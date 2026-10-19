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
import { UniversalDownloader, MediaDownloadResult } from './utils/downloader.js';
import {
  GraphUser,
  GraphMedia,
  GraphInsightsResponse,
  GraphConversation,
  PublishMediaParams,
  PublishFeedPostParams,
  PublishStoryParams,
  PublishReelParams,
  PublishNoteParams,
  GraphNote,
  ParsedCaptionInfo,
  ClientOptions,
  GraphSearchResponse,
  GraphSearchUser,
  GraphSearchHashtag,
  SearchOptions,
  DashboardTimeframe,
  GraphAccountOverview,
  GraphAudienceInsights,
  GraphContentPerformance,
  ProfessionalToolsStatus,
  ProfessionalDashboardData,
  ExtendedAnalyticsTimeframe,
  GraphStoryInsights,
  GraphReelInsights,
  GraphPostInsights,
  ContentFilterOptions,
  FilteredContentResponse,
  UnifiedContentItem,
  ViralEngagementMetrics,
  ViralExplorePost,
  ViralExploreOptions,
  ProfileTimelineOptions,
  ProfileTimelineResponse,
  CreatorDestinationInfo,
  SubscriptionBenefitEligibility,
  FollowingListOptions,
  FollowingListResponse,
  GraphComment,
  DirectSendMessageResponse
} from './types/graph.js';

export class TwinGraph {
  private _device: DeviceTwin;
  private _graphql: GraphQLTwin;
  private _direct: DirectTwin;
  private _media: MediaTwin;
  private _web: WebTwin;
  private _discovery: DiscoveryTwin;
  private _dashboard: DashboardTwin;
  private _router: GraphRouter;

  private accessToken: string;
  private apiVersion: string;
  private baseUrl: string;
  private offlineMode: boolean;

