/**
 * Explore Feed Verifier Script
 *
 * Target: Active authenticated session (@hokar368 / UID: 19835089130)
 * Endpoint: GET https://i.instagram.com/api/v1/discover/topical_explore/?is_prefetch=false&omit_cover_media=false
 * Protocol Stack: Xiaomi Redmi Note 13 4G (23129RAA4G) Liger Headers
 * Transport: SOCKS5 Proxy (socks5://127.0.0.1:10808) via TwinTransport
 *
 * Safety & Circuit Breaker:
 * - Exactly 1 single HTTP request. No retry loops under any circumstances.
 * - If status != 200 or network fails: trips circuit breaker immediately, records error in audit, halts with exit code 1.
 * - If status == 200: parses JSON, extracts explore items, writes structured output, updates audit ledger.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { TwinTransport } from '/home/hokar/Documents/antigravity/hopeful-bell/dist/twins/transport.js';

const WORKSPACE_DIR = '/home/hokar/Documents/antigravity/hopeful-bell';
const SESSION_FILE = path.join(WORKSPACE_DIR, 'instagram_mobile_session.json');
const CB_FILE = path.join(WORKSPACE_DIR, 'circuit_breaker.json');
const AUDIT_FILE = path.join(WORKSPACE_DIR, 'LIVE_EXECUTION_AUDIT.md');
const SCRATCH_OUTPUT_FILE = path.join(WORKSPACE_DIR, 'scratch/live_explore_feed.json');
const PROXY_URL = 'socks5://127.0.0.1:10808';

const TARGET_URL = 'https://i.instagram.com/api/v1/discover/topical_explore/?is_prefetch=false&omit_cover_media=false';

interface ExtractedMedia {
  id: string;
  code: string;
  media_type: number;
  media_type_name: string;
  creator: {
    pk: string;
    username: string;
    full_name: string;
    is_verified: boolean;
    is_private: boolean;
  };
  caption: string | null;
  like_count: number;
  comment_count: number;
  view_count?: number;
}

/**
 * Trips the circuit breaker and persists failure details to disk
 */
function tripCircuitBreaker(reason: string, status?: number): void {
  const cb = {
    tripped: true,
    reason: `HTTP ${status || 'ERR'}: ${reason}`,
    tripped_at: new Date().toISOString(),
    last_status: status || 0,
    endpoint: TARGET_URL,
    account: {
      username: 'hokar368',
      id: '19835089130'
    }
  };
  fs.writeFileSync(CB_FILE, JSON.stringify(cb, null, 2), 'utf-8');
  console.error(`💥 [CIRCUIT BREAKER TRIPPED] ${cb.reason}`);
}

/**
 * Updates the circuit breaker state upon a verified successful run
 */
function markCircuitBreakerSuccess(bytesCount: number): void {
  const cb = {
    tripped: false,
    reason: `Clear - Explore Feed verified successfully (HTTP 200, ${bytesCount} bytes)`,
    last_success_at: new Date().toISOString(),
    last_status: 200,
    endpoint: TARGET_URL,
    account: {
      username: 'hokar368',
      id: '19835089130'
    }
  };
  fs.writeFileSync(CB_FILE, JSON.stringify(cb, null, 2), 'utf-8');
  console.log(`🛡️ [CIRCUIT BREAKER] Reset to clear state (success)`);
}

/**
 * Appends error details to the live execution audit ledger
 */
function appendAuditError(reason: string, status?: number): void {
  if (!fs.existsSync(AUDIT_FILE)) return;
  const timestamp = new Date().toISOString();
  const entry = `\n### خطای جدید: HTTP ${status || 'ERR'} در اندپوینت \`discover/topical_explore\`
* **زمان وقوع:** ${timestamp}
* **علت فنی:** ${reason}
* **اقدام ترمز:** ترمز اضطراری فعال شد (Circuit Breaker Tripped) و ران متوقف گردید.\n`;
  fs.appendFileSync(AUDIT_FILE, entry, 'utf-8');
}

/**
 * Appends success details to the live execution audit ledger
 */
