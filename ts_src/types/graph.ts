/**
 * Meta Graph API v21.0 TypeScript Definitions
 * Standard schemas conforming to official Meta Platform documentation and TwinGraph architecture.
 */

export interface GraphUser {
  id: string;
  name?: string;
  username?: string;
  biography?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  profile_picture_url?: string;
  website?: string;
  is_professional_account?: boolean;
  category_name?: string;
}

export type MediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
export type MediaProductType = 'FEED' | 'STORY' | 'REELS';

export interface GraphMedia {
  id: string;
  ig_id?: string;
  caption?: string;
  media_type: MediaType;
  media_product_type?: MediaProductType;
  media_url?: string;
  permalink?: string;
  thumbnail_url?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  shortcode?: string;
}

export interface GraphInsightValue {
  value: number;
  end_time?: string;
}

export interface GraphInsightMetric {
  name: string;
  period: 'day' | 'week' | 'days_28' | 'month' | 'lifetime';
  values: GraphInsightValue[];
  title?: string;
  description?: string;
  id: string;
}

export interface GraphPaging {
  cursors?: {
    before?: string;
    after?: string;
  };
  next?: string;
  previous?: string;
}

export interface GraphInsightsResponse {
  data: GraphInsightMetric[];
  paging?: GraphPaging;
}

export interface GraphError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

export interface GraphResponse<T> {
  data?: T;
  error?: GraphError;
}

export interface PublishMediaParams {
  image_url?: string;
  video_url?: string;
  caption?: string;
  media_type?: 'IMAGE' | 'VIDEO' | 'REELS' | 'STORIES';
  thumb_offset?: number;
  audio_cluster_id?: string;
  share_to_feed?: boolean;
  // Extended fields for local buffer/payload or story overlays
  image_buffer?: Buffer | Uint8Array;
  video_buffer?: Buffer | Uint8Array;
  user_tags?: Array<{ username: string; x: number; y: number }>;
  location_id?: string;
}

export interface PublishFeedPostParams {
  imageUrl?: string;
  imageBuffer?: Buffer | Uint8Array;
  caption?: string;
  userTags?: Array<{ username: string; x: number; y: number }>;
  locationId?: string;
  disableComments?: boolean;
  likeAndViewCountsDisabled?: boolean;
}

export interface StoryTextOverlayParam {
  text: string;
  font?: string;
  fontSize?: number;
  textColor?: string;
  backgroundColor?: string;
  alignment?: 'LEFT' | 'CENTER' | 'RIGHT';
  x?: number; // 0.0 - 1.0
  y?: number; // 0.0 - 1.0
}

export interface StoryStickerParam {
  type: 'mention' | 'hashtag' | 'link' | 'poll' | 'question' | 'countdown';
  x: number;
  y: number;
  width?: number;
  height?: number;
  data?: Record<string, any>;
}

export interface PublishStoryParams {
  imageUrl?: string;
  imageBuffer?: Buffer | Uint8Array;
  videoUrl?: string;
  videoBuffer?: Buffer | Uint8Array;
  textOverlays?: StoryTextOverlayParam[];
  stickers?: StoryStickerParam[];
}

export interface PublishReelParams {
  videoUrl?: string;
  videoBuffer?: Buffer | Uint8Array;
  caption?: string;
  coverImageUrl?: string;
  coverImageBuffer?: Buffer | Uint8Array;
  audioClusterId?: string;
  shareToFeed?: boolean;
  durationMs?: number;
}

export interface PublishNoteParams {
  text: string;
  audience?: 'followers_you_follow_back' | 'close_friends';
}

export interface GraphNote {
  id: string;
  text: string;
  created_at: number;
  expires_at: number;
  user_id: string;
  audience: string;
  status: string;
}

export interface ParsedCaptionInfo {
  text: string;
  length: number;
  isValid: boolean;
  characterLimit: number;
  hashtags: string[];
  mentions: string[];
  warnings: string[];
}


export interface ClientOptions {
  accessToken?: string;
  appId?: string;
  apiVersion?: string;
  baseUrl?: string;
  sessionPath?: string;
  enableDigitalTwin?: boolean;
  offlineMode?: boolean;
  mobileSession?: string | Record<string, any>;
}

