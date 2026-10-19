/**
 * Meta Graph Unofficial — Live Mobile-Native Comment Post Test
 * 
 * Strict Guardrails:
 * - 1 single attempt only (No retry loops)
 * - Circuit breaker enforcement
 * - Full Liger headers matching physical Xiaomi Redmi Note 13 4G (23129RAA4G)
 * - HMAC-SHA256 signed_body with IG_SIGNING_KEY
 * - Output logged to scratch/live_comment_post_audit.json
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { DeviceTwin } from '../dist/twins/device_twin.js';
import { TwinTransport } from '../dist/twins/transport.js';

const WORKSPACE_DIR = '/home/hokar/Documents/antigravity/hopeful-bell';
const CB_FILE = path.join(WORKSPACE_DIR, 'circuit_breaker.json');
const AUDIT_FILE = path.join(WORKSPACE_DIR, 'scratch/live_comment_post_audit.json');
const SESSION_FILE = path.join(WORKSPACE_DIR, 'instagram_mobile_session.json');

function assertCircuitBreaker(): void {
  if (fs.existsSync(CB_FILE)) {
    const cb = JSON.parse(fs.readFileSync(CB_FILE, 'utf-8'));
    if (cb.tripped) {
      console.error(`\n🚨 [CIRCUIT BREAKER] Tripped: ${cb.reason}. Halting immediately.`);
      process.exit(1);
    }
  }
}

function updateCircuitBreaker(success: boolean, endpoint: string, status: number, reason: string): void {
  const cb = {
    tripped: !success,
    reason: success ? 'Clear - Safe mobile comment posting executed.' : reason,
    last_success_at: success ? new Date().toISOString() : undefined,
    last_status: status,
    endpoint
  };
  fs.writeFileSync(CB_FILE, JSON.stringify(cb, null, 2), 'utf-8');
}

async function main(): Promise<void> {
  console.log('[*] Starting Mobile-Native Live Comment Post Test...');
  assertCircuitBreaker();

  // 1. Target media: our own verified live post DepbV3TDaXD
  const shortcode = 'DepbV3TDaXD';
  const cleanMediaId = '4010857192890410435';
  const commentText = 'تست سیستم خودکار هوشمند';
  const proxyUrl = 'socks5://127.0.0.1:10808';

  console.log(`[*] Target Media ID   : ${cleanMediaId} (shortcode: ${shortcode})`);
  console.log(`[*] Comment Text      : "${commentText}"`);
  console.log(`[*] Proxy             : ${proxyUrl}`);

  // 2. Instantiate DeviceTwin with mobile session
  const device = new DeviceTwin(SESSION_FILE);
  const transport = new TwinTransport({ proxyUrl });

  console.log(`[*] Hardware Fingerprint: ${device.getFingerprint().brand} ${device.getFingerprint().model} (Android ${device.getFingerprint().os_release})`);
  console.log(`[*] User-Agent        : ${device.getFingerprint().user_agent}`);
  console.log(`[*] User Session      : @${device.getUsername()} (ID: ${device.getUserId()})`);

  // 3. Construct mobile payload
  const clientContext = crypto.randomUUID();
  const idempotenceToken = crypto.randomUUID();
  const rawPayload = {
    _uid: device.getUserId(),
    _uuid: device.getFingerprint().android_id,
    comment_text: commentText,
    idempotence_token: idempotenceToken,
    client_context: clientContext,
    delivery_class: 'organic'
  };

  // 4. Generate authentic signed_body
  const signedBody = device.getSignedBody(rawPayload);
  console.log(`[*] Signed Body Length : ${signedBody.length} bytes`);

  // 5. Build Liger headers
  const endpoint = `https://i.instagram.com/api/v1/media/${cleanMediaId}/comment/`;
  const headers = device.getLigerHeaders('media_comment');
  headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';

  console.log(`[*] Executing 1 SINGLE ATTEMPT to: ${endpoint}`);
  const startTime = Date.now();

  try {
    const response = await transport.request(endpoint, {
      method: 'POST',
      headers,
      body: signedBody,
      timeoutMs: 25000
    });

    const elapsedMs = Date.now() - startTime;
    console.log(`\n[*] Response Status : ${response.status} ${response.statusText} (${elapsedMs}ms)`);
    console.log(`[*] Response Size   : ${response.data?.length || 0} bytes`);

    let parsedResponse: any = null;
    try {
      parsedResponse = JSON.parse(response.data);
    } catch {
      parsedResponse = { raw: response.data.substring(0, 500) };
    }

    console.log('Response Payload Preview:', JSON.stringify(parsedResponse, null, 2));

    const auditData = {
      timestamp: new Date().toISOString(),
      endpoint,
      media_id: cleanMediaId,
      shortcode,
      comment_text: commentText,
      http_status: response.status,
      elapsed_ms: elapsedMs,
      response_data: parsedResponse
    };
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(auditData, null, 2), 'utf-8');

    if (response.status === 200 && parsedResponse?.status === 'ok') {
      console.log('\n======================================================');
      console.log('  🎉 SUCCESS: Mobile Comment Posted Successfully!');
      console.log(`  Comment ID: ${parsedResponse.comment?.pk || parsedResponse.comment?.id}`);
      console.log('======================================================\n');
      updateCircuitBreaker(true, endpoint, response.status, 'Mobile comment posted successfully');
    } else {
      console.warn('\n[!] Server responded with non-ok or error status.');
      updateCircuitBreaker(false, endpoint, response.status, `Server returned status ${response.status}: ${JSON.stringify(parsedResponse)}`);
    }

  } catch (error: any) {
    const elapsedMs = Date.now() - startTime;
    console.error(`\n🚨 Request Failed after ${elapsedMs}ms:`, error.message);
    updateCircuitBreaker(false, endpoint, 0, `Network/Execution error: ${error.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
