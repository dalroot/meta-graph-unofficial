/**
 * FieldProjector - Dynamic Meta Graph API v21.0 Field Filter & Transformer
 *
 * Takes raw telemetry responses and dynamically projects only requested fields
 * according to the SQLite schema catalog, eliminating all internal leaks.
 */
import { GraphCatalog } from './graph_catalog.js';
export class FieldProjector {
    catalog;
    constructor(catalog) {
        this.catalog = catalog || GraphCatalog.getInstance();
    }
    /**
     * Projects and transforms a raw object into an authentic Graph API Node
     */
    project(nodeName, rawObject, requestedFields, version = 'v21.0') {
        if (!rawObject || typeof rawObject !== 'object') {
            return {};
        }
        // 1. Resolve requested field list
        const fieldsToProject = this.resolveRequestedFields(nodeName, requestedFields, version);
        // 2. Fetch mapper rules from SQLite catalog
        const mappers = this.catalog.getFieldMappers(nodeName, version);
        const mapperLookup = new Map();
        for (const m of mappers) {
            mapperLookup.set(m.targetField, m);
        }
        // 3. Project each requested field
        const result = {};
        for (const field of fieldsToProject) {
            const rule = mapperLookup.get(field);
            let value = undefined;
            if (rule) {
                value = this.resolveCandidateValue(rawObject, rule.sourceCandidates);
                value = this.applyTransform(value, rule.transformType, rawObject);
            }
            else {
                // Fallback: direct property access
                value = rawObject[field];
            }
            if (value !== undefined) {
                result[field] = value;
            }
        }
        return result;
    }
    /**
     * Projects an array of raw objects (e.g. edge list or pagination data)
     */
    projectList(nodeName, rawList, requestedFields, version = 'v21.0') {
        if (!Array.isArray(rawList))
            return [];
        return rawList.map(item => this.project(nodeName, item, requestedFields, version));
    }
    /**
     * Resolves requested fields string or array into validated field list
     */
    resolveRequestedFields(nodeName, requestedFields, version = 'v21.0') {
        if (!requestedFields || (Array.isArray(requestedFields) && requestedFields.length === 0)) {
            return this.catalog.getDefaultFields(nodeName, version);
        }
        const fieldNames = typeof requestedFields === 'string'
            ? requestedFields.split(',').map(f => f.trim()).filter(Boolean)
            : requestedFields.map(f => String(f).trim()).filter(Boolean);
        // Filter to valid schema fields
        return fieldNames.filter(field => this.catalog.isValidField(nodeName, field, version));
    }
    /**
     * Resolves value from candidates path list (e.g. ['caption.text', 'caption'])
     */
    resolveCandidateValue(obj, candidates) {
        for (const path of candidates) {
            const val = this.getValueByPath(obj, path);
            if (val !== undefined && val !== null) {
                return val;
            }
        }
        return undefined;
    }
    /**
     * Retrieves a nested property by dot notation path
     */
    getValueByPath(obj, path) {
        if (!obj || typeof obj !== 'object')
            return undefined;
        // Handle array indexing like 'edges[0].node.text'
        const normalized = path.replace(/\[(\w+)\]/g, '.$1');
        const segments = normalized.split('.');
        let current = obj;
        for (const seg of segments) {
            if (current === undefined || current === null)
                return undefined;
            current = current[seg];
        }
        return current;
    }
    /**
     * Applies schema-defined transformation
     */
    applyTransform(value, transformType, fullObj) {
        if (value === undefined || value === null)
            return undefined;
        switch (transformType) {
            case 'string':
                return String(value);
            case 'number':
                const num = Number(value);
                return isNaN(num) ? 0 : num;
            case 'boolean':
                return Boolean(value);
            case 'timestamp_iso':
                if (typeof value === 'number') {
                    // Detect unix seconds vs milliseconds
                    const ms = value < 1e11 ? value * 1000 : value;
                    return new Date(ms).toISOString();
                }
                if (typeof value === 'string') {
                    const parsed = Date.parse(value);
                    return isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
                }
                return new Date().toISOString();
            case 'media_type_enum': {
                // Handle Mobile numeric codes: 1=Photo, 2=Video, 8=Carousel
                if (value === 2 || value === '2' || value === 'VIDEO' || value === 'XIGPolarisVideoMedia') {
                    return 'VIDEO';
                }
                if (value === 8 || value === '8' || value === 'CAROUSEL_ALBUM' || value === 'XIGPolarisCarouselMedia') {
                    return 'CAROUSEL_ALBUM';
                }
                if (value === 1 || value === '1' || value === 'IMAGE' || value === 'XIGPolarisImageMedia' || value === 'XIGPolarisPhotoMedia') {
                    return 'IMAGE';
                }
                // Fallback: check if video_versions exists on parent object
                if (fullObj && (fullObj.video_versions || fullObj.is_video)) {
                    return 'VIDEO';
                }
                return 'IMAGE';
            }
            case 'product_type_enum': {
                if (value === 'clips' || value === 'REELS' || value === 'CLIPS') {
                    return 'REELS';
                }
                if (value === 'story' || value === 'STORIES') {
                    return 'STORY';
                }
                return 'FEED';
            }
            default:
                return value;
        }
    }
}
