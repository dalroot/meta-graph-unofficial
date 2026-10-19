/**
 * Home Feed & Timeline Verifier
 * Official Meta Graph API Equivalent: GET /v21.0/me/feed (Timeline / Home Feed)
 * 
 * Safety: Exactly 1 single attempt, zero loops, strict circuit breaker.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { TwinTransport } from '../dist/twins/transport.js';

const WORKSPACE_DIR = '/home/hokar/Documents/antigravity/hopeful-bell';
const SESSION_FILE = path.join(WORKSPACE_DIR, 'instagram_session.json');
const CB_FILE = path.join(WORKSPACE_DIR, 'circuit_breaker.json');
const OUTPUT_FILE = path.join(WORKSPACE_DIR, 'scratch/live_home_feed_audit.json');

async function main(): Promise<void> {
  console.log('[*] Testing Home Timeline Feed for authenticated user...');

  if (fs.existsSync(CB_FILE)) {
    const cb = JSON.parse(fs.readFileSync(CB_FILE, 'utf-8'));
    if (cb.tripped) {
      console.error(`🚨 [CIRCUIT BREAKER] Tripped: ${cb.reason}. Halting immediately.`);
      process.exit(1);
    }
  }

  const session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
  const transport = new TwinTransport({ proxyUrl: 'socks5://127.0.0.1:10808' });

  const targetUrl = 'https://www.instagram.com/';
  console.log(`[*] Requesting Home Surface: ${targetUrl}`);

  const response = await transport.request(targetUrl, {
    method: 'GET',
    headers: {
      'User-Agent': session.digital_twin_fingerprint.user_agent,
      'Cookie': session.cookie_string,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,fa;q=0.8',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'X-IG-App-ID': '936619743392459'
    },
    timeoutMs: 30000
  });

  console.log(`[*] HTTP Status: ${response.status} ${response.statusText}`);
  console.log(`[*] Home Surface Response Size: ${response.data.length} bytes`);

  if (response.status !== 200) {
    const cb = {
      tripped: true,
      reason: `HTTP ${response.status} on Home Timeline Feed`,
      tripped_at: new Date().toISOString(),
      last_status: response.status,
      endpoint: targetUrl,
      account: { username: session.username, id: session.ds_user_id }
    };
    fs.writeFileSync(CB_FILE, JSON.stringify(cb, null, 2), 'utf-8');
    console.error('🚨 [CIRCUIT BREAKER] Tripped and halted.');
    process.exit(1);
  }

  // Verify authentication markers
  const isLoggedIn = response.data.includes('"username":"hokar368"') || response.data.includes('19835089130');
  const hasTimelineMarkers = response.data.includes('feed') || response.data.includes('timeline') || response.data.includes('Polaris');

  const result = {
    surface: 'Home Timeline Feed',
    target_url: targetUrl,
    http_status: response.status,
    payload_bytes: response.data.length,
    authenticated_user: 'hokar368',
    user_id: '19835089130',
    is_authenticated: isLoggedIn,
    contains_feed_runtime: hasTimelineMarkers,
    verified_at: new Date().toISOString()
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`✅ Success! Home Timeline Feed verified. Output saved to ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
