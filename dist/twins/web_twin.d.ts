/**
 * WebTwin - Desktop Web Browser Fingerprint & Network Protocol Emulation
 *
 * Accurately models desktop web clients (Chrome on Linux/Windows/macOS)
 * and interfaces directly with Meta's official web endpoints (www.instagram.com).
 * Completely eliminates identity clashes with mobile Liger/Tigon stacks.
 */
import { TwinTransport } from './transport.js';
import { WebBrowserProfile } from '../profiles/types.js';
import { GraphComment, GraphConversation, DirectSendMessageResponse } from '../types/graph.js';
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
export declare class WebTwin {
    private profile;
    private session;
    private transport;
    constructor(profile?: WebBrowserProfile, sessionPath?: string, transport?: TwinTransport);
    private loadSession;
    getProfile(): WebBrowserProfile;
    getSession(): WebSessionData;
    hasActiveSession(): boolean;
    /**
     * Generates authentic Web Browser headers conforming to Chrome on Linux
     */
    getWebHeaders(referer?: string): Record<string, string>;
    /**
     * Posts an authentic comment on a media object via official Web RelayModern GraphQL mutation
     * Query: PolarisPostCommentInputRevampedMutation (doc_id: 27261905640092552)
     * Endpoint: POST https://www.instagram.com/api/graphql
     */
    postComment(mediaId: string, message: string, options?: {
        shortcode?: string;
        parentCommentId?: string;
    }): Promise<GraphComment>;
    /**
     * Retrieves comments on a media object via official Web endpoint
     * Endpoint: GET https://www.instagram.com/api/v1/media/{cleanMediaId}/comments/
     */
    getComments(mediaId: string, options?: {
        limit?: number;
        min_id?: string;
        shortcode?: string;
    }): Promise<{
        data: GraphComment[];
        paging?: any;
    }>;
    /**
     * Retrieves messages from a direct conversation thread via official Web GraphQL
     * Query: IGDThreadDetailQuery (doc_id: 29613940454875963)
     * Endpoint: POST https://www.instagram.com/api/graphql
     */
    getThreadMessages(threadFbid: string, options?: {
        limit?: number;
    }): Promise<GraphConversation>;
    /**
     * Sends a direct text message to a conversation thread via official Web RelayModern GraphQL
     * Query: IGDirectTextSendMutation (doc_id: 26911679871773184)
     * Endpoint: POST https://www.instagram.com/api/graphql
     */
    sendDirectMessage(threadFbid: string, text: string): Promise<DirectSendMessageResponse>;
}
