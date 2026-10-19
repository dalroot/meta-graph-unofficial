/**
 * Notifications & Activity Inbox Dissector Script
 * Meta Graph Unofficial
 *
 * Target: Active authenticated session (@hokar368 / UID: 19835089130)
 * Endpoint: GET https://www.instagram.com/api/v1/news/inbox/?mark_as_read=false
 * Transport: TwinTransport over SOCKS5 proxy (socks5://127.0.0.1:10808)
 * Safety: Exactly 1 single live attempt with Circuit Breaker verification.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { TwinTransport } from '../dist/twins/transport.js';

const WORKSPACE_DIR = '/home/hokar/Documents/antigravity/hopeful-bell';
const SESSION_FILE = path.join(WORKSPACE_DIR, 'instagram_session.json');
const CB_FILE = path.join(WORKSPACE_DIR, 'circuit_breaker.json');
const OUTPUT_FILE = path.join(WORKSPACE_DIR, 'scratch/live_notifications_dissection.json');
const PROXY_URL = 'socks5://127.0.0.1:10808';

const TARGET_URL = 'https://www.instagram.com/api/v1/news/inbox/?mark_as_read=false';

interface ExtractedNotification {
  id: string;
  story_type?: number;
  type?: number;
  category: 'like' | 'comment' | 'follow' | 'mention' | 'tag' | 'relationship' | 'system' | 'suggestion' | 'other';
  timestamp_raw: number;
  timestamp_iso: string;
  actor: {
    id?: string;
    username?: string;
    profile_image?: string;
  };
  action_text: string;
  target_media_id?: string;
  comment_id?: string;
  comment_text?: string;
  destination?: string;
  actions?: string[];
  raw_story: any;
}

function classifyNotificationType(story: any): 'like' | 'comment' | 'follow' | 'mention' | 'tag' | 'relationship' | 'system' | 'suggestion' | 'other' {
  const text = (story.args?.text || '').toLowerCase();
  const type = story.type;
  const storyType = story.story_type;

  if (text.includes('liked your') || text.includes('liked') || type === 1) return 'like';
  if (text.includes('commented') || text.includes('replied to') || type === 2) return 'comment';
  if (text.includes('started following') || text.includes('requested to follow') || type === 3) return 'follow';
  if (text.includes('mentioned you') || type === 4) return 'mention';
  if (text.includes('tagged you') || text.includes('photos of you')) return 'tag';
  if (story.args?.tu || story.tu_stories) return 'suggestion';
  if (text.includes('accepted your follow request')) return 'relationship';
  if (storyType === 101 || storyType === 102) return 'system';
  return 'other';
}

function parseStory(story: any): ExtractedNotification {
  const args = story.args || {};
  const mediaList = args.media || [];
  const firstMedia = mediaList[0] || {};
  const ts = args.timestamp || story.timestamp || 0;
  const tsMs = ts > 1000000000000 ? ts : ts * 1000;

  return {
    id: String(story.pk || story.id || args.profile_id || Math.random().toString(36).substring(7)),
    story_type: story.story_type,
    type: story.type,
    category: classifyNotificationType(story),
    timestamp_raw: ts,
    timestamp_iso: ts ? new Date(tsMs).toISOString() : 'unknown',
    actor: {
      id: args.profile_id ? String(args.profile_id) : (args.links?.[0]?.type === 'user' ? String(args.links[0].id) : undefined),
      username: args.profile_name || (args.links?.[0]?.type === 'user' ? String(args.links[0].id) : undefined),
      profile_image: args.profile_image
    },
    action_text: args.text || args.rich_text || '',
    target_media_id: firstMedia.id ? String(firstMedia.id) : (args.media_id ? String(args.media_id) : undefined),
    comment_id: args.comment_id ? String(args.comment_id) : undefined,
    comment_text: args.comment_text || undefined,
    destination: args.destination || undefined,
    actions: args.actions || undefined,
    raw_story: story
  };
}

async function main(): Promise<void> {
  console.log('================================================================');
  console.log('  META GRAPH UNOFFICIAL - NOTIFICATIONS & ACTIVITY INBOX DISSECTOR');
  console.log('================================================================\n');

  // Step 1: Pre-flight Circuit Breaker Check
  if (fs.existsSync(CB_FILE)) {
    const cb = JSON.parse(fs.readFileSync(CB_FILE, 'utf-8'));
    if (cb.tripped) {
      console.error(`🚨 [CIRCUIT BREAKER] Circuit breaker is TRIPPED: ${cb.reason}. Halting execution.`);
      process.exit(1);
    }
  }

  // Step 2: Load Active Session
  if (!fs.existsSync(SESSION_FILE)) {
    console.error(`🚨 [SESSION] Session file not found at ${SESSION_FILE}`);
    process.exit(1);
  }
  const session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
  console.log(`[*] Target User: @${session.username} (UID: ${session.ds_user_id})`);

  // Step 3: Configure TwinTransport over SOCKS5 Proxy
  console.log(`[*] Configuring TwinTransport via SOCKS5 proxy: ${PROXY_URL}`);
  const transport = new TwinTransport({ proxyUrl: PROXY_URL });

  // Step 4: Construct Single Request with Strict Headers
  const requestHeaders = {
    'User-Agent': session.digital_twin_fingerprint.user_agent,
    'Cookie': session.cookie_string,
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'X-IG-App-ID': '936619743392459',
    'X-CSRFToken': session.key_tokens.csrftoken,
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://www.instagram.com/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin'
  };

  console.log(`[*] Executing 1 single live request to: ${TARGET_URL}`);
  const startTime = Date.now();
  let response: any;

  try {
    response = await transport.request(TARGET_URL, {
      method: 'GET',
      headers: requestHeaders,
      timeoutMs: 30000
    });
  } catch (netErr: any) {
    console.error(`🚨 [NETWORK ERROR] Request failed: ${netErr.message}`);
    const cb = {
      tripped: true,
      reason: `Network error on ${TARGET_URL}: ${netErr.message}`,
      tripped_at: new Date().toISOString(),
      last_status: 0,
      endpoint: TARGET_URL
    };
    fs.writeFileSync(CB_FILE, JSON.stringify(cb, null, 2), 'utf-8');
    process.exit(1);
  }

  const durationMs = Date.now() - startTime;
  console.log(`[*] Request finished in ${durationMs}ms`);
  console.log(`[*] HTTP Status: ${response.status} ${response.statusText}`);
  console.log(`[*] Response Size: ${response.data.length} bytes`);

  // Step 5: Circuit Breaker Evaluation on Response Status
  if (response.status !== 200) {
    console.error(`🚨 [CIRCUIT BREAKER] HTTP ${response.status} received. Tripping circuit breaker immediately!`);
    const cb = {
      tripped: true,
      reason: `HTTP ${response.status} on ${TARGET_URL}`,
      tripped_at: new Date().toISOString(),
      last_status: response.status,
      endpoint: TARGET_URL,
      account: { username: session.username, id: session.ds_user_id }
    };
    fs.writeFileSync(CB_FILE, JSON.stringify(cb, null, 2), 'utf-8');
    process.exit(1);
  }

  // Step 6: Parse and Dissect JSON Payload
  let rawJson: any;
  try {
    rawJson = JSON.parse(response.data);
  } catch (jsonErr: any) {
    console.error(`🚨 [JSON ERROR] Failed to parse response as JSON: ${jsonErr.message}`);
    process.exit(1);
  }

  console.log(`[✓] Meta Status: "${rawJson.status}"`);

  // Section 1: Counts Breakdown
  const counts = rawJson.counts || {};
  console.log(`[*] Activity Counts Breakdown:`, JSON.stringify(counts, null, 2));

  // Section 2: Partition
  const partition = rawJson.partition || null;
  console.log(`[*] Partition Structure:`, partition ? Object.keys(partition) : 'None');

  // Section 3: AYF (Accounts You Follow)
  const ayf = rawJson.ayf || null;
  console.log(`[*] Accounts You Follow (AYF) Presence:`, ayf ? (Array.isArray(ayf) ? `${ayf.length} items` : Object.keys(ayf)) : 'None');

  // Section 4: Stories Extraction
  const newStoriesRaw = rawJson.new_stories || [];
  const oldStoriesRaw = rawJson.old_stories || [];
  const friendRequestsRaw = rawJson.friend_request_stories || [];
  const tuStoriesRaw = rawJson.tu_stories || [];

  console.log(`[*] Stories Summary:`);
  console.log(`    - new_stories: ${newStoriesRaw.length}`);
  console.log(`    - old_stories: ${oldStoriesRaw.length}`);
  console.log(`    - friend_request_stories: ${friendRequestsRaw.length}`);
  console.log(`    - tu_stories: ${tuStoriesRaw.length}`);

  const parsedNewStories = newStoriesRaw.map(parseStory);
  const parsedOldStories = oldStoriesRaw.map(parseStory);
  const parsedFriendRequests = friendRequestsRaw.map(parseStory);
  const parsedTuStories = tuStoriesRaw.map(parseStory);

  const allParsedStories = [
    ...parsedNewStories,
    ...parsedOldStories,
    ...parsedFriendRequests,
    ...parsedTuStories
  ];

  console.log(`\n================================================================`);
  console.log(`       DISSECTED NOTIFICATIONS LIST FOR @${session.username}     `);
  console.log(`================================================================`);

  if (allParsedStories.length === 0) {
    console.log(`[!] Zero notifications currently in news inbox.`);
  } else {
    for (const [idx, item] of allParsedStories.entries()) {
      console.log(`\n#${idx + 1} [${item.category.toUpperCase()}] ID: ${item.id}`);
      console.log(`    Timestamp: ${item.timestamp_iso} (${item.timestamp_raw})`);
      console.log(`    Actor: @${item.actor.username || 'unknown'} (UID: ${item.actor.id || 'N/A'})`);
      console.log(`    Action Text: "${item.action_text}"`);
      if (item.target_media_id) console.log(`    Target Media ID: ${item.target_media_id}`);
      if (item.comment_text) console.log(`    Comment Text: "${item.comment_text}"`);
      if (item.destination) console.log(`    Destination: ${item.destination}`);
    }
  }

  // Step 7: Build Structured Dissection Artifact
  const dissectionResult = {
    metadata: {
      account: {
        username: session.username,
        user_id: session.ds_user_id
      },
      executed_at: new Date().toISOString(),
      endpoint: TARGET_URL,
      http_status: response.status,
      response_bytes: response.data.length,
      request_duration_ms: durationMs,
      proxy: PROXY_URL,
      meta_status: rawJson.status
    },
    architectural_breakdown: {
      field_inventory: Object.keys(rawJson),
      counts_schema: {
        description: 'Categorized counters of unread/pending activities',
        fields: Object.keys(counts),
        values: counts
      },
      partition_schema: {
        description: 'Time partition markers dividing activity history into temporal segments',
        structure: partition
      },
      ayf_schema: {
        description: 'Accounts You Follow feed suggestions or activity highlights',
        present: Boolean(ayf),
        data: ayf
      },
      stories_schema: {
        new_stories_count: newStoriesRaw.length,
        old_stories_count: oldStoriesRaw.length,
        friend_request_stories_count: friendRequestsRaw.length,
        tu_stories_count: tuStoriesRaw.length
      }
    },
    notifications_summary: {
      total_count: allParsedStories.length,
      by_category: {
        like: allParsedStories.filter(s => s.category === 'like').length,
        comment: allParsedStories.filter(s => s.category === 'comment').length,
        follow: allParsedStories.filter(s => s.category === 'follow').length,
        mention: allParsedStories.filter(s => s.category === 'mention').length,
        tag: allParsedStories.filter(s => s.category === 'tag').length,
        relationship: allParsedStories.filter(s => s.category === 'relationship').length,
        system: allParsedStories.filter(s => s.category === 'system').length,
        suggestion: allParsedStories.filter(s => s.category === 'suggestion').length,
        other: allParsedStories.filter(s => s.category === 'other').length
      }
    },
    extracted_notifications: {
      new_stories: parsedNewStories,
      old_stories: parsedOldStories,
      friend_requests: parsedFriendRequests,
      tu_stories: parsedTuStories
    },
    raw_response: rawJson
  };

  // Step 8: Save to scratch/live_notifications_dissection.json
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dissectionResult, null, 2), 'utf-8');
  console.log(`\n[✓] Successfully saved dissection to: ${OUTPUT_FILE}`);

  // Step 9: Update Circuit Breaker Ledger as Healthy
  const cb = {
    tripped: false,
    reason: 'Clear - Live news inbox dissection executed successfully with HTTP 200.',
    last_success_at: new Date().toISOString(),
    last_status: 200,
    endpoint: TARGET_URL
  };
  fs.writeFileSync(CB_FILE, JSON.stringify(cb, null, 2), 'utf-8');
  console.log(`[✓] Circuit breaker ledger updated as healthy.`);
}

main().catch((err) => {
  console.error(`🚨 Fatal execution failure:`, err);
  process.exit(1);
});
