/**
 * Transport Layer for TwinGraph
 * Supports Tigon/Liger emulation and transparent SOCKS5/HTTPS proxying
 */

import * as https from 'node:https';
import * as http from 'node:http';
import * as zlib from 'node:zlib';
import { SocksProxyAgent } from 'socks-proxy-agent';

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

export class TwinTransport {
  private agent?: https.Agent;

  constructor(options: { proxyUrl?: string; agent?: https.Agent } = {}) {
    if (options.agent) {
      this.agent = options.agent;
    } else {
      const proxyUrl = options.proxyUrl || process.env.HTTPS_PROXY || process.env.ALL_PROXY || process.env.HTTP_PROXY;
      if (proxyUrl) {
        this.agent = new SocksProxyAgent(proxyUrl) as unknown as https.Agent;
      }
    }
  }

  public async request(
    urlStr: string,
    options: TransportRequestOptions = {}
  ): Promise<TransportResponse> {
    const url = new URL(urlStr);
    const method = (options.method || 'GET').toUpperCase();
    const timeout = options.timeoutMs || 25000;

    const headers = { ...(options.headers || {}) };
    if (options.body && !headers['Content-Length'] && !headers['content-length']) {
      headers['Content-Length'] = Buffer.byteLength(options.body, 'utf-8').toString();
    }

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: url.hostname,
          port: url.port || 443,
          path: `${url.pathname}${url.search}`,
          method: method,
          headers: headers,
          agent: this.agent,
          timeout: timeout
        },
        (res) => {
          let stream: NodeJS.ReadableStream = res;
          const encoding = res.headers['content-encoding'];
          if (encoding === 'gzip') {
            stream = res.pipe(zlib.createGunzip());
          } else if (encoding === 'deflate') {
            stream = res.pipe(zlib.createInflate());
          } else if (encoding === 'br') {
            stream = res.pipe(zlib.createBrotliDecompress());
          }

          let data = '';
          stream.on('data', (chunk) => {
            data += chunk.toString();
          });
          stream.on('end', () => {
            const resHeaders: Record<string, string> = {};
            for (const [k, v] of Object.entries(res.headers)) {
              if (v) resHeaders[k] = Array.isArray(v) ? v.join(', ') : v;
            }
            resolve({
              status: res.statusCode || 0,
              statusText: res.statusMessage || '',
              headers: resHeaders,
              data: data
            });
          });
        }
      );

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
   * Convenience helper to perform a request and parse JSON response
   */
  public async requestJson<T = any>(
    urlStr: string,
    options: TransportRequestOptions = {}
  ): Promise<{ status: number; data: T; headers: Record<string, string> }> {
    const res = await this.request(urlStr, options);
    let parsed: any;
    try {
      parsed = JSON.parse(res.data);
    } catch {
      throw new Error(`Failed to parse JSON response from ${urlStr} (Status ${res.status}): ${res.data.slice(0, 300)}`);
    }
    return {
      status: res.status,
      data: parsed,
      headers: res.headers
    };
  }
}
