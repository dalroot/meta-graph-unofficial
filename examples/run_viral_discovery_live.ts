/**
 * Live Viral Engagement & Controversy Engine Runner
 * 
 * Target: Physical Xiaomi Redmi Note 13 4G (23129RAA4G) Liger Stack
 * Transport: SOCKS5 proxy (socks5://127.0.0.1:10808)
 * Standard: 1:1 Meta Graph API v21.0 Mapping & Single-Attempt Circuit Breaker
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { TwinGraph, DeviceTwin, DiscoveryTwin } from '../dist/index.js';

const SESSION_FILE = '/home/hokar/Documents/antigravity/hopeful-bell/instagram_mobile_session.json';
const CB_FILE = '/home/hokar/Documents/antigravity/hopeful-bell/circuit_breaker.json';
const OUTPUT_FILE = '/home/hokar/Documents/antigravity/hopeful-bell/scratch/viral_explore_posts.json';
const PROXY_URL = 'socks5://127.0.0.1:10808';

async function main(): Promise<void> {
  console.log('================================================================');
  console.log('  Meta Graph Unofficial — Live Viral Engagement & Discovery     ');
  console.log('  Target: Xiaomi Redmi Note 13 4G (23129RAA4G) Liger Stack      ');
  console.log('  Transport: SOCKS5 (socks5://127.0.0.1:10808)                   ');
  console.log('  Strict Rule: 1 Attempt Per Endpoint, Zero Retry Loops         ');
  console.log('================================================================\n');

  // 1. Assert circuit breaker is untripped
  if (fs.existsSync(CB_FILE)) {
    const cbData = JSON.parse(fs.readFileSync(CB_FILE, 'utf-8'));
    if (cbData.tripped) {
      console.error(`🚨 [CIRCUIT BREAKER] Tripped previously: ${cbData.reason}`);
      console.error('Halting execution immediately to protect mobile account.');
      process.exit(1);
    }
  }

  // 2. Initialize DeviceTwin with active mobile session
  const deviceTwin = new DeviceTwin(SESSION_FILE);
  console.log(`[*] Mobile session loaded for: @${deviceTwin.getUsername()} (${deviceTwin.getUserId()})`);
  console.log(`    Active session present: ${deviceTwin.hasActiveSession()}`);

  // 3. Initialize DiscoveryTwin in live mode with SOCKS5 proxy
  const discoveryTwin = new DiscoveryTwin(deviceTwin, {
    offlineMode: false,
    proxyUrl: PROXY_URL,
    circuitBreakerPath: CB_FILE
  });

  // 4. Also instantiate unified TwinGraph SDK client
  const tg = new TwinGraph({
    mobileSession: SESSION_FILE,
    offlineMode: false
  });

  console.log('\n--- Step 1: Querying Live Explore Feed & Computing Viral Metrics ---');
  console.log('[*] Executing single live attempt to discover/topical_explore...');
  const viralPosts = await discoveryTwin.getViralExplore();
  console.log(`✅ Extracted and ranked ${viralPosts.length} posts from explore feed.\n`);

  console.log('--- Step 2: Querying Trending Hashtags Discovery ---');
  const trendingQuery = 'ایران';
  console.log(`[*] Executing discovery search for keyword: "${trendingQuery}"...`);
  const trendingHashtags = await discoveryTwin.getTrendingHashtags(trendingQuery);
  console.log(`✅ Discovered ${trendingHashtags.length} trending hashtags.\n`);

  // 5. Structure final deliverable payload
  const resultPayload = {
    generated_at: new Date().toISOString(),
    engine: 'Viral Engagement & Controversy Engine (v21.0)',
    device_model: 'Xiaomi Redmi Note 13 4G (23129RAA4G)',
    transport: 'SOCKS5 (127.0.0.1:10808) over Liger Network Stack',
    account: {
      username: deviceTwin.getUsername(),
      ds_user_id: deviceTwin.getUserId()
    },
    ranking_summary: {
      total_ranked_posts: viralPosts.length,
      hot_debate_posts_count: viralPosts.filter(p => p.metrics.is_hot_debate).length,
      top_debate_reel: viralPosts[0] ? {
        code: viralPosts[0].code,
        creator: `@${viralPosts[0].creator.username}`,
        comments: viralPosts[0].comment_count,
        likes: viralPosts[0].like_count,
        views: viralPosts[0].view_count,
        comment_to_like_ratio_pct: `${(viralPosts[0].metrics.comment_to_like_ratio * 100).toFixed(2)}%`,
        comment_to_view_ratio_pct: `${(viralPosts[0].metrics.comment_to_view_ratio * 100).toFixed(4)}%`,
        controversy_score: viralPosts[0].metrics.controversy_score,
        permalink: viralPosts[0].permalink
      } : null
    },
    trending_hashtags: trendingHashtags.slice(0, 10),
    ranked_viral_posts: viralPosts
  };

  // 6. Save payload to target scratch file
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(resultPayload, null, 2), 'utf-8');
  console.log(`💾 Live ranked viral posts successfully saved to:\n   ${OUTPUT_FILE}\n`);

  // 7. Print summary table to console
  console.log('========================================================================================================');
  console.log('  RANK | CODE         | CREATOR            | COMMENTS | LIKES    | VIEWS      | C/L RATIO | CONTROVERSY');
  console.log('========================================================================================================');
  viralPosts.forEach((post, idx) => {
    const rank = String(idx + 1).padStart(4, ' ');
    const code = post.code.padEnd(12, ' ');
    const creator = `@${post.creator.username}`.padEnd(18, ' ');
    const comments = post.comment_count.toLocaleString().padStart(8, ' ');
    const likes = post.like_count.toLocaleString().padStart(8, ' ');
    const views = post.view_count > 0 ? post.view_count.toLocaleString().padStart(10, ' ') : '       N/A';
    const ratio = `${(post.metrics.comment_to_like_ratio * 100).toFixed(1)}%`.padStart(9, ' ');
    const controversy = String(post.metrics.controversy_score).padStart(11, ' ');
    const debateTag = post.metrics.is_hot_debate ? '🔥 HOT DEBATE' : '';
    console.log(`  ${rank} | ${code} | ${creator} | ${comments} | ${likes} | ${views} | ${ratio} | ${controversy} ${debateTag}`);
  });
  console.log('========================================================================================================\n');
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