  constructor(options: ClientOptions = {}) {
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

  public get web(): WebTwin {
    return this._web;
  }

  public get discovery(): DiscoveryTwin {
    return this._discovery;
  }

  public get dashboard(): DashboardTwin {
    return this._dashboard;
  }

  public get router(): GraphRouter {
    return this._router;
  }

  public get catalog(): GraphCatalog {
    return GraphCatalog.getInstance();
  }

  /**
   * Fluent Node Accessors (Official Facebook Business SDK 1:1 Parity)
   */
  public nodeMedia(id: string): GraphMediaProxy {
    return new GraphMediaProxy(id, this._router);
  }

  public nodeUser(id: string = 'me'): GraphUserProxy {
    return new GraphUserProxy(id, this._router);
  }

  public nodeConversation(id: string): GraphConversationProxy {
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

    // Normalize path by stripping leading slash
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // If path targets versioned Graph API (e.g. /v21.0/...), dispatch directly through declarative GraphRouter
    if (cleanPath.startsWith('/v21.0/') || cleanPath.startsWith('/v22.0/')) {
      return this._router.dispatch<T>(cleanPath, method, params);
    }

    const unversioned = cleanPath.replace(new RegExp(`^\\/${this.apiVersion}`), '');

    // 1. Route: /me or /{current_user_id}
    const currentUserId = this._device.getUserId();
    if (unversioned === '/me' || unversioned === `/${currentUserId}`) {
      const fields = params.fields ? String(params.fields).split(',') : undefined;
      return (await this.getMe(fields)) as unknown as T;
    }

    // 2. Route: Account Dashboard & Overview (/me/dashboard, /{user-id}/dashboard, /insights/account_overview)
    const dashboardMatch = unversioned.match(/^\/(?:me\/dashboard|insights\/account_overview|([a-zA-Z0-9_-]+)\/dashboard)\/?$/);
    if (dashboardMatch && method === 'GET') {
      const timeframe = (params.timeframe || '30d') as DashboardTimeframe;
      return (await this._dashboard.getFullDashboard(timeframe)) as unknown as T;
    }

    // 3. Route: Insights (Account Insights vs Media Insights)
    // - Account Insights: /me/insights or /{user-id}/insights
    // - Media Insights: /{media-id}/insights
    const insightsMatch = unversioned.match(/^\/([a-zA-Z0-9_-]+)\/insights\/?$/);
    if (insightsMatch) {
      const targetId = insightsMatch[1];
      const metrics = params.metric ? String(params.metric).split(',') : undefined;
      const timeframe = (params.timeframe || (params.period === 'week' ? '7d' : params.period === 'days_28' ? '14d' : '30d')) as DashboardTimeframe;

      // Distinguish account (/me, currentUserId, or metric specifies account metrics) vs media ID
      if (targetId === 'me' || targetId === currentUserId) {
        if (params.format === 'full' || params.format === 'dashboard') {
          return (await this._dashboard.getFullDashboard(timeframe)) as unknown as T;
        }
        return (await this._dashboard.getGraphApiInsights(timeframe, metrics)) as unknown as T;
      } else {
        if (params.type === 'reel' || params.breakdown === 'retention') {
          return (await this._dashboard.getReelInsights(targetId)) as unknown as T;
        }
        if (params.type === 'post' || params.breakdown === 'surface') {
          return (await this._dashboard.getPostInsights(targetId)) as unknown as T;
        }
        if (params.type === 'story' || params.breakdown === 'navigation') {
          const tf = (params.timeframe || '24h') as ExtendedAnalyticsTimeframe;
          return (await this._dashboard.getStoryInsights(targetId, tf)) as unknown as T;
        }
        const isAccountMetrics = metrics && metrics.some(m => ['follower_count', 'profile_views', 'website_clicks', 'accounts_engaged'].includes(m.toLowerCase()));
        if (isAccountMetrics) {
          return (await this._dashboard.getGraphApiInsights(timeframe, metrics)) as unknown as T;
        }
        return (await this.getMediaInsights(targetId, metrics)) as unknown as T;
      }
    }

    // Dedicated Granular Content Insights Routes
    const reelInsightsMatch = unversioned.match(/^\/([a-zA-Z0-9_-]+)\/reel_insights\/?$/);
    if (reelInsightsMatch) {
      return (await this._dashboard.getReelInsights(reelInsightsMatch[1])) as unknown as T;
    }

    const postInsightsMatch = unversioned.match(/^\/([a-zA-Z0-9_-]+)\/post_insights\/?$/);
    if (postInsightsMatch) {
      return (await this._dashboard.getPostInsights(postInsightsMatch[1])) as unknown as T;
    }

    const storyInsightsMatch = unversioned.match(/^\/([a-zA-Z0-9_-]+)\/story_insights\/?$/);
    if (storyInsightsMatch) {
      const tf = (params.timeframe || '24h') as ExtendedAnalyticsTimeframe;
      return (await this._dashboard.getStoryInsights(storyInsightsMatch[1], tf)) as unknown as T;
    }

    const contentFilterMatch = unversioned.match(/^\/(?:insights\/content|content_insights)\/?$/);
    if (contentFilterMatch) {
      return (await this._dashboard.filterContentInsights(params)) as unknown as T;
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

    // 4b. Route: /{media_id}/comments (Official Meta Graph API v21.0 POST/GET /{media-id}/comments)
    const commentsMatch = unversioned.match(/^\/([a-zA-Z0-9_-]+)\/comments?\/?$/);
    if (commentsMatch) {
      const mediaId = commentsMatch[1];
      if (method === 'POST') {
        const message = params.message || params.comment_text || params.text || '';
        return (await this._media.postComment(mediaId, message)) as unknown as T;
      } else {
        return (await this._media.getComments(mediaId, params)) as unknown as T;
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

    // 6b. Route: Profile & Timeline Hydration (IGProfileTimelineQuery)
    const timelineMatch = unversioned.match(/^\/(?:me\/timeline|([a-zA-Z0-9_-]+)\/timeline|me\/feed|([a-zA-Z0-9_-]+)\/feed)\/?$/);
    if (timelineMatch && method === 'GET') {
      const targetUserId = timelineMatch[1] || timelineMatch[2];
      return (await this.getProfileTimeline(targetUserId, params)) as unknown as T;
    }

    // 6c. Route: Creator Switching & Destination Metadata (IgCreatorDestinationTypeQuery)
    const creatorDestMatch = unversioned.match(/^\/(?:me\/creator_destination|([a-zA-Z0-9_-]+)\/creator_destination|creator\/destination)\/?$/);
    if (creatorDestMatch && method === 'GET') {
      return (await this.getCreatorDestination()) as unknown as T;
    }

    // 6d. Route: Subscription Tier Benefits (SUBSBenefitEligibilityQuery)
    const subBenefitsMatch = unversioned.match(/^\/(?:me\/subscription_benefits|([a-zA-Z0-9_-]+)\/subscription_benefits|subscriptions\/benefits|subscriptions\/eligibility)\/?$/);
    if (subBenefitsMatch && method === 'GET') {
      return (await this.getSubscriptionBenefits()) as unknown as T;
    }

    // 6e. Route: Following Graph Hydration (FollowingList)
    const followingMatch = unversioned.match(/^\/(?:me\/following|([a-zA-Z0-9_-]+)\/following|following)\/?$/);
    if (followingMatch && method === 'GET') {
      const targetUserId = followingMatch[1];
      return (await this.getFollowing(targetUserId, params)) as unknown as T;
    }

    // 7. Route: Single Media Object /{media-id}
    const singleMediaMatch = unversioned.match(/^\/([a-zA-Z0-9_-]+)\/?$/);
    if (singleMediaMatch && method === 'GET') {
      const mediaId = singleMediaMatch[1];
      return (await this._media.getMedia(mediaId)) as unknown as T;
    }

    // 8. Route: Notes & Status (/notes, /{user_id}/notes)
    const notesMatch = unversioned.match(/^\/(?:[a-zA-Z0-9_-]+\/)?notes\/?$/);
    if (notesMatch && method === 'POST') {
      const text = params.text || params.message || '';
      return (await this._media.publishNote({ text, audience: params.audience })) as unknown as T;
    }

    // 9. Route: Search & Discovery (/ig_hashtag_search, /users/search, /search, /fbsearch/topsearch_flat)
    const searchMatch = unversioned.match(/^\/(?:ig_hashtag_search|users\/search|search|fbsearch\/topsearch_flat)\/?$/);
    if (searchMatch && method === 'GET') {
      const q = params.q || params.query || '';
      return (await this._discovery.search(q, {
        context: params.context || 'blended',
        rankToken: params.rank_token,
        count: params.count ? Number(params.count) : undefined
      })) as unknown as T;
    }

    // 9b. Route: Viral Explore & Controversy Engine (/explore/viral, /discover/viral_explore)
    if (unversioned.match(/^\/(?:explore\/viral|discover\/viral_explore)\/?$/) && method === 'GET') {
      return (await this._discovery.getViralExplore({
        minCommentRatio: params.min_comment_ratio ? Number(params.min_comment_ratio) : undefined,
        limit: params.limit ? Number(params.limit) : undefined
      })) as unknown as T;
    }

    // 9c. Route: Trending Hashtags (/trending_hashtags, /hashtags/trending)
    if (unversioned.match(/^\/(?:trending_hashtags|hashtags\/trending)\/?$/) && method === 'GET') {
      const q = String(params.q || params.query || '');
      return (await this._discovery.getTrendingHashtags(q)) as unknown as T;
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
   * Complete media publishing workflow (Container -> Publish)
   */
  public async publishMedia(params: PublishMediaParams): Promise<{ id: string }> {
    return this._media.publishMedia(params);
  }

  /**
   * Convenience: Publish Feed Post (with caption validation, hashtags, mentions)
   */
  public async publishFeedPost(params: PublishFeedPostParams): Promise<{ id: string; media_id: string; fbid: string; status: string; caption_info: ParsedCaptionInfo }> {
    return this._media.publishFeedPost(params);
  }

  /**
   * Convenience: Publish Story (photo/video with stickers or overlays)
   */
  public async publishStory(params: PublishStoryParams): Promise<{ id: string; media_id: string; fbid: string; is_reel_media: boolean; expiring_at: number; status: string }> {
    return this._media.publishStory(params);
  }

  /**
   * Convenience: Publish Reel (video with caption and audio cluster)
   */
  public async publishReel(params: PublishReelParams): Promise<{ id: string; media_id: string; fbid: string; status: string; caption_info: ParsedCaptionInfo }> {
    return this._media.publishReel(params);
  }

  /**
   * Convenience: Publish Status Note (up to 60 characters)
   */
  public async publishNote(params: PublishNoteParams): Promise<GraphNote> {
    return this._media.publishNote(params);
  }

  /**
   * Caption parser & validator helper
   */
  public validateCaption(caption: string): ParsedCaptionInfo {
    return this._media.parseAndValidateCaption(caption);
  }

  /**
   * Search & Discovery (`/fbsearch/topsearch_flat` / `/ig_hashtag_search` / `/users/search`)
   */
  public async search(query: string, options?: SearchOptions): Promise<GraphSearchResponse> {
    return this._discovery.search(query, options);
  }

  /**
   * Search users only
   */
  public async searchUsers(query: string, options?: SearchOptions): Promise<GraphSearchUser[]> {
    return this._discovery.searchUsers(query, options);
  }

  /**
   * Search hashtags only
   */
  public async searchHashtags(query: string, options?: SearchOptions): Promise<GraphSearchHashtag[]> {
    return this._discovery.searchHashtags(query, options);
  }

  /**
   * Viral Engagement & Controversy Engine (`/discover/topical_explore`)
   * Ranks explore posts by true viral/controversial metrics (comment-to-view and comment-to-like engagement ratios).
   */
  public async getViralExplore(options?: ViralExploreOptions): Promise<ViralExplorePost[]> {
    return this._discovery.getViralExplore(options);
  }

  /**
   * Trending Hashtags Discovery
   * Discovers and ranks trending hashtags for a given topic or keyword.
   */
  public async getTrendingHashtags(query: string): Promise<GraphSearchHashtag[]> {
    return this._discovery.getTrendingHashtags(query);
  }

  // --- Professional Dashboard Convenience Methods ---

  /**
   * Fetch full mobile Professional Dashboard data
   */
  public async getDashboard(timeframe: DashboardTimeframe = '30d'): Promise<ProfessionalDashboardData> {
    return this._dashboard.getFullDashboard(timeframe);
  }

  /**
   * Fetch account overview metrics (reach, engagement, follower growth)
   */
  public async getAccountOverview(timeframe: DashboardTimeframe = '30d'): Promise<GraphAccountOverview> {
    return this._dashboard.getOverview(timeframe);
  }

  /**
   * Fetch audience demographics (top cities, top countries, age/gender, active hours)
   */
  public async getAudienceInsights(): Promise<GraphAudienceInsights> {
    return this._dashboard.getAudience();
  }

  /**
   * Fetch content performance (top reels, top posts, top stories)
   */
  public async getContentPerformance(timeframe: DashboardTimeframe = '30d'): Promise<GraphContentPerformance> {
    return this._dashboard.getContentPerformance(timeframe);
  }

  /**
   * Fetch professional creator tools & monetization eligibility
   */
  public async getProfessionalTools(): Promise<ProfessionalToolsStatus> {
    return this._dashboard.getProfessionalTools();
  }

  /**
   * Fetch Granular Story Insights (navigation, replies, follower attribution, 24h to 2y archives)
   */
  public async getStoryInsights(
    storyId: string,
    timeframe: ExtendedAnalyticsTimeframe = '24h'
  ): Promise<GraphStoryInsights> {
    return this._dashboard.getStoryInsights(storyId, timeframe);
  }

  /**
   * Fetch Granular Reel Insights (second-by-second retention curve, replays, watch time, follower attribution)
   */
  public async getReelInsights(reelId: string): Promise<GraphReelInsights> {
    return this._dashboard.getReelInsights(reelId);
  }

  /**
   * Fetch Granular Feed Post Insights (impressions by surface, follows from post, interaction distribution)
   */
  public async getPostInsights(postId: string): Promise<GraphPostInsights> {
    return this._dashboard.getPostInsights(postId);
  }

  /**
   * Filter and sort content across reels, posts, and stories with granular analytics
   */
  public async filterContentInsights(options?: ContentFilterOptions): Promise<FilteredContentResponse> {
    return this._dashboard.filterContentInsights(options);
  }

  /**
   * Hydrates Profile & Timeline Grid (IGProfileTimelineQuery)
   */
  public async getProfileTimeline(
    userId?: string,
    options?: ProfileTimelineOptions
  ): Promise<ProfileTimelineResponse> {
    return this._dashboard.getProfileTimeline(userId, options);
  }

  /**
   * Retrieves Creator Switching & Destination Metadata (IgCreatorDestinationTypeQuery)
   */
  public async getCreatorDestination(): Promise<CreatorDestinationInfo> {
    return this._dashboard.getCreatorDestination();
  }

  /**
   * Retrieves Subscription Tier Benefits & Monetization Eligibility (SUBSBenefitEligibilityQuery)
   */
  public async getSubscriptionBenefits(): Promise<SubscriptionBenefitEligibility> {
    return this._dashboard.getSubscriptionBenefitEligibility();
  }

  /**
   * Hydrates User Following Graph (FollowingList)
   */
  public async getFollowing(
    userId?: string,
    options?: FollowingListOptions
  ): Promise<FollowingListResponse> {
    return this._discovery.getFollowing(userId, options);
  }

  /**
   * Retrieves a single media object with optional field projection
   * Official Meta Graph API v21.0 Mapping: GET /{media-id}
   */
  public async getMedia(mediaId: string, fields?: string | string[]): Promise<GraphMedia> {
    const fieldParam = Array.isArray(fields) ? fields.join(',') : fields;
    return this._router.dispatch<GraphMedia>(`/${mediaId}`, 'GET', { fields: fieldParam });
  }

  /**
   * Posts a comment on a media object
   * Official Meta Graph API v21.0 Mapping: POST /{media-id}/comments
   * Modes:
   *  - 'web' (default if web session active): Authentic RelayModern GraphQL (PolarisPostCommentInputRevampedMutation)
   *  - 'mobile': Authentic Mobile Liger Endpoint (POST /api/v1/media/{cleanMediaId}/comment/)
   */
  public async postComment(
    mediaId: string,
    message: string,
    options?: { mode?: 'mobile' | 'web'; shortcode?: string; parentCommentId?: string }
  ): Promise<GraphComment> {
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
  public async getComments(mediaId: string, options?: { limit?: number; min_id?: string }): Promise<{
    data: GraphComment[];
    paging?: any;
  }> {
    return this._media.getComments(mediaId, options);
  }

  /**
   * Retrieves messages within a conversation thread
   * Official Meta Graph API v21.0 Mapping: GET /{conversation-id}/messages
   * Routes to Web GraphQL (IGDThreadDetailQuery) when web session active, or Mobile MSYS
   */
  public async getThreadMessages(
    threadId: string,
    options?: { limit?: number; mode?: 'mobile' | 'web' }
  ): Promise<GraphConversation> {
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
  public async sendDirectMessage(
    threadId: string,
    message: string,
    options?: { mode?: 'mobile' | 'web'; clientContext?: string; recipientUserId?: string }
  ): Promise<DirectSendMessageResponse> {
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
  public async downloadMedia(
    shortcodeOrUrl: string,
    options?: { downloadVideo?: boolean; downloadAudio?: boolean; downloadPhoto?: boolean; outputDir?: string }
  ): Promise<MediaDownloadResult> {
    const downloader = new UniversalDownloader();
    return downloader.downloadMedia(shortcodeOrUrl, options);
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
