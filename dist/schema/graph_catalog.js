/**
 * GraphCatalog - SQLite-backed Declarative Schema Engine
 *
 * Powered by Node.js built-in `node:sqlite` DatabaseSync.
 * Stores and manages Graph API nodes, edges, fields, and transformation rules.
 */
import { DatabaseSync } from 'node:sqlite';
import { DDL_SCHEMA, V21_SEED_NODES, V21_SEED_FIELDS, V21_SEED_EDGES, V21_SEED_MAPPERS } from './catalog_schema.js';
export class GraphCatalog {
    static instance = null;
    db;
    constructor(dbPath = ':memory:') {
        this.db = new DatabaseSync(dbPath);
        this.initialize();
    }
    static getInstance() {
        if (!GraphCatalog.instance) {
            GraphCatalog.instance = new GraphCatalog();
        }
        return GraphCatalog.instance;
    }
    initialize() {
        // 1. Run DDL schema creation
        this.db.exec(DDL_SCHEMA);
        // 2. Seed v21.0 Nodes
        const insertNode = this.db.prepare('INSERT OR REPLACE INTO graph_nodes (name, version, description, default_fields) VALUES (?, ?, ?, ?)');
        for (const node of V21_SEED_NODES) {
            insertNode.run(node.name, node.version, node.description, JSON.stringify(node.defaultFields));
        }
        // 3. Seed v21.0 Fields
        const insertField = this.db.prepare('INSERT OR REPLACE INTO graph_node_fields (node_name, field_name, version, data_type, raw_source_path, is_default, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
        for (const field of V21_SEED_FIELDS) {
            insertField.run(field.nodeName, field.fieldName, field.version, field.dataType, field.rawSourcePath || null, field.isDefault ? 1 : 0, field.description);
        }
        // 4. Seed v21.0 Edges
        const insertEdge = this.db.prepare('INSERT OR REPLACE INTO graph_edges (parent_node, edge_name, http_method, version, target_node, doc_id, endpoint_template, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        for (const edge of V21_SEED_EDGES) {
            insertEdge.run(edge.parentNode, edge.edgeName, edge.httpMethod, edge.version, edge.targetNode || null, edge.docId || null, edge.endpointTemplate || null, edge.description);
        }
        // 5. Seed Field Mappers
        const insertMapper = this.db.prepare('INSERT OR REPLACE INTO field_mappers (node_name, version, target_field, source_candidates, transform_type) VALUES (?, ?, ?, ?, ?)');
        for (const mapper of V21_SEED_MAPPERS) {
            insertMapper.run(mapper.nodeName, mapper.version, mapper.targetField, JSON.stringify(mapper.sourceCandidates), mapper.transformType || null);
        }
    }
    /**
     * Retrieves definition of a node
     */
    getNode(name, version = 'v21.0') {
        const stmt = this.db.prepare('SELECT name, version, description, default_fields FROM graph_nodes WHERE name = ? AND version = ?');
        const row = stmt.get(name, version);
        if (!row)
            return null;
        return {
            name: row.name,
            version: row.version,
            description: row.description,
            defaultFields: JSON.parse(row.default_fields)
        };
    }
    /**
     * Retrieves all supported fields for a node in a specific version
     */
    getNodeFields(nodeName, version = 'v21.0') {
        const stmt = this.db.prepare('SELECT node_name, field_name, version, data_type, raw_source_path, is_default, description FROM graph_node_fields WHERE node_name = ? AND version = ?');
        const rows = stmt.all(nodeName, version);
        return rows.map(r => ({
            nodeName: r.node_name,
            fieldName: r.field_name,
            version: r.version,
            dataType: r.data_type,
            rawSourcePath: r.raw_source_path,
            isDefault: Boolean(r.is_default),
            description: r.description
        }));
    }
    /**
     * Checks whether a specific field is valid on a node
     */
    isValidField(nodeName, fieldName, version = 'v21.0') {
        const stmt = this.db.prepare('SELECT 1 FROM graph_node_fields WHERE node_name = ? AND field_name = ? AND version = ?');
        return Boolean(stmt.get(nodeName, fieldName, version));
    }
    /**
     * Returns default field list for a node
     */
    getDefaultFields(nodeName, version = 'v21.0') {
        const node = this.getNode(nodeName, version);
        return node ? node.defaultFields : ['id'];
    }
    /**
     * Retrieves definition of an edge
     */
    getEdge(parentNode, edgeName, httpMethod, version = 'v21.0') {
        const stmt = this.db.prepare('SELECT parent_node, edge_name, http_method, version, target_node, doc_id, endpoint_template, description FROM graph_edges WHERE parent_node = ? AND edge_name = ? AND http_method = ? AND version = ?');
        const row = stmt.get(parentNode, edgeName, httpMethod, version);
        if (!row)
            return null;
        return {
            parentNode: row.parent_node,
            edgeName: row.edge_name,
            httpMethod: row.http_method,
            version: row.version,
            targetNode: row.target_node,
            docId: row.doc_id,
            endpointTemplate: row.endpoint_template,
            description: row.description
        };
    }
    /**
     * Retrieves field transformation rules for a node
     */
    getFieldMappers(nodeName, version = 'v21.0') {
        const stmt = this.db.prepare('SELECT node_name, version, target_field, source_candidates, transform_type FROM field_mappers WHERE node_name = ? AND version = ?');
        const rows = stmt.all(nodeName, version);
        return rows.map(r => ({
            nodeName: r.node_name,
            version: r.version,
            targetField: r.target_field,
            sourceCandidates: JSON.parse(r.source_candidates),
            transformType: r.transform_type
        }));
    }
    /**
     * Closes database session (for clean shutdown)
     */
    close() {
        this.db.close();
    }
}
