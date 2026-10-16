/**
 * Meta Graph API v21.0 TypeScript Definitions
 * Standard schemas conforming to official Meta Platform documentation.
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
}

export interface ClientOptions {
  accessToken?: string;
  appId?: string;
  apiVersion?: string;
  baseUrl?: string;
  sessionPath?: string;
  enableDigitalTwin?: boolean;
}
