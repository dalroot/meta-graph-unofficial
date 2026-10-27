/**
 * TwinGatewayServer - Zero-Dependency Native HTTP Drop-in Gateway
 *
 * Exposes Meta Graph API v21.0 HTTP wire protocol on localhost.
 * Accepts access_token query param and Authorization: Bearer <key>.
 * 1:1 error shape and JSON payload match with official Meta Graph API.
 */
import { GraphRouter } from '../router/graph_router.js';
import { ApiKeyManager } from '../auth/api_key_manager.js';
import { SmartRateLimiter } from './rate_limiter.js';
export interface GatewayServerOptions {
    port?: number;
    host?: string;
    router: GraphRouter;
    keyManager?: ApiKeyManager;
    rateLimiter?: SmartRateLimiter;
    allowGuestForPublicMedia?: boolean;
}
export declare class TwinGatewayServer {
    private server;
    private port;
    private host;
    private router;
    private keyManager;
    private rateLimiter;
    private allowGuestForPublicMedia;
    constructor(options: GatewayServerOptions);
    getPort(): number;
    getHost(): string;
    getBaseUrl(): string;
    start(): Promise<string>;
    stop(): Promise<void>;
    private handleRequest;
    private readRequestBody;
}
