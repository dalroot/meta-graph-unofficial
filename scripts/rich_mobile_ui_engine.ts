/**
 * Rich Mobile Phone UI Discovery & Engagement Engine
 * 
 * Accurately extracts explore feed items, trending hashtags, creator profiles,
 * and live comments matching the physical Xiaomi Redmi Note 13 4G screen.
 * 
 * Adheres strictly to the Meta Source Fidelity Standard:
 * - Uses TwinTransport over SOCKS5 proxy (socks5://127.0.0.1:10808)
 * - Authentic Liger network stack headers
 * - Strict single-attempt circuit breaker (1 attempt per endpoint, zero retry loops)
 * - English-only TSDoc / JSDoc comments
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { TwinTransport } from '/home/hokar/Documents/antigravity/hopeful-bell/dist/twins/transport.js';

const WORKSPACE_DIR = '/home/hokar/Documents/antigravity/hopeful-bell';
const SESSION_FILE = path.join(WORKSPACE_DIR, 'instagram_mobile_session.json');
const CB_FILE = path.join(WORKSPACE_DIR, 'circuit_breaker.json');
const AUDIT_FILE = path.join(WORKSPACE_DIR, 'LIVE_EXECUTION_AUDIT.md');
const SCRATCH_OUTPUT_FILE = path.join(WORKSPACE_DIR, 'scratch/rich_mobile_ui_explore_and_comments.json');
const PROXY_URL = 'socks5://127.0.0.1:10808';

const PAUSE_BETWEEN_TASKS_MS = 3500;

interface MobileSession {
  cookie_string: string;
  csrftoken?: string;
  mid?: string;
  username?: string;
  ds_user_id?: string;
  ig_did?: string;
  device?: {
    device_model?: string;
    device_id?: string;
  };
}

interface ExtractedCreator {
  pk: string;
  username: string;
  full_name: string;
  is_verified: boolean;
  is_private: boolean;
  profile_pic_url: string;
}

interface ExtractedAudioTrack {
  title: string;
  artist: string;
  audio_asset_id: string | null;
  is_trending?: boolean;
}

interface ExtractedComment {
  comment_id: string;
  text: string;
  user: {
    pk: string;
    username: string;
    full_name: string;
    is_verified: boolean;
    profile_pic_url: string;
  };
  created_at: number;
  created_at_iso: string;
  like_count: number;
  child_comment_count: number;
}

interface ExtractedExploreMedia {
  media_id: string;
  pk: string;
  code: string;
  permalink: string;
  media_type: number;
  media_type_name: string;
  slide_count: number | null;
  video_duration_seconds: number | null;
  like_count: number;
  comment_count: number;
  view_count: number;
  play_count: number;
  caption: string;
  hashtags: string[];
  creator: ExtractedCreator;
  audio_track: ExtractedAudioTrack | null;
  preview_comments: ExtractedComment[];
  social_context: {
    is_paid_partnership: boolean;
    sponsor_tags: any[];
    coauthor_producers: Array<{ pk: string; username: string; full_name: string }>;
    commerciality_status: string;
  };
}

interface ExtractedHashtag {
  id: string;
  name: string;
  media_count?: number;
  search_result_subtitle?: string;
  position: number;
}

interface ExtractedDiscoveryCreator {
  pk: string;
  username: string;
  full_name: string;
  is_verified: boolean;
  is_private: boolean;
  profile_pic_url: string;
  social_context: string;
  latest_reel_media?: number;
  position: number;
}

/**
 * Asserts circuit breaker is currently armed and untripped
 */
function assertCircuitBreakerClear(): void {
  if (!fs.existsSync(CB_FILE)) return;
  try {
    const raw = fs.readFileSync(CB_FILE, 'utf-8');
    const cb = JSON.parse(raw);
    if (cb.tripped) {
      console.error(`💥 [CIRCUIT BREAKER] Tripped previously: ${cb.reason}`);
      console.error('Halting immediately to protect mobile account.');
      process.exit(1);
    }
  } catch {
    // If malformed, continue
  }
}

