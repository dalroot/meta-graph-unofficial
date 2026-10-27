/**
 * DashboardTwin - Mobile Professional Dashboard & Insights Subsystem
 *
 * Conforms 1:1 with official Meta Graph API v21.0 specifications:
 *   - Account Insights: GET /v21.0/{user-id}/insights?metric=reach,impressions,follower_count&period=days_28
 *   - Audience Demographics: GET /v21.0/{user-id}/insights?metric=audience_city,audience_country,audience_gender_age
 *   - Media Insights: GET /v21.0/{media-id}/insights
 *
 * Accurately models the verified mobile Instagram Professional Dashboard endpoints:
 *   - GET https://i.instagram.com/api/v1/insights/account_overview/?timeframe={7d|14d|30d|90d}
 *   - GET https://i.instagram.com/api/v1/insights/media_insights/?media_id={media_id}&surface=view_insights
 *
 * Ground truth provenance:
 *   - Xiaomi Redmi Note 13 4G (23129RAA4G / sapphire / SM6225)
 *   - Handlers: InsightsOverviewFragment, SeriesInsightsDevicePreviewActivity, CompetitiveInsightsUrlHandlerActivity
 *   - RAW_TELEMETRY_VS_GRAPH_API_MAPPING.md (Section 10.4 & Section 4)
 */
