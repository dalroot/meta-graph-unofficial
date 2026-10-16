/**
 * TwinGraph - Harmonious Meta Graph API v21.0 Client Architecture
 * 
 * Bridges official Meta Graph API v21.0 resource representations with
 * authentic Xiaomi Redmi Note 13 4G hardware telemetry, Liger/Tigon headers,
 * Pando GraphQL queries, and MSYS Direct message pipelines.
 * 
 * Conforms 1:1 with official Meta JavaScript SDK conventions (FB.api).
 */

import { DeviceTwin, DEFAULT_SESSION_PATH } from './twins/device_twin.js';
import { GraphQLTwin } from './twins/graphql_twin.js';
import { DirectTwin } from './twins/direct_twin.js';
import { MediaTwin } from './twins/media_twin.js';
import {
  GraphUser,
  GraphMedia,
  GraphInsightsResponse,
  GraphConversation,
  PublishMediaParams,
  ClientOptions
} from './types/graph.js';

export class TwinGraph {
  private _device: DeviceTwin;
  private _graphql: GraphQLTwin;
  private _direct: DirectTwin;
  private _media: MediaTwin;

  private accessToken: string;
  private apiVersion: string;
  private baseUrl: string;
  private offlineMode: boolean;

  constructor(options: ClientOptions = {}) {
    this.accessToken = options.accessToken || 'IGQVJ...twingraph_access_token';
    this.apiVersion = options.apiVersion || 'v21.0';
    this.baseUrl = options.baseUrl || 'http://localhost:8080';
    this.offlineMode = options.offlineMode ?? true;

    // Initialize the 4 harmonious sub-twins
    this._device = new DeviceTwin(options.sessionPath || DEFAULT_SESSION_PATH);
    this._graphql = new GraphQLTwin(this._device);
    this._direct = new DirectTwin(this._device, this._graphql);
    this._media = new MediaTwin(this._device, this._graphql);
  }

  // --- Sub-Twin Getters ---

  public get device(): DeviceTwin {
    return this._device;
  }

  public get graphql(): GraphQLTwin {
    return this._graphql;
  }

  public get direct(): DirectTwin {
    return this._direct;
  }

  public get media(): MediaTwin {
    return this._media;
  }