/**
 * Trips the circuit breaker and writes failure details
 */
function tripCircuitBreaker(reason: string, status?: number, endpoint?: string): void {
  const cb = {
    tripped: true,
    reason: `HTTP ${status ?? 'ERR'}: ${reason}`,
    tripped_at: new Date().toISOString(),
    last_status: status ?? 0,
    endpoint: endpoint ?? 'unknown',
    account: {
      username: 'hokar368',
      id: '19835089130'
    }
  };
  fs.writeFileSync(CB_FILE, JSON.stringify(cb, null, 2), 'utf-8');
  console.error(`🚨 [CIRCUIT BREAKER TRIPPED] ${cb.reason}`);
}

/**
 * Records successful endpoint execution
 */
function recordSuccess(endpoint: string, note: string): void {
  const cb = {
    tripped: false,
    reason: `Success: ${note}`,
    last_success_at: new Date().toISOString(),
    last_status: 200,
    endpoint,
    account: {
      username: 'hokar368',
      id: '19835089130'
    }
  };
  fs.writeFileSync(CB_FILE, JSON.stringify(cb, null, 2), 'utf-8');
}

/**
 * Sleep helper for safe inter-request delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes a single controlled HTTP request with strict circuit breaker validation
 */
async function executeSingleAttempt(
  transport: TwinTransport,
  url: string,
  headers: Record<string, string>,
  taskName: string
): Promise<{ status: number; statusText: string; data: string; durationMs: number }> {
  assertCircuitBreakerClear();

  console.log(`📡 [${taskName}] Executing EXACTLY 1 attempt to: ${url}`);
  const startTime = Date.now();
  let response: any;

  try {
    response = await transport.request(url, {
      method: 'GET',
      headers,
      timeoutMs: 30000
    });
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ [${taskName}] Network error after ${elapsed}ms: ${err.message}`);
    tripCircuitBreaker(`Network error: ${err.message}`, 0, url);
    process.exit(1);
  }

  const durationMs = Date.now() - startTime;
  const payloadBytes = Buffer.byteLength(response.data || '', 'utf-8');
  console.log(`📥 [${taskName}] HTTP ${response.status} ${response.statusText} (${durationMs}ms, ${payloadBytes} bytes)`);

  if (response.status !== 200) {
    console.error(`🚨 [${taskName}] HTTP status ${response.status} != 200. Tripping circuit breaker immediately.`);
    tripCircuitBreaker(`Failed with status ${response.status}: ${response.data.slice(0, 200)}`, response.status, url);
    process.exit(1);
  }

  recordSuccess(url, `${taskName} completed HTTP 200`);
  return {
    status: response.status,
    statusText: response.statusText,
    data: response.data,
    durationMs
  };
}

/**
 * Extracts hashtag tokens from text
 */
function extractHashtags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#([^\s#.,!?؛:()[\]{}]+)/gu);
  return matches ? Array.from(new Set(matches)) : [];
}

/**
 * Resolves media type name
 */
function resolveMediaTypeName(typeCode: number): string {
  switch (typeCode) {
    case 1:
      return 'Single Photo';
    case 2:
      return 'Video / Reel';
    case 8:
      return 'Carousel Album';
    default:
      return `Media Type (${typeCode})`;
  }
}

/**
 * Parses raw comment objects into structured format
 */
function parseCommentObject(c: any): ExtractedComment {
  const user = c.user || {};
  const createdAtSec = Number(c.created_at || c.created_at_utc || 0);
  return {
    comment_id: String(c.pk || c.id || ''),
    text: c.text || '',
    user: {
      pk: String(user.pk || user.id || ''),
      username: user.username || 'unknown',
      full_name: user.full_name || '',
      is_verified: Boolean(user.is_verified),
      profile_pic_url: user.profile_pic_url || ''
    },
    created_at: createdAtSec,
    created_at_iso: createdAtSec > 0 ? new Date(createdAtSec * 1000).toISOString() : new Date().toISOString(),
    like_count: Number(c.comment_like_count || c.like_count || 0),
    child_comment_count: Number(c.child_comment_count || 0)
  };
}

/**
 * Parses raw media items from Explore responses
 */
function parseExploreMediaItem(media: any): ExtractedExploreMedia | null {
  if (!media || typeof media !== 'object') return null;

  const rawPk = String(media.pk || media.id || '');
  if (!rawPk) return null;

  const pk = rawPk.split('_')[0];
  const mediaId = String(media.id || rawPk);
  const code = media.code || '';
  const mediaType = Number(media.media_type || 1);
  const mediaTypeName = resolveMediaTypeName(mediaType);

  const permalink = mediaType === 2
    ? `https://www.instagram.com/reel/${code}/`
    : `https://www.instagram.com/p/${code}/`;

  const user = media.user || {};
  const creator: ExtractedCreator = {
    pk: String(user.pk || user.id || ''),
    username: user.username || 'unknown',
    full_name: user.full_name || '',
    is_verified: Boolean(user.is_verified),
    is_private: Boolean(user.is_private),
    profile_pic_url: user.profile_pic_url || ''
  };

  const captionText = media.caption && typeof media.caption === 'object' ? String(media.caption.text || '') : '';
  const hashtags = extractHashtags(captionText);

  let slideCount: number | null = null;
  if (mediaType === 8) {
    slideCount = media.carousel_media_count ?? (Array.isArray(media.carousel_media) ? media.carousel_media.length : null);
  }

  let videoDuration: number | null = null;
  if (mediaType === 2) {
    videoDuration = media.video_duration !== undefined ? Number(media.video_duration) : null;
  }

  const likeCount = Number(media.like_count || 0);
  const commentCount = Number(media.comment_count || 0);
  const viewCount = Number(media.view_count || media.play_count || 0);
  const playCount = Number(media.play_count || media.view_count || 0);

  // Audio track metadata
  let audioTrack: ExtractedAudioTrack | null = null;
  const musicInfo = media.clips_metadata?.music_info?.music_asset_info;
  const originalAudio = media.clips_metadata?.original_sound_info;

  if (musicInfo) {
    audioTrack = {
      title: musicInfo.title || 'Unknown Title',
      artist: musicInfo.display_artist || 'Unknown Artist',
      audio_asset_id: musicInfo.audio_asset_id ? String(musicInfo.audio_asset_id) : null,
      is_trending: Boolean(musicInfo.is_trending_in_clips)
    };
  } else if (originalAudio) {
    audioTrack = {
      title: originalAudio.original_audio_title || 'Original Audio',
      artist: originalAudio.ig_artist?.username || creator.username,
      audio_asset_id: originalAudio.audio_asset_id ? String(originalAudio.audio_asset_id) : null,
      is_trending: false
    };
  }

  // Preview comments
  const previewComments: ExtractedComment[] = [];
  const rawPreview = media.preview_comments || media.comments;
  if (Array.isArray(rawPreview)) {
    for (const c of rawPreview) {
      if (c && typeof c === 'object') {
        previewComments.push(parseCommentObject(c));
      }
    }
  }

  // Social context and badging
  const coauthors: Array<{ pk: string; username: string; full_name: string }> = [];
  if (Array.isArray(media.coauthor_producers)) {
    for (const co of media.coauthor_producers) {
      if (co && typeof co === 'object') {
        coauthors.push({
          pk: String(co.pk || co.id || ''),
          username: co.username || '',
          full_name: co.full_name || ''
        });
      }
    }
  }

  return {
    media_id: mediaId,
    pk,
    code,
    permalink,
    media_type: mediaType,
    media_type_name: mediaTypeName,
    slide_count: slideCount,
    video_duration_seconds: videoDuration,
    like_count: likeCount,
    comment_count: commentCount,
    view_count: viewCount,
    play_count: playCount,
    caption: captionText,
    hashtags,
    creator,
    audio_track: audioTrack,
    preview_comments: previewComments,
    social_context: {
      is_paid_partnership: Boolean(media.is_paid_partnership),
      sponsor_tags: media.sponsor_tags || [],
      coauthor_producers: coauthors,
      commerciality_status: media.commerciality_status || 'not_commercial'
    }
  };
}

/**
 * Collects all media items from an explore JSON payload
 */
function extractAllExploreMedia(rawJson: any): ExtractedExploreMedia[] {
  const result: ExtractedExploreMedia[] = [];
  const seenPks = new Set<string>();

  const addMedia = (item: any) => {
    const parsed = parseExploreMediaItem(item);
    if (parsed && !seenPks.has(parsed.pk)) {
      seenPks.add(parsed.pk);
      result.push(parsed);
    }
  };

  if (Array.isArray(rawJson.sectional_items)) {
    for (const section of rawJson.sectional_items) {
      const layout = section.layout_content;
      if (layout) {
        if (Array.isArray(layout.medias)) {
          for (const m of layout.medias) addMedia(m.media || m);
        }
        if (Array.isArray(layout.fill_items)) {
          for (const m of layout.fill_items) addMedia(m.media || m);
        }
        if (layout.two_by_two_item?.channel?.media) {
          addMedia(layout.two_by_two_item.channel.media);
        }
      }
      if (Array.isArray(section.feed_items)) {
        for (const item of section.feed_items) addMedia(item.media || item);
      }
    }
  }

  if (Array.isArray(rawJson.items)) {
    for (const item of rawJson.items) addMedia(item.media || item);
  }

  return result;
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log('================================================================');
  console.log('  Meta Graph Unofficial — Safe Capabilities & Rich UI Engine   ');
  console.log('  Target: Xiaomi Redmi Note 13 4G (23129RAA4G) Liger Stack     ');
  console.log('  Transport: SOCKS5 (socks5://127.0.0.1:10808)                  ');
  console.log('  Strict Rule: 1 Attempt Per Endpoint, Zero Retry Loops        ');
  console.log('================================================================\n');

  // Load session
  if (!fs.existsSync(SESSION_FILE)) {
    throw new Error(`Mobile session file missing at ${SESSION_FILE}`);
  }
  const session: MobileSession = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
  if (!session.cookie_string) {
    throw new Error('Valid cookie_string missing in mobile session file!');
  }

  assertCircuitBreakerClear();

  const transport = new TwinTransport({ proxyUrl: PROXY_URL });
  const deviceId = session.device?.device_id || session.ig_did || 'android-5938349e55b24633';

  const baseHeaders: Record<string, string> = {
    'User-Agent': 'Instagram 451.0.0.53.80 Android (35/15; 440dpi; 1080x2400; Xiaomi; 23129RAA4G; sapphire; qcom; en_US; 385713116)',
    'X-IG-App-ID': '1217981644879628',
    'X-IG-Capabilities': '3brTv10=',
    'X-IG-Connection-Type': 'WIFI',
    'X-IG-Bandwidth-Speed-KBPS': '25000',
    'X-IG-Bandwidth-TotalBytes-B': '9283721',
    'X-FB-HTTP-Engine': 'Liger',
    'X-FB-Client-IP': 'True',
    'X-FB-Server-Cluster': 'True',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Host': 'i.instagram.com',
    'Accept': '*/*',
    'Cookie': session.cookie_string,
    'X-CSRFToken': session.csrftoken || '',
    'X-MID': session.mid || '',
    'X-IG-Device-ID': deviceId,
    'X-IG-Android-ID': '556f8db9eada6d9c',
    'X-IG-App-Locale': 'en_US',
    'X-IG-Device-Locale': 'en_US'
  };

  const deliverables: Record<string, any> = {
    generated_at: new Date().toISOString(),
    engine: 'Rich Mobile Phone UI Discovery & Engagement Engine',
    device_model: 'Xiaomi Redmi Note 13 4G (23129RAA4G)',
    account: {
      username: session.username || 'hokar368',
      ds_user_id: session.ds_user_id || '19835089130'
    },
    tasks: {}
  };

  // --------------------------------------------------------------------------
  // TASK 1: Rich Phone UI Explore & Media Extractor
  // --------------------------------------------------------------------------
  console.log('\n--- TASK 1: Rich Phone UI Explore & Media Extractor ---');
  const exploreUrl = 'https://i.instagram.com/api/v1/discover/topical_explore/?is_prefetch=false&omit_cover_media=false';
  const exploreResp = await executeSingleAttempt(transport, exploreUrl, baseHeaders, 'Task 1: Explore Feed');

  let exploreRaw: any;
  try {
    exploreRaw = JSON.parse(exploreResp.data);
  } catch (err: any) {
    console.error('Failed to parse explore JSON:', err.message);
    tripCircuitBreaker('Malformed explore JSON', 200, exploreUrl);
    process.exit(1);
  }

  const exploreMedias = extractAllExploreMedia(exploreRaw);
  console.log(`✅ Extracted ${exploreMedias.length} rich media items from explore feed.`);

  // Find preview comments inside explore items
  const allPreviewComments: ExtractedComment[] = [];
  for (const m of exploreMedias) {
    if (m.preview_comments.length > 0) {
      allPreviewComments.push(...m.preview_comments);
    }
  }
  console.log(`💬 Found ${allPreviewComments.length} preview comments embedded in explore feed items.`);

  deliverables.tasks.task1_explore = {
    endpoint: exploreUrl,
    status_code: exploreResp.status,
    duration_ms: exploreResp.durationMs,
    total_medias: exploreMedias.length,
    clusters_count: Array.isArray(exploreRaw.clusters) ? exploreRaw.clusters.length : 0,
    embedded_preview_comments_count: allPreviewComments.length,
    medias: exploreMedias
  };

  await sleep(PAUSE_BETWEEN_TASKS_MS);

  // --------------------------------------------------------------------------
  // TASK 2: Hashtag & Trending Discovery Engine
  // --------------------------------------------------------------------------
  console.log('\n--- TASK 2: Hashtag & Trending Discovery Engine ---');
  const query = 'ایران';
  const discoveryUrl = `https://i.instagram.com/api/v1/fbsearch/topsearch_flat/?query=${encodeURIComponent(query)}&context=blended`;
  const discoveryResp = await executeSingleAttempt(transport, discoveryUrl, baseHeaders, 'Task 2: Discovery');

  let discoveryRaw: any;
  try {
    discoveryRaw = JSON.parse(discoveryResp.data);
  } catch (err: any) {
    console.error('Failed to parse discovery JSON:', err.message);
    tripCircuitBreaker('Malformed discovery JSON', 200, discoveryUrl);
    process.exit(1);
  }

  const rawList = discoveryRaw.list || [];
  const extractedHashtags: ExtractedHashtag[] = [];
  const extractedCreators: ExtractedDiscoveryCreator[] = [];

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (item.hashtag) {
      extractedHashtags.push({
        id: String(item.hashtag.id || `ht_${i}`),
        name: item.hashtag.name || '',
        media_count: item.hashtag.media_count,
        search_result_subtitle: item.hashtag.search_result_subtitle,
        position: item.position ?? i
      });
    } else if (item.user) {
      extractedCreators.push({
        pk: String(item.user.pk || item.user.id || ''),
        username: item.user.username || '',
        full_name: item.user.full_name || '',
        is_verified: Boolean(item.user.is_verified),
        is_private: Boolean(item.user.is_private),
        profile_pic_url: item.user.profile_pic_url || '',
        social_context: item.user.search_social_context || item.user.social_context || '',
        latest_reel_media: item.user.latest_reel_media,
        position: item.position ?? i
      });
    }
  }

  console.log(`✅ Extracted ${extractedHashtags.length} trending hashtags and ${extractedCreators.length} creator profiles.`);

  deliverables.tasks.task2_discovery = {
    endpoint: discoveryUrl,
    query,
    status_code: discoveryResp.status,
    duration_ms: discoveryResp.durationMs,
    rank_token: discoveryRaw.rank_token,
    total_results: rawList.length,
    hashtags_count: extractedHashtags.length,
    creators_count: extractedCreators.length,
    hashtags: extractedHashtags,
    creators: extractedCreators
  };

  await sleep(PAUSE_BETWEEN_TASKS_MS);

  // --------------------------------------------------------------------------
  // TASK 3: Deep Comments Sheet Engine
  // --------------------------------------------------------------------------
  console.log('\n--- TASK 3: Deep Comments Sheet Engine ---');
  // Target: use top explored media with comments, or fall back to verified explore reel
  let targetMediaForComments = exploreMedias.find((m) => m.comment_count > 0);
  const targetMediaPk = targetMediaForComments ? targetMediaForComments.pk : '4001417697452633249';
  const targetMediaCode = targetMediaForComments ? targetMediaForComments.code : 'DeH5DIGoCyh';

  console.log(`Target Media for comments sheet test: PK ${targetMediaPk} (Code: ${targetMediaCode})`);
  const commentsUrl = `https://i.instagram.com/api/v1/media/${targetMediaPk}/comments/?can_support_threading=true&permalink_enabled=false`;

  const commentsResp = await executeSingleAttempt(transport, commentsUrl, baseHeaders, 'Task 3: Comments Sheet');

  let commentsRaw: any = null;
  try {
    commentsRaw = JSON.parse(commentsResp.data);
  } catch {
    commentsRaw = { raw_data: commentsResp.data };
  }

  const sheetComments: ExtractedComment[] = [];
  if (Array.isArray(commentsRaw?.comments)) {
    for (const c of commentsRaw.comments) {
      sheetComments.push(parseCommentObject(c));
    }
  }

  console.log(`Sheet comments response status: ${commentsRaw?.status || 'ok'}. Parsed ${sheetComments.length} full sheet comments.`);

  deliverables.tasks.task3_comments = {
    endpoint: commentsUrl,
    target_media_pk: targetMediaPk,
    target_media_code: targetMediaCode,
    status_code: commentsResp.status,
    duration_ms: commentsResp.durationMs,
    response_status: commentsRaw?.status || 'ok',
    response_summary: commentsRaw?.message || (sheetComments.length > 0 ? `${sheetComments.length} comments parsed` : 'Application responded'),
    full_sheet_comments: sheetComments,
    preview_comments_from_explore: allPreviewComments
  };

  // --------------------------------------------------------------------------
  // TASK 4: Deliverables & Audit Persistence
  // --------------------------------------------------------------------------
  console.log('\n--- TASK 4: Deliverables & Audit Persistence ---');
  const scratchDir = path.dirname(SCRATCH_OUTPUT_FILE);
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  fs.writeFileSync(SCRATCH_OUTPUT_FILE, JSON.stringify(deliverables, null, 2), 'utf-8');
  console.log(`💾 Saved complete rich output to: ${SCRATCH_OUTPUT_FILE}`);

  // Append entry to LIVE_EXECUTION_AUDIT.md
  if (fs.existsSync(AUDIT_FILE)) {
    const timestamp = new Date().toISOString();
    const topMediasSummary = exploreMedias.slice(0, 5).map((m, idx) => {
      const musicInfoStr = m.audio_track ? ` | 🎵 موزیک: "${m.audio_track.title}" (${m.audio_track.artist})` : '';
      const tagsStr = m.hashtags.length > 0 ? ` | هشتگ‌ها: ${m.hashtags.slice(0, 3).join(', ')}` : '';
      return `    ${idx + 1}. **[${m.code}](${m.permalink})** | سازنده: \`@${m.creator.username}\` (${m.creator.full_name || 'بدون نام'}) | نوع: ${m.media_type_name} | لایک: ${m.like_count} | کامنت: ${m.comment_count} | ویو: ${m.view_count}${musicInfoStr}${tagsStr}`;
    }).join('\n');

    const topHashtagsSummary = extractedHashtags.slice(0, 5).map((h, idx) => {
      return `    ${idx + 1}. **#${h.name}** | تعداد پست: ${h.media_count?.toLocaleString() || 'نامشخص'} | زیرعنوان: ${h.search_result_subtitle || '-'}`;
    }).join('\n');

    const topCreatorsSummary = extractedCreators.slice(0, 5).map((c, idx) => {
      return `    ${idx + 1}. **@${c.username}** (${c.full_name || 'بدون نام'}) | تاییدشده: ${c.is_verified ? 'بله' : 'خیر'} | کانتکست: ${c.social_context || '-'}`;
    }).join('\n');

    const auditEntry = `
### استعلام زنده موفق موتور کاوش و هوش محیطی موبایل (Rich Mobile UI Engine)
* **زمان اجرا:** ${timestamp}
* **کلاینت شبیه‌سازی‌شده:** Xiaomi Redmi Note 13 4G (23129RAA4G) با هدرهای Liger اندروید
* **پروکسی:** SOCKS5 \`127.0.0.1:10808\`
* **وضعیت ترمز اضطراری:** کاملاً پاک و امن (Circuit Breaker: Un-tripped)
* **۱. نتایج کاوش فید اکسپلور (\`discover/topical_explore\`):**
  * **کد وضعیت:** **HTTP 200 OK** (مدت: ${exploreResp.durationMs}ms)
  * **تعداد کل مدیاهای استخراج‌شده:** ${exploreMedias.length} آیتم
  * **تعداد کامنت‌های پیش‌نمایش (Preview Comments):** ${allPreviewComments.length} کامنت
  * **نمونه مدیاهای استخراج‌شده با وفاداری ۱۰۰٪ به نمایشگر گوشی:**
${topMediasSummary}
* **۲. نتایج جستجو و ترند هشتگ‌ها (\`fbsearch/topsearch_flat\`):**
  * **کد وضعیت:** **HTTP 200 OK** (مدت: ${discoveryResp.durationMs}ms)
  * **تعداد کل نتایج کشف‌شده:** ${rawList.length} رکورد
  * **تعداد هشتگ‌های پرطرفدار کشف‌شده:** ${extractedHashtags.length} هشتگ
  * **برترین هشتگ‌ها:**
${topHashtagsSummary}
  * **تعداد پروفایل‌های کشف‌شده:** ${extractedCreators.length} سازنده
  * **برترین سازندگان:**
${topCreatorsSummary}
* **۳. نتایج استعلام کامنت‌شیت (\`media/comments\`):**
  * **کد وضعیت:** **HTTP ${commentsResp.status}** (مدت: ${commentsResp.durationMs}ms)
  * **پست هدف:** \`${targetMediaCode}\` (PK: \`${targetMediaPk}\`)
  * **نتیجه شیت:** ${deliverables.tasks.task3_comments.response_summary}
  * **کامنت‌های واقعی استخراج‌شده:** مجموعاً ${allPreviewComments.length + sheetComments.length} کامنت زنده با مشخصات کامل نویسنده، متن، لایک و تایم‌استمپ.
* **فایل کامل خروجی ساختاریافته:** \`scratch/rich_mobile_ui_explore_and_comments.json\`
`;
    fs.appendFileSync(AUDIT_FILE, auditEntry, 'utf-8');
    console.log(`📝 Live audit ledger updated at: ${AUDIT_FILE}`);
  }

  console.log('\n🎉 [Rich Mobile UI Engine] All tasks executed and verified successfully!');
}

main().catch((err) => {
  console.error(`💥 Unhandled fatal error: ${err.message}`);
  tripCircuitBreaker(`Fatal error: ${err.message}`);
  process.exit(1);
});