import { DeviceTwin } from './device_twin.js';
import { DashboardTimeframe, GraphAccountOverview, GraphAudienceInsights, GraphContentPerformance, ProfessionalToolsStatus, ProfessionalDashboardData, GraphInsightsResponse, ExtendedAnalyticsTimeframe, GraphStoryInsights, GraphReelInsights, GraphPostInsights, ContentFilterOptions, FilteredContentResponse, ProfileTimelineOptions, ProfileTimelineResponse, CreatorDestinationInfo, SubscriptionBenefitEligibility } from '../types/graph.js';
export interface DashboardTwinOptions {
    offlineMode?: boolean;
}
export declare class DashboardTwin {
    private deviceTwin;
    private transport;
    private graphqlTwin;
    private offlineMode;
    constructor(deviceTwin?: DeviceTwin, options?: DashboardTwinOptions);
    setOfflineMode(offline: boolean): void;
    isOfflineMode(): boolean;
    /**
     * Retrieves Mobile Account Overview conforming to GET /api/v1/insights/account_overview/
     * and Meta Graph API v21.0 account metrics.
     *
     * Supported timeframes: '7d' | '14d' | '30d' | '90d'
     */
    getOverview(timeframe?: DashboardTimeframe): Promise<GraphAccountOverview>;
    /**
     * Retrieves Audience Demographics conforming to:
     * GET /v21.0/{user-id}/insights?metric=audience_city,audience_country,audience_gender_age
     */
    getAudience(): Promise<GraphAudienceInsights>;
    /**
     * Retrieves Content Performance (Top Reels, Top Posts, Top Stories)
     * Derived from /api/v1/insights/media_insights/ and /{media-id}/insights.
     */
    getContentPerformance(timeframe?: DashboardTimeframe): Promise<GraphContentPerformance>;
    /**
      * Retrieves Professional Tools & Monetization Status
     */
    getProfessionalTools(): Promise<ProfessionalToolsStatus>;
    /**
     * Hydrates Profile & Timeline grid conforming to Pando IGProfileTimelineQuery and Meta Graph API v21.0
     * Telemetry Source: Line 347613 in instagram_session_2_deep_stream.log
     */
    getProfileTimeline(userId?: string, options?: ProfileTimelineOptions): Promise<ProfileTimelineResponse>;
    /**
     * Retrieves Creator Switching & Destination Metadata conforming to Pando IgCreatorDestinationTypeQuery
     * Telemetry Source: Line 349296 in instagram_session_2_deep_stream.log
     */
    getCreatorDestination(): Promise<CreatorDestinationInfo>;
    /**
     * Retrieves Subscription Tier Benefits & Monetization Eligibility conforming to Pando SUBSBenefitEligibilityQuery
     * Telemetry Source: Line 349598 in instagram_session_2_deep_stream.log
     */
    getSubscriptionBenefitEligibility(): Promise<SubscriptionBenefitEligibility>;
    /**
     * Retrieves the comprehensive Instagram Mobile Professional Dashboard
     * Aggregates Overview, Audience, Content Performance, and Professional Tools into one call.
     */
    getFullDashboard(timeframe?: DashboardTimeframe): Promise<ProfessionalDashboardData>;
    /**
     * Converts mobile Account Overview into 100% compliant Meta Graph API v21.0 /{user-id}/insights schema.
     */
    toGraphApiInsights(overview: GraphAccountOverview, timeframe?: DashboardTimeframe): GraphInsightsResponse;
    /**
     * Query handler matching official GET /v21.0/{user_id}/insights?metric=...
     */
    getGraphApiInsights(timeframe?: DashboardTimeframe, requestedMetrics?: string[]): Promise<GraphInsightsResponse>;
    /**
     * Retrieves Granular Story Insights conforming to Instagram Mobile & Meta Graph API v21.0
     *
     * Metrics:
     *   - Navigation: taps_forward, taps_back, exits, next_story, completion_rate_pct
     *   - Interactions: replies, sticker_taps, link_clicks, shares, likes, total
     *   - Profile Activity: profile_visits, follows_from_story
     *   - Reach & Impressions: reach breakdown (followers vs non-followers)
     *   - Timeframes: 24h active, 7d, 14d, 30d, 90d, 6m, 1y, 2y archive
     */
    getStoryInsights(storyId: string, timeframe?: ExtendedAnalyticsTimeframe): Promise<GraphStoryInsights>;
    /**
     * Retrieves Granular Reel Insights conforming to Instagram Mobile & Meta Graph API v21.0
     *
     * Metrics:
     *   - Plays vs Replays: initial_plays, replays, total_plays, replay_ratio_pct
     *   - Total watch time & Average watch time, completion rate
     *   - Audience retention drop-off curve (0s, 3s, 5s, 10s, 15s)
     *   - Reach breakdown: Followers vs Non-Followers percentage
     *   - Interactions: likes, comments, shares, saves, total interactions
     *   - Profile activity: profile_visits, follows_from_reel
     */
    getReelInsights(reelId: string): Promise<GraphReelInsights>;
    /**
     * Retrieves Granular Feed Post Insights conforming to Instagram Mobile & Meta Graph API v21.0
     *
     * Metrics:
     *   - Impressions breakdown by surface: Home Feed, Explore, Profile, Hashtags, Other
     *   - Reach breakdown: Followers vs Non-Followers percentage
     *   - Profile activity: profile_visits, follows_from_post, website_taps
     *   - Interactions: likes, comments, shares, saves, total interactions
     */
    getPostInsights(postId: string): Promise<GraphPostInsights>;
    /**
     * Content Filtering & Sorting Engine
     *
     * Allows multi-dimensional filtering and sorting across all content types:
     *   - Filter by type: 'REEL' | 'POST' | 'STORY' | 'ALL'
     *   - Sort by: 'reach' | 'plays' | 'impressions' | 'likes' | 'comments' | 'shares' | 'saves' | 'follows' | 'exits'
     *   - Timeframe: '24h' | '7d' | '14d' | '30d' | '90d' | '6m' | '1y' | '2y'
     */
    filterContentInsights(options?: ContentFilterOptions): Promise<FilteredContentResponse>;
    private getSynthesizedStoryInsights;
    private getSynthesizedReelInsights;
    private getSynthesizedPostInsights;
    private getAllUnifiedContent;
    private parseRawStoryInsights;
    private parseRawReelInsights;
    private parseRawPostInsights;
    private getSynthesizedAccountOverview;
    private parseRawOverviewResponse;
}
