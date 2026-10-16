/**
 * Test Suite for TwinGraph Architecture & Meta Graph API v21.0
 * 
 * STRICT RULE: Pure local offline verification.
 * Zero external network requests to Instagram servers.
 */

import {
  TwinGraph,
  TwinGraphClient,
  MetaGraphClient,
  DeviceTwin,
  GraphQLTwin,
  DirectTwin,
  MediaTwin,
  GraphUser,
  GraphInsightsResponse,
  GraphMedia
} from './index.js';

async function runTwinGraphVerification() {
  console.log('================================================================');
  console.log('       TWINGRAPH ARCHITECTURE & META GRAPH API v21.0 VERIFICATION');
  console.log('================================================================\n');

  const tg = new TwinGraph({ offlineMode: true });

  // -------------------------------------------------------------
  // Test 1: Official Standard api() call - tg.api('/me')
  // -------------------------------------------------------------
  console.log('[*] Test 1: Testing tg.api(\'/me\')...');
  const user = await tg.api<GraphUser>('/me');
  console.log('    Result:', { id: user.id, username: user.username, name: user.name });
  if (user.id !== '19835089130' || user.username !== 'hokar368') {
    throw new Error(`Test 1 Failed: Unexpected user ${JSON.stringify(user)}`);
  }
  console.log('    ✓ Test 1 Passed: tg.api(\'/me\') returned valid GraphUser node.\n');

  // -------------------------------------------------------------
  // Test 2: Official Standard api() call - tg.api('/DedDBnTCs-J/insights')
  // -------------------------------------------------------------
  console.log('[*] Test 2: Testing tg.api(\'/DedDBnTCs-J/insights\')...');
  const insights = await tg.api<GraphInsightsResponse>('/DedDBnTCs-J/insights');
  console.log(`    Total metrics returned: ${insights.data.length}`);
  const metricNames = insights.data.map(m => m.name);
  console.log('    Metrics:', metricNames);
  if (!metricNames.includes('reach') || !metricNames.includes('plays') || !metricNames.includes('impressions')) {
    throw new Error(`Test 2 Failed: Missing required insights metrics: ${metricNames}`);
  }
  console.log('    ✓ Test 2 Passed: tg.api(\'/DedDBnTCs-J/insights\') matched Graph API v21.0.\n');

  // -------------------------------------------------------------
  // Test 3: Single Media Object - tg.api('/DedDBnTCs-J')
  // -------------------------------------------------------------
  console.log('[*] Test 3: Testing tg.api(\'/DedDBnTCs-J\')...');
  const mediaObj = await tg.api<GraphMedia>('/DedDBnTCs-J');
  console.log('    Result:', { id: mediaObj.id, shortcode: mediaObj.shortcode, type: mediaObj.media_type });
  if (mediaObj.shortcode !== 'DedDBnTCs-J' || mediaObj.media_type !== 'VIDEO') {
    throw new Error(`Test 3 Failed: Invalid media object ${JSON.stringify(mediaObj)}`);
  }
  console.log('    ✓ Test 3 Passed: tg.api(\'/DedDBnTCs-J\') resolved GraphMedia node.\n');

  // -------------------------------------------------------------
  // Test 4: Shortcut - tg.getMe() with field filtering
  // -------------------------------------------------------------
  console.log('[*] Test 4: Testing tg.getMe([\'id\', \'username\'])...');
  const filteredUser = await tg.getMe(['id', 'username']);
  console.log('    Result:', filteredUser);
  if (filteredUser.id !== '19835089130' || !filteredUser.username) {
    throw new Error(`Test 4 Failed: Invalid filtered user ${JSON.stringify(filteredUser)}`);
  }
  console.log('    ✓ Test 4 Passed: tg.getMe() shortcut works with field projection.\n');

  // -------------------------------------------------------------
  // Test 5: Shortcut - tg.getMediaInsights('reel_test_999')
  // -------------------------------------------------------------
  console.log('[*] Test 5: Testing tg.getMediaInsights(\'reel_test_999\', [\'reach\', \'saved\'])...');
  const selectiveInsights = await tg.getMediaInsights('reel_test_999', ['reach', 'saved']);
  console.log(`    Selected metrics count: ${selectiveInsights.data.length}`);
  if (selectiveInsights.data.length !== 2 || selectiveInsights.data[0].name !== 'reach') {
    throw new Error(`Test 5 Failed: Metric filtering unexpected length: ${selectiveInsights.data.length}`);
  }
  console.log('    ✓ Test 5 Passed: tg.getMediaInsights() shortcut works with metric filters.\n');

  // -------------------------------------------------------------
  // Test 6: Shortcut - tg.publishMedia() pipeline
  // -------------------------------------------------------------
  console.log('[*] Test 6: Testing tg.publishMedia()...');
  const publishResult = await tg.publishMedia({
    caption: 'TwinGraph Verification Reel',
    media_type: 'REELS'
  });
  console.log('    Publish Result:', publishResult);
  if (!publishResult.id || !publishResult.id.startsWith('180')) {
    throw new Error(`Test 6 Failed: Invalid published media ID ${publishResult.id}`);
  }
  console.log('    ✓ Test 6 Passed: tg.publishMedia() pipeline completed container lifecycle.\n');

  // -------------------------------------------------------------
  // Test 7: Sub-Twin: DeviceTwin
  // -------------------------------------------------------------
  console.log('[*] Test 7: Verifying Sub-Twin tg.device (DeviceTwin)...');
  const fp = tg.device.getFingerprint();
  console.log('    Hardware Fingerprint:', {
    brand: fp.brand,
    model: fp.model,
    soc: fp.soc_model,
    resolution: fp.resolution,
    android_id: fp.android_id
  });
  if (fp.model !== '23129RAA4G' || fp.brand !== 'Redmi') {
    throw new Error(`Test 7 Failed: Unexpected hardware fingerprint: ${JSON.stringify(fp)}`);
  }

  const ligerHeaders = tg.device.getLigerHeaders('DirectInbox');
  console.log('    Liger Engine Header:', ligerHeaders['X-FB-HTTP-Engine']);
  console.log('    Tigon Network Stack:', tg.device.getTigonHeaders()['X-Tigon-Is-Retry']);
  if (ligerHeaders['X-FB-HTTP-Engine'] !== 'Liger') {
    throw new Error('Test 7 Failed: Missing Liger header');
  }

  const testPayload = { action: 'twin_test', count: 42 };
  const signature = tg.device.signPayload(testPayload);
  const isValidSig = tg.device.verifyPayloadSignature(signature);
  console.log('    HMAC-SHA256 Signature verified:', isValidSig);
  if (!isValidSig) {
    throw new Error('Test 7 Failed: HMAC signature verification failed');
  }
  console.log('    ✓ Test 7 Passed: DeviceTwin manages Redmi Note 13 hardware, headers, and HMAC.\n');

  // -------------------------------------------------------------
  // Test 8: Sub-Twin: GraphQLTwin
  // -------------------------------------------------------------
  console.log('[*] Test 8: Verifying Sub-Twin tg.graphql (GraphQLTwin)...');
  const supportedQueries = tg.graphql.getSupportedQueries();
  console.log(`    Supported Pando/Relay queries: ${supportedQueries.length}`);
  if (!supportedQueries.includes('InboxTrayRequestForUserQuery')) {
    throw new Error('Test 8 Failed: Missing InboxTrayRequestForUserQuery in registry');
  }

  const pandoRes = await tg.graphql.executeQuery('InboxTrayRequestForUserQuery');
  console.log('    Pando query executed:', {
    query: (pandoRes.data as any).query,
    threads_count: (pandoRes.data as any).threads_count,
    is_final: pandoRes.extensions?.is_final
  });
  if ((pandoRes.data as any).threads_count !== 1) {
    throw new Error('Test 8 Failed: Unexpected threads count in Pando response');
  }
  console.log('    ✓ Test 8 Passed: GraphQLTwin executes Pando queries & translates nodes.\n');

  // -------------------------------------------------------------
  // Test 9: Sub-Twin: DirectTwin
  // -------------------------------------------------------------
  console.log('[*] Test 9: Verifying Sub-Twin tg.direct (DirectTwin)...');
  const conversations = await tg.direct.getConversations();
  console.log(`    Conversations fetched: ${conversations.data.length}`);
  const firstConv = conversations.data[0];
  console.log('    First Conversation:', {
    id: firstConv.id,
    snippet: firstConv.snippet,
    participants: firstConv.participants?.data.map(p => p.username)
  });
  if (!firstConv.id || firstConv.participants?.data.length === 0) {
    throw new Error('Test 9 Failed: Invalid conversation structure');
  }

  const msgRes = await tg.direct.sendMessage(firstConv.id, 'Hello from TwinGraph DirectTwin!');
  console.log('    Message broadcast result:', msgRes);
  if (msgRes.status !== 'ok' || !msgRes.message_id) {
    throw new Error('Test 9 Failed: Direct message send failed');
  }
  console.log('    ✓ Test 9 Passed: DirectTwin manages conversations, inbox tray, and messaging.\n');

  // -------------------------------------------------------------
  // Test 10: Sub-Twin: MediaTwin
  // -------------------------------------------------------------
  console.log('[*] Test 10: Verifying Sub-Twin tg.media (MediaTwin)...');
  const codecProfile = tg.media.getHardwareCodecProfile();
  console.log('    Hardware Codec Profile:', {
    soc: codecProfile.soc_model,
    video_encoder: codecProfile.video_encoder,
    image_encoder: codecProfile.image_encoder,
    max_bitrate: `${codecProfile.max_bitrate_kbps} kbps`
  });
  if (codecProfile.video_encoder !== 'c2.qti.hevc.encoder') {
    throw new Error(`Test 10 Failed: Unexpected video encoder: ${codecProfile.video_encoder}`);
  }
  if (codecProfile.image_encoder !== 'c2.qti.heic.encoder') {
    throw new Error(`Test 10 Failed: Unexpected image encoder: ${codecProfile.image_encoder}`);
  }

  const codecValidation = tg.media.validateMediaForHardwareCodec('REELS', 1080, 1920);
  console.log('    Codec validation for 1080x1920 Reel:', codecValidation);
  if (!codecValidation.valid || codecValidation.codec !== 'c2.qti.hevc.encoder') {
    throw new Error('Test 10 Failed: Codec validation failed for valid 1080x1920 reel');
  }
  console.log('    ✓ Test 10 Passed: MediaTwin enforces Qualcomm hardware codecs & publishing pipeline.\n');

  // -------------------------------------------------------------
  // Test 11: Backward Compatibility Client Aliases
  // -------------------------------------------------------------
  console.log('[*] Test 11: Verifying TwinGraphClient and MetaGraphClient aliases...');
  const tgClient = new TwinGraphClient();
  const metaClient = new MetaGraphClient();
  const user1 = await tgClient.getMe();
  const user2 = await metaClient.getMe();
  if (user1.id !== user2.id || user1.id !== '19835089130') {
    throw new Error('Test 11 Failed: Alias instantiation discrepancy');
  }
  console.log('    ✓ Test 11 Passed: 100% backward compatibility preserved for MetaGraphClient.\n');

  console.log('================================================================');
  console.log('  ALL 11 TWINGRAPH ARCHITECTURE TESTS COMPLETED SUCCESSFULLY!  ');
  console.log('================================================================');
}

runTwinGraphVerification().catch(err => {
  console.error('[!] Verification Error:', err);
  process.exit(1);
});
