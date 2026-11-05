/**
 * Local Meta Graph API v21.0 REST Proxy Server
 * Emulates the official Meta Graph API endpoint on http://localhost:8080/v21.0/
 * Powered by the Digital Twin Bridge.
 */
import * as http from 'node:http';
export declare function createGraphServer(): http.Server;
