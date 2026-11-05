#!/usr/bin/env node
/**
 * Standalone Terminal CLI for MetaGraph Ghost Mode & MCP Testing
 * 
 * Usage:
 *   node scripts/mcp_cli.js profile <username>
 *   node scripts/mcp_cli.js posts <username> [limit]
 *   node scripts/mcp_cli.js reel <shortcode_or_url>
 *   node scripts/mcp_cli.js comments <shortcode_or_url> [limit]
 *   node scripts/mcp_cli.js search <keyword_or_hashtag>
 *   node scripts/mcp_cli.js viral [limit]
 *   node scripts/mcp_cli.js audit <username> [sampleCount]
 *   node scripts/mcp_cli.js test-mcp [username]
 */

import { GhostService } from '../dist/mcp/ghost_service.js';
import { spawn } from 'node:child_process';
import readline from 'node:readline';

const ghost = new GhostService();
const [,, command, arg1, arg2] = process.argv;

function printUsage() {
  console.log(`
============================================================
  MetaGraph Ghost Mode & MCP Terminal Testing CLI
============================================================

Commands:
  profile   <username>            Inspect any public IG account (bio, followers, stats)
  posts     <username> [limit]    Extract recent grid posts/reels (default limit: 12)
  reel      <shortcode_or_url>    Get metrics for a specific post/reel (views, likes, comments)
  comments  <shortcode_or_url>    Harvest public comments from a post/reel
  search    <query>               Search users and hashtags anonymously
  viral     [limit]               Scan explore feed for viral posts
  audit     <username> [samples]  Full analytical audit (engagement, avg views, top reels)
  test-mcp  [username]            Run full MCP JSON-RPC protocol test via stdio

Examples:
  node scripts/mcp_cli.js profile instagram
  node scripts/mcp_cli.js posts natgeo 6
  node scripts/mcp_cli.js reel DQQMJ9dER-7
  node scripts/mcp_cli.js comments DQQMJ9dER-7 10
  node scripts/mcp_cli.js audit nasa 10
  node scripts/mcp_cli.js test-mcp instagram
============================================================
`);
}

async function run() {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printUsage();
    return;
  }

  try {
    switch (command.toLowerCase()) {
      case 'profile': {
        if (!arg1) throw new Error('Please specify a username. Example: node scripts/mcp_cli.js profile instagram');
        console.log(`\n🔍 [Ghost Mode] Inspecting profile: @${arg1}...`);
        const res = await ghost.getProfile(arg1);
        console.log(JSON.stringify(res, null, 2));
        break;
      }

      case 'posts': {
        if (!arg1) throw new Error('Please specify a username. Example: node scripts/mcp_cli.js posts instagram 10');
        const limit = arg2 ? parseInt(arg2, 10) : 12;
        console.log(`\n📸 [Ghost Mode] Extracting ${limit} posts for @${arg1}...`);
        const res = await ghost.getTimelinePosts({ username: arg1, limit });
        console.log(JSON.stringify(res, null, 2));
        break;
      }

      case 'reel':
      case 'media': {
        if (!arg1) throw new Error('Please specify a shortcode or URL. Example: node scripts/mcp_cli.js reel DQQMJ9dER-7');
        console.log(`\n📊 [Ghost Mode] Fetching metrics for: ${arg1}...`);
        const res = await ghost.getMediaMetrics(arg1);
        console.log(JSON.stringify(res, null, 2));
        break;
      }

      case 'comments': {
        if (!arg1) throw new Error('Please specify a shortcode or URL. Example: node scripts/mcp_cli.js comments DQQMJ9dER-7 15');
        const limit = arg2 ? parseInt(arg2, 10) : 15;
        console.log(`\n💬 [Ghost Mode] Harvesting ${limit} comments for: ${arg1}...`);
        const res = await ghost.getComments(arg1, limit);
        console.log(JSON.stringify(res, null, 2));
        break;
      }

      case 'search': {
        if (!arg1) throw new Error('Please specify a search query. Example: node scripts/mcp_cli.js search nature');
        console.log(`\n🔎 [Ghost Mode] Searching for: "${arg1}"...`);
        const res = await ghost.search(arg1, 'all');
        console.log(JSON.stringify(res, null, 2));
        break;
      }

      case 'viral': {
        const limit = arg1 ? parseInt(arg1, 10) : 10;
        console.log(`\n🔥 [Ghost Mode] Scanning ${limit} viral explore posts...`);
        const res = await ghost.getViralExplore(limit);
        console.log(JSON.stringify(res, null, 2));
        break;
      }

      case 'audit': {
        if (!arg1) throw new Error('Please specify a username. Example: node scripts/mcp_cli.js audit instagram 10');
        const count = arg2 ? parseInt(arg2, 10) : 10;
        console.log(`\n📈 [Ghost Mode] Running automated audit for @${arg1} (samples: ${count})...`);
        const res = await ghost.auditAccount(arg1, count);
        console.log(JSON.stringify(res, null, 2));
        break;
      }

      case 'test-mcp': {
        const target = arg1 || 'instagram';
        console.log(`\n🤖 [MCP Protocol] Launching MCP stdio server to test tool execution on @${target}...`);
        const child = spawn('node', ['./dist/mcp/server.js'], { stdio: ['pipe', 'pipe', 'inherit'] });
        const rl = readline.createInterface({ input: child.stdout });
        let step = 1;

        child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'cli-tester', version: '1.0.0' } } }) + '\n');

        rl.on('line', (line) => {
          try {
            const res = JSON.parse(line);
            if (res.id === 1) {
              console.log('✅ Handshake succeeded. Requesting tools/list...');
              child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }) + '\n');
            } else if (res.id === 2) {
              console.log(`✅ ${res.result?.tools?.length || 0} Tools registered. Calling ghost_get_profile for @${target}...`);
              child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'ghost_get_profile', arguments: { username: target } } }) + '\n');
            } else if (res.id === 3) {
              console.log('✅ MCP Tool Response received:\n', res.result?.content?.[0]?.text);
              console.log('\n🎉 [SUCCESS] MCP Server is fully operational on stdio!');
              process.exit(0);
            }
          } catch {
            console.log(line);
          }
        });
        break;
      }

      default:
        console.error(`❌ Unknown command: "${command}"`);
        printUsage();
        process.exit(1);
    }
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

run();
