/**
 * GraphRouter - Universal Meta Graph API v21.0 Path & Method Dispatcher
 *
 * Reconciles RESTful `/v21.0/{node}/{edge}` requests with underlying
 * digital twin execution engines and SQLite-backed dynamic field projection.
 */
import { GraphCatalog } from '../schema/graph_catalog.js';
import { WebTwin } from '../twins/web_twin.js';
import { MediaTwin } from '../twins/media_twin.js';
import { DirectTwin } from '../twins/direct_twin.js';
import { DiscoveryTwin } from '../twins/discovery_twin.js';
import { DashboardTwin } from '../twins/dashboard_twin.js';
import { DeviceTwin } from '../twins/device_twin.js';
export interface RouterDependencies {
    device: DeviceTwin;
    web: WebTwin;
    media: MediaTwin;
    direct: DirectTwin;
    discovery: DiscoveryTwin;
    dashboard: DashboardTwin;
}
export interface ParsedGraphPath {
    version: string;
    targetId: string;
    edgeName?: string;
    subTargetId?: string;
}
export declare class GraphRouter {
    private catalog;
    private projector;
    private deps;
    constructor(deps: RouterDependencies, catalog?: GraphCatalog);
    /**
     * Universal dispatch handler matching Meta Graph API v21.0
     */
    dispatch<T = any>(path: string, method?: 'GET' | 'POST' | 'DELETE', paramsOrBody?: Record<string, any>): Promise<T>;
    /**
     * Parse graph path into components: /v21.0/17895695668004550/comments
     */
    parsePath(rawPath: string): ParsedGraphPath;
    private handleUserNode;
    private handleMediaOrUserNode;
    private handleCommentsEdge;
    private handleMessagesEdge;
    private handleInsightsEdge;
    private handleMediaEdge;
    private handleMediaPublishEdge;
    private handleStoriesEdge;
    private handleConversationsEdge;
}
