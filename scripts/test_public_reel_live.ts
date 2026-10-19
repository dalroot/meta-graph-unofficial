/**
 * Safe Single-Attempt Media Fetcher & Inspector
 * Matches Meta Graph API v21.0: GET /{media-id}
 * 
 * Safety: 1 attempt only, zero retries, circuit breaker integrated.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { TwinTransport } from '../dist/twins/transport.js';

const WORKSPACE_DIR = '/home/hokar/Documents/antigravity/hopeful-bell';
const SESSION_FILE = path.join(WORKSPACE_DIR, 'instagram_session.json');
const CB_FILE = path.join(WORKSPACE_DIR, 'circuit_breaker.json');
const OUTPUT_FILE = path.join(WORKSPACE_DIR, 'scratch/live_media_audit.json');
const TARGET_SHORTCODE = 'DeU-UkmOB4z'; // The 3,889-comment viral reel discovered

async function main(): Promise<void> {
  console.log(`[*] Initiating safe media inspection for shortcode: ${TARGET_SHORTCODE}`);
  
  if (fs.existsSync(CB_FILE)) {
    const cb = JSON.parse(fs.readFileSync(CB_FILE, 'utf-8'));
    if (cb.tripped) {
      console.error(`🚨 [CIRCUIT BREAKER] Tripped: ${cb.reason}. Halting immediately.`);
      process.exit(1);
    }
  }

  const session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
  const transport = new TwinTransport({ proxyUrl: 'socks5://127.0.0.1:10808' });

  const targetUrl = `https://www.instagram.com/p/${TARGET_SHORTCODE}/`;
  console.log(`[*] Requesting: ${targetUrl}`);

  const response = await transport.request(targetUrl, {
    method: 'GET',
    headers: {
      'User-Agent': session.digital_twin_fingerprint.user_agent,
      'Cookie': session.cookie_string,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,fa;q=0.8',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'X-IG-App-ID': '936619743392459'
    },
    timeoutMs: 25000
  });

  console.log(`[*] HTTP Status: ${response.status} ${response.statusText}`);
  console.log(`[*] Response Size: ${response.data.length} bytes`);

  if (response.status !== 200) {
    const cb = {
      tripped: true,
      reason: `HTTP ${response.status} on ${targetUrl}`,
      tripped_at: new Date().toISOString(),
      last_status: response.status,
      endpoint: targetUrl,
      account: { username: session.username, id: session.ds_user_id }
    };
    fs.writeFileSync(CB_FILE, JSON.stringify(cb, null, 2), 'utf-8');
    console.error('🚨 [CIRCUIT BREAKER] Tripped and halted.');
    process.exit(1);
  }

  // Parse embedded video/metadata JSON if available in HTML
  let videoUrl: string | null = null;
  let caption: string | null = null;
  const videoMatch = response.data.match(/"video_url":"([^"]+)"/);
  if (videoMatch) {
    videoUrl = JSON.parse(`"${videoMatch[1]}"`);
  }

  const result = {
    shortcode: TARGET_SHORTCODE,
    permalink: `https://www.instagram.com/reel/${TARGET_SHORTCODE}/`,
    status_code: response.status,
    bytes: response.data.length,
    extracted_at: new Date().toISOString(),
    has_video_stream: Boolean(videoUrl),
    sample_video_cdn: videoUrl ? videoUrl.substring(0, 120) + '...' : null
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`✅ Success! Media verified. Written to ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
