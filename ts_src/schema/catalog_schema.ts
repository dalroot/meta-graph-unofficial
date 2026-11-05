/**
 * Meta Graph API v21.0 - SQLite Catalog Schema Definitions
 * 
 * Provides declarative relational models for Graph Nodes, Edges, Fields,
 * and Telemetry Mappers to power true 1:1 Meta Graph API execution.
 */

export interface GraphNodeDefinition {
  name: string;
  version: string;
  description: string;
  defaultFields: string[];
}

export interface GraphFieldDefinition {
  nodeName: string;
  fieldName: string;
  version: string;
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'enum';
  rawSourcePath?: string;
  isDefault: boolean;
  description: string;
}

export interface GraphEdgeDefinition {
  parentNode: string;
  edgeName: string;
  httpMethod: 'GET' | 'POST' | 'DELETE';
  version: string;
  targetNode?: string;
  docId?: string;
  endpointTemplate?: string;
  description: string;
}

export interface FieldMapperRule {
  nodeName: string;
  version: string;
  targetField: string;
  sourceCandidates: string[];
  transformType?: 'string' | 'number' | 'boolean' | 'timestamp_iso' | 'media_type_enum' | 'product_type_enum';
}

export const DDL_SCHEMA = `
CREATE TABLE IF NOT EXISTS graph_nodes (
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  default_fields TEXT NOT NULL,
  PRIMARY KEY (name, version)
);

CREATE TABLE IF NOT EXISTS graph_node_fields (
  node_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  version TEXT NOT NULL,
  data_type TEXT NOT NULL,
  raw_source_path TEXT,
  is_default INTEGER DEFAULT 0,
  description TEXT,
  PRIMARY KEY (node_name, field_name, version)
);

CREATE TABLE IF NOT EXISTS graph_edges (
  parent_node TEXT NOT NULL,
  edge_name TEXT NOT NULL,
  http_method TEXT NOT NULL,
  version TEXT NOT NULL,
  target_node TEXT,
  doc_id TEXT,
  endpoint_template TEXT,
  description TEXT,
  PRIMARY KEY (parent_node, edge_name, http_method, version)
);

CREATE TABLE IF NOT EXISTS field_mappers (
  node_name TEXT NOT NULL,
  version TEXT NOT NULL,
  target_field TEXT NOT NULL,
  source_candidates TEXT NOT NULL,
  transform_type TEXT,
  PRIMARY KEY (node_name, version, target_field)
);
`;

export const V21_SEED_NODES: GraphNodeDefinition[] = [
  {
    name: 'Media',
    version: 'v21.0',
    description: 'Instagram Media Node representing posts, reels, stories, or carousel albums',
    defaultFields: ['id', 'caption', 'media_type', 'media_url', 'permalink', 'timestamp']
  },
  {
    name: 'User',
    version: 'v21.0',
    description: 'Instagram User Node representing a creator, business, or public profile',
    defaultFields: ['id', 'username', 'name', 'biography', 'followers_count', 'follows_count', 'media_count']
  },
  {
    name: 'Comment',
    version: 'v21.0',
    description: 'Instagram Comment Node on a media object',
    defaultFields: ['id', 'text', 'timestamp', 'like_count', 'from']
  },
  {
    name: 'Conversation',
    version: 'v21.0',
    description: 'Instagram Direct Message Conversation thread',
    defaultFields: ['id', 'updated_time', 'participants']
  },
  {
    name: 'Message',
    version: 'v21.0',
    description: 'Individual Direct Message inside a conversation thread',
    defaultFields: ['id', 'created_time', 'from', 'to', 'message']
  }
];

