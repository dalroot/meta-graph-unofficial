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
import { WebTwin } from './twins/web_twin.js';
import { DiscoveryTwin } from './twins/discovery_twin.js';
import { DashboardTwin } from './twins/dashboard_twin.js';
import { GraphRouter } from './router/graph_router.js';
import { GraphMediaProxy, GraphUserProxy, GraphConversationProxy } from './nodes/node_proxies.js';
import { GraphCatalog } from './schema/graph_catalog.js';
import { UniversalDownloader } from './utils/downloader.js';
import { ApiKeyManager } from './auth/api_key_manager.js';
import { TwinGatewayServer } from './gateway/gateway_server.js';
export class TwinGraph {
    _device;
    _graphql;
    _direct;
    _media;
    _web;
    _discovery;
    _dashboard;
    _router;
    accessToken;
    apiVersion;
    baseUrl;
    offlineMode;
    constructor(options = {}) {
        this.accessToken = options.accessToken || 'IGQVJ...twingraph_access_token';
        this.apiVersion = options.apiVersion || 'v21.0';
        this.baseUrl = options.baseUrl || 'http://localhost:8080';
        this.offlineMode = options.offlineMode ?? true;
        // Initialize the harmonious sub-twins
        const sessionInput = options.mobileSession || options.sessionPath || DEFAULT_SESSION_PATH;
        this._device = new DeviceTwin(sessionInput);
        this._graphql = new GraphQLTwin(this._device);
        this._direct = new DirectTwin(this._device, { offlineMode: this.offlineMode });
        this._media = new MediaTwin(this._device, this._graphql);
        this._web = new WebTwin(undefined, typeof sessionInput === 'string' ? sessionInput : DEFAULT_SESSION_PATH);
        this._discovery = new DiscoveryTwin(this._device, { offlineMode: this.offlineMode });
        this._dashboard = new DashboardTwin(this._device, { offlineMode: this.offlineMode });
        // Initialize the declarative Meta Graph v21.0 Router & SQLite Catalog
        this._router = new GraphRouter({
            device: this._device,
            web: this._web,
            media: this._media,
            direct: this._direct,
            discovery: this._discovery,
            dashboard: this._dashboard
        });
    }
    // --- Sub-Twin Getters ---
    get device() {
        return this._device;
    }
    get graphql() {
        return this._graphql;
    }
    get direct() {
        return this._direct;
    }
    get media() {
        return this._media;
    }
    get web() {
        return this._web;
    }
    get discovery() {
        return this._discovery;
    }
    get dashboard() {
        return this._dashboard;
    }
    get router() {
        return this._router;
    }
    get catalog() {
        return GraphCatalog.getInstance();
    }
    get keyManager() {
        return new ApiKeyManager();
    }
    /**
     * Fluent Node Accessors (Official Facebook Business SDK 1:1 Parity)
     */
    nodeMedia(id) {
        return new GraphMediaProxy(id, this._router);
    }
    nodeUser(id = 'me') {
        return new GraphUserProxy(id, this._router);
    }
    nodeConversation(id) {
        return new GraphConversationProxy(id, this._router);
    }
    /**
     * Official Standard Meta Graph API Method
     * Matches official Meta JavaScript SDK FB.api() 1:1
     *
     * Usage:
     *   tg.api('/me')
     *   tg.api('/me', { fields: 'id,name' })
     *   tg.api('/me/insights', { metric: 'reach,impressions,follower_count' })
     *   tg.api('/me/dashboard')
     *   tg.api('/DedDBnTCs-J/insights', 'GET')
     *   tg.api('/1234567/messages', 'POST', { message: 'Hello' })
     */
    async api(path, methodOrParams, paramsOrBody) {
        let method = 'GET';
        let params = {};
        if (typeof methodOrParams === 'string') {
            method = methodOrParams.toUpperCase();
            params = paramsOrBody || {};
        }
        else if (typeof methodOrParams === 'object' && methodOrParams !== null) {
            method = 'GET';
            params = methodOrParams;
        }
        // Normalize path by stripping leading slash
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        // If path targets versioned Graph API (e.g. /v21.0/...), dispatch directly through declarative GraphRouter
        if (cleanPath.startsWith('/v21.0/') || cleanPath.startsWith('/v22.0/')) {
            return this._router.dispatch(cleanPath, method, params);
        }
        const unversioned = cleanPath.replace(new RegExp(`^\\/${this.apiVersion}`), '');
        // 1. Route: /me or /{current_user_id}
        const currentUserId = this._device.getUserId();
        if (unversioned === '/me' || unversioned === `/${currentUserId}`) {
            const fields = params.fields ? String(params.fields).split(',') : undefined;
            return (await this.getMe(fields));
        }
        // 2. Route: Account Dashboard & Overview (/me/dashboard, /{user-id}/dashboard, /insights/account_overview)
        const dashboardMatch = unversioned.match(/^\/(?:me\/dashboard|insights\/account_overview|([a-zA-Z0-9_-]+)\/dashboard)\/?$/);
        if (dashboardMatch && method === 'GET') {
            const timeframe = (params.timeframe || '30d');
            return (await this._dashboard.getFullDashboard(timeframe));
        }
        // 3. Route: Insights (Account Insights vs Media Insights)
        // - Account Insights: /me/insights or /{user-id}/insights
        // - Media Insights: /{media-id}/insights
        const insightsMatch = unversioned.match(/^\/([a-zA-Z0-9_-]+)\/insights\/?$/);
        if (insightsMatch) {
            const targetId = insightsMatch[1];
            const metrics = params.metric ? String(params.metric).split(',') : undefined;
            const timeframe = (params.timeframe || (params.period === 'week' ? '7d' : params.period === 'days_28' ? '14d' : '30d'));
            // Distinguish account (/me, currentUserId, or metric specifies account metrics) vs media ID
            if (targetId === 'me' || targetId === currentUserId) {
                if (params.format === 'full' || params.format === 'dashboard') {
                    return (await this._dashboard.getFullDashboard(timeframe));
                }
                return (await this._dashboard.getGraphApiInsights(timeframe, metrics));
            }
            else {
                if (params.type === 'reel' || params.breakdown === 'retention') {
                    return (await this._dashboard.getReelInsights(targetId));
                }
                if (params.type === 'post' || params.breakdown === 'surface') {
                    return (await this._dashboard.getPostInsights(targetId));
                }
                if (params.type === 'story' || params.breakdown === 'navigation') {
                    const tf = (params.timeframe || '24h');
                    return (await this._dashboard.getStoryInsights(targetId, tf));
                }
                const isAccountMetrics = metrics && metrics.some(m => ['follower_count', 'profile_views', 'website_clicks', 'accounts_engaged'].includes(m.toLowerCase()));
                if (isAccountMetrics) {
                    return (await this._dashboard.getGraphApiInsights(timeframe, metrics));
                }
                return (await this.getMediaInsights(targetId, metrics));
            }
        }
        // Dedicated Granular Content Insights Routes
        const reelInsightsMatch = unversioned.match(/^\/([a-zA-Z0-9_-]+)\/reel_insights\/?$/);
        if (reelInsightsMatch) {
            return (await this._dashboard.getReelInsights(reelInsightsMatch[1]));
        }
        const postInsightsMatch = unversioned.match(/^\/([a-zA-Z0-9_-]+)\/post_insights\/?$/);
        if (postInsightsMatch) {
            return (await this._dashboard.getPostInsights(postInsightsMatch[1]));
        }
        const storyInsightsMatch = unversioned.match(/^\/([a-zA-Z0-9_-]+)\/story_insights\/?$/);
        if (storyInsightsMatch) {
            const tf = (params.timeframe || '24h');
            return (await this._dashboard.getStoryInsights(storyInsightsMatch[1], tf));
        }
        const contentFilterMatch = unversioned.match(/^\/(?:insights\/content|content_insights)\/?$/);
        if (contentFilterMatch) {
            return (await this._dashboard.filterContentInsights(params));
        }
        // 3. Route: /{user_id}/conversations or /conversations
        const convMatch = unversioned.match(/^\/(?:[a-zA-Z0-9_-]+\/)?conversations\/?$/);
        if (convMatch && method === 'GET') {
            return (await this._direct.getConversations(params));
        }
        // 4. Route: /{conversation_id}/messages
        const messagesMatch = unversioned.match(/^\/([a-zA-Z0-9_-]+)\/messages\/?$/);
        if (messagesMatch) {
            const conversationId = messagesMatch[1];
            if (method === 'POST') {
                const text = params.message || params.text || '';
                return (await this._direct.sendMessage(conversationId, text, params));
            }
            else {
                return (await this._direct.getMessages(conversationId, params.limit));
            }
        }
        // 4b. Route: /{media_id}/comments (Official Meta Graph API v21.0 POST/GET /{media-id}/comments)
        const commentsMatch = unversioned.match(/^\/([a-zA-Z0-9_-]+)\/comments?\/?$/);
        if (commentsMatch) {
            const mediaId = commentsMatch[1];
            if (method === 'POST') {
                const message = params.message || params.comment_text || params.text || '';
                return (await this._media.postComment(mediaId, message));
            }
            else {
                return (await this._media.getComments(mediaId, params));
            }
        }
        // 5. Route: /{user_id}/media
        const mediaContainerMatch = unversioned.match(/^\/(?:[a-zA-Z0-9_-]+\/)?media\/?$/);
        if (mediaContainerMatch && method === 'POST') {
            return (await this._media.createMediaContainer(params));
        }
        // 6. Route: /{user_id}/media_publish
        const mediaPublishMatch = unversioned.match(/^\/(?:[a-zA-Z0-9_-]+\/)?media_publish\/?$/);
        if (mediaPublishMatch && method === 'POST') {
            const containerId = params.creation_id || params.id || `180${Date.now().toString().slice(-8)}`;
            return (await this._media.publishMediaContainer(containerId));
        }
        // 6b. Route: Profile & Timeline Hydration (IGProfileTimelineQuery)
        const timelineMatch = unversioned.match(/^\/(?:me\/timeline|([a-zA-Z0-9_-]+)\/timeline|me\/feed|([a-zA-Z0-9_-]+)\/feed)\/?$/);
        if (timelineMatch && method === 'GET') {
            const targetUserId = timelineMatch[1] || timelineMatch[2];
            return (await this.getProfileTimeline(targetUserId, params));
        }
        // 6c. Route: Creator Switching & Destination Metadata (IgCreatorDestinationTypeQuery)
        const creatorDestMatch = unversioned.match(/^\/(?:me\/creator_destination|([a-zA-Z0-9_-]+)\/creator_destination|creator\/destination)\/?$/);
        if (creatorDestMatch && method === 'GET') {
            return (await this.getCreatorDestination());
        }
        // 6d. Route: Subscription Tier Benefits (SUBSBenefitEligibilityQuery)
        const subBenefitsMatch = unversioned.match(/^\/(?:me\/subscription_benefits|([a-zA-Z0-9_-]+)\/subscription_benefits|subscriptions\/benefits|subscriptions\/eligibility)\/?$/);
        if (subBenefitsMatch && method === 'GET') {
            return (await this.getSubscriptionBenefits());
        }
        // 6e. Route: Following Graph Hydration (FollowingList)
        const followingMatch = unversioned.match(/^\/(?:me\/following|([a-zA-Z0-9_-]+)\/following|following)\/?$/);
        if (followingMatch && method === 'GET') {
            const targetUserId = followingMatch[1];
            return (await this.getFollowing(targetUserId, params));
        }
        // 7. Route: Single Media Object /{media-id}
        const singleMediaMatch = unversioned.match(/^\/([a-zA-Z0-9_-]+)\/?$/);
        if (singleMediaMatch && method === 'GET') {
            const mediaId = singleMediaMatch[1];
            return (await this._media.getMedia(mediaId));
        }
        // 8. Route: Notes & Status (/notes, /{user_id}/notes)
        const notesMatch = unversioned.match(/^\/(?:[a-zA-Z0-9_-]+\/)?notes\/?$/);
        if (notesMatch && method === 'POST') {
            const text = params.text || params.message || '';
            return (await this._media.publishNote({ text, audience: params.audience }));
        }
        // 9. Route: Search & Discovery (/ig_hashtag_search, /users/search, /search, /fbsearch/topsearch_flat)
        const searchMatch = unversioned.match(/^\/(?:ig_hashtag_search|users\/search|search|fbsearch\/topsearch_flat)\/?$/);
        if (searchMatch && method === 'GET') {
            const q = params.q || params.query || '';
            return (await this._discovery.search(q, {
                context: params.context || 'blended',
                rankToken: params.rank_token,
                count: params.count ? Number(params.count) : undefined
            }));
        }
        // 9b. Route: Viral Explore & Controversy Engine (/explore/viral, /discover/viral_explore)
        if (unversioned.match(/^\/(?:explore\/viral|discover\/viral_explore)\/?$/) && method === 'GET') {
            return (await this._discovery.getViralExplore({
                minCommentRatio: params.min_comment_ratio ? Number(params.min_comment_ratio) : undefined,
                limit: params.limit ? Number(params.limit) : undefined
            }));
        }
        // 9c. Route: Trending Hashtags (/trending_hashtags, /hashtags/trending)
        if (unversioned.match(/^\/(?:trending_hashtags|hashtags\/trending)\/?$/) && method === 'GET') {
            const q = String(params.q || params.query || '');
            return (await this._discovery.getTrendingHashtags(q));
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
                    return (await resp.json());
                }
            }
            catch {
                // Fallback to offline twin synthesis
            }
        }
        // Default fallback node
        return {
            id: currentUserId,
            path: cleanPath,
            method: method
        };
    }
    // --- Convenience Shortcuts ---
    /**
     * Fetch authenticated user node (`/me`)
     */
    async getMe(fields) {
        const rawUser = {
            id: this._device.getUserId(),
            username: this._device.getUsername(),
            full_name: this._device.getFullName()
        };
        const node = this._graphql.translateUserToGraphNode(rawUser);
        if (fields && fields.length > 0) {
            const filtered = { id: node.id };
            for (const field of fields) {
                if (field in node) {
                    filtered[field] = node[field];
                }
            }
            return filtered;
        }
        return node;
    }
    /**
     * Fetch media insights (`/{media_id}/insights`)
     */
    async getMediaInsights(mediaId, metrics) {
        return this._media.getInsights(mediaId, metrics);
    }
    /**
     * Complete media publishing workflow (Container -> Publish)
     */
    async publishMedia(params) {
        return this._media.publishMedia(params);
    }
    /**
     * Convenience: Publish Feed Post (with caption validation, hashtags, mentions)
     */
    async publishFeedPost(params) {
        return this._media.publishFeedPost(params);
    }
    /**
     * Convenience: Publish Story (photo/video with stickers or overlays)
     */
    async publishStory(params) {
        return this._media.publishStory(params);
    }
    /**
     * Convenience: Publish Reel (video with caption and audio cluster)
     */
    async publishReel(params) {
        return this._media.publishReel(params);
    }
    /**
     * Convenience: Publish Status Note (up to 60 characters)
     */
    async publishNote(params) {
        return this._media.publishNote(params);
    }
    /**
     * Caption parser & validator helper
     */
    validateCaption(caption) {
        return this._media.parseAndValidateCaption(caption);
    }
    /**
     * Search & Discovery (`/fbsearch/topsearch_flat` / `/ig_hashtag_search` / `/users/search`)
     */
    async search(query, options) {
        return this._discovery.search(query, options);
    }
    /**
     * Search users only
     */
    async searchUsers(query, options) {
        return this._discovery.searchUsers(query, options);
    }
    /**
     * Search hashtags only
     */
    async searchHashtags(query, options) {
        return this._discovery.searchHashtags(query, options);
    }
    /**
     * Viral Engagement & Controversy Engine (`/discover/topical_explore`)
     * Ranks explore posts by true viral/controversial metrics (comment-to-view and comment-to-like engagement ratios).
     */
    async getViralExplore(options) {
        return this._discovery.getViralExplore(options);
    }
    /**
     * Trending Hashtags Discovery
     * Discovers and ranks trending hashtags for a given topic or keyword.
     */
    async getTrendingHashtags(query) {
        return this._discovery.getTrendingHashtags(query);
    }
    // --- Professional Dashboard Convenience Methods ---
    /**
     * Fetch full mobile Professional Dashboard data
     */
    async getDashboard(timeframe = '30d') {
        return this._dashboard.getFullDashboard(timeframe);
    }
    /**
     * Fetch account overview metrics (reach, engagement, follower growth)
     */
    async getAccountOverview(timeframe = '30d') {
        return this._dashboard.getOverview(timeframe);
    }
    /**
     * Fetch audience demographics (top cities, top countries, age/gender, active hours)
     */
    async getAudienceInsights() {
        return this._dashboard.getAudience();
    }
    /**
     * Fetch content performance (top reels, top posts, top stories)
     */
    async getContentPerformance(timeframe = '30d') {
        return this._dashboard.getContentPerformance(timeframe);
    }
    /**
     * Fetch professional creator tools & monetization eligibility
     */
    async getProfessionalTools() {
        return this._dashboard.getProfessionalTools();
    }
    /**
     * Fetch Granular Story Insights (navigation, replies, follower attribution, 24h to 2y archives)
     */
    async getStoryInsights(storyId, timeframe = '24h') {
        return this._dashboard.getStoryInsights(storyId, timeframe);
    }
    /**
     * Fetch Granular Reel Insights (second-by-second retention curve, replays, watch time, follower attribution)
     */
    async getReelInsights(reelId) {
        return this._dashboard.getReelInsights(reelId);
    }
    /**
     * Fetch Granular Feed Post Insights (impressions by surface, follows from post, interaction distribution)
     */
    async getPostInsights(postId) {
        return this._dashboard.getPostInsights(postId);
    }
    /**
     * Filter and sort content across reels, posts, and stories with granular analytics
     */
    async filterContentInsights(options) {
        return this._dashboard.filterContentInsights(options);
    }
    /**
     * Hydrates Profile & Timeline Grid (IGProfileTimelineQuery)
     */
    async getProfileTimeline(userId, options) {
        return this._dashboard.getProfileTimeline(userId, options);
    }
    /**
     * Retrieves Creator Switching & Destination Metadata (IgCreatorDestinationTypeQuery)
     */
    async getCreatorDestination() {
        return this._dashboard.getCreatorDestination();
    }
    /**
     * Retrieves Subscription Tier Benefits & Monetization Eligibility (SUBSBenefitEligibilityQuery)
     */
    async getSubscriptionBenefits() {
        return this._dashboard.getSubscriptionBenefitEligibility();
    }
    /**
     * Hydrates User Following Graph (FollowingList)
     */
    async getFollowing(userId, options) {
        return this._discovery.getFollowing(userId, options);
    }
    /**
     * Retrieves a single media object with optional field projection
     * Official Meta Graph API v21.0 Mapping: GET /{media-id}
     */
    async getMedia(mediaId, fields) {
        const fieldParam = Array.isArray(fields) ? fields.join(',') : fields;
        return this._router.dispatch(`/${mediaId}`, 'GET', { fields: fieldParam });
    }
    /**
     * Posts a comment on a media object
     * Official Meta Graph API v21.0 Mapping: POST /{media-id}/comments
     * Modes:
     *  - 'web' (default if web session active): Authentic RelayModern GraphQL (PolarisPostCommentInputRevampedMutation)
     *  - 'mobile': Authentic Mobile Liger Endpoint (POST /api/v1/media/{cleanMediaId}/comment/)
     */
    async postComment(mediaId, message, options) {
        if (options?.mode === 'web' || (!this._device.hasActiveSession() && this._web.hasActiveSession())) {
            return this._web.postComment(mediaId, message, options);
        }
        return this._media.postComment(mediaId, message);
    }
    /**
     * Retrieves comments on a media object
     * Official Meta Graph API v21.0 Mapping: GET /{media-id}/comments
     * Authentic Mobile Endpoint: GET https://i.instagram.com/api/v1/media/{cleanMediaId}/comments/
     */
    async getComments(mediaId, options) {
        return this._media.getComments(mediaId, options);
    }
    /**
     * Retrieves messages within a conversation thread
     * Official Meta Graph API v21.0 Mapping: GET /{conversation-id}/messages
     * Routes to Web GraphQL (IGDThreadDetailQuery) when web session active, or Mobile MSYS
     */
    async getThreadMessages(threadId, options) {
        if (options?.mode === 'mobile') {
            return this._direct.getThread(threadId);
        }
        if (options?.mode === 'web' || this._web.hasActiveSession()) {
            return this._web.getThreadMessages(threadId, options);
        }
        return this._direct.getThread(threadId);
    }
    /**
     * Sends a direct message to a conversation thread
     * Official Meta Graph API v21.0 Mapping: POST /{conversation-id}/messages
     * Routes to Web GraphQL (IGDirectTextSendMutation) when web session active, or Mobile MSYS (broadcast/text)
     */
    async sendDirectMessage(threadId, message, options) {
        if (options?.mode === 'mobile') {
            return this._direct.sendMessage(threadId, message, options);
        }
        if (options?.mode === 'web' || this._web.hasActiveSession()) {
            return this._web.sendDirectMessage(threadId, message);
        }
        return this._direct.sendMessage(threadId, message, options);
    }
    /**
     * Downloads high-resolution media (Video, MP3 Audio, High-Res Cover Image)
     * Pure native SDK method — zero scripts required.
     */
    async downloadMedia(shortcodeOrUrl, options) {
        const downloader = new UniversalDownloader();
        return downloader.downloadMedia(shortcodeOrUrl, options);
    }
    // --- Backward Compatibility Convenience Methods ---
    async get(endpoint, params = {}) {
        return this.api(endpoint, 'GET', params);
    }
    /**
     * Starts a local wire-compatible HTTP Gateway Server (Meta Graph API v21.0)
     */
    async startGateway(port = 3000, host = '127.0.0.1') {
        const server = new TwinGatewayServer({
            port,
            host,
            router: this._router,
            keyManager: this.keyManager
        });
        await server.start();
        return server;
    }
}
// 100% Backward Compatibility Aliases
export const TwinGraphClient = TwinGraph;
export const MetaGraphClient = TwinGraph;
