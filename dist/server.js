/**
 * Local Meta Graph API v21.0 REST Proxy Server
 * Emulates the official Meta Graph API endpoint on http://localhost:8080/v21.0/
 * Powered by the Digital Twin Bridge.
 */
import * as http from 'node:http';
import * as process from 'node:process';
import { DigitalTwinBridge } from './digital_twin_bridge.js';
const PORT = 8080;
const API_VERSION = 'v21.0';
const bridge = new DigitalTwinBridge();
function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    });
    res.end(JSON.stringify(data, null, 2));
}
export function createGraphServer() {
    return http.createServer((req, res) => {
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
            });
            res.end();
            return;
        }
        const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname;
        console.log(`[Graph API v21.0] ${req.method} ${pathname}`);
        // Health check
        if (pathname === '/' || pathname === '/health') {
            sendJson(res, 200, {
                status: 'ok',
                api_version: API_VERSION,
                digital_twin: 'active_verified',
                account: `@${bridge.getUsername()}`
            });
            return;
        }
        // Standard Route: GET /v21.0/me or GET /v21.0/{user_id}
        const meMatch = pathname.match(new RegExp(`^\\/${API_VERSION}\\/(me|${bridge.getUserId()})\\/?$`));
        if (req.method === 'GET' && meMatch) {
            sendJson(res, 200, bridge.getGraphUser());
            return;
        }
        // Standard Route: GET /v21.0/{media_id}/insights
        const insightsMatch = pathname.match(new RegExp(`^\\/${API_VERSION}\\/([a-zA-Z0-9_]+)\\/insights\\/?$`));
        if (req.method === 'GET' && insightsMatch) {
            const mediaId = insightsMatch[1];
            sendJson(res, 200, bridge.getGraphInsights(mediaId));
            return;
        }
        // Standard Route: POST /v21.0/{user_id}/media
        const publishMatch = pathname.match(new RegExp(`^\\/${API_VERSION}\\/([a-zA-Z0-9_]+)\\/media\\/?$`));
        if (req.method === 'POST' && publishMatch) {
            let body = '';
            req.on('data', (chunk) => { body += chunk.toString(); });
            req.on('end', () => {
                const newMediaId = `180${Date.now().toString().slice(-8)}`;
                sendJson(res, 200, {
                    id: newMediaId
                });
            });
            return;
        }
        // Unknown Route: Official Meta Error Shape
        sendJson(res, 404, {
            error: {
                message: `Unknown path components: ${pathname}`,
                type: 'OAuthException',
                code: 2500,
                fbtrace_id: `trace_${Date.now().toString(36)}`
            }
        });
    });
}
// Auto-run if executed directly
if (process.argv[1] && (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'))) {
    const server = createGraphServer();
    server.listen(PORT, () => {
        console.log(`=======================================================`);
        console.log(`[*] Official Meta Graph API v21.0 REST Proxy Server`);
        console.log(`[*] Listening on: http://localhost:${PORT}/${API_VERSION}/`);
        console.log(`[*] Endpoints:`);
        console.log(`    - GET  /${API_VERSION}/me`);
        console.log(`    - GET  /${API_VERSION}/{media_id}/insights`);
        console.log(`    - POST /${API_VERSION}/{user_id}/media`);
        console.log(`=======================================================`);
    });
}
