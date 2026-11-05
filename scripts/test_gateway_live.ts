/**
 * End-to-End Live Integration Test for TwinGatewayServer & API Key Auth
 */

import { TwinGraph } from '../dist/twin_graph.js';
import { ApiKeyManager } from '../dist/auth/api_key_manager.js';
import { TwinGatewayServer } from '../dist/gateway/gateway_server.js';

async function runGatewayTests() {
  console.log('===============================================================');
  console.log('🚀 TESTING TWINGRAPH HTTP GATEWAY (Meta Graph API v21.0 Wire)');
  console.log('===============================================================\n');

  const tg = new TwinGraph({ offlineMode: true });
  const keyManager = new ApiKeyManager();

  // Create isolated keys for testing
  const masterKey = keyManager.createKey('Test-Master', 'master');
  const freeKey = keyManager.createKey('Test-Free-Limited', 'free', { dailyLimit: 2 });

  const PORT = 3888;
  const server = new TwinGatewayServer({
    port: PORT,
    router: tg.router,
    keyManager
  });

  const baseUrl = await server.start();
  console.log(`[+] TwinGatewayServer running live on: ${baseUrl}\n`);

  try {
    // Test 1: Health check
    console.log('[*] Test 1: Testing GET /health...');
    const res1 = await fetch(`${baseUrl}/health`);
    const data1 = await res1.json();
    if (res1.status !== 200 || data1.status !== 'ok') {
      throw new Error(`Test 1 Failed: ${JSON.stringify(data1)}`);
    }
    console.log(`    ✓ Test 1 Passed: HTTP ${res1.status} - Gateway is healthy.\n`);

    // Test 2: Request without token (Must return Meta OAuthException 401)
    console.log('[*] Test 2: Testing GET /v21.0/me WITHOUT token (Expect HTTP 401)...');
    const res2 = await fetch(`${baseUrl}/v21.0/me`);
    const data2 = await res2.json();
    if (res2.status !== 401 || data2.error?.code !== 190) {
      throw new Error(`Test 2 Failed: Expected 401 code 190, got ${res2.status}`);
    }
    console.log('    Response Error Payload:', data2);
    console.log(`    ✓ Test 2 Passed: Rejected unauthenticated request with Meta 401.\n`);

    // Test 3: Request with invalid token (Must return Meta 401 signature error)
    console.log('[*] Test 3: Testing GET /v21.0/me with INVALID token (Expect HTTP 401)...');
    const res3 = await fetch(`${baseUrl}/v21.0/me?access_token=tg_live_invalid_1234567890`);
    const data3 = await res3.json();
    if (res3.status !== 401 || data3.error?.code !== 190) {
      throw new Error(`Test 3 Failed: Expected 401, got ${res3.status}`);
    }
    console.log(`    ✓ Test 3 Passed: Rejected invalid signature token.\n`);

    // Test 4: Request with Master Key via Query Parameter (Expect HTTP 200)
    console.log('[*] Test 4: Testing GET /v21.0/me with MASTER key in URL (?access_token=...)...');
    const res4 = await fetch(`${baseUrl}/v21.0/me?access_token=${masterKey.rawKey}&fields=id,username,name`);
    const data4 = await res4.json();
    if (res4.status !== 200 || !data4.id || !data4.username) {
      throw new Error(`Test 4 Failed: Expected 200 with user data, got ${res4.status} ${JSON.stringify(data4)}`);
    }
    console.log('    Output Payload:', data4);
    console.log(`    X-TwinGraph-Role: ${res4.headers.get('x-twingraph-role')}`);
    console.log(`    ✓ Test 4 Passed: Master key granted instant 200 OK access.\n`);

    // Test 5: Request with Master Key via Authorization: Bearer Header (Expect HTTP 200)
    console.log('[*] Test 5: Testing GET /v21.0/me with MASTER key in Header (Authorization: Bearer)...');
    const res5 = await fetch(`${baseUrl}/v21.0/me?fields=id,username`, {
      headers: {
        'Authorization': `Bearer ${masterKey.rawKey}`
      }
    });
    const data5 = await res5.json();
    if (res5.status !== 200 || !data5.id) {
      throw new Error(`Test 5 Failed: Expected 200, got ${res5.status}`);
    }
    console.log(`    ✓ Test 5 Passed: Header Bearer auth succeeded.\n`);

    // Test 6: Media Node and dynamic field projection via Gateway
    console.log('[*] Test 6: Testing GET /v21.0/4010857192890410435?fields=id,caption,media_type...');
    const res6 = await fetch(`${baseUrl}/v21.0/4010857192890410435?fields=id,caption,media_type`, {
      headers: { 'Authorization': `Bearer ${masterKey.rawKey}` }
    });
    const data6 = await res6.json();
    if (res6.status !== 200 || data6.media_type !== 'VIDEO') {
      throw new Error(`Test 6 Failed: ${JSON.stringify(data6)}`);
    }
    console.log('    Clean Media Output:', data6);
    console.log(`    ✓ Test 6 Passed: Dynamic field projection returned clean v21.0 shape.\n`);

    // Test 7: Rate Limit Quota Enforcement on Free Key (Daily Limit = 2)
    console.log('[*] Test 7: Testing Free Key Quota Enforcement (Daily Limit = 2)...');
    
    // Call 1: OK
    const q1 = await fetch(`${baseUrl}/v21.0/me?access_token=${freeKey.rawKey}`);
    console.log(`    Request 1: HTTP ${q1.status} (Remaining: ${q1.headers.get('x-twingraph-remaining-today')})`);
    if (q1.status !== 200) throw new Error('Quota Request 1 should be 200');

    // Call 2: OK
    const q2 = await fetch(`${baseUrl}/v21.0/me?access_token=${freeKey.rawKey}`);
    console.log(`    Request 2: HTTP ${q2.status} (Remaining: ${q2.headers.get('x-twingraph-remaining-today')})`);
    if (q2.status !== 200) throw new Error('Quota Request 2 should be 200');

    // Call 3: Exceeded -> Expect HTTP 429
    const q3 = await fetch(`${baseUrl}/v21.0/me?access_token=${freeKey.rawKey}`);
    const q3Data = await q3.json();
    console.log(`    Request 3 (Exceeded): HTTP ${q3.status}`, q3Data);
    if (q3.status !== 429 || q3Data.error?.code !== 17) {
      throw new Error(`Test 7 Failed: Expected 429 code 17, got ${q3.status}`);
    }
    console.log(`    ✓ Test 7 Passed: Tiered quota enforcement blocked request with Meta 429.\n`);

  } finally {
    await server.stop();
    keyManager.close();
    console.log('[-] TwinGatewayServer stopped gracefully.');
  }

  console.log('===============================================================');
  console.log('🎉 ALL 7 GATEWAY & AUTH INTEGRATION TESTS PASSED WITH 100% SUCCESS');
  console.log('===============================================================');
}

runGatewayTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
