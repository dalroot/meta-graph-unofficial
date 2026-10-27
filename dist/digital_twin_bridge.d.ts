/**
 * Digital Twin Bridge for Meta Graph API v21.0
 * Binds physical Redmi Note 13 hardware parameters, authenticated cookies,
 * and HMAC payload signing into the official Graph API execution lane.
 */
import { GraphUser, GraphInsightsResponse } from './types/graph.js';
export interface SessionData {
    platform: string;
    username: string;
    full_name: string;
    ds_user_id: string;
    profile_url: string;
    status: string;
    cookie_string: string;
    key_tokens: {
        ds_user_id: string;
        sessionid: string;
        csrftoken: string;
        mid: string;
        ig_did: string;
        datr: string;
        rur: string;
    };
    digital_twin_fingerprint: {
        device_model: string;
        viewport_width: number;
        viewport_height: number;
        device_pixel_ratio: number;
        user_agent: string;
    };
}
export declare class DigitalTwinBridge {
    private sessionData;
    constructor(sessionPath?: string);
    getSession(): SessionData;
    getUserId(): string;
    getUsername(): string;
    signPayload(payload: Record<string, any>): string;
    getAuthenticatedHeaders(): Record<string, string>;
    /**
     * Generates a compliant GraphUser node representation of the active account
     */
    getGraphUser(): GraphUser;
    /**
     * Generates official Graph API v21.0 compliant Insights response
     */
    getGraphInsights(mediaId: string): GraphInsightsResponse;
}
