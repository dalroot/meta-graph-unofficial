#!/usr/bin/env node
/**
 * Standalone Runner for Meta Graph Unofficial Drop-in Gateway Server
 * 
 * Usage:
 *   npx tsx scripts/start_gateway.ts [--port 3000] [--host 127.0.0.1]
 */

import { TwinGraph } from '../ts_src/twin_graph.js';
import { ApiKeyManager } from '../ts_src/auth/api_key_manager.js';
import { TwinGatewayServer } from '../ts_src/gateway/gateway_server.js';

function parsePort(): number {
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    return parseInt(process.argv[portArgIdx + 1], 10);
  }
  return parseInt(process.env.PORT || '3000', 10);
}

function parseHost(): string {
  const hostArgIdx = process.argv.indexOf('--host');
  if (hostArgIdx !== -1 && process.argv[hostArgIdx + 1]) {
    return process.argv[hostArgIdx + 1];
  }
  return process.env.HOST || '127.0.0.1';
}

async function main() {
  const port = parsePort();
  const host = parseHost();

  const tg = new TwinGraph({ offlineMode: false });
  const keyManager = new ApiKeyManager();

  const server = new TwinGatewayServer({
    port,
    host,
    router: tg.router,
    keyManager
  });

  const baseUrl = await server.start();

  console.log('===============================================================');
  console.log('🌐 TWINGRAPH WIRE-COMPATIBLE HTTP GATEWAY SERVER STARTED');
  console.log('===============================================================');
  console.log(`📡 URL:           ${baseUrl}`);
  console.log(`🎯 API Version:   v21.0 (Meta Graph API 1:1 Match)`);
  console.log(`🔑 Key Vault:     SQLite Persistent (${keyManager.listKeys().length} keys loaded)`);
  console.log(`🛡️  Auth Scheme:   access_token query param OR Authorization: Bearer`);
  console.log('---------------------------------------------------------------');
  console.log('Sample usage:');
  console.log(`  curl "${baseUrl}/v21.0/me?access_token=YOUR_API_KEY"`);
  console.log(`  curl "${baseUrl}/v21.0/{media-id}?fields=id,caption,media_type&access_token=YOUR_API_KEY"`);
  console.log('---------------------------------------------------------------');
  console.log('Press Ctrl+C to stop the gateway.');

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('\nStopping TwinGraph Gateway...');
    await server.stop();
    keyManager.close();
    console.log('Gateway stopped. Goodbye!');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(err => {
  console.error('Failed to start gateway:', err);
  process.exit(1);
});