/**
 * Direct Messaging & Conversation Types (Meta Graph API v21.0 & Mobile MSYS)
 */
export interface GraphDirectMessage {
  id: string;
  created_time?: string;
  from?: {
    id: string;
    username?: string;
    name?: string;
  };
  to?: {
    data: Array<{ id: string; username?: string; name?: string }>;
  };
  message?: string;
  item_type?: string;
}

export interface GraphConversation {
  id: string;
  updated_time?: string;
  unread_count?: number;
  message_count?: number;
  participants?: {
    data: Array<{ id: string; username?: string; name?: string }>;
  };
  messages?: {
    data: GraphDirectMessage[];
    paging?: GraphPaging;
  };
  snippet?: string;
}

export interface DirectSendMessageResponse {
  recipient_id?: string;
  message_id: string;
  thread_id?: string;
  status: string;
  timestamp?: number;
}

/**
 * Hardware Codec Acceleration Profiles (Physical Redmi Note 13 4G)
 */
export interface HardwareCodecProfile {
  brand: string;
  model: string;
  soc_model: string;
  chipset: string;
  video_decoder: string;
  video_encoder: string;
  image_encoder: string;
  audio_decoder: string;
  audio_encoder: string;
  supported_resolutions: string[];
  color_format: string;
  max_bitrate_kbps: number;
}

/**
 * Pando / Relay GraphQL Query Definitions
 */
export interface PandoQueryDefinition {
  queryName: string;
  docId?: string;
  queryHash?: string;
  variables?: Record<string, any>;
}

export interface PandoQueryResult<T> {
  data: T;
  extensions?: Record<string, any>;
  errors?: any[];
}

export interface SessionTokens {
  ds_user_id: string;
  sessionid: string;
  csrftoken: string;
  mid?: string;
  ig_did?: string;
  device_id?: string;
  phone_id?: string;
  authorization?: string;
  datr?: string;
  rur?: string;
  fb_dtsg?: string;
  jazoest?: string;
}

export interface DeviceFingerprint {
  brand: string;
  manufacturer: string;
  model: string;
  device_code: string;
  board: string;
  soc_model: string;
  chipset: string;
  android_id: string;
  os_release: string;
  os_sdk_int: number;
  build_id: string;
  resolution: string;
  density_dpi: number;
  user_agent: string;
  app_version: string;
  app_version_code: number;
}

/**
 * Search & Discovery Types (Meta Graph API v21.0 & Mobile fbsearch)
 */
export interface GraphSearchUser {
  id: string;
  username: string;
  name: string;
  is_verified?: boolean;
  is_private?: boolean;
  profile_pic_url?: string;
  has_anonymous_profile_picture?: boolean;
  position?: number;
}

export interface GraphSearchHashtag {
  id: string;
  name: string;
  media_count?: number;
  search_result_subtitle?: string;
  position?: number;
}

export interface GraphSearchResponse {
  users: GraphSearchUser[];
  hashtags: GraphSearchHashtag[];
  rank_token?: string;
  status: string;
  total_items: number;
  raw_items?: any[];
}

export interface SearchOptions {
  context?: 'blended' | 'user' | 'hashtag' | 'place';
  rankToken?: string;
  count?: number;
}

/**
 * Viral Engagement & Controversy Metrics
 */
export interface ViralEngagementMetrics {
  comment_to_like_ratio: number;
  comment_to_view_ratio: number;
  like_to_view_ratio: number;
  controversy_score: number;
  is_hot_debate: boolean;
}

/**
 * Explore Post with Viral & Controversy Metrics
 */
export interface ViralExplorePost {
  id: string;
  code: string;
  permalink: string;
  media_type: number;
  media_type_name: string;
  creator: {
    id: string;
    username: string;
    name: string;
    is_verified: boolean;
    is_private: boolean;
    profile_pic_url?: string;
  };
  caption: string;
  like_count: number;
  comment_count: number;
  view_count: number;
  play_count: number;
  hashtags: string[];
  metrics: ViralEngagementMetrics;
}

