/**
 * Ghost Mode Service for Meta Graph Unofficial
 *
 * Provides 100% anonymous, read-only intelligence and data extraction
 * using authentic TwinGraph mobile/web client emulation.
 * Leaves zero footprint, zero story view notifications, and zero search history.
 */
import { TwinGraph } from '../twin_graph.js';
import { GraphSearchResponse, ViralExplorePost } from '../types/graph.js';
export interface GhostProfileResult {
    id: string;
    username: string;
    full_name: string;
    biography: string;
    external_url?: string;
    followers_count: number;
    following_count: number;
    media_count: number;
    is_verified: boolean;
    is_private: boolean;
    is_business: boolean;
    profile_pic_url: string;
}
export interface GhostPostItem {
    id: string;
    shortcode: string;
    permalink: string;
    media_type: string;
    media_product_type?: string;
    caption: string;
    timestamp: string;
    like_count: number;
    comment_count: number;
    video_play_count?: number;
    video_view_count?: number;
    video_duration?: number;
    thumbnail_url?: string;
    video_url?: string;
    calculated_engagement_rate?: number;
}
export interface GhostTimelineResult {
    username: string;
    user_id: string;
    total_media_count: number;
    retrieved_count: number;
    has_next_page: boolean;
    next_cursor?: string;
    posts: GhostPostItem[];
}
export interface GhostMediaMetricsResult {
    media_id: string;
    shortcode: string;
    media_type: string;
    caption: string;
    timestamp: string;
    metrics: {
        video_plays: number;
        video_views: number;
        likes: number;
        comments: number;
        shares?: number;
        saves?: number;
        reach?: number;
        impressions?: number;
        engagement_rate: number;
    };
    retention?: {
        avg_watch_time_seconds?: number;
        drop_off_pct_3s?: number;
        drop_off_pct_15s?: number;
    };
}
export interface GhostAuditReport {
    target: {
        username: string;
        full_name: string;
        followers: number;
        following: number;
        total_posts: number;
        is_verified: boolean;
    };
    analyzed_sample_size: number;
    aggregate_metrics: {
        total_sampled_plays: number;
        average_plays_per_reel: number;
        total_sampled_likes: number;
        average_likes_per_post: number;
        total_sampled_comments: number;
        average_comments_per_post: number;
        overall_engagement_rate_pct: number;
    };
    content_mix: {
        reels_count: number;
        feed_posts_count: number;
        reels_share_pct: number;
    };
    top_performing_reels: Array<{
        id: string;
        shortcode: string;
        plays: number;
        likes: number;
        comments: number;
        engagement_rate: number;
        caption_snippet: string;
        permalink: string;
    }>;
    discussion_driver_posts: Array<{
        id: string;
        shortcode: string;
        comments: number;
        comment_to_like_ratio: number;
        caption_snippet: string;
    }>;
    audit_timestamp: string;
}
export declare class GhostService {
    private client;
    constructor(client?: TwinGraph);
    /**
     * 1. Ghost Profile Inspection
     */
    getProfile(username: string): Promise<GhostProfileResult>;
    /**
     * 2. Ghost Timeline & Feed Posts Pagination
     */
    getTimelinePosts(params: {
        username?: string;
        userId?: string;
        limit?: number;
        cursor?: string;
        feedType?: 'all' | 'reels' | 'posts';
    }): Promise<GhostTimelineResult>;
    /**
     * 3. Granular Media & Reel Metrics
     */
    getMediaMetrics(mediaId: string): Promise<GhostMediaMetricsResult>;
    /**
     * 4. Ghost Comment Harvesting
     */
    getComments(mediaId: string, limit?: number): Promise<{
        media_id: string;
        total_retrieved: number;
        comments: Array<{
            id: string;
            username: string;
            text: string;
            timestamp: string;
            like_count: number;
        }>;
    }>;
    /**
     * 5. Ghost Search (Users & Hashtags)
     */
    search(query: string, type?: 'users' | 'hashtags' | 'all'): Promise<GraphSearchResponse>;
    /**
     * 6. Ghost Viral & Debate Explore Radar
     */
    getViralExplore(limit?: number, minCommentRatio?: number): Promise<ViralExplorePost[]>;
    /**
     * 7. Comprehensive Ghost Audit Report
     */
    auditAccount(username: string, sampleCount?: number): Promise<GhostAuditReport>;
}
