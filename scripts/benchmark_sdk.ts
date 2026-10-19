import { TwinGraph } from '../ts_src/twin_graph.js';
import { FieldProjector } from '../ts_src/schema/field_projector.js';
import { performance } from 'node:perf_hooks';

async function runBenchmark() {
  console.log('===============================================================');
  console.log('⚡ TWINGRAPH SDK CURRENT ENGINE BENCHMARK (Node.js 24 + SQLite)');
  console.log('===============================================================');

  const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`[Memory] Initial Heap: ${initialMemory.toFixed(2)} MB`);

  const tg = new TwinGraph({ offlineMode: true });

  const afterInitMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`[Memory] Heap after TwinGraph + SQLite in-memory init: ${afterInitMemory.toFixed(2)} MB`);
  console.log(`[Memory] SQLite Schema & Router Footprint: ${(afterInitMemory - initialMemory).toFixed(2)} MB`);

  // 1. Benchmark: Schema lookup & Field Projector directly (10,000 iterations)
  const ITERS = 10000;
  console.log(`\n--- Test 1: SQLite Catalog & Field Projector (${ITERS.toLocaleString()} ops) ---`);
  
  const projector = new FieldProjector(tg.catalog);
  const rawData = {
    pk: '4010857192890410435',
    id: '4010857192890410435',
    caption: { text: 'Benchmark caption test' },
    media_type: 2,
    like_count: 520,
    comment_count: 14,
    taken_at: 1729450000,
    internal_liger_token: 'should_be_stripped'
  };

  const t0 = performance.now();
  for (let i = 0; i < ITERS; i++) {
    projector.project('Media', rawData, 'id,caption,media_type,like_count');
  }
  const t1 = performance.now();
  const totalMs1 = t1 - t0;
  const avgUs1 = (totalMs1 / ITERS) * 1000; // microseconds
  const opsSec1 = Math.round((ITERS / totalMs1) * 1000);

  console.log(`Total Time: ${totalMs1.toFixed(2)} ms`);
  console.log(`Average Latency per projection: ${avgUs1.toFixed(2)} µs (microseconds) = ${(avgUs1 / 1000).toFixed(4)} ms`);
  console.log(`Throughput: ${opsSec1.toLocaleString()} ops/sec`);

  // 2. Benchmark: GraphRouter Dispatch (/v21.0/...) (2,000 iterations)
  const ROUTER_ITERS = 2000;
  console.log(`\n--- Test 2: GraphRouter.dispatch('/v21.0/me') (${ROUTER_ITERS.toLocaleString()} ops) ---`);
  
  const t2 = performance.now();
  for (let i = 0; i < ROUTER_ITERS; i++) {
    await tg.get('/v21.0/me', { fields: 'id,username,name' });
  }
  const t3 = performance.now();
  const totalMs2 = t3 - t2;
  const avgMs2 = totalMs2 / ROUTER_ITERS;
  const opsSec2 = Math.round((ROUTER_ITERS / totalMs2) * 1000);

  console.log(`Total Time: ${totalMs2.toFixed(2)} ms`);
  console.log(`Average Latency per route dispatch: ${avgMs2.toFixed(4)} ms`);
  console.log(`Throughput: ${opsSec2.toLocaleString()} ops/sec`);

  // 3. Benchmark: Fluent Node Proxy tg.nodeMedia(id).get([...]) (2,000 iterations)
  console.log(`\n--- Test 3: Fluent Node Proxy tg.nodeMedia(id).get() (${ROUTER_ITERS.toLocaleString()} ops) ---`);
  
  const media = tg.nodeMedia('4010857192890410435');
  const t4 = performance.now();
  for (let i = 0; i < ROUTER_ITERS; i++) {
    await media.get(['id', 'caption', 'media_type']);
  }
  const t5 = performance.now();
  const totalMs3 = t5 - t4;
  const avgMs3 = totalMs3 / ROUTER_ITERS;
  const opsSec3 = Math.round((ROUTER_ITERS / totalMs3) * 1000);

  console.log(`Total Time: ${totalMs3.toFixed(2)} ms`);
  console.log(`Average Latency per proxy call: ${avgMs3.toFixed(4)} ms`);
  console.log(`Throughput: ${opsSec3.toLocaleString()} ops/sec`);

  // Final Memory Check
  const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`\n[Memory] Final Heap: ${finalMemory.toFixed(2)} MB (Memory Delta: ${(finalMemory - afterInitMemory).toFixed(2)} MB)`);
  console.log('===============================================================');
  console.log('🎉 BENCHMARK COMPLETED SUCCESSFULLY');
  console.log('===============================================================');
}

runBenchmark().catch(console.error);