export interface ViralExploreOptions {
  minCommentRatio?: number;
  limit?: number;
}

/**
 * Mobile Professional Dashboard Types (Meta Graph API v21.0 & Redmi Note 13 Telemetry)
 */
export type DashboardTimeframe = '7d' | '14d' | '30d' | '90d';

export interface GraphMetricBreakdown {
  home: number;
  explore: number;
  profile: number;
  other: number;
}

export interface GraphAccountOverview {
  timeframe: DashboardTimeframe;
  timeframe_days: number;
  accounts_reached: number;
  accounts_reached_growth_pct: number;
  reach_breakdown: {
    followers: number;
    non_followers: number;
  };
  accounts_engaged: number;
  accounts_engaged_growth_pct: number;
  total_followers: number;
  net_follower_growth: number;
  follower_growth_pct: number;
  content_interactions: {
    total: number;
    growth_pct: number;
    likes: number;
    comments: number;
    saves: number;
    shares: number;
    replies: number;
  };
  profile_activity: {
    profile_visits: number;
    growth_pct: number;
    website_taps: number;
    email_button_taps?: number;
    call_button_taps?: number;
  };
  impressions: number;
  impressions_breakdown?: GraphMetricBreakdown;
  total_content_shared: {
    posts: number;
    reels: number;
    stories: number;
    total: number;
  };
}

export interface GraphDemographicItem {
  label: string;
  value: number;
  percentage: number;
}

export interface GraphAudienceInsights {
  total_followers: number;
  growth_summary: {
    overall_growth_pct: number;
    unfollows: number;
    follows: number;
  };
  top_cities: GraphDemographicItem[];
  top_countries: GraphDemographicItem[];
  age_distribution: GraphDemographicItem[];
  gender_distribution: {
    male_pct: number;
    female_pct: number;
    custom_pct?: number;
  };
  gender_age_breakdown: Record<string, { male: number; female: number }>;
  active_hours: Array<{ hour: number; active_count: number }>;
  active_days: Array<{ day: string; active_count: number }>;
}

export interface TopMediaItem {
  id: string;
  media_type: 'REELS' | 'FEED' | 'STORY';
  title?: string;
  caption?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp: string;
  reach: number;
  plays?: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagement_rate: number;
}

export interface GraphContentPerformance {
  timeframe: DashboardTimeframe;
  top_posts: TopMediaItem[];
  top_reels: TopMediaItem[];
  top_stories: TopMediaItem[];
  content_count_by_type: {
    posts: number;
    reels: number;
    stories: number;
  };
  average_engagement_per_post: number;
  average_watch_time_seconds: number;
}

export interface ProfessionalToolsStatus {
  creator_status: 'eligible' | 'active' | 'not_eligible';
  account_category: string;
  monetization_eligibility: {
    is_eligible: boolean;
    status: 'eligible' | 'not_eligible' | 'review_required';
    branded_content: boolean;
    creator_marketplace: boolean;
    gifts_enabled: boolean;
    subscriptions_eligible: boolean;
  };
  ad_tools: {
    active_promotions: number;
    ad_account_linked: boolean;
    ad_account_id?: string;
    total_ad_spend_usd?: number;
  };
  quick_replies: {
    total_count: number;
    faq_enabled: boolean;
    frequently_asked_questions: Array<{ question: string; answer: string }>;
  };
  creator_destination?: CreatorDestinationInfo;
  subscription_benefits?: SubscriptionBenefitEligibility;
}

export interface ProfessionalDashboardData {
  user_id: string;
  username: string;
  timeframe: DashboardTimeframe;
  account_overview: GraphAccountOverview;
  audience_insights: GraphAudienceInsights;
  content_performance: GraphContentPerformance;
  professional_tools: ProfessionalToolsStatus;
  graph_api_equivalent: GraphInsightsResponse;
}

/**
 * Granular & Advanced Insights Definitions (Mobile Telemetry & Meta Graph API v21.0)
 */

export type ExtendedAnalyticsTimeframe = '24h' | '7d' | '14d' | '30d' | '90d' | '6m' | '1y' | '2y' | 'custom';

