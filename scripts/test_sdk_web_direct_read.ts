/**
 * SDK Direct Web Thread Reading Test (Zero Browser - Pure HTTP Twin)
 * 
 * Tests TwinGraph.getThreadMessages() using the authentic
 * IGDThreadDetailQuery GraphQL endpoint (doc_id: 29613940454875963).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { TwinGraph } from '../dist/index.js';

const WORKSPACE_DIR = '/home/hokar/Documents/antigravity/hopeful-bell';
const CB_FILE = path.join(WORKSPACE_DIR, 'circuit_breaker.json');
const AUDIT_FILE = path.join(WORKSPACE_DIR, 'scratch/live_sdk_direct_read_audit.json');
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
    tripped: true, // Always re-lock after 1-attempt
    reason: success ? 'Clear - Safe SDK direct thread reading executed.' : reason,
    last_attempt_at: new Date().toISOString(),
    last_status: status,
    endpoint
  };
  fs.writeFileSync(CB_FILE, JSON.stringify(cb, null, 2), 'utf-8');
}

async function main(): Promise<void> {
  console.log('================================================================');
  console.log('  📬 SDK DIRECT THREAD READING TEST (ZERO BROWSER - PURE TWIN)');
  console.log('================================================================');
  assertCircuitBreaker();

  const targetThreadFbid = '2102378287099186'; // Conversation with @tawanatallks

  console.log(`[*] Target Thread FBID : ${targetThreadFbid}`);
  console.log(`[*] Session File       : ${SESSION_FILE}`);

  try {
    const tg = new TwinGraph({
      sessionPath: SESSION_FILE,
      offlineMode: false
    });

    console.log('[*] Fetching thread messages via TwinGraph.getThreadMessages()...');
    const thread = await tg.getThreadMessages(targetThreadFbid, { limit: 10 });

    console.log('\n================================================================');
    console.log('🎉 DIRECT THREAD MESSAGES RETRIEVED SUCCESSFULLY!');
    console.log('================================================================');
    console.log(`Thread ID      : ${thread.id}`);
    console.log(`Total Messages : ${thread.message_count}`);
    console.log('Messages:');

    const messages = thread.messages?.data || [];
    messages.forEach((m, idx) => {
      console.log(`  [${idx + 1}] [${m.created_time}] ${m.from?.username}: ${m.message}`);
    });

    const auditData = {
      timestamp: new Date().toISOString(),
      thread_fbid: targetThreadFbid,
      message_count: thread.message_count,
      messages: thread.messages?.data,
      status: 200
    };
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(auditData, null, 2), 'utf-8');
    console.log(`\n[*] Audit written to: ${AUDIT_FILE}`);

    updateCircuitBreaker(true, 'IGDThreadDetailQuery', 200, 'Success');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ SDK Direct Read Failed:', err.message);
    updateCircuitBreaker(false, 'IGDThreadDetailQuery', 500, err.message);
    process.exit(1);
  }
}

main();
