/**
 * Node Proxies - Fluent Meta Business SDK Alignment
 * 
 * Implements object-oriented Node and Edge proxies (Media, User, Conversation)
 * matching the official Facebook Business SDK pattern.
 */

import { GraphRouter } from '../router/graph_router.js';
import { GraphMedia, GraphUser, GraphComment, GraphConversation } from '../types/graph.js';

export class GraphMediaProxy {
  private mediaId: string;
  private router: GraphRouter;

  constructor(mediaId: string, router: GraphRouter) {
    this.mediaId = mediaId;
    this.router = router;
  }

  /**
   * Retrieves media node with specific requested fields
   */
  public async get(fields?: string | string[]): Promise<GraphMedia> {
    const fieldParam = Array.isArray(fields) ? fields.join(',') : fields;
    return this.router.dispatch<GraphMedia>(`/${this.mediaId}`, 'GET', { fields: fieldParam });
  }

  /**
   * Retrieves comments edge on this media
   */
  public async getComments(options?: { fields?: string | string[]; limit?: number; after?: string }): Promise<{ data: GraphComment[]; paging?: any }> {
    const fieldParam = Array.isArray(options?.fields) ? options?.fields.join(',') : options?.fields;
    return this.router.dispatch(`/${this.mediaId}/comments`, 'GET', {
      fields: fieldParam,
      limit: options?.limit,
      after: options?.after
    });
  }

  /**
   * Creates/publishes a comment on this media
   */
  public async createComment(data: { message: string }): Promise<GraphComment> {
    return this.router.dispatch<GraphComment>(`/${this.mediaId}/comments`, 'POST', data);
  }

  /**
   * Retrieves insights edge on this media
   */
  public async getInsights(metrics?: string[]): Promise<any> {
    return this.router.dispatch(`/${this.mediaId}/insights`, 'GET', {
      metric: metrics ? metrics.join(',') : undefined
    });
  }
}

export class GraphUserProxy {
  private userId: string;
  private router: GraphRouter;

  constructor(userId: string = 'me', router: GraphRouter) {
    this.userId = userId;
    this.router = router;
  }

  /**
   * Retrieves user node with specific requested fields
   */
  public async get(fields?: string | string[]): Promise<GraphUser> {
    const fieldParam = Array.isArray(fields) ? fields.join(',') : fields;
    return this.router.dispatch<GraphUser>(`/${this.userId}`, 'GET', { fields: fieldParam });
  }

  /**
   * Retrieves media feed edge of this user
   */
  public async getMedia(options?: { fields?: string | string[]; limit?: number }): Promise<{ data: GraphMedia[]; paging?: any }> {
    const fieldParam = Array.isArray(options?.fields) ? options?.fields.join(',') : options?.fields;
    return this.router.dispatch(`/${this.userId}/media`, 'GET', {
      fields: fieldParam,
      limit: options?.limit
    });
  }

  /**
   * Creates a media container on user edge
   */
  public async createMedia(data: Record<string, any>): Promise<{ id: string }> {
    return this.router.dispatch(`/${this.userId}/media`, 'POST', data);
  }

  /**
   * Publishes a media container on user edge
   */
  public async createMediaPublish(creationId: string): Promise<{ id: string }> {
    return this.router.dispatch(`/${this.userId}/media_publish`, 'POST', { creation_id: creationId });
  }

  /**
   * Retrieves active stories edge of this user
   */
  public async getStories(options?: { fields?: string | string[] }): Promise<{ data: GraphMedia[] }> {
    const fieldParam = Array.isArray(options?.fields) ? options?.fields.join(',') : options?.fields;
    return this.router.dispatch(`/${this.userId}/stories`, 'GET', { fields: fieldParam });
  }

  /**
   * Retrieves conversations edge of this user
   */
  public async getConversations(options?: { limit?: number }): Promise<{ data: GraphConversation[] }> {
    return this.router.dispatch(`/${this.userId}/conversations`, 'GET', options);
  }
}

export class GraphConversationProxy {
  private conversationId: string;
  private router: GraphRouter;

  constructor(conversationId: string, router: GraphRouter) {
    this.conversationId = conversationId;
    this.router = router;
  }

  /**
   * Retrieves messages edge on this conversation
   */
  public async getMessages(options?: { fields?: string | string[]; limit?: number }): Promise<{ data: any[]; paging?: any }> {
    const fieldParam = Array.isArray(options?.fields) ? options?.fields.join(',') : options?.fields;
    return this.router.dispatch(`/${this.conversationId}/messages`, 'GET', {
      fields: fieldParam,
      limit: options?.limit
    });
  }

  /**
   * Sends a message into this conversation thread
   */
  public async createMessage(data: { message: string } | string): Promise<{ message_id: string; recipient_id?: string }> {
    const payload = typeof data === 'string' ? { message: data } : data;
    return this.router.dispatch(`/${this.conversationId}/messages`, 'POST', payload);
  }
}
