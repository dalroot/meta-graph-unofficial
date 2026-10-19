/**
 * SDK Direct Message Send Test (Zero Browser - Pure HTTP Twin)
 * 
 * Tests TwinGraph.sendDirectMessage() using the authentic
 * IGDirectTextSendMutation GraphQL endpoint (doc_id: 26911679871773184).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { TwinGraph } from '../dist/index.js';

const WORKSPACE_DIR = '/home/hokar/Documents/antigravity/hopeful-bell';
const CB_FILE = path.join(WORKSPACE_DIR, 'circuit_breaker.json');
const AUDIT_FILE = path.join(WORKSPACE_DIR, 'scratch/live_sdk_direct_send_audit.json');
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
    tripped: true, // Re-lock after single attempt
    reason: success ? 'Clear - Safe SDK direct message send executed.' : reason,
    last_attempt_at: new Date().toISOString(),
    last_status: status,
    endpoint
  };
  fs.writeFileSync(CB_FILE, JSON.stringify(cb, null, 2), 'utf-8');
}

async function main(): Promise<void> {
  console.log('================================================================');
  console.log('  🚀 SDK DIRECT MESSAGE SEND TEST (ZERO BROWSER - PURE TWIN)');
  console.log('================================================================');
  assertCircuitBreaker();

  const targetThreadFbid = '2102378287099186'; // Conversation with @tawanatallks
  const messageText = 'تست پیام SDK توئین‌گراف - ارسال مستقیم بدون مرورگر';

  console.log(`[*] Target Thread FBID : ${targetThreadFbid}`);
  console.log(`[*] Message Text       : "${messageText}"`);
  console.log(`[*] Session File       : ${SESSION_FILE}`);

  try {
    const tg = new TwinGraph({
      sessionPath: SESSION_FILE,
      offlineMode: false
    });

    console.log('[*] Sending direct message via TwinGraph.sendDirectMessage()...');
    const result = await tg.sendDirectMessage(targetThreadFbid, messageText);

    console.log('\n================================================================');
    console.log('🎉 DIRECT MESSAGE SENT SUCCESSFULLY VIA SDK!');
    console.log('================================================================');
    console.log(`Message ID : ${result.message_id}`);
    console.log(`Thread ID  : ${result.thread_id}`);
    console.log(`Status     : ${result.status}`);
    console.log(`Timestamp  : ${result.timestamp ? new Date(result.timestamp).toISOString() : new Date().toISOString()}`);

    const auditData = {
      timestamp: new Date().toISOString(),
      thread_fbid: targetThreadFbid,
      message_text: messageText,
      result,
      status: 200
    };
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(auditData, null, 2), 'utf-8');
    console.log(`\n[*] Audit written to: ${AUDIT_FILE}`);

    updateCircuitBreaker(true, 'IGDirectTextSendMutation', 200, 'Success');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ SDK Direct Send Failed:', err.message);
    updateCircuitBreaker(false, 'IGDirectTextSendMutation', 500, err.message);
    process.exit(1);
  }
}

main();
