/**
 * Transport Layer for TwinGraph
 * Supports Tigon/Liger emulation and transparent SOCKS5/HTTPS proxying
 */
import * as https from 'node:https';
import * as http from 'node:http';
import * as zlib from 'node:zlib';
import { SocksProxyAgent } from 'socks-proxy-agent';
export class TwinTransport {
    defaultProxy;
    constructor(options) {
        this.defaultProxy = options?.proxyUrl;
    }
    async request(urlStr, options = {}) {
        const url = new URL(urlStr);
        const method = (options.method || 'GET').toUpperCase();
        const timeout = options.timeoutMs || 25000;
        const proxyEnv = options.proxyUrl || this.defaultProxy || process.env.HTTPS_PROXY || process.env.ALL_PROXY || process.env.http_proxy;
        let agent = undefined;
        if (proxyEnv && proxyEnv.startsWith('socks')) {
            try {
                agent = new SocksProxyAgent(proxyEnv);
            }
            catch {
                // Continue with direct connection
            }
        }
        const headers = { ...(options.headers || {}) };
        if (options.body && !headers['Content-Length'] && !headers['content-length']) {
            headers['Content-Length'] = Buffer.byteLength(options.body, 'utf-8').toString();
        }
        return new Promise((resolve, reject) => {
            const req = https.request({
                hostname: url.hostname,
                port: url.port || 443,
                path: `${url.pathname}${url.search}`,
                method: method,
                headers: headers,
                timeout: timeout,
                agent: agent
            }, (res) => {
                let stream = res;
                const encoding = res.headers['content-encoding'];
                if (encoding === 'gzip') {
                    stream = res.pipe(zlib.createGunzip());
                }
                else if (encoding === 'deflate') {
                    stream = res.pipe(zlib.createInflate());
                }
                else if (encoding === 'br') {
                    stream = res.pipe(zlib.createBrotliDecompress());
                }
                let data = '';
                stream.on('data', (chunk) => {
                    data += chunk.toString();
                });
                stream.on('end', () => {
                    const resHeaders = {};
                    for (const [k, v] of Object.entries(res.headers)) {
                        if (v)
                            resHeaders[k] = Array.isArray(v) ? v.join(', ') : v;
                    }
                    resolve({
                        status: res.statusCode || 0,
                        statusText: res.statusMessage || '',
                        headers: resHeaders,
                        data: data
                    });
                });
            });
            req.on('error', (err) => {
                reject(err);
            });
            req.on('timeout', () => {
                req.destroy();
                reject(new Error(`Network timeout after ${timeout}ms connecting to ${urlStr}`));
            });
            if (options.body) {
                req.write(options.body);
            }
            req.end();
        });
    }
    /**
     * Performs an HTTP request and returns raw binary Buffer
     */
    async requestBuffer(urlStr, options = {}) {
        const url = new URL(urlStr);
        const isHttps = url.protocol === 'https:';
        const client = isHttps ? https : http;
        const method = (options.method || 'GET').toUpperCase();
        const timeout = options.timeoutMs || 30000;
        const headers = { ...(options.headers || {}) };
        if (options.body && !headers['Content-Length'] && !headers['content-length']) {
            headers['Content-Length'] = Buffer.byteLength(options.body, 'utf-8').toString();
        }
        return new Promise((resolve, reject) => {
            const req = client.request({
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: `${url.pathname}${url.search}`,
                method: method,
                headers: headers,
                timeout: timeout
            }, (res) => {
                let stream = res;
                const encoding = res.headers['content-encoding'];
                if (encoding === 'gzip') {
                    stream = res.pipe(zlib.createGunzip());
                }
                else if (encoding === 'deflate') {
                    stream = res.pipe(zlib.createInflate());
                }
                else if (encoding === 'br') {
                    stream = res.pipe(zlib.createBrotliDecompress());
                }
                const chunks = [];
                stream.on('data', (chunk) => {
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                });
                stream.on('end', () => {
                    const resHeaders = {};
                    for (const [k, v] of Object.entries(res.headers)) {
                        if (v)
                            resHeaders[k] = Array.isArray(v) ? v.join(', ') : v;
                    }
                    resolve({
                        status: res.statusCode || 0,
                        statusText: res.statusMessage || '',
                        headers: resHeaders,
                        data: Buffer.concat(chunks)
                    });
                });
            });
            req.on('error', (err) => {
                reject(err);
            });
            req.on('timeout', () => {
                req.destroy();
                reject(new Error(`Network timeout after ${timeout}ms connecting to ${urlStr}`));
            });
            if (options.body) {
                req.write(options.body);
            }
            req.end();
        });
    }
    /**
     * Streams a binary file directly to disk over SOCKS5 proxy
     */
    async downloadToFile(urlStr, destinationFilePath, options = {}, maxRedirects = 5) {
        const fs = await import('node:fs');
        const path = await import('node:path');
        let currentUrl = urlStr;
        let redirectsCount = 0;
        while (redirectsCount <= maxRedirects) {
            const url = new URL(currentUrl);
            const isHttps = url.protocol === 'https:';
            const client = isHttps ? https : http;
            const method = (options.method || 'GET').toUpperCase();
            const timeout = options.timeoutMs || 60000;
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                'Accept': '*/*',
                ...(options.headers || {})
            };
            const result = await new Promise((resolve, reject) => {
                const req = client.request({
                    hostname: url.hostname,
                    port: url.port || (isHttps ? 443 : 80),
                    path: `${url.pathname}${url.search}`,
                    method: method,
                    headers: headers,
                    timeout: timeout
                }, (res) => {
                    const statusCode = res.statusCode || 0;
                    const resHeaders = {};
                    for (const [k, v] of Object.entries(res.headers)) {
                        if (v)
                            resHeaders[k] = Array.isArray(v) ? v.join(', ') : v;
                    }
                    // Handle HTTP redirects (301, 302, 303, 307, 308)
                    if ([301, 302, 303, 307, 308].includes(statusCode) && res.headers.location) {
                        const redirectUrl = new URL(res.headers.location, currentUrl).toString();
                        res.resume(); // Drain and discard
                        resolve({ redirect: redirectUrl, status: statusCode, headers: resHeaders, bytes: 0, filePath: destinationFilePath });
                        return;
                    }
                    if (statusCode < 200 || statusCode >= 300) {
                        res.resume();
                        reject(new Error(`Download failed with HTTP ${statusCode} ${res.statusMessage || ''} for ${currentUrl}`));
                        return;
                    }
                    const targetDir = path.dirname(destinationFilePath);
                    if (!fs.existsSync(targetDir)) {
                        fs.mkdirSync(targetDir, { recursive: true });
                    }
                    const fileWriteStream = fs.createWriteStream(destinationFilePath);
                    let stream = res;
                    const encoding = res.headers['content-encoding'];
                    if (encoding === 'gzip') {
                        stream = res.pipe(zlib.createGunzip());
                    }
                    else if (encoding === 'deflate') {
                        stream = res.pipe(zlib.createInflate());
                    }
                    else if (encoding === 'br') {
                        stream = res.pipe(zlib.createBrotliDecompress());
                    }
                    let downloadedBytes = 0;
                    stream.on('data', (chunk) => {
                        downloadedBytes += chunk.length;
                    });
                    stream.pipe(fileWriteStream);
                    fileWriteStream.on('finish', () => {
                        fileWriteStream.close(() => {
                            resolve({
                                status: statusCode,
                                headers: resHeaders,
                                bytes: downloadedBytes,
                                filePath: destinationFilePath,
                                contentType: resHeaders['content-type']
                            });
                        });
                    });
                    fileWriteStream.on('error', (err) => {
                        fileWriteStream.close();
                        reject(err);
                    });
                    stream.on('error', (err) => {
                        fileWriteStream.close();
                        reject(err);
                    });
                });
                req.on('error', (err) => {
                    reject(err);
                });
                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error(`Download network timeout after ${timeout}ms for ${currentUrl}`));
                });
                req.end();
            });
            if (result.redirect) {
                currentUrl = result.redirect;
                redirectsCount++;
                continue;
            }
            return result;
        }
        throw new Error(`Exceeded maximum redirects (${maxRedirects}) while downloading ${urlStr}`);
    }
    /**
     * Convenience helper to perform a request and parse JSON response
     */
    async requestJson(urlStr, options = {}) {
        const res = await this.request(urlStr, options);
        let parsed;
        try {
            parsed = JSON.parse(res.data);
        }
        catch {
            throw new Error(`Failed to parse JSON response from ${urlStr} (Status ${res.status}): ${res.data.slice(0, 300)}`);
        }
        return {
            status: res.status,
            data: parsed,
            headers: res.headers
        };
    }
}