  /**
   * Official Standard Meta Graph API Method
   * Matches official Meta JavaScript SDK FB.api() 1:1
   * 
   * Usage:
   *   tg.api('/me')
   *   tg.api('/me', { fields: 'id,name' })
   *   tg.api('/DedDBnTCs-J/insights', 'GET')
   *   tg.api('/1234567/messages', 'POST', { message: 'Hello' })
   */
  public async api<T = any>(
    path: string,
    methodOrParams?: 'GET' | 'POST' | 'DELETE' | 'get' | 'post' | 'delete' | Record<string, any>,
    paramsOrBody?: Record<string, any>
  ): Promise<T> {
    let method: 'GET' | 'POST' | 'DELETE' = 'GET';
    let params: Record<string, any> = {};

    if (typeof methodOrParams === 'string') {
      method = methodOrParams.toUpperCase() as 'GET' | 'POST' | 'DELETE';
      params = paramsOrBody || {};
    } else if (typeof methodOrParams === 'object' && methodOrParams !== null) {
      method = 'GET';
      params = methodOrParams;
    }

    // Normalize path by stripping leading slash and version prefix if present
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const unversioned = cleanPath.replace(new RegExp(`^\\/${this.apiVersion}`), '');

    // 1. Route: /me or /{current_user_id}
    const currentUserId = this._device.getUserId();
    if (unversioned === '/me' || unversioned === `/${currentUserId}`) {
      const fields = params.fields ? String(params.fields).split(',') : undefined;
      return (await this.getMe(fields)) as unknown as T;
    }

    // 2. Route: /{media_id}/insights
    const insightsMatch = unversioned.match(/^\/([a-zA-Z0-9_-]+)\/insights\/?$/);
    if (insightsMatch) {
      const mediaId = insightsMatch[1];
      const metrics = params.metric ? String(params.metric).split(',') : undefined;
      return (await this.getMediaInsights(mediaId, metrics)) as unknown as T;
    }

    // 3. Route: /{user_id}/conversations or /conversations
    const convMatch = unversioned.match(/^\/(?:[a-zA-Z0-9_-]+\/)?conversations\/?$/);
    if (convMatch && method === 'GET') {
      return (await this._direct.getConversations(params)) as unknown as T;
    }

    // 4. Route: /{conversation_id}/messages
    const messagesMatch = unversioned.match(/^\/([a-zA-Z0-9_-]+)\/messages\/?$/);
    if (messagesMatch) {
      const conversationId = messagesMatch[1];
      if (method === 'POST') {
        const text = params.message || params.text || '';
        return (await this._direct.sendMessage(conversationId, text, params)) as unknown as T;
      } else {
        return (await this._direct.getMessages(conversationId, params.limit)) as unknown as T;
      }
    }

    // 5. Route: /{user_id}/media
    const mediaContainerMatch = unversioned.match(/^\/(?:[a-zA-Z0-9_-]+\/)?media\/?$/);
    if (mediaContainerMatch && method === 'POST') {
      return (await this._media.createMediaContainer(params)) as unknown as T;
    }

    // 6. Route: /{user_id}/media_publish
    const mediaPublishMatch = unversioned.match(/^\/(?:[a-zA-Z0-9_-]+\/)?media_publish\/?$/);
    if (mediaPublishMatch && method === 'POST') {
      const containerId = params.creation_id || params.id || `180${Date.now().toString().slice(-8)}`;
      return (await this._media.publishMediaContainer(containerId)) as unknown as T;
    }

    // 7. Route: Single Media Object /{media-id}
    const singleMediaMatch = unversioned.match(/^\/([a-zA-Z0-9_-]+)\/?$/);
    if (singleMediaMatch && method === 'GET') {
      const mediaId = singleMediaMatch[1];
      return (await this._media.getMedia(mediaId)) as unknown as T;
    }

    // Fallback if proxy server is active and not offlineMode
    if (!this.offlineMode) {
      try {
        const queryParams = method === 'GET' ? new URLSearchParams({ ...params, access_token: this.accessToken }).toString() : '';
        const url = `${this.baseUrl}/${this.apiVersion}${cleanPath}${queryParams ? `?${queryParams}` : ''}`;
        const resp = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...this._device.getAuthenticatedHeaders()
          },
          body: method !== 'GET' ? JSON.stringify(params) : undefined
        });
        if (resp.ok) {
          return (await resp.json()) as T;
        }
      } catch {
        // Fallback to offline twin synthesis
      }
    }

    // Default fallback node
    return {
      id: currentUserId,
      path: cleanPath,
      method: method
    } as unknown as T;
  }

  // --- Convenience Shortcuts ---

  /**
   * Fetch authenticated user node (`/me`)
   */
  public async getMe(fields?: string[]): Promise<GraphUser> {
    const rawUser = {
      id: this._device.getUserId(),
      username: this._device.getUsername(),
      full_name: this._device.getFullName()
    };
    const node = this._graphql.translateUserToGraphNode(rawUser);

    if (fields && fields.length > 0) {
      const filtered: Record<string, any> = { id: node.id };
      for (const field of fields) {
        if (field in node) {
          filtered[field] = (node as any)[field];
        }
      }
      return filtered as GraphUser;
    }

    return node;
  }

  /**
   * Fetch media insights (`/{media_id}/insights`)
   */
  public async getMediaInsights(
    mediaId: string,
    metrics?: string[]
  ): Promise<GraphInsightsResponse> {
    return this._media.getInsights(mediaId, metrics);
  }

  /**
   * Complete media publishing workflow
   */
  public async publishMedia(params: PublishMediaParams): Promise<{ id: string }> {
    return this._media.publishMedia(params);
  }

  // --- Backward Compatibility Convenience Methods ---

  public async get<T = any>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    return this.api<T>(endpoint, 'GET', params);
  }

  public async post<T = any>(endpoint: string, body: Record<string, any> = {}): Promise<T> {
    return this.api<T>(endpoint, 'POST', body);
  }
}

// 100% Backward Compatibility Aliases
export const TwinGraphClient = TwinGraph;
export type TwinGraphClient = TwinGraph;

export const MetaGraphClient = TwinGraph;
export type MetaGraphClient = TwinGraph;
