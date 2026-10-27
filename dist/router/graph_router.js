/**
 * GraphRouter - Universal Meta Graph API v21.0 Path & Method Dispatcher
 *
 * Reconciles RESTful `/v21.0/{node}/{edge}` requests with underlying
 * digital twin execution engines and SQLite-backed dynamic field projection.
 */
import { GraphCatalog } from '../schema/graph_catalog.js';
import { FieldProjector } from '../schema/field_projector.js';
export class GraphRouter {
    catalog;
    projector;
    deps;
    constructor(deps, catalog) {
        this.deps = deps;
        this.catalog = catalog || GraphCatalog.getInstance();
        this.projector = new FieldProjector(this.catalog);
    }
    /**
     * Universal dispatch handler matching Meta Graph API v21.0
     */
    async dispatch(path, method = 'GET', paramsOrBody = {}) {
        const parsed = this.parsePath(path);
        // 1. Dispatch Root / Node Requests: /{node-id}
        if (!parsed.edgeName) {
            if (parsed.targetId === 'me') {
                return this.handleUserNode('me', method, paramsOrBody, parsed.version);
            }
            return this.handleMediaOrUserNode(parsed.targetId, method, paramsOrBody, parsed.version);
        }
        // 2. Dispatch Edge Requests: /{node-id}/{edge}
        switch (parsed.edgeName) {
            case 'comments':
                return this.handleCommentsEdge(parsed.targetId, method, paramsOrBody, parsed.version);
            case 'messages':
                return this.handleMessagesEdge(parsed.targetId, method, paramsOrBody, parsed.version);
            case 'insights':
                return this.handleInsightsEdge(parsed.targetId, method, paramsOrBody, parsed.version);
            case 'media':
                return this.handleMediaEdge(parsed.targetId, method, paramsOrBody, parsed.version);
            case 'media_publish':
                return this.handleMediaPublishEdge(parsed.targetId, method, paramsOrBody, parsed.version);
            case 'stories':
                return this.handleStoriesEdge(parsed.targetId, method, paramsOrBody, parsed.version);
            case 'conversations':
                return this.handleConversationsEdge(parsed.targetId, method, paramsOrBody, parsed.version);
            default:
                throw new Error(`Unsupported Meta Graph API Edge '${parsed.edgeName}' on Node '${parsed.targetId}' in ${parsed.version}`);
        }
    }
    /**
     * Parse graph path into components: /v21.0/17895695668004550/comments
     */
    parsePath(rawPath) {
        const clean = rawPath.replace(/^\/+/, '').split('?')[0];
        const segments = clean.split('/').filter(Boolean);
        let version = 'v21.0';
        let startIndex = 0;
        if (segments[0] && segments[0].startsWith('v') && segments[0].includes('.')) {
            version = segments[0];
            startIndex = 1;
        }
        const targetId = segments[startIndex] || 'me';
        const edgeName = segments[startIndex + 1];
        const subTargetId = segments[startIndex + 2];
        return {
            version,
            targetId,
            edgeName,
            subTargetId
        };
    }
    // --- Edge Handlers ---
    async handleUserNode(userId, method, params, version) {
        if (method !== 'GET') {
            throw new Error(`Method ${method} not allowed on User Node`);
        }
        const username = this.deps.device.getUsername() || 'me';
        const rawUser = {
            id: this.deps.device.getUserId(),
            username,
            name: this.deps.device.getFullName(),
            biography: 'Creator Profile',
            followers_count: 124,
            follows_count: 89,
            media_count: 14,
            profile_picture_url: 'https://scontent.cdninstagram.com/avatar_placeholder.jpg',
            is_professional_account: true
        };
        return this.projector.project('User', rawUser, params.fields, version);
    }
    async handleMediaOrUserNode(targetId, method, params, version) {
        if (method !== 'GET') {
            throw new Error(`Method ${method} not allowed on Node '${targetId}'`);
        }
        const rawMedia = await this.deps.media.getMedia(targetId);
        return this.projector.project('Media', rawMedia, params.fields, version);
    }
    async handleCommentsEdge(mediaId, method, params, version) {
        if (method === 'GET') {
            const response = await this.deps.media.getComments(mediaId, {
                limit: params.limit,
                min_id: params.after || params.min_id
            });
            const projected = this.projector.projectList('Comment', response.data, params.fields, version);
            return {
                data: projected,
                paging: response.paging
            };
        }
        if (method === 'POST') {
            const message = params.message || params.text;
            if (!message) {
                throw new Error("Missing required field 'message' in comment payload");
            }
            let commentResult;
            if (this.deps.web.hasActiveSession()) {
                commentResult = await this.deps.web.postComment(mediaId, message, {
                    shortcode: params.shortcode,
                    parentCommentId: params.parent_comment_id || params.parentCommentId
                });
            }
            else {
                commentResult = await this.deps.media.postComment(mediaId, message);
            }
            return this.projector.project('Comment', commentResult, params.fields, version);
        }
        throw new Error(`Method ${method} not supported on comments edge`);
    }
    async handleMessagesEdge(conversationId, method, params, version) {
        if (method === 'GET') {
            const thread = this.deps.web.hasActiveSession()
                ? await this.deps.web.getThreadMessages(conversationId, { limit: params.limit })
                : await this.deps.direct.getThread(conversationId);
            const rawMessages = thread.messages?.data || [];
            const projected = this.projector.projectList('Message', rawMessages, params.fields, version);
            return {
                data: projected,
                paging: thread.messages?.paging
            };
        }
        if (method === 'POST') {
            const messageText = typeof params.message === 'string' ? params.message : params.message?.text || params.text;
            if (!messageText) {
                throw new Error("Missing required field 'message' in direct message payload");
            }
            let res;
            if (this.deps.web.hasActiveSession()) {
                res = await this.deps.web.sendDirectMessage(conversationId, messageText);
            }
            else {
                res = await this.deps.direct.sendMessage(conversationId, messageText, params);
            }
            return {
                recipient_id: params.recipient?.id || conversationId,
                message_id: res.message_id || res.item_id || 'mid.sample'
            };
        }
        throw new Error(`Method ${method} not supported on messages edge`);
    }
    async handleInsightsEdge(mediaId, method, params, _version) {
        if (method !== 'GET') {
            throw new Error(`Method ${method} not supported on insights edge`);
        }
        const metrics = typeof params.metric === 'string'
            ? params.metric.split(',').map((m) => m.trim())
            : params.metric;
        return (await this.deps.media.getInsights(mediaId, metrics));
    }
    async handleMediaEdge(userId, method, params, _version) {
        if (method === 'GET') {
            const timeline = await this.deps.dashboard.getProfileTimeline(userId, { count: params.limit });
            return {
                data: this.projector.projectList('Media', timeline.items || [], params.fields),
                paging: timeline.paging
            };
        }
        if (method === 'POST') {
            // Create container
            const container = await this.deps.media.createMediaContainer(params);
            return { id: container.id };
        }
        throw new Error(`Method ${method} not supported on media edge`);
    }
    async handleMediaPublishEdge(_userId, method, params, _version) {
        if (method !== 'POST') {
            throw new Error(`Method ${method} not supported on media_publish edge`);
        }
        const creationId = params.creation_id || params.creationId;
        if (!creationId) {
            throw new Error("Missing required field 'creation_id'");
        }
        const published = await this.deps.media.publishMediaContainer(creationId);
        return { id: published.id };
    }
    async handleStoriesEdge(_userId, method, params, version) {
        if (method !== 'GET') {
            throw new Error(`Method ${method} not supported on stories edge`);
        }
        const stories = [
            {
                id: '4010857071171723200',
                pk: '4010857071171723200',
                code: 'DepbUF8Dd_A',
                media_type: 1,
                product_type: 'story',
                caption: { text: 'Active story' }
            }
        ];
        return {
            data: this.projector.projectList('Media', stories, params.fields, version)
        };
    }
    async handleConversationsEdge(_userId, method, params, version) {
        if (method !== 'GET') {
            throw new Error(`Method ${method} not supported on conversations edge`);
        }
        const inbox = await this.deps.direct.getInbox({ limit: params.limit });
        return {
            data: this.projector.projectList('Conversation', inbox.threads || [], params.fields, version)
        };
    }
}
