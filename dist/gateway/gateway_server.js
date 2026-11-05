/**
 * TwinGatewayServer - Zero-Dependency Native HTTP Drop-in Gateway
 *
 * Exposes Meta Graph API v21.0 HTTP wire protocol on localhost.
 * Accepts access_token query param and Authorization: Bearer <key>.
 * 1:1 error shape and JSON payload match with official Meta Graph API.
 */
import * as http from 'node:http';
import * as crypto from 'node:crypto';
import { ApiKeyManager } from '../auth/api_key_manager.js';
import { SmartRateLimiter } from './rate_limiter.js';
export class TwinGatewayServer {
    server = null;
    port;
    host;
    router;
    keyManager;
    rateLimiter;
    allowGuestForPublicMedia;
    constructor(options) {
        this.port = options.port || 3000;
        this.host = options.host || '127.0.0.1';
        this.router = options.router;
        this.keyManager = options.keyManager || new ApiKeyManager();
        this.rateLimiter = options.rateLimiter || new SmartRateLimiter();
        this.allowGuestForPublicMedia = options.allowGuestForPublicMedia ?? false;
    }
    getPort() {
        return this.port;
    }
    getHost() {
        return this.host;
    }
    getBaseUrl() {
        return `http://${this.host}:${this.port}`;
    }
    async start() {
        return new Promise((resolve, reject) => {
            this.server = http.createServer((req, res) => this.handleRequest(req, res));
            this.server.on('error', (err) => {
                reject(err);
            });
            this.server.listen(this.port, this.host, () => {
                const addr = this.server?.address();
                if (typeof addr === 'object' && addr?.port) {
                    this.port = addr.port;
                }
                resolve(this.getBaseUrl());
            });
        });
    }
    async stop() {
        return new Promise((resolve) => {
            if (!this.server)
                return resolve();
            this.server.close(() => {
                this.server = null;
                resolve();
            });
        });
    }
    async handleRequest(req, res) {
        // Set standard CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Requested-With');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }
        const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        const pathname = reqUrl.pathname;
        // 1. Health check & gateway status
        if (pathname === '/' || pathname === '/health') {
            res.writeHead(200);
            res.end(JSON.stringify({
                status: 'ok',
                engine: 'Meta Graph Unofficial Drop-in Gateway',
                api_version: 'v21.0',
                active_port: this.port,
                documentation: 'https://github.com/dalroot/meta-graph-unofficial'
            }, null, 2));
            return;
        }
        // 2. Extract Auth Token (Query Param `access_token` OR `Authorization: Bearer ...`)
        const queryToken = reqUrl.searchParams.get('access_token');
        const authHeader = req.headers['authorization'];
        let bearerToken = null;
        if (authHeader && typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
            bearerToken = authHeader.slice(7).trim();
        }
        const token = queryToken || bearerToken;
        // 3. Validate Token
        const authResult = this.keyManager.validateKey(token);
        if (!authResult.valid) {
            const fbtraceId = `twin_${crypto.randomBytes(8).toString('hex')}`;
            if (authResult.error === 'missing_key') {
                res.writeHead(401);
                res.end(JSON.stringify({
                    error: {
                        message: 'An active access token must be used to query information about the current user or resource.',
                        type: 'OAuthException',
                        code: 190,
                        fbtrace_id: fbtraceId
                    }
                }, null, 2));
                return;
            }
            if (authResult.error === 'daily_limit_exceeded') {
                res.writeHead(429);
                res.end(JSON.stringify({
                    error: {
                        message: '(#17) User request limit reached for this API Key.',
                        type: 'OAuthException',
                        code: 17,
                        error_subcode: 2446079,
                        fbtrace_id: fbtraceId
                    }
                }, null, 2));
                return;
            }
            // Invalid or revoked key
            res.writeHead(401);
            res.end(JSON.stringify({
                error: {
                    message: 'Invalid OAuth access token - Cannot parse or verify access token signature.',
                    type: 'OAuthException',
                    code: 190,
                    error_subcode: 463,
                    fbtrace_id: fbtraceId
                }
            }, null, 2));
            return;
        }
        // Set Gateway telemetry headers
        if (authResult.role) {
            res.setHeader('X-TwinGraph-Role', authResult.role);
        }
        if (authResult.remainingToday !== undefined) {
            res.setHeader('X-TwinGraph-Remaining-Today', authResult.remainingToday.toString());
        }
        // 3.5. Evaluate Smart Rate Limiter (Gentle Guest vs Protected Account Pacing)
        const pacer = this.rateLimiter.check(req.method || 'GET', pathname);
        res.setHeader('X-TwinGraph-Mode', pacer.mode);
        res.setHeader('X-App-Usage', JSON.stringify(pacer.appUsage));
        if (!pacer.allowed) {
            res.setHeader('Retry-After', (pacer.retryAfterSec || 2).toString());
            res.writeHead(429);
            res.end(JSON.stringify({
                error: {
                    message: pacer.errorMessage || '(#17) User request limit reached for this resource.',
                    type: 'OAuthException',
                    code: 17,
                    error_subcode: 2446079,
                    is_transient: true,
                    error_user_title: pacer.reason === 'account_hourly_safety_cap' ? 'Account Safety Shield Active' : 'Rate Limit Pacing Active',
                    error_user_msg: pacer.reason === 'account_hourly_safety_cap'
                        ? 'Safe hourly request threshold reached on live account session. Throttling temporarily to prevent detection.'
                        : 'Requests are paced with human jitter to protect account integrity. Please retry shortly.',
                    retry_after_seconds: pacer.retryAfterSec || 2,
                    rate_limit_reason: pacer.reason || 'rate_limit_exceeded',
                    fbtrace_id: `twin_${crypto.randomBytes(8).toString('hex')}`
                }
            }, null, 2));
            return;
        }
        if (pacer.delayMs > 0) {
            await new Promise(r => setTimeout(r, pacer.delayMs));
        }
        // 4. Collect Query Parameters & Body
        const params = {};
        reqUrl.searchParams.forEach((val, key) => {
            if (key !== 'access_token') {
                params[key] = val;
            }
        });
        let bodyData = '';
        if (req.method === 'POST') {
            try {
                bodyData = await this.readRequestBody(req);
                if (bodyData.trim()) {
                    const parsedBody = JSON.parse(bodyData);
                    Object.assign(params, parsedBody);
                }
            }
            catch (err) {
                res.writeHead(400);
                res.end(JSON.stringify({
                    error: {
                        message: `Invalid JSON payload in request body: ${err.message}`,
                        type: 'OAuthException',
                        code: 100
                    }
                }));
                return;
            }
        }
        // 5. Dispatch through GraphRouter
        try {
            const httpMethod = (req.method?.toUpperCase() || 'GET');
            const result = await this.router.dispatch(pathname, httpMethod, params);
            res.writeHead(200);
            res.end(JSON.stringify(result, null, 2));
        }
        catch (err) {
            const statusCode = err.message?.includes('not found') ? 404 : 500;
            res.writeHead(statusCode);
            res.end(JSON.stringify({
                error: {
                    message: err.message || 'Internal TwinGraph Gateway Error',
                    type: 'OAuthException',
                    code: statusCode === 404 ? 803 : 1
                }
            }, null, 2));
        }
    }
    readRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk) => {
                body += chunk;
                if (body.length > 5 * 1024 * 1024) { // 5MB guard
                    req.destroy();
                    reject(new Error('Request payload exceeds 5MB limit'));
                }
            });
            req.on('end', () => resolve(body));
            req.on('error', (err) => reject(err));
        });
    }
}
