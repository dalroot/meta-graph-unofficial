/**
 * Node Proxies - Fluent Meta Business SDK Alignment
 *
 * Implements object-oriented Node and Edge proxies (Media, User, Conversation)
 * matching the official Facebook Business SDK pattern.
 */
export class GraphMediaProxy {
    mediaId;
    router;
    constructor(mediaId, router) {
        this.mediaId = mediaId;
        this.router = router;
    }
    /**
     * Retrieves media node with specific requested fields
     */
    async get(fields) {
        const fieldParam = Array.isArray(fields) ? fields.join(',') : fields;
        return this.router.dispatch(`/${this.mediaId}`, 'GET', { fields: fieldParam });
    }
    /**
     * Retrieves comments edge on this media
     */
    async getComments(options) {
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
    async createComment(data) {
        return this.router.dispatch(`/${this.mediaId}/comments`, 'POST', data);
    }
    /**
     * Retrieves insights edge on this media
     */
    async getInsights(metrics) {
        return this.router.dispatch(`/${this.mediaId}/insights`, 'GET', {
            metric: metrics ? metrics.join(',') : undefined
        });
    }
}
export class GraphUserProxy {
    userId;
    router;
    constructor(userId = 'me', router) {
        this.userId = userId;
        this.router = router;
    }
    /**
     * Retrieves user node with specific requested fields
     */
    async get(fields) {
        const fieldParam = Array.isArray(fields) ? fields.join(',') : fields;
        return this.router.dispatch(`/${this.userId}`, 'GET', { fields: fieldParam });
    }
    /**
     * Retrieves media feed edge of this user
     */
    async getMedia(options) {
        const fieldParam = Array.isArray(options?.fields) ? options?.fields.join(',') : options?.fields;
        return this.router.dispatch(`/${this.userId}/media`, 'GET', {
            fields: fieldParam,
            limit: options?.limit
        });
    }
    /**
     * Creates a media container on user edge
     */
    async createMedia(data) {
        return this.router.dispatch(`/${this.userId}/media`, 'POST', data);
    }
    /**
     * Publishes a media container on user edge
     */
    async createMediaPublish(creationId) {
        return this.router.dispatch(`/${this.userId}/media_publish`, 'POST', { creation_id: creationId });
    }
    /**
     * Retrieves active stories edge of this user
     */
    async getStories(options) {
        const fieldParam = Array.isArray(options?.fields) ? options?.fields.join(',') : options?.fields;
        return this.router.dispatch(`/${this.userId}/stories`, 'GET', { fields: fieldParam });
    }
    /**
     * Retrieves conversations edge of this user
     */
    async getConversations(options) {
        return this.router.dispatch(`/${this.userId}/conversations`, 'GET', options);
    }
}
export class GraphConversationProxy {
    conversationId;
    router;
    constructor(conversationId, router) {
        this.conversationId = conversationId;
        this.router = router;
    }
    /**
     * Retrieves messages edge on this conversation
     */
    async getMessages(options) {
        const fieldParam = Array.isArray(options?.fields) ? options?.fields.join(',') : options?.fields;
        return this.router.dispatch(`/${this.conversationId}/messages`, 'GET', {
            fields: fieldParam,
            limit: options?.limit
        });
    }
    /**
     * Sends a message into this conversation thread
     */
    async createMessage(data) {
        const payload = typeof data === 'string' ? { message: data } : data;
        return this.router.dispatch(`/${this.conversationId}/messages`, 'POST', payload);
    }
}
