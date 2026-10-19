/**
 * SDK Direct Web Comment Test (Zero Browser - Pure HTTP Twin)
 * 
 * Tests TwinGraph.web.postComment() directly using the verified
 * PolarisPostCommentInputRevampedMutation GraphQL endpoint.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { TwinGraph } from '../dist/index.js';

const WORKSPACE_DIR = '/home/hokar/Documents/antigravity/hopeful-bell';
const CB_FILE = path.join(WORKSPACE_DIR, 'circuit_breaker.json');
const AUDIT_FILE = path.join(WORKSPACE_DIR, 'scratch/live_sdk_web_comment_audit.json');
const SESSION_FILE = path.join(WORKSPACE_DIR, 'instagram_session.json');

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
    tripped: true, // Re-lock after 1-attempt
    reason: success ? 'Clear - Safe SDK direct web comment executed.' : reason,
    last_attempt_at: new Date().toISOString(),
    last_status: status,
    endpoint
  };
  fs.writeFileSync(CB_FILE, JSON.stringify(cb, null, 2), 'utf-8');
}

async function main(): Promise<void> {
  console.log('================================================================');
  console.log('  🚀 SDK DIRECT WEB COMMENT TEST (ZERO BROWSER - PURE TWIN)');
  console.log('================================================================');
  assertCircuitBreaker();

  const shortcode = 'DepbV3TDaXD';
  const cleanMediaId = '4010857192890410435';
  const commentText = 'تست SDK توئین‌گراف - ارسال مستقیم بدون مرورگر';

  console.log(`[*] Target Media ID   : ${cleanMediaId} (shortcode: ${shortcode})`);
  console.log(`[*] Comment Text      : "${commentText}"`);
  console.log(`[*] Session File      : ${SESSION_FILE}`);

  try {
    const tg = new TwinGraph({
      sessionPath: SESSION_FILE,
      offlineMode: false
    });

    console.log('[*] Posting comment via TwinGraph.web.postComment()...');
    const comment = await tg.web.postComment(cleanMediaId, commentText, { shortcode });

    console.log('\n================================================================');
    console.log('🎉 SDK COMMENT POSTED SUCCESSFULLY!');
    console.log('================================================================');
    console.log(`Comment ID : ${comment.id}`);
    console.log(`Text       : ${comment.text}`);
    console.log(`Author     : @${comment.from?.username} (UID: ${comment.from?.id})`);
    console.log(`Status     : ${comment.status}`);

    const auditData = {
      timestamp: new Date().toISOString(),
      media_id: cleanMediaId,
      shortcode,
      comment,
      status: 200
    };
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(auditData, null, 2), 'utf-8');
    console.log(`[*] Audit written to: ${AUDIT_FILE}`);

    updateCircuitBreaker(true, 'PolarisPostCommentInputRevampedMutation', 200, 'Success');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ SDK Comment Post Failed:', err.message);
    updateCircuitBreaker(false, 'PolarisPostCommentInputRevampedMutation', 500, err.message);
    process.exit(1);
  }
}

main();
