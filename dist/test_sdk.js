/**
 * End-to-End Verification Test for Meta Graph API v21.0 TypeScript SDK & Server
 */
import { createGraphServer } from './server.js';
import { MetaGraphClient } from './client.js';
async function runTestSuite() {
    console.log('=== STARTING META GRAPH API v21.0 TEST SUITE ===');
    const server = createGraphServer();
    await new Promise((resolve) => {
        server.listen(8080, () => {
            console.log('[*] Test server listening on http://localhost:8080');
            resolve();
        });
    });
    const client = new MetaGraphClient({
        baseUrl: 'http://localhost:8080',
        apiVersion: 'v21.0'
    });
    try {
        // 1. Test /me
        console.log('\n--- Test 1: Fetching /me ---');
        const me = await client.getMe();
        console.log('User node:', me);
        if (me.id !== '19835089130' || me.username !== 'hokar368') {
            throw new Error(`Unexpected user data: ${JSON.stringify(me)}`);
        }
        console.log('Test 1 PASSED: /me returned verified user identity');
        // 2. Test /{media_id}/insights
        console.log('\n--- Test 2: Fetching /{media_id}/insights ---');
        const insights = await client.getMediaInsights('reel_12345');
        console.log(`Insights metrics count: ${insights.data.length}`);
        const metricsNames = insights.data.map(m => m.name);
        console.log('Metric keys:', metricsNames);
        if (!metricsNames.includes('reach') || !metricsNames.includes('plays')) {
            throw new Error(`Missing expected metrics: ${metricsNames}`);
        }
        console.log('Test 2 PASSED: /{media_id}/insights conforms to Graph API v21.0');
        // 3. Test /{user_id}/media
        console.log('\n--- Test 3: Publishing media container ---');
        const pub = await client.publishMedia({ caption: 'Digital Twin Verification Reel' });
        console.log('Publish result:', pub);
        if (!pub.id || !pub.id.startsWith('180')) {
            throw new Error(`Unexpected publish ID: ${pub.id}`);
        }
        console.log('Test 3 PASSED: /{user_id}/media published successfully');
        // 4. Test direct raw HTTP fetch to Proxy Server
        console.log('\n--- Test 4: Direct HTTP Request to Proxy Server ---');
        const rawResp = await fetch('http://localhost:8080/v21.0/me');
        const rawJson = await rawResp.json();
        console.log('Direct HTTP Response:', rawJson);
        if (rawResp.status !== 200 || rawJson.username !== 'hokar368') {
            throw new Error(`Direct HTTP request failed: status ${rawResp.status}`);
        }
        console.log('Test 4 PASSED: Proxy server answered with HTTP 200');
        console.log('\n=======================================================');
        console.log('ALL META GRAPH API v21.0 TESTS PASSED WITH 100% SUCCESS!');
        console.log('=======================================================');
    }
    finally {
        server.close();
        console.log('[*] Test server closed cleanly.');
    }
}
runTestSuite().catch(err => {
    console.error('[!] Test suite failed:', err);
    process.exit(1);
});
