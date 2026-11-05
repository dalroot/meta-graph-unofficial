/**
 * DirectTwin - Mobile Client Direct Messaging & Conversation Management
 *
 * Pure Mobile Client Twin over i.instagram.com.
 * Conforms 1:1 with Meta Graph API v21.0 resource model (`/{user-id}/conversations`, `/{conversation-id}/messages`).
 * Routes internal operations cleanly to official mobile endpoints:
 *   - Inbox: GET https://i.instagram.com/api/v1/direct_v2/inbox/
 *   - Thread: GET https://i.instagram.com/api/v1/direct_v2/threads/{thread_id}/
 *   - Broadcast text: POST https://i.instagram.com/api/v1/direct_v2/threads/broadcast/text/
 */
import { DeviceTwin } from './device_twin.js';
import { GraphConversation, GraphDirectMessage, DirectSendMessageResponse, GraphPaging } from '../types/graph.js';
export interface DirectTwinOptions {
    offlineMode?: boolean;
}
export declare class DirectTwin {
    private deviceTwin;
    private transport;
    private offlineMode;
    constructor(deviceTwin?: DeviceTwin, options?: DirectTwinOptions);
    setOfflineMode(offline: boolean): void;
    isOfflineMode(): boolean;
    /**
     * Translates a mobile thread item into GraphDirectMessage
     */
    private parseThreadItems;
    /**
     * Translates an authentic mobile thread into official GraphConversation
     */
    private translateMobileThread;
    /**
     * Fetches raw Direct Inbox from mobile endpoint
     * Endpoint: GET https://i.instagram.com/api/v1/direct_v2/inbox/
     */
    getInbox(options?: {
        limit?: number;
        cursor?: string;
    }): Promise<any>;
    /**
     * Official Meta Graph API v21.0 Equivalent: GET /{user-id}/conversations
     */
    getConversations(options?: {
        limit?: number;
        cursor?: string;
        fields?: string[];
    }): Promise<{
        data: GraphConversation[];
        paging?: GraphPaging;
    }>;
    /**
     * Fetches raw Thread Details from mobile endpoint
     * Endpoint: GET https://i.instagram.com/api/v1/direct_v2/threads/{thread_id}/
     */
    getThreadRaw(threadId: string, options?: {
        limit?: number;
        cursor?: string;
    }): Promise<any>;
    /**
     * Fetches a single conversation thread by ID
     * Official Meta Graph API v21.0 Equivalent: GET /{conversation-id}
     */
    getThread(threadId: string): Promise<GraphConversation>;
    /**
     * Fetches messages within a conversation thread
     * Official Meta Graph API v21.0 Equivalent: GET /{conversation-id}/messages
     * Powered by authentic mobile endpoint: GET https://i.instagram.com/api/v1/direct_v2/threads/{thread_id}/
     */
    getMessages(threadId: string, limit?: number, cursor?: string): Promise<{
        data: GraphDirectMessage[];
        paging?: GraphPaging;
    }>;
    /**
     * Sends a direct message to a thread or recipient
     * Official Meta Graph API v21.0 Equivalent: POST /{conversation-id}/messages
     * Mobile Native Endpoint: POST https://i.instagram.com/api/v1/direct_v2/threads/broadcast/text/
     */
    sendMessage(threadId: string, text: string, options?: {
        clientContext?: string;
        recipientUserId?: string;
    }): Promise<DirectSendMessageResponse>;
    /**
     * Fetches real-time presence for authenticated user and contacts
     */
    getPresence(): Promise<Record<string, any>>;
}
