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
  HardwareCodecProfile
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
   * Step 1: Create Media Container (`POST /{user-id}/media`)
   */
  public async createMediaContainer(params: PublishMediaParams): Promise<{ id: string; status: string }> {
    const mediaType = params.media_type || 'REELS';
    this.validateMediaForHardwareCodec(mediaType);

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
}