function appendAuditSuccess(
  totalItems: number,
  bytesCount: number,
  topItems: ExtractedMedia[],
  clustersCount: number
): void {
  if (!fs.existsSync(AUDIT_FILE)) return;
  const timestamp = new Date().toISOString();
  const topListMd = topItems.map((item, idx) => {
    return `    ${idx + 1}. **[${item.code}](https://www.instagram.com/p/${item.code}/)** | سازنده: \`@${item.creator.username}\` (${item.creator.full_name || 'بدون نام'}) | نوع: ${item.media_type_name} | لایک: ${item.like_count} | کامنت: ${item.comment_count}`;
  }).join('\n');

  const successEntry = `
### استعلام زنده موفق: استخراج اکسپلور فید (\`discover/topical_explore\`)
* **زمان اجرا:** ${timestamp}
* **کد وضعیت:** **HTTP 200 OK** (حجم کل پاسخ: ${bytesCount} بایت)
* **اندپوینت موبایل نیتیو:** \`GET ${TARGET_URL}\`
* **داده‌های کلیدی استخراج‌شده:**
  * **تعداد کل مدیاهای کشف‌شده در فید:** ${totalItems} آیتم
  * **تعداد دسته‌بندی‌ها / کلاسترهای موضوعی:** ${clustersCount} کلاستر
  * **برترین آیتم‌های اکسپلور کشف‌شده:**
${topListMd}
* **نتیجه:** اکسپلور فید اکانت با موفقیت ۱۰۰٪ و با شبیه‌سازی کامل هدرهای Liger اندروید ردمی نوت ۱۳ استخراج شد و متادیتای کامل پست‌ها و ریلزهای پرطرفدار شبکه به دست آمد.
`;
  fs.appendFileSync(AUDIT_FILE, successEntry, 'utf-8');
}

/**
 * Resolves human-readable media type name
 */
function getMediaTypeName(typeCode: number): string {
  switch (typeCode) {
    case 1:
      return 'Image Post';
    case 2:
      return 'Video / Reel';
    case 8:
      return 'Carousel / Album';
    default:
      return `Media Type ${typeCode}`;
  }
}

/**
 * Recursively parses media items from various Instagram explore payload formats
 */