export interface CustomDateRange {
  startDate: string; // ISO string or YYYY-MM-DD
  endDate: string;   // ISO string or YYYY-MM-DD
}

export interface ProfileTimelineOptions {
  userId?: string;
  count?: number;
  cursor?: string;
  feedType?: 'all' | 'posts' | 'reels' | 'tagged';
}

export interface ProfileTimelineResponse {
  user: GraphUser;
  items: GraphMedia[];
  paging: GraphPaging;
  pinned_post_ids?: string[];
  total_media_count: number;
  status: string;
}

export type CreatorDestinationType = 'CREATOR' | 'BUSINESS' | 'PERSONAL';

export interface CreatorDestinationInfo {
  user_id: string;
  username: string;
  account_type: CreatorDestinationType;
  destination_type: 'FACEBOOK_PAGE' | 'NONE' | 'WHATSAPP_BUSINESS';
  is_destination_switch_eligible: boolean;
  linked_destination_id?: string;
  linked_destination_name?: string;
  allowed_transition_destinations: CreatorDestinationType[];
  professional_conversion_status: 'ACTIVE_CREATOR' | 'ELIGIBLE_TO_SWITCH' | 'PENDING';
}

export type SubscriptionBenefitType =
  | 'SUBSCRIBER_BADGES'
  | 'EXCLUSIVE_REELS'
  | 'SUBSCRIBER_BROADCAST_CHAT'
  | 'SUBSCRIBER_STORIES'
  | 'EXCLUSIVE_LIVES';

export interface SubscriptionTier {
  tier_id: string;
  name: string;
  price_cents: number;
  currency: string;
  formatted_price: string;
  benefits: SubscriptionBenefitType[];
}

export interface SubscriptionBenefitEligibility {
  user_id: string;
  is_eligible: boolean;
  status: 'ACTIVE' | 'INELIGIBLE' | 'PENDING' | 'REVOKED';
  subscriber_count: number;
  active_subscribers_mrr_cents: number;
  enabled_benefits: SubscriptionBenefitType[];
  available_tiers: SubscriptionTier[];
  onboarding_flow_completed: boolean;
}

export interface FollowingUserItem {
  id: string;
  username: string;
  full_name: string;
  profile_pic_url: string;
  is_verified: boolean;
  is_private: boolean;
  is_bestie: boolean;
  is_restricted: boolean;
  followed_by_viewer: boolean;
  follows_viewer: boolean;
  has_requested_viewer: boolean;
  mutual_count: number;
  following_since_timestamp?: number;
}

export interface FollowingListOptions {
  limit?: number;
  cursor?: string;
  mutualsOnly?: boolean;
  query?: string;
}

export interface FollowingListResponse {
  status: string;
  total_count: number;
  users: FollowingUserItem[];
  paging: GraphPaging;
}

export interface StoryNavigationMetrics {
  taps_forward: number;
  taps_back: number;
  exits: number;
  next_story: number;
  completion_rate_pct: number;
}

export interface StoryInteractions {
  replies: number;
  sticker_taps: number;
  link_clicks: number;
  shares: number;
  likes: number;
  total: number;
}

export interface StoryProfileActivity {
  profile_visits: number;
  follows_from_story: number;
}

export interface GraphStoryInsights {
  id: string;
  media_type: 'STORY';
  title?: string;
  caption?: string;
  permalink?: string;
  thumbnail_url?: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  timeframe: ExtendedAnalyticsTimeframe;
  reach: number;
  impressions: number;
  reach_breakdown: {
    followers: number;
    followers_pct: number;
    non_followers: number;
    non_followers_pct: number;
  };
  navigation: StoryNavigationMetrics;
  interactions: StoryInteractions;
  profile_activity: StoryProfileActivity;
  engagement_rate: number;
}

export interface ReelPlaysBreakdown {
  initial_plays: number;
  replays: number;
  total_plays: number;
  replay_ratio_pct: number;
}

export interface ReelWatchTime {
  total_watch_time_seconds: number;
  average_watch_time_seconds: number;
  video_duration_seconds: number;
  completion_rate_pct: number;
}

