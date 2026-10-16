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
}

export interface ClientOptions {
  accessToken?: string;
  appId?: string;
  apiVersion?: string;
  baseUrl?: string;
  sessionPath?: string;
  enableDigitalTwin?: boolean;
  offlineMode?: boolean;
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
  datr?: string;
  rur?: string;
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
