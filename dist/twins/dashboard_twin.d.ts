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
 * ZERO FAKE / SYNTHETIC DATA ENFORCEMENT:
 *   Every metric is either fetched directly from live authentic network responses,
 *   or the function safely fails closed with zero synthetic generation.
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
     * Retrieves Aggregated Content Performance Metrics
     */
    getContentPerformance(timeframe?: DashboardTimeframe): Promise<GraphContentPerformance>;
    /**
     * Retrieves Professional Tools Status
     */
    getProfessionalTools(): Promise<ProfessionalToolsStatus>;
    /**
     * Hydrates Profile & Timeline grid conforming to Pando IGProfileTimelineQuery and Meta Graph API v21.0
     */
    getProfileTimeline(userId?: string, options?: ProfileTimelineOptions): Promise<ProfileTimelineResponse>;
    /**
     * Retrieves Creator Switching & Destination Metadata conforming to Pando IgCreatorDestinationTypeQuery
     */
    getCreatorDestination(): Promise<CreatorDestinationInfo>;
    /**
     * Retrieves Subscription Benefits & Monetization Tier Eligibility conforming to Pando SUBSBenefitEligibilityQuery
     */
    getSubscriptionBenefitEligibility(): Promise<SubscriptionBenefitEligibility>;
    /**
     * Retrieves the comprehensive Instagram Mobile Professional Dashboard
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
     */
    getStoryInsights(storyId: string, timeframe?: ExtendedAnalyticsTimeframe): Promise<GraphStoryInsights>;
    /**
     * Retrieves Granular Reel Insights conforming to Instagram Mobile & Meta Graph API v21.0
     */
    getReelInsights(reelId: string): Promise<GraphReelInsights>;
    /**
     * Retrieves Granular Feed Post Insights conforming to Instagram Mobile & Meta Graph API v21.0
     */
    getPostInsights(postId: string): Promise<GraphPostInsights>;
    /**
     * Content Filtering & Sorting Engine
     * Pure live execution: zero synthetic items.
     */
    filterContentInsights(options?: ContentFilterOptions): Promise<FilteredContentResponse>;
    /**
     * Returns unified content items from genuine user media.
     * Zero mock items returned.
     */
    private getAllUnifiedContent;
    private parseRawStoryInsights;
    private parseRawReelInsights;
    private parseRawPostInsights;
    private parseRawOverviewResponse;
}