export const V21_SEED_FIELDS: GraphFieldDefinition[] = [
  // Media Fields
  { nodeName: 'Media', fieldName: 'id', version: 'v21.0', dataType: 'string', rawSourcePath: 'pk || id', isDefault: true, description: 'Unique identifier for the media object' },
  { nodeName: 'Media', fieldName: 'ig_id', version: 'v21.0', dataType: 'string', rawSourcePath: 'pk || id', isDefault: false, description: 'Legacy numeric Instagram ID' },
  { nodeName: 'Media', fieldName: 'caption', version: 'v21.0', dataType: 'string', rawSourcePath: 'caption.text || caption', isDefault: true, description: 'Caption text of the media' },
  { nodeName: 'Media', fieldName: 'media_type', version: 'v21.0', dataType: 'enum', rawSourcePath: 'media_type', isDefault: true, description: 'Format: IMAGE, VIDEO, or CAROUSEL_ALBUM' },
  { nodeName: 'Media', fieldName: 'media_product_type', version: 'v21.0', dataType: 'enum', rawSourcePath: 'product_type', isDefault: false, description: 'Product placement: FEED, REELS, or STORY' },
  { nodeName: 'Media', fieldName: 'media_url', version: 'v21.0', dataType: 'string', rawSourcePath: 'video_versions[0].url || image_versions2.candidates[0].url', isDefault: true, description: 'Direct progressive CDN URL' },
  { nodeName: 'Media', fieldName: 'permalink', version: 'v21.0', dataType: 'string', rawSourcePath: 'code || shortcode', isDefault: true, description: 'Permanent web URL (https://www.instagram.com/p/.../)' },
  { nodeName: 'Media', fieldName: 'shortcode', version: 'v21.0', dataType: 'string', rawSourcePath: 'code || shortcode', isDefault: false, description: 'Instagram short alphanumeric identifier' },
  { nodeName: 'Media', fieldName: 'timestamp', version: 'v21.0', dataType: 'string', rawSourcePath: 'taken_at', isDefault: true, description: 'ISO-8601 publish timestamp' },
  { nodeName: 'Media', fieldName: 'like_count', version: 'v21.0', dataType: 'number', rawSourcePath: 'like_count', isDefault: false, description: 'Total likes count' },
  { nodeName: 'Media', fieldName: 'comments_count', version: 'v21.0', dataType: 'number', rawSourcePath: 'comment_count', isDefault: false, description: 'Total comments count' },
  { nodeName: 'Media', fieldName: 'is_comment_enabled', version: 'v21.0', dataType: 'boolean', rawSourcePath: 'comments_disabled', isDefault: false, description: 'Whether comments are enabled' },

  // User Fields
  { nodeName: 'User', fieldName: 'id', version: 'v21.0', dataType: 'string', rawSourcePath: 'id || pk', isDefault: true, description: 'Unique user identifier' },
  { nodeName: 'User', fieldName: 'username', version: 'v21.0', dataType: 'string', rawSourcePath: 'username', isDefault: true, description: 'Public handle / username' },
  { nodeName: 'User', fieldName: 'name', version: 'v21.0', dataType: 'string', rawSourcePath: 'full_name || name', isDefault: true, description: 'Full public name' },
  { nodeName: 'User', fieldName: 'biography', version: 'v21.0', dataType: 'string', rawSourcePath: 'biography', isDefault: true, description: 'Profile bio text' },
  { nodeName: 'User', fieldName: 'followers_count', version: 'v21.0', dataType: 'number', rawSourcePath: 'followers_count || follower_count', isDefault: true, description: 'Total followers count' },
  { nodeName: 'User', fieldName: 'follows_count', version: 'v21.0', dataType: 'number', rawSourcePath: 'follows_count || following_count', isDefault: true, description: 'Total following count' },
  { nodeName: 'User', fieldName: 'media_count', version: 'v21.0', dataType: 'number', rawSourcePath: 'media_count', isDefault: true, description: 'Total published media count' },
  { nodeName: 'User', fieldName: 'profile_picture_url', version: 'v21.0', dataType: 'string', rawSourcePath: 'profile_pic_url || profile_picture_url', isDefault: false, description: 'Avatar image URL' },
  { nodeName: 'User', fieldName: 'is_professional_account', version: 'v21.0', dataType: 'boolean', rawSourcePath: 'is_professional_account', isDefault: false, description: 'Whether account is Business/Creator' },

  // Comment Fields
  { nodeName: 'Comment', fieldName: 'id', version: 'v21.0', dataType: 'string', rawSourcePath: 'pk || id', isDefault: true, description: 'Comment ID' },
  { nodeName: 'Comment', fieldName: 'text', version: 'v21.0', dataType: 'string', rawSourcePath: 'text', isDefault: true, description: 'Comment message body' },
  { nodeName: 'Comment', fieldName: 'timestamp', version: 'v21.0', dataType: 'string', rawSourcePath: 'created_at', isDefault: true, description: 'Comment timestamp' },
  { nodeName: 'Comment', fieldName: 'like_count', version: 'v21.0', dataType: 'number', rawSourcePath: 'comment_like_count', isDefault: true, description: 'Comment likes count' },
  { nodeName: 'Comment', fieldName: 'from', version: 'v21.0', dataType: 'object', rawSourcePath: 'user', isDefault: true, description: 'Author of the comment' }
];

