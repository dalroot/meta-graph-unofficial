/**
 * Benchmark for TwinGatewayServer (HTTP Wire Protocol + API Key Auth)
 * Compares directly against the baseline SDK in-memory performance.
 */

import { TwinGraph } from '../ts_src/twin_graph.js';
import { ApiKeyManager } from '../ts_src/auth/api_key_manager.js';
import { TwinGatewayServer } from '../ts_src/gateway/gateway_server.js';
import { performance } from 'node:perf_hooks';

async function runGatewayBenchmark() {
  console.log('===============================================================');
  console.log('⚡ TWINGRAPH HTTP GATEWAY BENCHMARK (Real HTTP Wire + Auth)');
  console.log('===============================================================\n');

  const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`[Memory] Initial Heap: ${initialMemory.toFixed(2)} MB`);

  const tg = new TwinGraph({ offlineMode: true });
  const keyManager = new ApiKeyManager();

  // Generate a dedicated benchmark key
  const benchKey = keyManager.createKey('Benchmark-Runner', 'master');

  const PORT = 3889;
  const server = new TwinGatewayServer({
    port: PORT,
    router: tg.router,
    keyManager
  });

  const baseUrl = await server.start();
  const afterInitMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`[Memory] Heap after Gateway Server Start: ${afterInitMemory.toFixed(2)} MB`);
  console.log(`[Memory] Gateway Server Footprint: ${(afterInitMemory - initialMemory).toFixed(2)} MB`);
  console.log(`[+] Server listening on: ${baseUrl}`);

  try {
    // -------------------------------------------------------------
    // Test 1: Full HTTP Wire Benchmark: GET /v21.0/me (2,000 requests)
    // Measures: TCP Handshake + HTTP Parse + SHA-256 Key Auth + DB Query + Router + JSON Serialize
    // -------------------------------------------------------------
    const ITERS = 2000;
    console.log(`\n--- Test 1: HTTP Wire GET /v21.0/me (${ITERS.toLocaleString()} real HTTP requests) ---`);

    const targetUrl1 = `${baseUrl}/v21.0/me?access_token=${benchKey.rawKey}&fields=id,username,name`;

    // Warm-up 10 requests
    for (let w = 0; w < 10; w++) {
      await fetch(targetUrl1);
    }

    const t0 = performance.now();
    for (let i = 0; i < ITERS; i++) {
      const res = await fetch(targetUrl1);
      if (res.status !== 200) throw new Error(`Unexpected status ${res.status}`);
    }
    const t1 = performance.now();
    const totalMs1 = t1 - t0;
    const avgMs1 = totalMs1 / ITERS;
    const opsSec1 = Math.round((ITERS / totalMs1) * 1000);

    console.log(`Total Time: ${totalMs1.toFixed(2)} ms`);
    console.log(`Average Latency per HTTP request: ${avgMs1.toFixed(4)} ms`);
    console.log(`Throughput (Requests/sec): ${opsSec1.toLocaleString()} req/sec`);

    // -------------------------------------------------------------
    // Test 2: Full HTTP Wire Benchmark: Media Node with Dynamic Field Projection
    // GET /v21.0/4010857192890410435?fields=id,caption,media_type
    // -------------------------------------------------------------
    console.log(`\n--- Test 2: HTTP Wire GET /v21.0/{mediaId} with Field Projection (${ITERS.toLocaleString()} reqs) ---`);
    const targetUrl2 = `${baseUrl}/v21.0/4010857192890410435?fields=id,caption,media_type&access_token=${benchKey.rawKey}`;

    const t2 = performance.now();
    for (let i = 0; i < ITERS; i++) {
      const res = await fetch(targetUrl2);
      if (res.status !== 200) throw new Error(`Unexpected status ${res.status}`);
    }
    const t3 = performance.now();
    const totalMs2 = t3 - t2;
    const avgMs2 = totalMs2 / ITERS;
    const opsSec2 = Math.round((ITERS / totalMs2) * 1000);

    console.log(`Total Time: ${totalMs2.toFixed(2)} ms`);
    console.log(`Average Latency per HTTP request: ${avgMs2.toFixed(4)} ms`);
    console.log(`Throughput (Requests/sec): ${opsSec2.toLocaleString()} req/sec`);

    // Memory footprint after heavy benchmark
    const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`\n[Memory] Final Heap after 4,000 HTTP requests: ${finalMemory.toFixed(2)} MB`);
    console.log(`[Memory] Heap Delta: ${(finalMemory - afterInitMemory).toFixed(2)} MB`);

    console.log('\n===============================================================');
    console.log('🎉 HTTP GATEWAY BENCHMARK COMPLETED SUCCESSFULLY');
    console.log('===============================================================');

    return {
      gatewayUser: { latencyMs: avgMs1, rps: opsSec1 },
      gatewayMedia: { latencyMs: avgMs2, rps: opsSec2 },
      memory: { initial: initialMemory, final: finalMemory }
    };
  } finally {
    await server.stop();
    keyManager.close();
  }
}

runGatewayBenchmark().catch(console.error);