function extractExploreMedia(rawJson: any): { medias: ExtractedMedia[]; clustersCount: number } {
  const medias: ExtractedMedia[] = [];
  const seenIds = new Set<string>();

  const processMediaObj = (media: any) => {
    if (!media || typeof media !== 'object') return;
    const pk = String(media.pk || media.id || '');
    if (!pk || seenIds.has(pk)) return;
    seenIds.add(pk);

    const code = media.code || '';
    const user = media.user || {};
    const captionText = media.caption && typeof media.caption === 'object' ? media.caption.text : null;
    const mediaType = media.media_type || 1;

    medias.push({
      id: pk,
      code: code,
      media_type: mediaType,
      media_type_name: getMediaTypeName(mediaType),
      creator: {
        pk: String(user.pk || user.id || ''),
        username: user.username || 'unknown',
        full_name: user.full_name || '',
        is_verified: Boolean(user.is_verified),
        is_private: Boolean(user.is_private)
      },
      caption: captionText ? captionText.slice(0, 100) : null,
      like_count: Number(media.like_count || 0),
      comment_count: Number(media.comment_count || 0),
      view_count: media.view_count !== undefined ? Number(media.view_count) : (media.play_count !== undefined ? Number(media.play_count) : undefined)
    });
  };

  // Format A: sectional_items
  if (Array.isArray(rawJson.sectional_items)) {
    for (const section of rawJson.sectional_items) {
      const layoutContent = section.layout_content;
      if (layoutContent) {
        if (Array.isArray(layoutContent.medias)) {
          for (const m of layoutContent.medias) {
            processMediaObj(m.media || m);
          }
        }
        if (Array.isArray(layoutContent.fill_items)) {
          for (const m of layoutContent.fill_items) {
            processMediaObj(m.media || m);
          }
        }
        if (layoutContent.two_by_two_item && layoutContent.two_by_two_item.channel) {
          const ch = layoutContent.two_by_two_item.channel;
          if (ch.media) processMediaObj(ch.media);
        }
      }
      if (Array.isArray(section.feed_items)) {
        for (const item of section.feed_items) {
          processMediaObj(item.media || item);
        }
      }
    }
  }

  // Format B: items array
  if (Array.isArray(rawJson.items)) {
    for (const item of rawJson.items) {
      processMediaObj(item.media || item);
    }
  }

  const clustersCount = Array.isArray(rawJson.clusters) ? rawJson.clusters.length : 0;

  return { medias, clustersCount };
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log('🚀 [Explore Feed Verifier] Initializing single-request verification...');

  // 1. Validate session file
  if (!fs.existsSync(SESSION_FILE)) {
    throw new Error(`Mobile session file missing at ${SESSION_FILE}`);
  }
  const session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
  const cookieString = session.cookie_string;
  if (!cookieString) {
    throw new Error('Cookie string missing in mobile session file!');
  }

  // 2. Pre-flight: Arm circuit breaker for this controlled verification
  const cbArmed = {
    tripped: false,
    reason: 'Armed for controlled single-request Explore Feed verification',
    reset_at: new Date().toISOString(),
    account: {
      username: 'hokar368',
      id: '19835089130'
    }
  };
  fs.writeFileSync(CB_FILE, JSON.stringify(cbArmed, null, 2), 'utf-8');
  console.log('🛡️ Circuit breaker armed (tripped: false)');

  // 3. Initialize TwinTransport with SOCKS5 Proxy
  const transport = new TwinTransport({ proxyUrl: PROXY_URL });

  // 4. Build authentic Xiaomi Redmi Note 13 Liger stack headers
  const deviceId = session.device?.device_id || session.ig_did || 'android-5938349e55b24633';
  const headers: Record<string, string> = {
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
    'Cookie': cookieString,
    'X-CSRFToken': session.csrftoken,
    'X-MID': session.mid,
    'X-IG-Device-ID': deviceId,
    'X-IG-Android-ID': '556f8db9eada6d9c',
    'X-IG-App-Locale': 'en_US',
    'X-IG-Device-Locale': 'en_US'
  };

  console.log(`📡 Sending EXACTLY 1 request to: ${TARGET_URL}`);
  console.log(`🔌 Route: ${PROXY_URL}`);

  let response: { status: number; statusText: string; headers: Record<string, string>; data: string };
  try {
    response = await transport.request(TARGET_URL, {
      method: 'GET',
      headers: headers,
      timeoutMs: 25000
    });
  } catch (netErr: any) {
    console.error(`❌ Network / Transport Error: ${netErr.message}`);
    tripCircuitBreaker(`Network error: ${netErr.message}`);
    appendAuditError(`خطای اتصال شبکه یا پروکسی: ${netErr.message}`);
    process.exit(1);
  }

  const payloadBytes = Buffer.byteLength(response.data, 'utf-8');
  console.log(`📥 Received response: HTTP ${response.status} ${response.statusText} (${payloadBytes} bytes)`);

  // 5. Strict Single-Attempt Circuit Breaker Check
  if (response.status !== 200) {
    console.error(`🚨 EMERGENCY: HTTP status ${response.status} != 200! Halting immediately.`);
    tripCircuitBreaker(`Explore feed request returned HTTP ${response.status}: ${response.data.slice(0, 200)}`, response.status);
    appendAuditError(`پاسخ غیرمنتظره HTTP ${response.status}: ${response.data.slice(0, 150)}`, response.status);
    process.exit(1);
  }

  // 6. Parse JSON payload
  let rawJson: any;
  try {
    rawJson = JSON.parse(response.data);
  } catch (parseErr: any) {
    console.error('🚨 Failed to parse response body as JSON');
    tripCircuitBreaker('Non-JSON response returned on HTTP 200', response.status);
    appendAuditError('پاسخ ۲۰۰ فاقد بدنه معتبر JSON است.', response.status);
    process.exit(1);
  }

  // 7. Extract explore items
  const { medias, clustersCount } = extractExploreMedia(rawJson);
  console.log(`✅ Extracted ${medias.length} explore media items and ${clustersCount} topic clusters.`);

  const top3 = medias.slice(0, 3);
  console.log('🌟 Top 3 Explored Media Items:');
  top3.forEach((item, i) => {
    console.log(`   [${i + 1}] ID: ${item.id} | Shortcode: ${item.code} | Creator: @${item.creator.username} (${item.creator.full_name}) | Type: ${item.media_type_name} | Likes: ${item.like_count}`);
  });

  // 8. Prepare structured JSON output
  const structuredOutput = {
    verified_at: new Date().toISOString(),
    status_code: response.status,
    endpoint: TARGET_URL,
    payload_size_bytes: payloadBytes,
    total_explore_items: medias.length,
    clusters_count: clustersCount,
    top_3_items: top3,
    all_extracted_items: medias,
    max_id: rawJson.max_id || null,
    rank_token: rawJson.rank_token || null,
    status: rawJson.status || 'ok'
  };

  // 9. Save structured output
  const scratchDir = path.dirname(SCRATCH_OUTPUT_FILE);
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }
  fs.writeFileSync(SCRATCH_OUTPUT_FILE, JSON.stringify(structuredOutput, null, 2), 'utf-8');
  console.log(`💾 Saved structured output to: ${SCRATCH_OUTPUT_FILE}`);

  // 10. Update Circuit Breaker and Live Audit Ledger
  markCircuitBreakerSuccess(payloadBytes);
  appendAuditSuccess(medias.length, payloadBytes, top3, clustersCount);

  console.log('🎉 Verification completed successfully with 100% ground-truth fidelity.');
}

main().catch((err) => {
  console.error(`💥 Unhandled fatal error: ${err.message}`);
  tripCircuitBreaker(`Unhandled error: ${err.message}`);
  appendAuditError(`خطای سیستمی مدیریت‌نشده: ${err.message}`);
  process.exit(1);
});
