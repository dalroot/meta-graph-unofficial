/**
 * TwinGraph - Harmonious Meta Graph API v21.0 Client Architecture
 *
 * Bridges official Meta Graph API v21.0 resource representations with
 * authentic Xiaomi Redmi Note 13 4G hardware telemetry, Liger/Tigon headers,
 * Pando GraphQL queries, and MSYS Direct message pipelines.
 *
 * Conforms 1:1 with official Meta JavaScript SDK conventions (FB.api).
 */
import { DeviceTwin } from './twins/device_twin.js';
import { GraphQLTwin } from './twins/graphql_twin.js';
import { DirectTwin } from './twins/direct_twin.js';
import { MediaTwin } from './twins/media_twin.js';
import { WebTwin } from './twins/web_twin.js';
import { DiscoveryTwin } from './twins/discovery_twin.js';
import { DashboardTwin } from './twins/dashboard_twin.js';
import { GraphRouter } from './router/graph_router.js';
import { GraphMediaProxy, GraphUserProxy, GraphConversationProxy } from './nodes/node_proxies.js';
import { GraphCatalog } from './schema/graph_catalog.js';
import { MediaDownloadResult } from './utils/downloader.js';
import { ApiKeyManager } from './auth/api_key_manager.js';
import { TwinGatewayServer } from './gateway/gateway_server.js';
import { GraphUser, GraphMedia, GraphInsightsResponse, GraphConversation, PublishMediaParams, PublishFeedPostParams, PublishStoryParams, PublishReelParams, PublishNoteParams, GraphNote, ParsedCaptionInfo, ClientOptions, GraphSearchResponse, GraphSearchUser, GraphSearchHashtag, SearchOptions, DashboardTimeframe, GraphAccountOverview, GraphAudienceInsights, GraphContentPerformance, ProfessionalToolsStatus, ProfessionalDashboardData, ExtendedAnalyticsTimeframe, GraphStoryInsights, GraphReelInsights, GraphPostInsights, ContentFilterOptions, FilteredContentResponse, ViralExplorePost, ViralExploreOptions, ProfileTimelineOptions, ProfileTimelineResponse, CreatorDestinationInfo, SubscriptionBenefitEligibility, FollowingListOptions, FollowingListResponse, GraphComment, DirectSendMessageResponse } from './types/graph.js';
export declare class TwinGraph {
    private _device;
    private _graphql;
    private _direct;
    private _media;
    private _web;
    private _discovery;
    private _dashboard;
    private _router;
    private accessToken;
    private apiVersion;
    private baseUrl;
    private offlineMode;
    constructor(options?: ClientOptions);
    get device(): DeviceTwin;
    get graphql(): GraphQLTwin;
    get direct(): DirectTwin;
    get media(): MediaTwin;
    get web(): WebTwin;
    get discovery(): DiscoveryTwin;
    get dashboard(): DashboardTwin;
    get router(): GraphRouter;
    get catalog(): GraphCatalog;
    get keyManager(): ApiKeyManager;
    /**
     * Fluent Node Accessors (Official Facebook Business SDK 1:1 Parity)
     */
    nodeMedia(id: string): GraphMediaProxy;
    nodeUser(id?: string): GraphUserProxy;
    nodeConversation(id: string): GraphConversationProxy;
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
    api<T = any>(path: string, methodOrParams?: 'GET' | 'POST' | 'DELETE' | 'get' | 'post' | 'delete' | Record<string, any>, paramsOrBody?: Record<string, any>): Promise<T>;
    /**
     * Fetch authenticated user node (`/me`)
     */
    getMe(fields?: string[]): Promise<GraphUser>;
    /**
     * Fetch media insights (`/{media_id}/insights`)
     */
    getMediaInsights(mediaId: string, metrics?: string[]): Promise<GraphInsightsResponse>;
    /**
     * Complete media publishing workflow (Container -> Publish)
     */
    publishMedia(params: PublishMediaParams): Promise<{
        id: string;
    }>;
    /**
     * Convenience: Publish Feed Post (with caption validation, hashtags, mentions)
     */
    publishFeedPost(params: PublishFeedPostParams): Promise<{
        id: string;
        media_id: string;
        fbid: string;
        status: string;
        caption_info: ParsedCaptionInfo;
    }>;
    /**
     * Convenience: Publish Story (photo/video with stickers or overlays)
     */
    publishStory(params: PublishStoryParams): Promise<{
        id: string;
        media_id: string;
        fbid: string;
        is_reel_media: boolean;
        expiring_at: number;
        status: string;
    }>;
    /**
     * Convenience: Publish Reel (video with caption and audio cluster)
     */
    publishReel(params: PublishReelParams): Promise<{
        id: string;
        media_id: string;
        fbid: string;
        status: string;
        caption_info: ParsedCaptionInfo;
    }>;
    /**
     * Convenience: Publish Status Note (up to 60 characters)
     */
    publishNote(params: PublishNoteParams): Promise<GraphNote>;
    /**
     * Caption parser & validator helper
     */
    validateCaption(caption: string): ParsedCaptionInfo;
    /**
     * Search & Discovery (`/fbsearch/topsearch_flat` / `/ig_hashtag_search` / `/users/search`)
     */
    search(query: string, options?: SearchOptions): Promise<GraphSearchResponse>;
    /**
     * Search users only
     */
    searchUsers(query: string, options?: SearchOptions): Promise<GraphSearchUser[]>;
    /**
     * Search hashtags only
     */
    searchHashtags(query: string, options?: SearchOptions): Promise<GraphSearchHashtag[]>;
    /**
     * Viral Engagement & Controversy Engine (`/discover/topical_explore`)
     * Ranks explore posts by true viral/controversial metrics (comment-to-view and comment-to-like engagement ratios).
     */
    getViralExplore(options?: ViralExploreOptions): Promise<ViralExplorePost[]>;
    /**
     * Trending Hashtags Discovery
     * Discovers and ranks trending hashtags for a given topic or keyword.
     */
    getTrendingHashtags(query: string): Promise<GraphSearchHashtag[]>;
    /**
     * Fetch full mobile Professional Dashboard data
     */
    getDashboard(timeframe?: DashboardTimeframe): Promise<ProfessionalDashboardData>;
    /**
     * Fetch account overview metrics (reach, engagement, follower growth)
     */
    getAccountOverview(timeframe?: DashboardTimeframe): Promise<GraphAccountOverview>;
    /**
     * Fetch audience demographics (top cities, top countries, age/gender, active hours)
     */
    getAudienceInsights(): Promise<GraphAudienceInsights>;
    /**
     * Fetch content performance (top reels, top posts, top stories)
     */
    getContentPerformance(timeframe?: DashboardTimeframe): Promise<GraphContentPerformance>;
    /**
     * Fetch professional creator tools & monetization eligibility
     */
    getProfessionalTools(): Promise<ProfessionalToolsStatus>;
    /**
     * Fetch Granular Story Insights (navigation, replies, follower attribution, 24h to 2y archives)
     */
    getStoryInsights(storyId: string, timeframe?: ExtendedAnalyticsTimeframe): Promise<GraphStoryInsights>;
    /**
     * Fetch Granular Reel Insights (second-by-second retention curve, replays, watch time, follower attribution)
     */
    getReelInsights(reelId: string): Promise<GraphReelInsights>;
    /**
     * Fetch Granular Feed Post Insights (impressions by surface, follows from post, interaction distribution)
     */
    getPostInsights(postId: string): Promise<GraphPostInsights>;
    /**
     * Filter and sort content across reels, posts, and stories with granular analytics
     */
    filterContentInsights(options?: ContentFilterOptions): Promise<FilteredContentResponse>;
    /**
     * Hydrates Profile & Timeline Grid (IGProfileTimelineQuery)
     */
    getProfileTimeline(userId?: string, options?: ProfileTimelineOptions): Promise<ProfileTimelineResponse>;
    /**
     * Retrieves Creator Switching & Destination Metadata (IgCreatorDestinationTypeQuery)
     */
    getCreatorDestination(): Promise<CreatorDestinationInfo>;
    /**
     * Retrieves Subscription Tier Benefits & Monetization Eligibility (SUBSBenefitEligibilityQuery)
     */
    getSubscriptionBenefits(): Promise<SubscriptionBenefitEligibility>;
    /**
     * Hydrates User Following Graph (FollowingList)
     */
    getFollowing(userId?: string, options?: FollowingListOptions): Promise<FollowingListResponse>;
    /**
     * Retrieves a single media object with optional field projection
     * Official Meta Graph API v21.0 Mapping: GET /{media-id}
     */
    getMedia(mediaId: string, fields?: string | string[]): Promise<GraphMedia>;
    /**
     * Posts a comment on a media object
     * Official Meta Graph API v21.0 Mapping: POST /{media-id}/comments
     * Modes:
     *  - 'web' (default if web session active): Authentic RelayModern GraphQL (PolarisPostCommentInputRevampedMutation)
     *  - 'mobile': Authentic Mobile Liger Endpoint (POST /api/v1/media/{cleanMediaId}/comment/)
     */
    postComment(mediaId: string, message: string, options?: {
        mode?: 'mobile' | 'web';
        shortcode?: string;
        parentCommentId?: string;
    }): Promise<GraphComment>;
    /**
     * Retrieves comments on a media object
     * Official Meta Graph API v21.0 Mapping: GET /{media-id}/comments
     * Authentic Mobile Endpoint: GET https://i.instagram.com/api/v1/media/{cleanMediaId}/comments/
     */
    getComments(mediaId: string, options?: {
        limit?: number;
        min_id?: string;
    }): Promise<{
        data: GraphComment[];
        paging?: any;
    }>;
    /**
     * Retrieves messages within a conversation thread
     * Official Meta Graph API v21.0 Mapping: GET /{conversation-id}/messages
     * Routes to Web GraphQL (IGDThreadDetailQuery) when web session active, or Mobile MSYS
     */
    getThreadMessages(threadId: string, options?: {
        limit?: number;
        mode?: 'mobile' | 'web';
    }): Promise<GraphConversation>;
    /**
     * Sends a direct message to a conversation thread
     * Official Meta Graph API v21.0 Mapping: POST /{conversation-id}/messages
     * Routes to Web GraphQL (IGDirectTextSendMutation) when web session active, or Mobile MSYS (broadcast/text)
     */
    sendDirectMessage(threadId: string, message: string, options?: {
        mode?: 'mobile' | 'web';
        clientContext?: string;
        recipientUserId?: string;
    }): Promise<DirectSendMessageResponse>;
    /**
     * Downloads high-resolution media (Video, MP3 Audio, High-Res Cover Image)
     * Pure native SDK method — zero scripts required.
     */
    downloadMedia(shortcodeOrUrl: string, options?: {
        downloadVideo?: boolean;
        downloadAudio?: boolean;
        downloadPhoto?: boolean;
        outputDir?: string;
    }): Promise<MediaDownloadResult>;
    get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T>;
    /**
     * Starts a local wire-compatible HTTP Gateway Server (Meta Graph API v21.0)
     */
    startGateway(port?: number, host?: string): Promise<TwinGatewayServer>;
}
export declare const TwinGraphClient: typeof TwinGraph;
export type TwinGraphClient = TwinGraph;
export declare const MetaGraphClient: typeof TwinGraph;
export type MetaGraphClient = TwinGraph;
