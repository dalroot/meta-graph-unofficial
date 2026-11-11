#!/usr/bin/env node
/**
 * TwinGraph Global CLI — Multi-tool CLI for Meta Graph Unofficial
 * 
 * Works from any directory.
 * Automatically detects local proxy ports (10808, 7890, 2080) in filtered regions.
 */

import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import readline from 'node:readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Helper to check if a local port is listening (timeout: 150ms)
function isPortOpen(port) {
  return new Promise((resolve) => {
    const sock = net.createConnection({ host: '127.0.0.1', port, timeout: 150 }, () => {
      sock.destroy();
      resolve(true);
    });
    sock.on('error', () => resolve(false));
    sock.on('timeout', () => { sock.destroy(); resolve(false); });
  });
}

// Auto-detect proxy if not already exported in terminal environment
async function initProxy() {
  const existing = process.env.ALL_PROXY || process.env.HTTPS_PROXY || process.env.all_proxy || process.env.http_proxy;
  if (existing) return;

  const candidatePorts = [10808, 7890, 2080, 10809];
  for (const port of candidatePorts) {
    if (await isPortOpen(port)) {
      process.env.ALL_PROXY = `socks5://127.0.0.1:${port}`;
      break;
    }
  }
}

await initProxy();

// Dynamic import of compiled GhostService from project root
const { GhostService } = await import(path.join(projectRoot, 'dist/mcp/ghost_service.js'));

const ghost = new GhostService();
const args = process.argv.slice(2);
const command = args[0];
const arg1 = args[1];
const arg2 = args[2];

