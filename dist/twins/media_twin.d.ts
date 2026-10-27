/**
 * MediaTwin - Media Insights, Hardware Codec Parameters & Publishing Pipelines
 *
 * Accurately models physical Qualcomm SM6225 hardware codec acceleration
 * (`c2.qti.hevc.encoder`, `c2.qti.heic.encoder`) and implements the complete
 * 2-step Meta Graph API v21.0 media publishing lifecycle (`/{user_id}/media` + `media_publish`).
 */
import { DeviceTwin } from './device_twin.js';
import { GraphQLTwin } from './graphql_twin.js';
import { GraphMedia, GraphInsightsResponse, PublishMediaParams, HardwareCodecProfile, ParsedCaptionInfo, GraphReelInsights, GraphPostInsights, ExtendedAnalyticsTimeframe, CustomDateRange, FilteredContentResponse, GraphComment } from '../types/graph.js';
export declare class MediaTwin {
    private deviceTwin;
    private graphqlTwin;
    private transport;
    private codecProfile;
    constructor(deviceTwin?: DeviceTwin, graphqlTwin?: GraphQLTwin);
    /**
     * Returns physical Qualcomm hardware codec acceleration profile
     */
    getHardwareCodecProfile(): HardwareCodecProfile;
    /**
     * Validates media parameters against physical device hardware encoder limits
     */
    validateMediaForHardwareCodec(mediaType: 'IMAGE' | 'VIDEO' | 'REELS' | 'STORIES', width?: number, height?: number): {
        valid: boolean;
        codec: string;
        warnings: string[];
    };
    /**
     * Official Meta Graph API v21.0 Equivalent: GET /{media-id}/insights
     */
    getInsights(mediaId: string, metrics?: string[]): Promise<GraphInsightsResponse>;
    /**
     * Official Meta Graph API v21.0 Equivalent: GET /{media-id}
     */
    getMedia(mediaId: string): Promise<GraphMedia>;
    /**
     * Caption Parser & Validator (Instagram 2,200 character limit, hashtag & mention extractor)
     */
    parseAndValidateCaption(caption?: string): ParsedCaptionInfo;
    /**
     * Step 1: Create Media Container (`POST /{user-id}/media`)
     */
    createMediaContainer(params: PublishMediaParams): Promise<{
        id: string;
        status: string;
    }>;
    /**
     * Polling Container Status (`GET /{container-id}?fields=status_code`)
     */
    checkContainerStatus(containerId: string): Promise<{
        id: string;
        status_code: string;
    }>;
    /**
     * Step 2: Publish Media Container (`POST /{user-id}/media_publish`)
     */
    publishMediaContainer(containerId: string): Promise<{
        id: string;
    }>;
    /**
     * Convenience Orchestrator: Complete Media Publishing Pipeline
     */
    publishMedia(params: PublishMediaParams): Promise<{
        id: string;
    }>;
    /**
     * High-Level: Publish Feed Post (Photo/Carousel)
     * Internal Mobile Mapping: POST /rupload_igphoto/{upload_id} -> POST /api/v1/media/configure/
     * Official Meta Graph API v21.0 Mapping: POST /{ig-user-id}/media + POST /{ig-user-id}/media_publish
     */
    publishFeedPost(params: {
        imageUrl?: string;
        imageBuffer?: Buffer | Uint8Array;
        caption?: string;
        userTags?: Array<{
            username: string;
            x: number;
            y: number;
        }>;
        locationId?: string;
        disableComments?: boolean;
        likeAndViewCountsDisabled?: boolean;
    }): Promise<{
        id: string;
        media_id: string;
        fbid: string;
        status: string;
        caption_info: ParsedCaptionInfo;
    }>;
    /**
     * High-Level: Publish Story (Photo/Video)
     * Internal Mobile Mapping: POST /rupload_igphoto/{upload_id} -> POST /api/v1/media/configure_to_story/
     * Official Meta Graph API v21.0 Mapping: POST /{ig-user-id}/media?media_type=STORIES + POST /{ig-user-id}/media_publish
     */
    publishStory(params: {
        imageUrl?: string;
        imageBuffer?: Buffer | Uint8Array;
        videoUrl?: string;
        videoBuffer?: Buffer | Uint8Array;
        textOverlays?: any[];
        stickers?: any[];
    }): Promise<{
        id: string;
        media_id: string;
        fbid: string;
        is_reel_media: boolean;
        expiring_at: number;
        status: string;
    }>;
    /**
     * High-Level: Publish Reel (Short-form Video)
     * Internal Mobile Mapping: POST /rupload_igvideo/{upload_id} -> POST /api/v1/media/configure_to_clips/
     * Official Meta Graph API v21.0 Mapping: POST /{ig-user-id}/media?media_type=REELS + POST /{ig-user-id}/media_publish
     */
    publishReel(params: {
        videoUrl?: string;
        videoBuffer?: Buffer | Uint8Array;
        caption?: string;
        coverImageUrl?: string;
        coverImageBuffer?: Buffer | Uint8Array;
        audioClusterId?: string;
        shareToFeed?: boolean;
        durationMs?: number;
    }): Promise<{
        id: string;
        media_id: string;
        fbid: string;
        status: string;
        caption_info: ParsedCaptionInfo;
    }>;
    /**
     * High-Level: Publish Direct Status Note
     * Internal Mobile Mapping: POST /api/v1/notes/create/
     * Max 60 characters
     */
    publishNote(params: {
        text: string;
        audience?: 'followers_you_follow_back' | 'close_friends';
    }): Promise<{
        id: string;
        text: string;
        created_at: number;
        expires_at: number;
        user_id: string;
        audience: string;
        status: string;
    }>;
    /**
     * Retrieves granular reel retention and surface breakdown
     * Telemetry backed: Second-by-second drop-off for followers vs non-followers
     */
    getGranularReelBreakdown(reelId: string): Promise<GraphReelInsights>;
    /**
     * Retrieves granular post surface breakdown and audience impressions
     */
    getGranularPostBreakdown(postId: string): Promise<GraphPostInsights>;
    /**
     * Retrieves multi-dimensional content breakdown with category, timeframe and custom date range filtering
     */
    getContentBreakdownByTimeframe(timeframe?: ExtendedAnalyticsTimeframe, customRange?: CustomDateRange, category?: string): Promise<FilteredContentResponse>;
    /**
     * Posts an authentic comment on a media object
     * Official Meta Graph API v21.0 Mapping: POST /{media-id}/comments
     * Authentic Mobile Endpoint: POST https://i.instagram.com/api/v1/media/{cleanMediaId}/comment/
     * Telemetry Citation: Line 441786 (layout_comment_thread_post_button_icon, handler X.0GYp, module comments_v2_clips_viewer_serp_top_minor_unit)
     */
    postComment(mediaId: string, message: string): Promise<GraphComment>;
    /**
     * Retrieves comments on a media object
     * Official Meta Graph API v21.0 Mapping: GET /{media-id}/comments
     * Authentic Mobile Endpoint: GET https://i.instagram.com/api/v1/media/{cleanMediaId}/comments/
     * Telemetry Citations: evidence/comments_evidence.json, RESOLVED_ENDPOINTS_CATALOG.md line 256
     */
    getComments(mediaId: string, options?: {
        limit?: number;
        min_id?: string;
    }): Promise<{
        data: GraphComment[];
        paging?: any;
    }>;
}
