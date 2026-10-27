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
export declare const DDL_SCHEMA = "\nCREATE TABLE IF NOT EXISTS graph_nodes (\n  name TEXT NOT NULL,\n  version TEXT NOT NULL,\n  description TEXT,\n  default_fields TEXT NOT NULL,\n  PRIMARY KEY (name, version)\n);\n\nCREATE TABLE IF NOT EXISTS graph_node_fields (\n  node_name TEXT NOT NULL,\n  field_name TEXT NOT NULL,\n  version TEXT NOT NULL,\n  data_type TEXT NOT NULL,\n  raw_source_path TEXT,\n  is_default INTEGER DEFAULT 0,\n  description TEXT,\n  PRIMARY KEY (node_name, field_name, version)\n);\n\nCREATE TABLE IF NOT EXISTS graph_edges (\n  parent_node TEXT NOT NULL,\n  edge_name TEXT NOT NULL,\n  http_method TEXT NOT NULL,\n  version TEXT NOT NULL,\n  target_node TEXT,\n  doc_id TEXT,\n  endpoint_template TEXT,\n  description TEXT,\n  PRIMARY KEY (parent_node, edge_name, http_method, version)\n);\n\nCREATE TABLE IF NOT EXISTS field_mappers (\n  node_name TEXT NOT NULL,\n  version TEXT NOT NULL,\n  target_field TEXT NOT NULL,\n  source_candidates TEXT NOT NULL,\n  transform_type TEXT,\n  PRIMARY KEY (node_name, version, target_field)\n);\n";
export declare const V21_SEED_NODES: GraphNodeDefinition[];
export declare const V21_SEED_FIELDS: GraphFieldDefinition[];
export declare const V21_SEED_EDGES: GraphEdgeDefinition[];
export declare const V21_SEED_MAPPERS: FieldMapperRule[];
