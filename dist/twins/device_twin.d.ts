/**
 * DeviceTwin - Hardware Fingerprint & Network Protocol Emulation
 *
 * Accurately models the physical Xiaomi Redmi Note 13 4G (23129RAA4G / sapphire)
 * hardware characteristics, session tokens, Liger/Tigon transport headers,
 * and HMAC payload signing for Instagram private and mobile endpoints.
 */
import { DeviceFingerprint, SessionTokens } from '../types/graph.js';
import { MobileDeviceProfile } from '../profiles/index.js';
import { MobileSession } from './session_loader.js';
export declare const DEFAULT_SESSION_PATH = "/home/hokar/Documents/antigravity/hopeful-bell/instagram_session.json";
export declare const IG_SIGNING_KEY = "6dc344682cc5cd2496191b26cc065e8c1b97bfb9cf1ad982798e2ee4e9d56262";
export declare const IG_APP_ID_MOBILE = "1217981644879628";
export declare const IG_APP_ID_WEB = "936619743392459";
export interface DeviceTwinSession {
    platform: string;
    username: string;
    full_name: string;
    ds_user_id: string;
    profile_url: string;
    status: string;
    cookie_string: string;
    key_tokens: SessionTokens;
    digital_twin_fingerprint?: {
        device_model: string;
        viewport_width: number;
        viewport_height: number;
        device_pixel_ratio: number;
        user_agent: string;
    };
}
export declare class DeviceTwin {
    private session;
    private mobileSession;
    private fingerprint;
    constructor(sessionInput?: string | MobileSession | DeviceTwinSession | Record<string, any>, customProfile?: MobileDeviceProfile);
    private getDefaultMobileSession;
    /**
     * Returns true if session is real (not placeholder or empty)
     */
    hasActiveSession(): boolean;
    getFingerprint(): DeviceFingerprint;
    getSession(): DeviceTwinSession;
    getMobileSession(): MobileSession;
    getTokens(): SessionTokens;
    getUserId(): string;
    getUsername(): string;
    getFullName(): string;
    /**
     * Generates authentic Redmi Note 13 Android Liger HTTP headers (100% Mobile Client)
     */
    getLigerHeaders(friendlyName?: string): Record<string, string>;
    /**
     * Generates Tigon network stack headers (Meta MNS Tigon)
     */
    getTigonHeaders(friendlyName?: string): Record<string, string>;
    /**
     * Generates WebView headers (used for Polaris Web surfaces)
     */
    getWebviewHeaders(): Record<string, string>;
    /**
     * Default authenticated headers conforming to physical Redmi Note 13
     */
    getAuthenticatedHeaders(): Record<string, string>;
    /**
     * HMAC-SHA256 Payload Signing (Meta Private API standard)
     */
    signPayload(payload: Record<string, any>): string;
    /**
     * Signed body formatted for application/x-www-form-urlencoded
     */
    getSignedBody(payload: Record<string, any>): string;
    /**
     * Verifies an HMAC payload signature
     */
    verifyPayloadSignature(signatureString: string): boolean;
}
