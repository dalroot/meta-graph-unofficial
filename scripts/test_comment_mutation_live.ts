/**
 * Meta Graph Unofficial — Live Mobile-Native Comment Post Test Runner
 * 
 * Strict Guardrails (AGENTS.md & Rule Zero):
 * 1. ZERO GUESSWORK & ZERO DEPRECATED ENDPOINTS:
 *    Backed 100% by raw telemetry from physical Redmi Note 13 4G:
 *    - Line 441786 in evidence/raw_telemetry/instagram/instagram_session_2_deep_stream.log
 *    - View ID: layout_comment_thread_post_button_icon (handler X.0GYp)
 *    - Module: comments_v2_clips_viewer_serp_top_minor_unit
 * 2. Mandatory Circuit Breaker Enforcement: Pre-flight check & post-flight lock.
 * 3. 1 Single Live Attempt only (No retry loops).
 * 4. 100% TypeScript SDK Execution (TwinGraph.postComment).
 * 5. Structured audit log saved to scratch/live_mobile_comment_audit.json.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { TwinGraph } from '../dist/twin_graph.js';

const WORKSPACE_DIR = '/home/hokar/Documents/antigravity/hopeful-bell';
const CB_FILE = path.join(WORKSPACE_DIR, 'circuit_breaker.json');
const AUDIT_FILE = path.join(WORKSPACE_DIR, 'scratch/live_mobile_comment_audit.json');

function checkCircuitBreaker(): void {
  if (fs.existsSync(CB_FILE)) {
    const cb = JSON.parse(fs.readFileSync(CB_FILE, 'utf-8'));
    if (cb.tripped) {
      console.error(`\n🚨 [CIRCUIT BREAKER] Tripped: ${cb.reason}. Execution halted.`);
      process.exit(1);
    }
  }
}

function updateCircuitBreaker(success: boolean, endpoint: string, status: number, reason: string): void {
  const cb = {
    tripped: !success,
    reason: success ? 'Clear - Safe mobile comment posting executed.' : reason,
    last_attempt_at: new Date().toISOString(),
    last_status: status,
    endpoint
  };
  fs.writeFileSync(CB_FILE, JSON.stringify(cb, null, 2), 'utf-8');
}

async function main(): Promise<void> {
  console.log('================================================================');
  console.log('    TWINGRAPH SDK v21.0 - LIVE MOBILE COMMENT EXECUTION (1-SHOT)');
  console.log('================================================================');

  // Pre-flight check
  checkCircuitBreaker();

  const shortcode = 'DepbV3TDaXD';
  const cleanMediaId = '4010857192890410435';
  const commentMessage = 'تست هوشمند توئین‌گراف';

  console.log(`[*] Target Media ID   : ${cleanMediaId} (shortcode: ${shortcode})`);
  console.log(`[*] Comment Text      : "${commentMessage}"`);
  console.log(`[*] Telemetry Citation: Line 441786 (layout_comment_thread_post_button_icon)`);

  const tg = new TwinGraph();

  console.log(`[*] Authenticated User: @${tg.device.getUsername()} (ID: ${tg.device.getUserId()})`);
  console.log(`[*] Device Model      : ${tg.device.getFingerprint().brand} ${tg.device.getFingerprint().model}`);

  const startTime = Date.now();
  let result: any = null;
  let success = false;
  let httpStatus = 0;
  let errorMsg = '';

  try {
    console.log(`[*] Dispatched single attempt via tg.postComment('${cleanMediaId}', ...)...`);
    result = await tg.postComment(cleanMediaId, commentMessage);
    const elapsedMs = Date.now() - startTime;
    success = true;
    httpStatus = 200;

    console.log(`\n✅ Comment successfully posted in ${elapsedMs}ms!`);
    console.log('Result:', JSON.stringify(result, null, 2));

    updateCircuitBreaker(true, `POST /api/v1/media/${cleanMediaId}/comment/`, 200, 'Success');
  } catch (err: any) {
    const elapsedMs = Date.now() - startTime;
    errorMsg = err.message || String(err);
    console.error(`\n❌ Comment posting failed in ${elapsedMs}ms:`, errorMsg);

    const match = errorMsg.match(/HTTP\s+(\d+)/);
    httpStatus = match ? parseInt(match[1], 10) : 500;

    updateCircuitBreaker(false, `POST /api/v1/media/${cleanMediaId}/comment/`, httpStatus, errorMsg);
  }

  const scratchDir = path.dirname(AUDIT_FILE);
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  const auditPayload = {
    executed_at: new Date().toISOString(),
    single_attempt: true,
    telemetry_citation: 'Line 441786 (instagram_session_2_deep_stream.log)',
    target_media: {
      media_id: cleanMediaId,
      shortcode
    },
    comment_text: commentMessage,
    success,
    http_status: httpStatus,
    elapsed_ms: Date.now() - startTime,
    result: result || null,
    error: errorMsg || null
  };

  fs.writeFileSync(AUDIT_FILE, JSON.stringify(auditPayload, null, 2), 'utf-8');
  console.log(`[*] Audit log written to: ${AUDIT_FILE}`);

  if (!success) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
