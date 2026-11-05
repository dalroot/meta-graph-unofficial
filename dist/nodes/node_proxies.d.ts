/**
 * Node Proxies - Fluent Meta Business SDK Alignment
 *
 * Implements object-oriented Node and Edge proxies (Media, User, Conversation)
 * matching the official Facebook Business SDK pattern.
 */
import { GraphRouter } from '../router/graph_router.js';
import { GraphMedia, GraphUser, GraphComment, GraphConversation } from '../types/graph.js';
export declare class GraphMediaProxy {
    private mediaId;
    private router;
    constructor(mediaId: string, router: GraphRouter);
    /**
     * Retrieves media node with specific requested fields
     */
    get(fields?: string | string[]): Promise<GraphMedia>;
    /**
     * Retrieves comments edge on this media
     */
    getComments(options?: {
        fields?: string | string[];
        limit?: number;
        after?: string;
    }): Promise<{
        data: GraphComment[];
        paging?: any;
    }>;
    /**
     * Creates/publishes a comment on this media
     */
    createComment(data: {
        message: string;
    }): Promise<GraphComment>;
    /**
     * Retrieves insights edge on this media
     */
    getInsights(metrics?: string[]): Promise<any>;
}
export declare class GraphUserProxy {
    private userId;
    private router;
    constructor(userId: string | undefined, router: GraphRouter);
    /**
     * Retrieves user node with specific requested fields
     */
    get(fields?: string | string[]): Promise<GraphUser>;
    /**
     * Retrieves media feed edge of this user
     */
    getMedia(options?: {
        fields?: string | string[];
        limit?: number;
    }): Promise<{
        data: GraphMedia[];
        paging?: any;
    }>;
    /**
     * Creates a media container on user edge
     */
    createMedia(data: Record<string, any>): Promise<{
        id: string;
    }>;
    /**
     * Publishes a media container on user edge
     */
    createMediaPublish(creationId: string): Promise<{
        id: string;
    }>;
    /**
     * Retrieves active stories edge of this user
     */
    getStories(options?: {
        fields?: string | string[];
    }): Promise<{
        data: GraphMedia[];
    }>;
    /**
     * Retrieves conversations edge of this user
     */
    getConversations(options?: {
        limit?: number;
    }): Promise<{
        data: GraphConversation[];
    }>;
}
export declare class GraphConversationProxy {
    private conversationId;
    private router;
    constructor(conversationId: string, router: GraphRouter);
    /**
     * Retrieves messages edge on this conversation
     */
    getMessages(options?: {
        fields?: string | string[];
        limit?: number;
    }): Promise<{
        data: any[];
        paging?: any;
    }>;
    /**
     * Sends a message into this conversation thread
     */
    createMessage(data: {
        message: string;
    } | string): Promise<{
        message_id: string;
        recipient_id?: string;
    }>;
}
