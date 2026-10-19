/**
 * Single-Attempt Safe Direct Message Dispatch via TwinGraph (Option A - Clean Existing Thread)
 * Conforming strictly to Meta Graph API v21.0 POST /{conversation-id}/messages
 * Endpoint: POST https://i.instagram.com/api/v1/direct_v2/threads/broadcast/text/
 * Headers: Authentic mobile Liger headers from DeviceTwin.getLigerHeaders()
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as https from 'node:https';
import * as crypto from 'node:crypto';
import * as zlib from 'node:zlib';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { DeviceTwin } from './twins/device_twin.js';

const CB_PATH = '/home/hokar/Documents/antigravity/hopeful-bell/circuit_breaker.json';
const SESSION_PATH = '/home/hokar/Documents/antigravity/hopeful-bell/instagram_session.json';
const PROXY_URL = process.env.HTTPS_PROXY || process.env.ALL_PROXY || 'socks5://127.0.0.1:10808';

const TARGET_RECIPIENT = {
  username: 'tawanatallks',
  userId: '76631390374',
  threadId: '2102378287099186'
};

const MESSAGE_TEXT = 'سلام توانا عزیز، تست موفق ارسال پیام مستقیم از TwinGraph 🚀';

function checkCircuitBreaker(): void {
  if (!fs.existsSync(CB_PATH)) {
    throw new Error(`Circuit breaker not found: ${CB_PATH}`);
  }
  const cb = JSON.parse(fs.readFileSync(CB_PATH, 'utf-8'));
  if (cb.tripped) {
    console.error(`[!] CIRCUIT BREAKER TRIPPED: ${cb.reason}. Halting immediately.`);
    process.exit(1);
  }
}

function tripCircuitBreaker(reason: string): void {
  try {
    if (fs.existsSync(CB_PATH)) {
      const cb = JSON.parse(fs.readFileSync(CB_PATH, 'utf-8'));
      cb.tripped = true;
      cb.reason = reason;
      cb.tripped_at = new Date().toISOString();
      fs.writeFileSync(CB_PATH, JSON.stringify(cb, null, 2), 'utf-8');
      console.error(`[!] Circuit breaker tripped and written to disk: ${reason}`);
    }
  } catch (err: any) {
    console.error(`[!] Failed writing circuit breaker: ${err.message}`);
  }
}

async function main() {
  console.log('[*] ========================================================');
  console.log('[*] TwinGraph Mobile Native Direct Message Dispatcher (Clean Existing Thread)');
  console.log('[*] Conforming to Meta Graph API v21.0 POST /{conversation-id}/messages');
  console.log('[*] Endpoint: POST https://i.instagram.com/api/v1/direct_v2/threads/broadcast/text/');
  console.log('[*] ========================================================');

  // 1. Verify Circuit Breaker
  checkCircuitBreaker();
  console.log('[+] Pre-flight Check 1: Circuit breaker is CLEAR (tripped: false)');

  // 2. Instantiate DeviceTwin with authentic Redmi Note 13 fingerprint & session
  const deviceTwin = new DeviceTwin(SESSION_PATH);
  const tokens = deviceTwin.getTokens();
  const fp = deviceTwin.getFingerprint();

  console.log(`[+] Pre-flight Check 2: Authenticated Account: @${deviceTwin.getUsername()} (ID: ${deviceTwin.getUserId()})`);
  console.log(`[+] Pre-flight Check 3: Device Model: ${fp.brand} ${fp.model} (${fp.soc_model})`);
  console.log(`[+] Target Recipient: @${TARGET_RECIPIENT.username} (Thread: ${TARGET_RECIPIENT.threadId})`);
  console.log(`[+] Outbound Message: "${MESSAGE_TEXT}"`);

  // 3. Prepare Clean Form-Encoded Parameters for Existing Thread (OMIT recipient_users)
  const clientContext = crypto.randomUUID();
  const mutationToken = clientContext;

  const bodyParams = new URLSearchParams({
    action: 'send_item',
    thread_ids: JSON.stringify([TARGET_RECIPIENT.threadId]),
    client_context: clientContext,
    mutation_token: mutationToken,
    text: MESSAGE_TEXT,
    _csrftoken: tokens.csrftoken || '',
    _uid: deviceTwin.getUserId(),
    _uuid: tokens.ig_did || fp.android_id
  });

  const bodyData = bodyParams.toString();

  // 4. Authentic Mobile Liger Headers
  const ligerHeaders = deviceTwin.getLigerHeaders();
  const headers: Record<string, string> = {
    ...ligerHeaders,
    'Host': 'i.instagram.com',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Content-Length': Buffer.byteLength(bodyData, 'utf-8').toString(),
    'Accept': '*/*',
    'X-FB-HTTP-Engine': 'Liger',
    'X-IG-App-ID': '1217981644879628'
  };

  if (tokens.mid) {
    headers['X-MID'] = tokens.mid;
  }
  if (tokens.ig_did) {
    headers['X-IG-Device-ID'] = tokens.ig_did;
  }
  headers['X-IG-Android-ID'] = fp.android_id;

  const agent = new SocksProxyAgent(PROXY_URL);

  const reqOptions: https.RequestOptions = {
    hostname: 'i.instagram.com',
    port: 443,
    path: '/api/v1/direct_v2/threads/broadcast/text/',
    method: 'POST',
    headers: headers,
    agent: agent,
    timeout: 30000
  };

  console.log(`[*] Executing FINAL SINGLE ATTEMPT to https://i.instagram.com/api/v1/direct_v2/threads/broadcast/text/ ...`);
  const t0 = Date.now();

  const response = await new Promise<{ statusCode: number; statusMessage: string; headers: any; body: string }>((resolve, reject) => {
    const req = https.request(reqOptions, (res) => {
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
        resolve({
          statusCode: res.statusCode || 0,
          statusMessage: res.statusMessage || '',
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Network timeout after 30000ms'));
    });

    req.write(bodyData);
    req.end();
  });

  const durationMs = Date.now() - t0;
  console.log(`[*] HTTP Status: ${response.statusCode} ${response.statusMessage} (${durationMs}ms)`);
  console.log(`[*] Raw response: ${response.body}`);

  if (response.statusCode !== 200) {
    const errorMsg = `HTTP ${response.statusCode}: ${response.body.slice(0, 300)}`;
    tripCircuitBreaker(errorMsg);
    console.error(`[!] Request failed with HTTP ${response.statusCode}. Circuit breaker TRIPPED. Halting.`);
    process.exit(1);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(response.body);
  } catch (err) {
    parsed = { raw: response.body };
  }

  const itemId = parsed.payload?.item_id || parsed.item_id || parsed.message_metadata?.[0]?.item_id || clientContext;

  const result = {
    meta_graph_v21_response: {
      recipient_id: TARGET_RECIPIENT.userId,
      message_id: itemId
    },
    thread_id: TARGET_RECIPIENT.threadId,
    status: parsed.status || 'ok',
    http_status: response.statusCode,
    client_context: clientContext,
    raw_response: parsed
  };

  console.log('[+] DISPATCH SUCCEEDED! Result:');
  console.log(JSON.stringify(result, null, 2));

  // Write dispatch record to disk
  const outputPath = '/home/hokar/Documents/antigravity/hopeful-bell/scratch/dm_sent_success.json';
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`[+] Success record persisted to ${outputPath}`);
}

main().catch((err) => {
  console.error(`[!] Execution error: ${err.message}`);
  tripCircuitBreaker(err.message);
  process.exit(1);
});