export interface ReelRetentionPoint {
  second: number;
  retention_pct: number;
  drop_off_pct: number;
  active_viewers: number;
}

export interface ReelSurfaceBreakdown {
  reels_tab: number;
  home_feed: number;
  explore: number;
  profile_grid: number;
  audio_page: number;
  direct_shares: number;
  total: number;
}

export interface AudienceRetentionRate {
  rate_3s_pct: number;
  rate_15s_pct: number;
  rate_30s_pct: number;
  completion_rate_pct: number;
  average_watch_time_seconds: number;
}

export interface AudienceRetentionComparison {
  followers: AudienceRetentionRate;
  non_followers: AudienceRetentionRate;
}

export interface GraphReelInsights {
  id: string;
  media_type: 'REEL';
  title?: string;
  caption?: string;
  category?: string;
  permalink?: string;
  thumbnail_url?: string;
  timestamp: string;
  reach: number;
  reach_breakdown: {
    followers: number;
    followers_pct: number;
    non_followers: number;
    non_followers_pct: number;
  };
  plays_breakdown: ReelPlaysBreakdown;
  watch_time: ReelWatchTime;
  retention_curve: ReelRetentionPoint[];
  followers_retention_curve?: ReelRetentionPoint[];
  non_followers_retention_curve?: ReelRetentionPoint[];
  audience_retention_comparison?: AudienceRetentionComparison;
  surface_breakdown?: ReelSurfaceBreakdown;
  interactions: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    total: number;
  };
  profile_activity: {
    profile_visits: number;
    follows_from_reel: number;
  };
  engagement_rate: number;
}

export interface PostImpressionsBreakdown {
  home: number;
  explore: number;
  profile: number;
  hashtags: number;
  other: number;
  total: number;
}

export interface GraphPostInsights {
  id: string;
  media_type: 'POST';
  title?: string;
  caption?: string;
  category?: string;
  permalink?: string;
  thumbnail_url?: string;
  timestamp: string;
  reach: number;
  reach_breakdown: {
    followers: number;
    followers_pct: number;
    non_followers: number;
    non_followers_pct: number;
  };
  impressions: number;
  impressions_breakdown: PostImpressionsBreakdown;
  interactions: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    total: number;
  };
  profile_activity: {
    profile_visits: number;
    follows_from_post: number;
    website_taps: number;
  };
  engagement_rate: number;
}

export type ContentFilterType = 'REEL' | 'POST' | 'STORY' | 'ALL';
export type ContentSortMetric = 'reach' | 'plays' | 'impressions' | 'likes' | 'comments' | 'shares' | 'saves' | 'follows' | 'exits';

export interface ContentFilterOptions {
  type?: ContentFilterType;
  category?: string;
  sort_by?: ContentSortMetric;
  order?: 'asc' | 'desc';
  timeframe?: ExtendedAnalyticsTimeframe;
  custom_range?: CustomDateRange;
  surface?: 'home' | 'explore' | 'reels_tab' | 'profile' | 'all';
  limit?: number;
}

export interface UnifiedContentItem {
  id: string;
  media_type: 'REEL' | 'POST' | 'STORY';
  title?: string;
  caption?: string;
  category?: string;
  timestamp: string;
  reach: number;
  plays?: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  follows: number;
  exits?: number;
  engagement_rate: number;
  permalink?: string;
  surface_breakdown?: ReelSurfaceBreakdown | PostImpressionsBreakdown;
  audience_retention?: AudienceRetentionComparison;
  details: GraphStoryInsights | GraphReelInsights | GraphPostInsights;
}

export interface FilteredContentResponse {
  total_count: number;
  applied_filters: ContentFilterOptions;
  summary: {
    total_reach: number;
    total_impressions: number;
    total_interactions: number;
    avg_engagement_rate: number;
  };
  items: UnifiedContentItem[];
}

/**
 * Meta Graph API v21.0 Comment Representation
 * Equivalent to Node: /{comment-id} or Edge: POST /{media-id}/comments
 */
export interface GraphComment {
  id: string;
  text: string;
  timestamp?: string;
  like_count?: number;
  from?: {
    id: string;
    username: string;
    name?: string;
  };
  status?: string;
}
