/**
 * WebTwin - Desktop Web Browser Fingerprint & Network Protocol Emulation
 * 
 * Accurately models desktop web clients (Chrome on Linux/Windows/macOS)
 * and interfaces directly with Meta's official web endpoints (www.instagram.com).
 * Completely eliminates identity clashes with mobile Liger/Tigon stacks.
 */

import * as fs from 'node:fs';
import { TwinTransport } from './transport.js';
import { WebBrowserProfile } from '../profiles/types.js';
import { TwinProfileRegistry } from '../profiles/registry.js';
import { GraphComment, GraphDirectMessage, GraphConversation, DirectSendMessageResponse } from '../types/graph.js';
import { DEFAULT_SESSION_PATH } from './device_twin.js';

export interface WebSessionData {
  username: string;
  full_name: string;
  ds_user_id: string;
  cookie_string: string;
  csrftoken?: string;
  sessionid?: string;
  mid?: string;
  ig_did?: string;
  datr?: string;
  rur?: string;
  fb_dtsg?: string;
  lsd?: string;
  jazoest?: string;
}

export class WebTwin {
  private profile: WebBrowserProfile;
  private session: WebSessionData;
  private transport: TwinTransport;

  constructor(profile?: WebBrowserProfile, sessionPath: string = DEFAULT_SESSION_PATH, transport?: TwinTransport) {
    this.profile = profile || TwinProfileRegistry.getDefaultWeb();
    this.transport = transport || new TwinTransport();
    this.session = this.loadSession(sessionPath);
  }

  private loadSession(sessionPath: string): WebSessionData {
    if (fs.existsSync(sessionPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
        const tokens = raw.key_tokens || {};
        return {
          username: raw.username || 'hokar368',
          full_name: raw.full_name || 'hokarveria',
          ds_user_id: raw.ds_user_id || tokens.ds_user_id || '19835089130',
          cookie_string: raw.cookie_string || '',
          csrftoken: tokens.csrftoken,
          sessionid: tokens.sessionid,
          mid: tokens.mid,
          ig_did: tokens.ig_did,
          datr: tokens.datr,
          rur: tokens.rur,
          fb_dtsg: tokens.fb_dtsg,
          lsd: tokens.lsd,
          jazoest: tokens.jazoest
        };
      } catch {
        // Fallback below
      }
    }

    return {
      username: 'hokar368',
      full_name: 'hokarveria',
      ds_user_id: '19835089130',
      cookie_string: ''
    };
  }

  public getProfile(): WebBrowserProfile {
    return { ...this.profile };
  }

  public getSession(): WebSessionData {
    return { ...this.session };
  }

  public hasActiveSession(): boolean {
    return Boolean(this.session.sessionid && this.session.sessionid.length > 10);
  }

