/**
 * FieldProjector - Dynamic Meta Graph API v21.0 Field Filter & Transformer
 *
 * Takes raw telemetry responses and dynamically projects only requested fields
 * according to the SQLite schema catalog, eliminating all internal leaks.
 */
import { GraphCatalog } from './graph_catalog.js';
export declare class FieldProjector {
    private catalog;
    constructor(catalog?: GraphCatalog);
    /**
     * Projects and transforms a raw object into an authentic Graph API Node
     */
    project(nodeName: string, rawObject: Record<string, any>, requestedFields?: string | string[], version?: string): Record<string, any>;
    /**
     * Projects an array of raw objects (e.g. edge list or pagination data)
     */
    projectList(nodeName: string, rawList: Record<string, any>[], requestedFields?: string | string[], version?: string): Record<string, any>[];
    /**
     * Resolves requested fields string or array into validated field list
     */
    private resolveRequestedFields;
    /**
     * Resolves value from candidates path list (e.g. ['caption.text', 'caption'])
     */
    private resolveCandidateValue;
    /**
     * Retrieves a nested property by dot notation path
     */
    private getValueByPath;
    /**
     * Applies schema-defined transformation
     */
    private applyTransform;
}
