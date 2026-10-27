/**
 * Transport Layer for TwinGraph
 * Supports Tigon/Liger emulation and transparent SOCKS5/HTTPS proxying
 */
import * as https from 'node:https';
export interface TransportResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: string;
}
export interface TransportRequestOptions {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    timeoutMs?: number;
}
export declare class TwinTransport {
    private agent?;
    constructor(options?: {
        proxyUrl?: string;
        agent?: https.Agent;
    });
    request(urlStr: string, options?: TransportRequestOptions): Promise<TransportResponse>;
    /**
     * Performs an HTTP request and returns raw binary Buffer
     */
    requestBuffer(urlStr: string, options?: TransportRequestOptions): Promise<{
        status: number;
        statusText: string;
        headers: Record<string, string>;
        data: Buffer;
    }>;
    /**
     * Streams a binary file directly to disk over SOCKS5 proxy
     */
    downloadToFile(urlStr: string, destinationFilePath: string, options?: TransportRequestOptions, maxRedirects?: number): Promise<{
        status: number;
        headers: Record<string, string>;
        bytes: number;
        filePath: string;
        contentType?: string;
    }>;
    /**
     * Convenience helper to perform a request and parse JSON response
     */
    requestJson<T = any>(urlStr: string, options?: TransportRequestOptions): Promise<{
        status: number;
        data: T;
        headers: Record<string, string>;
    }>;
}
