/**
 * GraphCatalog - SQLite-backed Declarative Schema Engine
 *
 * Powered by Node.js built-in `node:sqlite` DatabaseSync.
 * Stores and manages Graph API nodes, edges, fields, and transformation rules.
 */
import { GraphNodeDefinition, GraphFieldDefinition, GraphEdgeDefinition, FieldMapperRule } from './catalog_schema.js';
export declare class GraphCatalog {
    private static instance;
    private db;
    constructor(dbPath?: string);
    static getInstance(): GraphCatalog;
    private initialize;
    /**
     * Retrieves definition of a node
     */
    getNode(name: string, version?: string): GraphNodeDefinition | null;
    /**
     * Retrieves all supported fields for a node in a specific version
     */
    getNodeFields(nodeName: string, version?: string): GraphFieldDefinition[];
    /**
     * Checks whether a specific field is valid on a node
     */
    isValidField(nodeName: string, fieldName: string, version?: string): boolean;
    /**
     * Returns default field list for a node
     */
    getDefaultFields(nodeName: string, version?: string): string[];
    /**
     * Retrieves definition of an edge
     */
    getEdge(parentNode: string, edgeName: string, httpMethod: 'GET' | 'POST' | 'DELETE', version?: string): GraphEdgeDefinition | null;
    /**
     * Retrieves field transformation rules for a node
     */
    getFieldMappers(nodeName: string, version?: string): FieldMapperRule[];
    /**
     * Closes database session (for clean shutdown)
     */
    close(): void;
}
