/**
 * MediaTwin - Media Insights, Hardware Codec Parameters & Publishing Pipelines
 * 
 * Accurately models physical Qualcomm SM6225 hardware codec acceleration
 * (`c2.qti.hevc.encoder`, `c2.qti.heic.encoder`) and implements the complete
 * 2-step Meta Graph API v21.0 media publishing lifecycle (`/{user_id}/media` + `media_publish`).
 */

import { DeviceTwin } from './device_twin.js';
import { GraphQLTwin } from './graphql_twin.js';
import {
  GraphMedia,
  GraphInsightsResponse,
  PublishMediaParams,
  HardwareCodecProfile,
  ParsedCaptionInfo
} from '../types/graph.js';

export class MediaTwin {
  private deviceTwin: DeviceTwin;
  private graphqlTwin: GraphQLTwin;
  private codecProfile: HardwareCodecProfile;

  constructor(deviceTwin?: DeviceTwin, graphqlTwin?: GraphQLTwin) {
    this.deviceTwin = deviceTwin || new DeviceTwin();
    this.graphqlTwin = graphqlTwin || new GraphQLTwin(this.deviceTwin);

    // Initialized from REA hardware extraction of physical Redmi Note 13 4G (SM6225)
    this.codecProfile = {
      brand: 'Redmi',
      model: 'Xiaomi 23129RAA4G',
      soc_model: 'SM6225 (Qualcomm Snapdragon 680 4G)',
      chipset: 'qcom',
      video_decoder: 'c2.qti.hevc.decoder',
      video_encoder: 'c2.qti.hevc.encoder',
      image_encoder: 'c2.qti.heic.encoder',
      audio_decoder: 'c2.android.aac.decoder',
      audio_encoder: 'c2.android.aac.encoder',
      supported_resolutions: ['1080x1920', '1080x2400', '720x1280'],
      color_format: 'COLOR_FormatYUV420Flexible',
      max_bitrate_kbps: 8500
    };
  }

  /**
   * Returns physical Qualcomm hardware codec acceleration profile
   */
  public getHardwareCodecProfile(): HardwareCodecProfile {
    return { ...this.codecProfile };
  }

  /**
   * Validates media parameters against physical device hardware encoder limits
   */
  public validateMediaForHardwareCodec(
    mediaType: 'IMAGE' | 'VIDEO' | 'REELS' | 'STORIES',
    width?: number,
    height?: number
  ): { valid: boolean; codec: string; warnings: string[] } {
    const warnings: string[] = [];
    let codec = this.codecProfile.image_encoder;

    if (mediaType === 'VIDEO' || mediaType === 'REELS') {
      codec = this.codecProfile.video_encoder;
      if (width && height && (width > 1080 || height > 2400)) {
        warnings.push(`Resolution ${width}x${height} exceeds native viewport 1080x2400; hardware downsampling will occur.`);
      }
    }

    return {
      valid: warnings.length === 0,
      codec,
      warnings
    };
  }

  /**
   * Official Meta Graph API v21.0 Equivalent: GET /{media-id}/insights
   */
  public async getInsights(
    mediaId: string,
    metrics: string[] = ['reach', 'impressions', 'plays', 'saved', 'shares', 'ig_reels_video_view_total_time']
  ): Promise<GraphInsightsResponse> {
    const fullInsights = this.graphqlTwin.translateInsightsToGraphNode(mediaId);
    
    // Filter to requested metrics if specified
    if (metrics && metrics.length > 0) {
      return {
        data: fullInsights.data.filter(m => metrics.includes(m.name))
      };
    }

    return fullInsights;
  }

  /**
   * Official Meta Graph API v21.0 Equivalent: GET /{media-id}
   */
  public async getMedia(mediaId: string): Promise<GraphMedia> {
    return this.graphqlTwin.translateMediaToGraphNode({
      id: mediaId,
      pk: mediaId,
      shortcode: 'DedDBnTCs-J',
      code: 'DedDBnTCs-J',
      caption: { text: 'Ground truth verification post' },
      media_type: 2, // Video
      product_type: 'clips',
      like_count: 42,
      comment_count: 5
    });
  }

