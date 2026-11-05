/**
 * GraphQLTwin - Pando GraphQL Query Execution & Graph Node Translation
 *
 * Reconciles internal Meta mobile Pando C++ runtime queries with the
 * official Meta Graph API v21.0 resource model.
 */
import { DeviceTwin } from './device_twin.js';
import { GraphUser, GraphMedia, GraphInsightsResponse, GraphConversation, PandoQueryResult, ProfileTimelineResponse, FollowingListResponse } from '../types/graph.js';
export declare class GraphQLTwin {
    private deviceTwin;
    private static readonly QUERY_REGISTRY;
    constructor(deviceTwin?: DeviceTwin);
    getSupportedQueries(): string[];
    /**
     * Executes a Pando or Relay GraphQL Query
     * In offline / standalone mode, synthesizes authentic responses backed by REA telemetry.
     */
    executeQuery<T = any>(queryNameOrDocId: string, variables?: Record<string, any>): Promise<PandoQueryResult<T>>;
    private resolveQueryName;
    /**
     * Translates raw user payload into official GraphUser node
     */
    translateUserToGraphNode(rawUser: any): GraphUser;
    /**
     * Translates raw post / reel into official GraphMedia node
     */
    translateMediaToGraphNode(rawMedia: any): GraphMedia;
    /**
     * Translates raw insight telemetry into official GraphInsightsResponse
     */
    translateInsightsToGraphNode(mediaId: string, customMetrics?: Record<string, number>): GraphInsightsResponse;
    /**
     * Translates raw Pando thread into official GraphConversation
     */
    translateThreadToGraphConversation(rawThread: any): GraphConversation;
    /**
     * Translates raw Pando IGProfileTimelineQuery response to Graph API compliant ProfileTimelineResponse
     */
    translateProfileTimelineToGraphNodes(rawTimelineData: any): ProfileTimelineResponse;
    /**
     * Translates raw Pando FollowingList response to Graph API compliant FollowingListResponse
     */
    translateFollowingListToGraphResponse(rawFollowingData: any): FollowingListResponse;
}