  /**
   * Generates authentic Web Browser headers conforming to Chrome on Linux
   */
  public getWebHeaders(referer: string = 'https://www.instagram.com/'): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': this.profile.user_agent,
      'Accept': '*/*',
      'Accept-Language': this.profile.accept_language,
      'X-IG-App-ID': this.profile.app_id,
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://www.instagram.com',
      'Referer': referer,
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Connection': 'keep-alive'
    };

    if (this.profile.sec_ch_ua) {
      headers['sec-ch-ua'] = this.profile.sec_ch_ua;
    }
    if (this.profile.sec_ch_ua_mobile) {
      headers['sec-ch-ua-mobile'] = this.profile.sec_ch_ua_mobile;
    }
    if (this.profile.sec_ch_ua_platform) {
      headers['sec-ch-ua-platform'] = this.profile.sec_ch_ua_platform;
    }
    if (this.profile.sec_ch_ua_platform_version) {
      headers['sec-ch-ua-platform-version'] = this.profile.sec_ch_ua_platform_version;
    }
    if (this.profile.sec_ch_ua_arch) {
      headers['sec-ch-ua-arch'] = this.profile.sec_ch_ua_arch;
    }
    if (this.profile.sec_ch_ua_bitness) {
      headers['sec-ch-ua-bitness'] = this.profile.sec_ch_ua_bitness;
    }
    if (this.profile.sec_ch_ua_model) {
      headers['sec-ch-ua-model'] = this.profile.sec_ch_ua_model;
    }

    if (this.session.csrftoken) {
      headers['X-CSRFToken'] = this.session.csrftoken;
    }

    if (this.session.cookie_string) {
      headers['Cookie'] = this.session.cookie_string;
    }

    return headers;
  }

  /**
   * Posts an authentic comment on a media object via official Web RelayModern GraphQL mutation
   * Query: PolarisPostCommentInputRevampedMutation (doc_id: 27261905640092552)
   * Endpoint: POST https://www.instagram.com/api/graphql
   */
  public async postComment(
    mediaId: string,
    message: string,
    options: { shortcode?: string; parentCommentId?: string } = {}
  ): Promise<GraphComment> {
    const text = message ? message.trim() : '';
    if (!text) {
      throw new Error('Comment message cannot be empty.');
    }

    const cleanMediaId = mediaId.includes('_') ? mediaId.split('_')[0] : mediaId;
    const referer = options.shortcode
      ? `https://www.instagram.com/p/${options.shortcode}/`
      : 'https://www.instagram.com/';

    const headers = this.getWebHeaders(referer);
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    headers['x-fb-friendly-name'] = 'PolarisPostCommentInputRevampedMutation';
    headers['x-asbd-id'] = '359341';
    if (this.session.lsd) {
      headers['x-fb-lsd'] = this.session.lsd;
    }

    const params = new URLSearchParams();
    params.set('av', this.session.ds_user_id || '17841419713919386');
    params.set('__d', 'www');
    params.set('__user', '0');
    params.set('__a', '1');
    if (this.session.fb_dtsg) {
      params.set('fb_dtsg', this.session.fb_dtsg);
    }
    if (this.session.jazoest) {
      params.set('jazoest', this.session.jazoest);
    }
    if (this.session.lsd) {
      params.set('lsd', this.session.lsd);
    }
    params.set('fb_api_caller_class', 'RelayModern');
    params.set('fb_api_req_friendly_name', 'PolarisPostCommentInputRevampedMutation');
    params.set('server_timestamps', 'true');
    params.set('doc_id', '27261905640092552');

    const variables: Record<string, any> = {
      connections: [
        `client:root:__PolarisPostComments__xdt_api__v1__media__media_id__comments__connection_connection(data:{},media_id:"${cleanMediaId}",sort_order:"popular")`
      ],
      data: {
        comment_text: text,
        media_id: cleanMediaId
      }
    };
    if (options.parentCommentId) {
      variables.data.replied_to_comment_id = options.parentCommentId;
    }

    params.set('variables', JSON.stringify(variables));

    const bodyData = params.toString();
    headers['Content-Length'] = Buffer.byteLength(bodyData, 'utf-8').toString();

    const url = 'https://www.instagram.com/api/graphql';
    const res = await this.transport.request(url, {
      method: 'POST',
      headers,
      body: bodyData,
      timeoutMs: 25000
    });

    if (res.status === 200) {
      let parsed: any;
      try {
        const cleanData = res.data.replace(/^\s*for\s*\(\s*;\s*;\s*\)\s*;/, '');
        parsed = JSON.parse(cleanData);
      } catch {
        throw new Error(`Web Media Comment on ${cleanMediaId} returned unparseable JSON: ${res.data.slice(0, 200)}`);
      }

      if (parsed.error) {
        const errDetail = parsed.errorSummary || parsed.errorDescription || JSON.stringify(parsed.error);
        throw new Error(`Instagram mutation rejected with error ${parsed.error}: ${errDetail}`);
      }

      if (parsed.errors && parsed.errors.length > 0) {
        throw new Error(`Web Media Comment GraphQL error: ${parsed.errors[0].message || JSON.stringify(parsed.errors)}`);
      }

      const commentCreate = parsed.data?.xig_comment_create;
      if (commentCreate?.comment_dict?.pk) {
        const dict = commentCreate.comment_dict;
        return {
          id: String(dict.pk),
          text: dict.text || text,
          timestamp: dict.created_at ? new Date(dict.created_at * 1000).toISOString() : new Date().toISOString(),
          like_count: 0,
          from: {
            id: String(dict.user?.pk || this.session.ds_user_id),
            username: dict.user?.username || this.session.username,
            name: dict.user?.full_name || this.session.full_name
          },
          status: 'ok'
        };
      }

      throw new Error(`Web Media Comment on ${cleanMediaId} failed: Server did not return a valid comment PK (Response: ${res.data.slice(0, 300)})`);
    }

    throw new Error(`Web Media Comment on ${cleanMediaId} returned HTTP ${res.status}: ${res.data.slice(0, 300)}`);
  }

  /**
   * Retrieves comments on a media object via official Web endpoint
   * Endpoint: GET https://www.instagram.com/api/v1/media/{cleanMediaId}/comments/
   */
  public async getComments(
    mediaId: string,
    options: { limit?: number; min_id?: string; shortcode?: string } = {}
  ): Promise<{ data: GraphComment[]; paging?: any }> {
    const cleanMediaId = mediaId.includes('_') ? mediaId.split('_')[0] : mediaId;
    const referer = options.shortcode
      ? `https://www.instagram.com/p/${options.shortcode}/`
      : 'https://www.instagram.com/';

    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.min_id) params.set('min_id', options.min_id);
    const qs = params.toString();

    const url = `https://www.instagram.com/api/v1/media/${cleanMediaId}/comments/${qs ? `?${qs}` : ''}`;
    const headers = this.getWebHeaders(referer);

    const res = await this.transport.request(url, {
      method: 'GET',
      headers,
      timeoutMs: 20000
    });

    if (res.status === 200) {
      const parsed = JSON.parse(res.data);
      const rawComments = parsed.comments || [];
      const comments: GraphComment[] = rawComments.map((c: any) => ({
        id: String(c.pk || c.id || ''),
        text: c.text || '',
        timestamp: c.created_at ? new Date(c.created_at * 1000).toISOString() : undefined,
        like_count: c.comment_like_count || 0,
        from: c.user ? {
          id: String(c.user.pk || c.user_id || ''),
          username: c.user.username || '',
          name: c.user.full_name || ''
        } : undefined,
        status: 'ok'
      }));

      return {
        data: comments,
        paging: {
          cursors: {
            after: parsed.next_max_id || parsed.next_min_id
          }
        }
      };
    }

    throw new Error(`Web Comments retrieval on ${cleanMediaId} returned HTTP ${res.status}: ${res.data.slice(0, 300)}`);
  }

  /**
   * Retrieves messages from a direct conversation thread via official Web GraphQL
   * Query: IGDThreadDetailQuery (doc_id: 29613940454875963)
   * Endpoint: POST https://www.instagram.com/api/graphql
   */
  public async getThreadMessages(
    threadFbid: string,
    options: { limit?: number } = {}
  ): Promise<GraphConversation> {
    const limit = options.limit || 20;
    const directUrl = 'https://www.instagram.com/api/graphql';
    const docId = '29613940454875963';

    const directVariables = {
      min_uq_seq_id: null,
      thread_fbid: threadFbid,
      __relay_internal__pv__IGDEnableOffMsysChatThemesQErelayprovider: false,
      __relay_internal__pv__IGDInitialMessagePageCountrelayprovider: limit
    };

    const referer = 'https://www.instagram.com/direct/inbox/';
    const headers = this.getWebHeaders(referer);
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    headers['x-fb-friendly-name'] = 'IGDThreadDetailQuery';
    headers['x-asbd-id'] = '359341';
    if (this.session.lsd) {
      headers['x-fb-lsd'] = this.session.lsd;
    }

    const params = new URLSearchParams();
    params.set('av', this.session.ds_user_id || '17841419713919386');
    params.set('__d', 'www');
    params.set('__user', '0');
    params.set('__a', '1');
    if (this.session.fb_dtsg) {
      params.set('fb_dtsg', this.session.fb_dtsg);
    }
    if (this.session.jazoest) {
      params.set('jazoest', this.session.jazoest);
    }
    if (this.session.lsd) {
      params.set('lsd', this.session.lsd);
    }
    params.set('fb_api_caller_class', 'RelayModern');
    params.set('fb_api_req_friendly_name', 'IGDThreadDetailQuery');
    params.set('server_timestamps', 'true');
    params.set('doc_id', docId);
    params.set('variables', JSON.stringify(directVariables));

    const bodyData = params.toString();
    headers['Content-Length'] = Buffer.byteLength(bodyData, 'utf-8').toString();

    const res = await this.transport.request(directUrl, {
      method: 'POST',
      headers,
      body: bodyData,
      timeoutMs: 25000
    });

    if (res.status === 200) {
      let parsed: any;
      try {
        const cleanData = res.data.replace(/^for\s*\(\s*;\s*;\s*\)\s*;/, '');
        parsed = JSON.parse(cleanData);
      } catch {
        throw new Error(`IGDThreadDetailQuery returned unparseable JSON: ${res.data.slice(0, 200)}`);
      }

      const thread = parsed.data?.get_slide_thread_nullable?.as_ig_direct_thread;
      const edges = thread?.slide_messages?.edges || [];
      const messages: GraphDirectMessage[] = edges.map((e: any) => {
        const node = e.node || {};
        const senderFbid = node.sender_fbid || node.sender?.id || node.sender?.igid;
        const isSelf = senderFbid === this.session.ds_user_id || node.sender?.user_dict?.username === this.session.username;
        return {
          id: String(node.message_id || node.id || `msg_${Date.now()}`),
          created_time: node.timestamp_ms ? new Date(Number(node.timestamp_ms)).toISOString() : new Date().toISOString(),
          from: {
            id: String(senderFbid || ''),
            username: node.sender?.user_dict?.username || (isSelf ? this.session.username : 'user'),
            name: node.sender?.user_dict?.full_name || (isSelf ? this.session.full_name : '')
          },
          message: node.content?.text_body || node.text_body || '',
          item_type: node.content_type || 'TEXT'
        };
      });

      return {
        id: thread?.thread_fbid || threadFbid,
        snippet: messages[0]?.message,
        message_count: messages.length,
        messages: {
          data: messages
        }
      };
    }

    throw new Error(`IGDThreadDetailQuery on thread ${threadFbid} returned HTTP ${res.status}: ${res.data.slice(0, 300)}`);
  }

  /**
   * Sends a direct text message to a conversation thread via official Web RelayModern GraphQL
   * Query: IGDirectTextSendMutation (doc_id: 26911679871773184)
   * Endpoint: POST https://www.instagram.com/api/graphql
   */
  public async sendDirectMessage(
    threadFbid: string,
    text: string
  ): Promise<DirectSendMessageResponse> {
    const message = text ? text.trim() : '';
    if (!message) {
      throw new Error('Direct message text cannot be empty.');
    }

    const directUrl = 'https://www.instagram.com/api/graphql';
    const docId = '26911679871773184';
    const referer = `https://www.instagram.com/direct/t/${threadFbid}/`;

    const headers = this.getWebHeaders(referer);
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    headers['x-fb-friendly-name'] = 'IGDirectTextSendMutation';
    headers['x-asbd-id'] = '359341';
    if (this.session.lsd) {
      headers['x-fb-lsd'] = this.session.lsd;
    }

    // Generate random 64-bit offline threading id
    const randomSuffix = Math.floor(Math.random() * 900000 + 100000);
    const offlineThreadingId = `${Date.now()}${randomSuffix}`;

    const variables = {
      ig_thread_igid: threadFbid,
      offline_threading_id: offlineThreadingId,
      recipient_igids: null,
      replied_to_client_context: null,
      replied_to_item_id: null,
      reply_to_message_id: null,
      sampled: null,
      text: {
        sensitive_string_value: message
      },
      mentions: [],
      mentioned_user_ids: [],
      commands: null,
      forwarded_from_thread_id: null,
      is_forwarded_from_own_message: null,
      send_attribution: 'igd_web_chat_tab:in_thread'
    };

    const params = new URLSearchParams();
    params.set('av', this.session.ds_user_id || '17841419713919386');
    params.set('__d', 'www');
    params.set('__user', '0');
    params.set('__a', '1');
    if (this.session.fb_dtsg) {
      params.set('fb_dtsg', this.session.fb_dtsg);
    }
    if (this.session.jazoest) {
      params.set('jazoest', this.session.jazoest);
    }
    if (this.session.lsd) {
      params.set('lsd', this.session.lsd);
    }
    params.set('fb_api_caller_class', 'RelayModern');
    params.set('fb_api_req_friendly_name', 'IGDirectTextSendMutation');
    params.set('server_timestamps', 'true');
    params.set('doc_id', docId);
    params.set('variables', JSON.stringify(variables));

    const bodyData = params.toString();
    headers['Content-Length'] = Buffer.byteLength(bodyData, 'utf-8').toString();

    const res = await this.transport.request(directUrl, {
      method: 'POST',
      headers,
      body: bodyData,
      timeoutMs: 25000
    });

    if (res.status === 200) {
      let parsed: any;
      try {
        const cleanData = res.data.replace(/^for\s*\(\s*;\s*;\s*\)\s*;/, '');
        parsed = JSON.parse(cleanData);
      } catch {
        throw new Error(`IGDirectTextSendMutation returned unparseable JSON: ${res.data.slice(0, 200)}`);
      }

      const sendResponse = parsed.data?.xig_direct_text_send_with_slide_messaging_response;
      if (sendResponse?.message_id) {
        return {
          message_id: sendResponse.message_id,
          thread_id: threadFbid,
          timestamp: sendResponse.timestamp_ms ? Number(sendResponse.timestamp_ms) : Date.now(),
          status: 'ok'
        };
      }

      if (parsed.errors && parsed.errors.length > 0) {
        throw new Error(`IGDirectTextSendMutation error: ${parsed.errors[0].message || JSON.stringify(parsed.errors)}`);
      }

      throw new Error(`IGDirectTextSendMutation unexpected response shape: ${res.data.slice(0, 300)}`);
    }

    throw new Error(`IGDirectTextSendMutation on thread ${threadFbid} returned HTTP ${res.status}: ${res.data.slice(0, 300)}`);
  }
}