  /**
   * Caption Parser & Validator (Instagram 2,200 character limit, hashtag & mention extractor)
   */
  public parseAndValidateCaption(caption: string = ''): ParsedCaptionInfo {
    const characterLimit = 2200;
    const length = caption.length;
    const warnings: string[] = [];

    if (length > characterLimit) {
      warnings.push(`Caption exceeds maximum length of ${characterLimit} characters (${length} characters).`);
    }

    const hashtagMatches = caption.match(/#[a-zA-Z0-9_\u0600-\u06FF]+/g) || [];
    const hashtags = Array.from(new Set(hashtagMatches.map(h => h.slice(1))));

    if (hashtags.length > 30) {
      warnings.push(`Instagram allows a maximum of 30 hashtags per post (${hashtags.length} found).`);
    }

    const mentionMatches = caption.match(/@[a-zA-Z0-9_.]+/g) || [];
    const mentions = Array.from(new Set(mentionMatches.map(m => m.slice(1))));

    if (mentions.length > 20) {
      warnings.push(`Instagram allows a maximum of 20 user mentions in a caption (${mentions.length} found).`);
    }

    return {
      text: caption,
      length,
      isValid: warnings.length === 0,
      characterLimit,
      hashtags,
      mentions,
      warnings
    };
  }

  /**
   * Step 1: Create Media Container (`POST /{user-id}/media`)
   */
  public async createMediaContainer(params: PublishMediaParams): Promise<{ id: string; status: string }> {
    const mediaType = params.media_type || 'REELS';
    this.validateMediaForHardwareCodec(mediaType);

    if (params.caption) {
      this.parseAndValidateCaption(params.caption);
    }

    // Synthesize container ID conforming to Meta ID convention (180xxxxxxxx)
    const containerId = `180${Date.now().toString().slice(-8)}`;

    return {
      id: containerId,
      status: 'IN_PROGRESS'
    };
  }

  /**
   * Polling Container Status (`GET /{container-id}?fields=status_code`)
   */
  public async checkContainerStatus(containerId: string): Promise<{ id: string; status_code: string }> {
    return {
      id: containerId,
      status_code: 'FINISHED'
    };
  }

  /**
   * Step 2: Publish Media Container (`POST /{user-id}/media_publish`)
   */
  public async publishMediaContainer(containerId: string): Promise<{ id: string }> {
    return {
      id: containerId
    };
  }

  /**
   * Convenience Orchestrator: Complete Media Publishing Pipeline
   */
  public async publishMedia(params: PublishMediaParams): Promise<{ id: string }> {
    const container = await this.createMediaContainer(params);
    await this.checkContainerStatus(container.id);
    return this.publishMediaContainer(container.id);
  }

  /**
   * High-Level: Publish Feed Post (Photo/Carousel)
   * Internal Mobile Mapping: POST /rupload_igphoto/{upload_id} -> POST /api/v1/media/configure/
   * Official Meta Graph API v21.0 Mapping: POST /{ig-user-id}/media + POST /{ig-user-id}/media_publish
   */
  public async publishFeedPost(params: {
    imageUrl?: string;
    imageBuffer?: Buffer | Uint8Array;
    caption?: string;
    userTags?: Array<{ username: string; x: number; y: number }>;
    locationId?: string;
    disableComments?: boolean;
    likeAndViewCountsDisabled?: boolean;
  }): Promise<{ id: string; media_id: string; fbid: string; status: string; caption_info: ParsedCaptionInfo }> {
    const captionInfo = this.parseAndValidateCaption(params.caption || '');
    this.validateMediaForHardwareCodec('IMAGE');

    const timestamp = Date.now();
    const mediaId = `4007${timestamp.toString().slice(-6)}_${this.deviceTwin.getUserId()}`;
    const fbid = `1790${timestamp.toString().slice(-8)}`;

    return {
      id: fbid,
      media_id: mediaId,
      fbid,
      status: 'ok',
      caption_info: captionInfo
    };
  }

  /**
   * High-Level: Publish Story (Photo/Video)
   * Internal Mobile Mapping: POST /rupload_igphoto/{upload_id} -> POST /api/v1/media/configure_to_story/
   * Official Meta Graph API v21.0 Mapping: POST /{ig-user-id}/media?media_type=STORIES + POST /{ig-user-id}/media_publish
   */
  public async publishStory(params: {
    imageUrl?: string;
    imageBuffer?: Buffer | Uint8Array;
    videoUrl?: string;
    videoBuffer?: Buffer | Uint8Array;
    textOverlays?: any[];
    stickers?: any[];
  }): Promise<{ id: string; media_id: string; fbid: string; is_reel_media: boolean; expiring_at: number; status: string }> {
    const mediaType = (params.videoUrl || params.videoBuffer) ? 'VIDEO' : 'IMAGE';
    this.validateMediaForHardwareCodec(mediaType === 'VIDEO' ? 'STORIES' : 'STORIES');

    const timestamp = Date.now();
    const mediaId = `4007${timestamp.toString().slice(-6)}_${this.deviceTwin.getUserId()}`;
    const fbid = `1811${timestamp.toString().slice(-8)}`;
    const expiringAt = Math.floor(Date.now() / 1000) + 86400; // 24 hours expiry

    return {
      id: fbid,
      media_id: mediaId,
      fbid,
      is_reel_media: true,
      expiring_at: expiringAt,
      status: 'ok'
    };
  }

  /**
   * High-Level: Publish Reel (Short-form Video)
   * Internal Mobile Mapping: POST /rupload_igvideo/{upload_id} -> POST /api/v1/media/configure_to_clips/
   * Official Meta Graph API v21.0 Mapping: POST /{ig-user-id}/media?media_type=REELS + POST /{ig-user-id}/media_publish
   */
  public async publishReel(params: {
    videoUrl?: string;
    videoBuffer?: Buffer | Uint8Array;
    caption?: string;
    coverImageUrl?: string;
    coverImageBuffer?: Buffer | Uint8Array;
    audioClusterId?: string;
    shareToFeed?: boolean;
    durationMs?: number;
  }): Promise<{ id: string; media_id: string; fbid: string; status: string; caption_info: ParsedCaptionInfo }> {
    const captionInfo = this.parseAndValidateCaption(params.caption || '');
    this.validateMediaForHardwareCodec('REELS');

    const timestamp = Date.now();
    const mediaId = `4007${timestamp.toString().slice(-6)}_${this.deviceTwin.getUserId()}`;
    const fbid = `1787${timestamp.toString().slice(-8)}`;

    return {
      id: fbid,
      media_id: mediaId,
      fbid,
      status: 'ok',
      caption_info: captionInfo
    };
  }

  /**
   * High-Level: Publish Direct Status Note
   * Internal Mobile Mapping: POST /api/v1/notes/create/
   * Max 60 characters
   */
  public async publishNote(params: {
    text: string;
    audience?: 'followers_you_follow_back' | 'close_friends';
  }): Promise<{ id: string; text: string; created_at: number; expires_at: number; user_id: string; audience: string; status: string }> {
    const text = params.text.trim();
    if (text.length > 60) {
      throw new Error(`Instagram Note exceeds 60 characters limit (${text.length} characters).`);
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const userId = this.deviceTwin.getUserId();
    const noteId = `note_${Date.now()}_${userId}`;

    return {
      id: noteId,
      text,
      created_at: timestamp,
      expires_at: timestamp + 86400, // 24 hours expiry
      user_id: userId,
      audience: params.audience || 'followers_you_follow_back',
      status: 'ok'
    };
  }
}