function printUsage() {
  console.log(`
============================================================
  TwinGraph CLI (Meta Graph Unofficial)
============================================================

Commands:
  profile   <username>            Inspect public IG profile (bio, followers, stats)
  posts     <username> [limit]    Extract recent grid posts/reels (default limit: 12)
  reel/metrics <shortcode_or_url> Get metrics for a post/reel (views, likes, comments)
  comments  <shortcode_or_url>    Harvest public comments from a post/reel
  search    <query>               Search users and hashtags anonymously
  viral     [limit]               Scan explore feed for viral posts
  audit     <username> [samples]  Full analytical audit (engagement, avg views, top reels)
  publish-post  <caption> [image] Publish photo/feed post
  publish-story [image/video]     Publish story with hardware codec checks
  login                           Launch browser to log in & auto-extract cookies to instagram_session.json
  test-mcp  [username]            Run full MCP JSON-RPC protocol test via stdio
  mcp                             Start the standard MCP stdio server

Usage:
  twingraph profile <username>
  twingraph posts <username> [limit]
  twingraph reel <shortcode_or_url>
  twingraph comments <shortcode_or_url> [limit]
  twingraph search <query>
  twingraph viral [limit]
  twingraph audit <username> [samples]
  twingraph test-mcp [username]
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
      case 'call': {
        const toolName = arg1;
        const rawPayload = arg2 || '{}';
        let parsedArgs = {};
        try {
          parsedArgs = JSON.parse(rawPayload);
        } catch (e) {
          throw new Error(`Invalid JSON arguments payload: ${rawPayload}`);
        }

        switch (toolName) {
          case 'instagram_get_profile':
          case 'ghost_get_profile': {
            const username = parsedArgs.username;
            if (!username) throw new Error('Argument "username" is required.');
            const res = await ghost.getProfile(username);
            process.stdout.write(JSON.stringify(res, null, 2) + '\n');
            break;
          }

          case 'instagram_get_posts':
          case 'ghost_get_posts': {
            const username = parsedArgs.username;
            if (!username) throw new Error('Argument "username" is required.');
            const res = await ghost.getTimelinePosts({
              username,
              limit: parsedArgs.limit ? Number(parsedArgs.limit) : 12,
              feedType: parsedArgs.feed_type || parsedArgs.feedType,
            });
            process.stdout.write(JSON.stringify(res, null, 2) + '\n');
            break;
          }

          case 'instagram_get_media_metrics':
          case 'ghost_get_media_metrics': {
            const mediaId = parsedArgs.media_id || parsedArgs.mediaId;
            if (!mediaId) throw new Error('Argument "media_id" is required.');
            const res = await ghost.getMediaMetrics(mediaId);
            process.stdout.write(JSON.stringify(res, null, 2) + '\n');
            break;
          }

          case 'instagram_get_comments':
          case 'ghost_get_comments': {
            const mediaId = parsedArgs.media_id || parsedArgs.mediaId;
            if (!mediaId) throw new Error('Argument "media_id" is required.');
            const res = await ghost.getComments(mediaId, parsedArgs.limit ? Number(parsedArgs.limit) : 25);
            process.stdout.write(JSON.stringify(res, null, 2) + '\n');
            break;
          }

          case 'instagram_search':
          case 'ghost_search': {
            const query = parsedArgs.query;
            if (!query) throw new Error('Argument "query" is required.');
            const res = await ghost.search(query, parsedArgs.search_type || parsedArgs.type || 'all');
            process.stdout.write(JSON.stringify(res, null, 2) + '\n');
            break;
          }

          case 'instagram_audit_account':
          case 'ghost_audit_account': {
            const username = parsedArgs.username;
            if (!username) throw new Error('Argument "username" is required.');
            const res = await ghost.auditAccount(username, parsedArgs.sample_count ? Number(parsedArgs.sample_count) : 15);
            process.stdout.write(JSON.stringify(res, null, 2) + '\n');
            break;
          }

          case 'instagram_get_insights': {
            const { TwinGraph } = await import(path.join(projectRoot, 'dist/index.js'));
            const tg = new TwinGraph({ offlineMode: false });
            const metricType = parsedArgs.metric_type || 'overview';
            if (metricType === 'media') {
              let mediaId = parsedArgs.media_id;
              if (mediaId && (mediaId.includes('/p/') || mediaId.includes('/reel/'))) {
                const m = mediaId.match(/(?:\/p\/|\/reel\/)([a-zA-Z0-9_-]+)/);
                if (m) mediaId = m[1];
              }
              const res = await ghost.getMediaMetrics(mediaId);
              process.stdout.write(JSON.stringify(res, null, 2) + '\n');
            } else if (metricType === 'content' || metricType === 'dashboard') {
              const res = await tg.dashboard.filterContentInsights({
                type: parsedArgs.content_type || parsedArgs.type || 'ALL',
                sort_by: parsedArgs.sort_by || 'reach',
                timeframe: parsedArgs.period || '30d',
                category: parsedArgs.category
              });
              process.stdout.write(JSON.stringify(res, null, 2) + '\n');
            } else {
              const res = await tg.dashboard.getOverview(parsedArgs.period || '30d');
              process.stdout.write(JSON.stringify(res, null, 2) + '\n');
            }
            break;
          }

          case 'instagram_get_inbox': {
            const { TwinGraph } = await import(path.join(projectRoot, 'dist/index.js'));
            const tg = new TwinGraph({ offlineMode: false });
            let res;
            try {
              res = await tg.web.getConversations();
            } catch (webErr) {
              res = await tg.direct.getConversations();
            }
            process.stdout.write(JSON.stringify(res, null, 2) + '\n');
            break;
          }

          case 'instagram_send_message': {
            const { TwinGraph } = await import(path.join(projectRoot, 'dist/index.js'));
            const tg = new TwinGraph({ offlineMode: false });
            let target = parsedArgs.recipient_id;
            // If recipient is a username, auto-resolve to numeric PK
            if (!/^\d+$/.test(target)) {
              const cleanUser = target.replace(/^@/, '').trim().toLowerCase();
              const searchRes = await ghost.search(cleanUser, 'users');
              const foundUser = searchRes.users?.find((u) => u.username.toLowerCase() === cleanUser);
              if (foundUser?.id) {
                target = foundUser.id;
              }
            }
            const res = await tg.web.sendDirectMessage(target, parsedArgs.text);
            process.stdout.write(JSON.stringify(res, null, 2) + '\n');
            break;
          }

          case 'instagram_post_comment': {
            const { TwinGraph } = await import(path.join(projectRoot, 'dist/index.js'));
            const tg = new TwinGraph({ offlineMode: false });
            let rawMedia = String(parsedArgs.media_id || '').trim();
            let shortcode = '';
            if (rawMedia.includes('/p/') || rawMedia.includes('/reel/')) {
              const m = rawMedia.match(/(?:\/p\/|\/reel\/)([a-zA-Z0-9_-]+)/);
              if (m) shortcode = m[1];
            } else if (!/^\d+$/.test(rawMedia)) {
              shortcode = rawMedia.replace(/^POLARIS_/, '');
            }

            let mediaId = rawMedia;
            if (rawMedia.includes('/p/') || rawMedia.includes('/reel/')) {
              const m = rawMedia.match(/(?:\/p\/|\/reel\/)([a-zA-Z0-9_-]+)/);
              if (m) mediaId = m[1];
            }
            if (mediaId.startsWith('POLARIS_')) {
              mediaId = mediaId.replace('POLARIS_', '');
            }
            if (!/^\d+$/.test(mediaId)) {
              const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
              let numId = 0n;
              for (let i = 0; i < mediaId.length; i++) {
                const idx = alphabet.indexOf(mediaId[i]);
                if (idx !== -1) {
                  numId = numId * 64n + BigInt(idx);
                }
              }
              mediaId = numId.toString();
            }
            const res = await tg.web.postComment(mediaId, parsedArgs.text, { shortcode });
            process.stdout.write(JSON.stringify(res, null, 2) + '\n');
            break;
          }

          case 'instagram_publish_post': {
            const { TwinGraph } = await import(path.join(projectRoot, 'dist/index.js'));
            const tg = new TwinGraph({ offlineMode: false });
            const caption = parsedArgs.caption || '';
            const imageUrl = parsedArgs.image_url || parsedArgs.imageUrl || parsedArgs.image_path || parsedArgs.imagePath;
            let res;
            if (tg.web.hasActiveSession() && imageUrl) {
              res = await tg.web.publishFeedPost({ imageInput: imageUrl, caption });
            } else {
              res = await tg.media.publishFeedPost({
                caption,
                imageUrl,
                userTags: parsedArgs.user_tags || parsedArgs.userTags,
              });
            }
            process.stdout.write(JSON.stringify(res, null, 2) + '\n');
            break;
          }

          case 'instagram_publish_story': {
            const { TwinGraph } = await import(path.join(projectRoot, 'dist/index.js'));
            const tg = new TwinGraph({ offlineMode: false });
            const imageUrl = parsedArgs.image_url || parsedArgs.imageUrl || parsedArgs.image_path || parsedArgs.imagePath || path.resolve(projectRoot, 'scratch/test_story.jpg');
            let res;
            if (tg.web.hasActiveSession() && imageUrl) {
              res = await tg.web.publishStory(imageUrl);
            } else {
              res = await tg.media.publishStory({
                imageUrl,
                videoUrl: parsedArgs.video_url || parsedArgs.videoUrl || parsedArgs.video_path || parsedArgs.videoPath,
                textOverlays: parsedArgs.text_overlays || parsedArgs.textOverlays,
                stickers: parsedArgs.stickers,
              });
            }
            process.stdout.write(JSON.stringify(res, null, 2) + '\n');
            break;
          }

          default:
            throw new Error(`Unknown TwinGraph tool: "${toolName}"`);
        }
        break;
      }

      case 'profile': {
        if (!arg1) throw new Error('Please specify a username. Example: twingraph profile instagram');
        console.log(`\n🔍 [TwinGraph] Inspecting profile: @${arg1}...`);
        const res = await ghost.getProfile(arg1);
        console.log(JSON.stringify(res, null, 2));
        break;
      }

      case 'posts': {
        if (!arg1) throw new Error('Please specify a username. Example: twingraph posts instagram 10');
        const limit = arg2 ? parseInt(arg2, 10) : 12;
        console.log(`\n📸 [TwinGraph] Extracting ${limit} posts for @${arg1}...`);
        const res = await ghost.getTimelinePosts({ username: arg1, limit });
        console.log(JSON.stringify(res, null, 2));
        break;
      }

      case 'reel':
      case 'media':
      case 'metrics': {
        if (!arg1) throw new Error('Please specify a shortcode or URL. Example: twingraph reel DQQMJ9dER-7');
        console.log(`\n📊 [TwinGraph] Fetching metrics for: ${arg1}...`);
        const res = await ghost.getMediaMetrics(arg1);
        console.log(JSON.stringify(res, null, 2));
        break;
      }

      case 'comments': {
        if (!arg1) throw new Error('Please specify a shortcode or URL. Example: twingraph comments DQQMJ9dER-7 15');
        const limit = arg2 ? parseInt(arg2, 10) : 15;
        console.log(`\n💬 [TwinGraph] Harvesting ${limit} comments for: ${arg1}...`);
        const res = await ghost.getComments(arg1, limit);
        console.log(JSON.stringify(res, null, 2));
        break;
      }

      case 'search': {
        if (!arg1) throw new Error('Please specify a search query. Example: twingraph search technology');
        console.log(`\n🔎 [TwinGraph] Searching for: "${arg1}"...`);
        const res = await ghost.search(arg1, 'all');
        console.log(JSON.stringify(res, null, 2));
        break;
      }

      case 'viral': {
        const limit = arg1 ? parseInt(arg1, 10) : 10;
        console.log(`\n🔥 [TwinGraph] Scanning ${limit} viral explore posts...`);
        const res = await ghost.getViralExplore(limit);
        console.log(JSON.stringify(res, null, 2));
        break;
      }

      case 'audit': {
        if (!arg1) throw new Error('Please specify a username. Example: twingraph audit instagram 10');
        const count = arg2 ? parseInt(arg2, 10) : 10;
        console.log(`\n📈 [TwinGraph] Running automated audit for @${arg1} (samples: ${count})...`);
        const res = await ghost.auditAccount(arg1, count);
        console.log(JSON.stringify(res, null, 2));
        break;
      }

      case 'publish-post':
      case 'post': {
        const { TwinGraph } = await import(path.join(projectRoot, 'dist/index.js'));
        const tg = new TwinGraph({ offlineMode: false });
        const caption = arg1 || '';
        const imageUrl = arg2 || '';
        console.log(`\n📮 [TwinGraph] Publishing post (caption: "${caption}")...`);
        let res;
        if (tg.web.hasActiveSession() && imageUrl) {
          res = await tg.web.publishFeedPost({ imageInput: imageUrl, caption });
        } else {
          res = await tg.media.publishFeedPost({ caption, imageUrl });
        }
        console.log(JSON.stringify(res, null, 2));
        break;
      }

      case 'publish-story':
      case 'story': {
        const { TwinGraph } = await import(path.join(projectRoot, 'dist/index.js'));
        const tg = new TwinGraph({ offlineMode: false });
        const mediaUrl = arg1 || path.resolve(projectRoot, 'scratch/test_story.jpg');
        console.log(`\n✨ [TwinGraph] Publishing story (media: "${mediaUrl}")...`);
        let res;
        if (tg.web.hasActiveSession()) {
          res = await tg.web.publishStory(mediaUrl);
        } else {
          res = await tg.media.publishStory({ imageUrl: mediaUrl });
        }
        console.log(JSON.stringify(res, null, 2));
        break;
      }

      case 'login': {
        const { runBrowserLogin } = await import(path.join(projectRoot, 'dist/auth/browser_login.js'));
        await runBrowserLogin({
          outputPath: path.resolve(process.cwd(), 'instagram_session.json')
        });
        break;
      }

      case 'mcp': {
        const serverPath = path.join(projectRoot, 'dist/mcp/server.js');
        const child = spawn('node', [serverPath], { stdio: 'inherit' });
        child.on('exit', (code) => process.exit(code || 0));
        break;
      }

      case 'test-mcp': {
        const target = arg1 || 'instagram';
        const serverPath = path.join(projectRoot, 'dist/mcp/server.js');
        console.log(`\n🤖 [MCP Protocol] Launching MCP stdio server to test tool execution on @${target}...`);
        const child = spawn('node', [serverPath], { stdio: ['pipe', 'pipe', 'inherit'] });
        const rl = readline.createInterface({ input: child.stdout });

        child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'twingraph-tester', version: '1.0.0' } } }) + '\n');

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
    const msg = err?.message || String(err || 'Unknown error');
    const isNetworkError =
      msg.includes('ECONNREFUSED') ||
      msg.includes('ETIMEDOUT') ||
      msg.includes('ENOTFOUND') ||
      msg.includes('EHOSTUNREACH') ||
      msg.includes('timeout') ||
      msg.includes('socket hang up') ||
      msg.includes('is_from_rle') ||
      msg.includes('Status 302') ||
      msg.includes('Network/Proxy Error');

    if (isNetworkError) {
      console.error(`\n❌ [Network/Proxy Error] Unable to connect to Instagram servers.`);
      console.error(`   Details: ${msg}`);
      console.error(`   Resolution: Please verify your active VPN/Proxy (ALL_PROXY) or switch your VPN server location.\n`);
    } else {
      console.error(`\n❌ Error: ${msg}\n`);
    }
    process.exit(1);
  }
}

run();
