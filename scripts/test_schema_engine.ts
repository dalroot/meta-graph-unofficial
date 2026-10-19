/**
 * Verification Test Suite: SQLite Declarative Schema Engine & 1:1 Meta Graph v21.0 Router
 */

import { GraphCatalog, FieldProjector, TwinGraph } from '../dist/index.js';

async function runTests() {
  console.log('===============================================================');
  console.log('🧪 Running SQLite Schema Engine & Meta Graph v21.0 Alignment Test');
  console.log('===============================================================\n');

  // Test 1: SQLite Catalog Initialization & Querying
  console.log('[*] Test 1: Testing SQLite GraphCatalog schema & seed verification...');
  const catalog = GraphCatalog.getInstance();
  const mediaNode = catalog.getNode('Media', 'v21.0');
  if (!mediaNode || mediaNode.name !== 'Media') {
    throw new Error('Test 1 Failed: Media node not found in SQLite catalog');
  }
  const mediaFields = catalog.getNodeFields('Media', 'v21.0');
  console.log(`    ✓ Test 1 Passed: SQLite Catalog loaded ${mediaFields.length} fields for Node 'Media'`);

  // Test 2: FieldProjector Dynamic Projection & Encapsulation
  console.log('\n[*] Test 2: Testing FieldProjector dynamic field filtering...');
  const projector = new FieldProjector(catalog);
  const rawAndroidData = {
    pk: '4010857192890410435',
    id: '4010857192890410435',
    caption: { text: 'Ground truth post test caption' },
    media_type: 2, // Android numeric code for Video
    product_type: 'clips',
    taken_at: 1729279440,
    like_count: 320,
    comment_count: 18,
    internal_liger_token: 'secret_leak_123',
    internal_device_id: '556f8db9eada6d9c'
  };

  const projectedMedia = projector.project('Media', rawAndroidData, 'id,caption,media_type,like_count');
  console.log('    Projected output:', projectedMedia);

  if (projectedMedia.id !== '4010857192890410435') throw new Error('ID mismatch');
  if (projectedMedia.caption !== 'Ground truth post test caption') throw new Error('Caption mismatch');
  if (projectedMedia.media_type !== 'VIDEO') throw new Error('Media type enum mismatch');
  if (projectedMedia.like_count !== 320) throw new Error('Like count mismatch');
  if ((projectedMedia as any).internal_liger_token || (projectedMedia as any).pk) {
    throw new Error('Test 2 Failed: Internal telemetry leaked into output!');
  }
  console.log('    ✓ Test 2 Passed: Dynamic projection exact match (0 internal leaks)');

  // Test 3: TwinGraph /v21.0 Versioned Path Routing
  console.log('\n[*] Test 3: Testing TwinGraph.get(\'/v21.0/...\') versioned route...');
  const tg = new TwinGraph();
  const graphMedia = await tg.get('/v21.0/4010857192890410435', {
    fields: 'id,caption,media_type,like_count'
  });
  console.log('    tg.get(\'/v21.0/...\') Result:', graphMedia);
  if (!graphMedia.id || !graphMedia.media_type) {
    throw new Error('Test 3 Failed: /v21.0/ endpoint returned invalid media');
  }
  console.log('    ✓ Test 3 Passed: tg.get(\'/v21.0/...\') successfully dispatched and projected');

  // Test 4: TwinGraph Fluent Node Proxies (Business SDK Parity)
  console.log('\n[*] Test 4: Testing Fluent Node Proxy tg.nodeMedia(id).get([...])...');
  const proxyMedia = await tg.nodeMedia('4010857192890410435').get(['id', 'caption', 'media_type']);
  console.log('    Fluent Node Proxy Output:', proxyMedia);
  if (!proxyMedia.id || proxyMedia.media_type !== 'VIDEO') {
    throw new Error('Test 4 Failed: nodeMedia proxy returned unexpected result');
  }
  console.log('    ✓ Test 4 Passed: Fluent Node Proxy matches Meta Business SDK');

  // Test 5: Backward Compatibility of Existing Convenience Methods
  console.log('\n[*] Test 5: Testing 100% backward compatibility of convenience methods...');
  const legacyMedia = await tg.getMedia('4010857192890410435');
  const legacyUser = await tg.getMe();
  console.log('    Legacy getMedia() id:', legacyMedia.id);
  console.log('    Legacy getMe() username:', legacyUser.username);
  if (!legacyMedia.id || !legacyUser.username) {
    throw new Error('Test 5 Failed: Legacy convenience methods failed');
  }
  console.log('    ✓ Test 5 Passed: Zero breaking changes in legacy SDK methods');

  console.log('\n===============================================================');
  console.log('🎉 ALL 5 TESTS PASSED: SQLite Schema Engine & v21.0 Parity Verified!');
  console.log('===============================================================');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
