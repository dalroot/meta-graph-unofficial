/**
 * Transport Layer for TwinGraph
 * Supports Tigon/Liger emulation and transparent SOCKS5/HTTPS proxying
 */

import * as https from 'node:https';
import { SocksProxyAgent } from 'socks-proxy-agent';

export interface TransportResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: string;
}

export class TwinTransport {
  private agent?: https.Agent;

  constructor() {
    const proxyUrl = process.env.HTTPS_PROXY || process.env.ALL_PROXY || process.env.HTTP_PROXY;
    if (proxyUrl) {
      this.agent = new SocksProxyAgent(proxyUrl) as unknown as https.Agent;
    }
  }

  public async request(
    urlStr: string,
    options: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
      timeoutMs?: number;
    } = {}
  ): Promise<TransportResponse> {
    const url = new URL(urlStr);
    const method = (options.method || 'GET').toUpperCase();
    const timeout = options.timeoutMs || 15000;

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: url.hostname,
          port: url.port || 443,
          path: `${url.pathname}${url.search}`,
          method: method,
          headers: options.headers || {},
          agent: this.agent,
          timeout: timeout
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk.toString();
          });
          res.on('end', () => {
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
}