export const V21_SEED_EDGES: GraphEdgeDefinition[] = [
  // Media Edges
  { parentNode: 'Media', edgeName: 'comments', httpMethod: 'GET', version: 'v21.0', targetNode: 'Comment', docId: 'xdt_api__v1__media__comments', description: 'Retrieve comments list for media' },
  { parentNode: 'Media', edgeName: 'comments', httpMethod: 'POST', version: 'v21.0', targetNode: 'Comment', docId: '27261905640092552', description: 'Publish a new comment on media' },
  { parentNode: 'Media', edgeName: 'insights', httpMethod: 'GET', version: 'v21.0', description: 'Retrieve media performance metrics (reach, impressions, plays)' },

  // User Edges
  { parentNode: 'User', edgeName: 'media', httpMethod: 'GET', version: 'v21.0', targetNode: 'Media', description: 'Retrieve user media feed' },
  { parentNode: 'User', edgeName: 'media', httpMethod: 'POST', version: 'v21.0', description: 'Create media upload container' },
  { parentNode: 'User', edgeName: 'media_publish', httpMethod: 'POST', version: 'v21.0', description: 'Publish media container' },
  { parentNode: 'User', edgeName: 'stories', httpMethod: 'GET', version: 'v21.0', targetNode: 'Media', description: 'Active stories tray' },
  { parentNode: 'User', edgeName: 'conversations', httpMethod: 'GET', version: 'v21.0', targetNode: 'Conversation', description: 'Direct message threads inbox' },
  { parentNode: 'User', edgeName: 'messages', httpMethod: 'POST', version: 'v21.0', targetNode: 'Message', docId: '26911679871773184', description: 'Send direct message to recipient' },
  { parentNode: 'User', edgeName: 'insights', httpMethod: 'GET', version: 'v21.0', description: 'Account-level aggregate metrics' },

  // Conversation Edges
  { parentNode: 'Conversation', edgeName: 'messages', httpMethod: 'GET', version: 'v21.0', targetNode: 'Message', docId: '29613940454875963', description: 'Messages list inside a thread' },
  { parentNode: 'Conversation', edgeName: 'messages', httpMethod: 'POST', version: 'v21.0', targetNode: 'Message', docId: '26911679871773184', description: 'Send message into thread' }
];

export const V21_SEED_MAPPERS: FieldMapperRule[] = [
  { nodeName: 'Media', version: 'v21.0', targetField: 'id', sourceCandidates: ['id', 'pk', 'media_id'], transformType: 'string' },
  { nodeName: 'Media', version: 'v21.0', targetField: 'caption', sourceCandidates: ['caption.text', 'caption', 'edge_media_to_caption.edges[0].node.text'], transformType: 'string' },
  { nodeName: 'Media', version: 'v21.0', targetField: 'media_type', sourceCandidates: ['media_type', '__typename'], transformType: 'media_type_enum' },
  { nodeName: 'Media', version: 'v21.0', targetField: 'media_product_type', sourceCandidates: ['product_type', 'media_product_type'], transformType: 'product_type_enum' },
  { nodeName: 'Media', version: 'v21.0', targetField: 'media_url', sourceCandidates: ['video_versions[0].url', 'video_url', 'image_versions2.candidates[0].url', 'display_url'], transformType: 'string' },
  { nodeName: 'Media', version: 'v21.0', targetField: 'permalink', sourceCandidates: ['permalink', 'code', 'shortcode'], transformType: 'string' },
  { nodeName: 'Media', version: 'v21.0', targetField: 'timestamp', sourceCandidates: ['taken_at', 'taken_at_timestamp', 'timestamp'], transformType: 'timestamp_iso' },
  { nodeName: 'Media', version: 'v21.0', targetField: 'like_count', sourceCandidates: ['like_count', 'edge_media_preview_like.count'], transformType: 'number' },
  { nodeName: 'Media', version: 'v21.0', targetField: 'comments_count', sourceCandidates: ['comment_count', 'comments_count', 'edge_media_to_comment.count'], transformType: 'number' }
];
