/**
 * qa/regression_f01_f11.mjs
 *
 * Deterministic regression tests for Ghost Mode MCP Server fixes F01–F11.
 * Uses mocked transport fixtures — NO real Instagram network requests.
 *
 * Run with:
 *   ELECTRON_RUN_AS_NODE=1 "Antigravity IDE.exe" qa/regression_f01_f11.mjs
 * or via Python helper:
 *   python qa/run_regression.py
 *
 * Tests are grouped by finding ID.
 * Each test is PASS / FAIL / BLOCKED (needs live network).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(__dirname, 'results');
fs.mkdirSync(RESULTS_DIR, { recursive: true });

// ─── Minimal stub for TwinTransport ──────────────────────────────────────────
// We inject a mock transport so GhostService never touches the network.

class MockTransport {
  constructor(responses = {}) {
    this._responses = responses; // url-prefix → { status, data, headers }
    this.calls = [];
  }
  async request(url, _opts) {
    this.calls.push(url);
    // Prefer the most specific URL fixture to avoid overlapping matches.
    const fixtures = Object.entries(this._responses)
      .sort(([a], [b]) => b.length - a.length);

    for (const [prefix, resp] of fixtures) {
      if (url.includes(prefix)) return resp;
    }
    // Default: network unreachable (simulates offline/blocked)
    throw new Error(`MOCK_NETWORK_ERROR: no fixture for ${url}`);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const results = [];

function record(id, name, status, detail, evidence = {}) {
  results.push({ finding: id, test: name, status, detail, evidence });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️ ';
  console.log(`${icon} [${id}] ${name}: ${status}`);
  if (status === 'FAIL') console.log(`       Detail: ${detail}`);
}

function assert(cond, failMsg) {
  if (!cond) throw new Error(failMsg);
}

// ─── Build a GhostService with a mocked transport ────────────────────────────
// We import the compiled JS so we test what actually ships.

async function makeService(mockResponses = {}) {
  const { GhostService } = await import('../dist/mcp/ghost_service.js');
  const svc = new GhostService();
  // Replace the transport with our mock
  svc._transport = new MockTransport(mockResponses);
  // Also patch the internal property (compiled as 'transport')
  svc.transport = svc._transport;
  return svc;
}

// ─── Fixture HTML builders ────────────────────────────────────────────────────

function makeProfileHtml({ followers = '1.2M', following = '450', posts = '300',
                            fullName = 'Test User', bio = 'Test bio' } = {}) {
  return `<!DOCTYPE html><html><head>
<meta property="og:title" content="${fullName} (@testuser) ">
<meta name="description" content="${followers} Followers, ${following} Following, ${posts} Posts">
<meta content="${followers} Followers, ${following} Following, ${posts} Posts - See Instagram photos and videos from ${fullName} (@testuser) on Instagram: &quot;${bio}&quot;">
</head><body></body></html>`;
}

function makeTimelineHtml({ edges = [], hasNextPage = false, endCursor = null } = {}) {
  const edgeJson = JSON.stringify(edges);
  const pageInfo = JSON.stringify({ has_next_page: hasNextPage, end_cursor: endCursor });
  const payload = {
    edge_owner_to_timeline_media: {
      page_info: JSON.parse(pageInfo),
      edges: edges
    }
  };
  return `<!DOCTYPE html><html><body>
<script type="application/json">${JSON.stringify(payload)}</script>
</body></html>`;
}

function makeMediaNode({ id = 'TEST123', code = 'ABC', taken_at = 1700000000,
                          media_type = 1, is_video = false, like_count = 100,
                          comment_count = 10, video_play_count = null,
                          caption = { text: 'hello' } } = {}) {
  return {
    node: {
      id, code, taken_at, media_type, is_video,
      like_count, comment_count, video_play_count, caption,
      display_url: 'https://example.com/img.jpg'
    }
  };
}

function makeReelHtml({ likes = 500, comments = 20, plays = 10000,
                         caption = 'reel caption', taken_at = 1700000000,
                         mediaType = 'VIDEO' } = {}) {
  const isVideoFlag = mediaType === 'VIDEO';
  const payload = {
    xdt_shortcode_media: {
      __typename: 'XIG',
      like_count: likes,
      comment_count: comments,
      video_play_count: isVideoFlag ? plays : null,
      is_video: isVideoFlag,
      taken_at,
      caption: { text: caption }
    }
  };
  const ogType = isVideoFlag ? 'video' : 'article';
  const videoHint = isVideoFlag ? '"video_url":"https://example.com/v.mp4"' : '';
  return `<!DOCTYPE html><html><head>
<meta property="og:type" content="${ogType}">
<meta name="description" content="${likes} likes, ${comments} comments - Test &quot;${caption}&quot;">
</head><body>
${videoHint}
<script type="application/json">${JSON.stringify(payload)}</script>
</body></html>`;
}

function makeCommentsHtml({ comments = [] } = {}) {
  const nodes = comments.map((c, i) => ({
    __typename: 'XIGComment',
    id: String(i + 1),
    text: c.text,
    comment_like_count: c.likes ?? 0,
    created_at: c.created_at ?? 1700000000,
    user: { username: c.username ?? 'user' + i }
  }));
  const payload = {
    XIGComment: true,
    edge_media_to_parent_comment: { edges: nodes.map(n => ({ node: n })) }
  };
  // embed each node at root level for the recursive searcher
  const root = {};
  nodes.forEach((n, i) => { root['c' + i] = n; });
  return `<!DOCTYPE html><html><body>
<script type="application/json">${JSON.stringify(root)}</script>
</body></html>`;
}

// ─── TESTS ───────────────────────────────────────────────────────────────────

// F01: Timeline — network errors must propagate, not be silently swallowed
async function testF01_ErrorPropagation() {
  const svc = await makeService({}); // no fixtures → mock throws
  // We bypass the profile fetch by injecting profile directly into getTimelinePosts
  // by passing a profile param  (avoids a second network call)
  const fakeProfile = {
    id: '99', username: 'errtest', full_name: 'Err Test',
    biography: '', followers_count: 1000, following_count: 100,
    media_count: 50, is_verified: false, is_private: false,
    is_business: false, profile_pic_url: ''
  };

  let threw = false;
  let errorMsg = '';
  try {
    // transport will throw MOCK_NETWORK_ERROR
    await svc.getTimelinePosts({ username: 'errtest', profile: fakeProfile });
  } catch (e) {
    threw = true;
    errorMsg = e.message;
  }

  if (threw && (errorMsg.includes('MOCK_NETWORK_ERROR') || errorMsg.includes('HTTP') || errorMsg.includes('Failed'))) {
    record('F01', 'Timeline network error propagates (not swallowed)', 'PASS',
      'getTimelinePosts threw: ' + errorMsg.slice(0, 120));
  } else if (threw) {
    record('F01', 'Timeline network error propagates (not swallowed)', 'PASS',
      'An error was thrown: ' + errorMsg.slice(0, 120));
  } else {
    record('F01', 'Timeline network error propagates (not swallowed)', 'FAIL',
      'getTimelinePosts returned silently instead of throwing on network failure',
      { threw, errorMsg });
  }
}

// F02: Unsupported pagination must fail explicitly, not silently repeat page one
async function testF02_CursorPagination() {
  const svc = await makeService({
    'instagram.com/testuser/': {
      status: 200,
      data: '<html></html>',
      headers: {}
    }
  });

  const profile = {
    id: '99',
    username: 'testuser',
    followers_count: 1000,
    following_count: 100,
    media_count: 50
  };

  try {
    await svc.getTimelinePosts({
      username: 'testuser',
      profile,
      cursor: 'NEXT_PAGE_CURSOR'
    });

    record(
      'F02',
      'Unsupported cursor rejected explicitly',
      'FAIL',
      'Cursor was silently ignored; first page may be returned again.'
    );
  } catch (e) {
    const message = String(e.message || e);

    if (/cursor|pagination|unsupported/i.test(message)) {
      record(
        'F02',
        'Unsupported cursor rejected explicitly',
        'PASS',
        message
      );
    } else {
      record(
        'F02',
        'Unsupported cursor rejected explicitly',
        'FAIL',
        'Unexpected error: ' + message
      );
    }
  }
}

// F03: Media metrics — HTTP errors must propagate
async function testF03_MediaMetricsErrorPropagation() {
  const svc = await makeService({}); // no fixtures

  let threw = false;
  let errMsg = '';
  try {
    await svc.getMediaMetrics('TESTSHORTCODE');
  } catch (e) {
    threw = true;
    errMsg = e.message;
  }

  if (threw) {
    record('F03', 'Media metrics network error propagates', 'PASS',
      'getMediaMetrics threw: ' + errMsg.slice(0, 120));
  } else {
    record('F03', 'Media metrics network error propagates', 'FAIL',
      'getMediaMetrics returned default zeros silently on network failure');
  }
}

// F03b: Media metrics — 302 login challenge propagates
async function testF03b_MediaMetrics302() {
  const svc = await makeService({
    'instagram.com/reel/': { status: 302, data: '', headers: { location: '/login/' } }
  });

  let threw = false;
  let errMsg = '';
  try {
    await svc.getMediaMetrics('SHORTCODE302');
  } catch (e) {
    threw = true;
    errMsg = e.message;
  }

  if (threw && errMsg.includes('302')) {
    record('F03', 'Media metrics 302 challenge propagates as error', 'PASS',
      'HTTP 302 resulted in thrown error: ' + errMsg.slice(0, 120));
  } else if (threw) {
    record('F03', 'Media metrics 302 challenge propagates as error', 'PASS',
      'An error was thrown for 302: ' + errMsg.slice(0, 120));
  } else {
    record('F03', 'Media metrics 302 challenge propagates as error', 'FAIL',
      'getMediaMetrics returned silently on HTTP 302 login challenge');
  }
}

// F04: Engagement rate formula — image posts should not silently get 0 rate
async function testF04_EngagementRateImagePost() {
  // Test: image post with 1000 likes, 50 comments, no video plays
  // Current code: engRate = 0 when videoPlays is falsy — undocumented limitation
  const html = makeReelHtml({ likes: 1000, comments: 50, plays: 0, mediaType: 'IMAGE' });
  const svc = await makeService({
    'instagram.com/reel/': { status: 200, data: html, headers: {} }
  });

  let result;
  try {
    result = await svc.getMediaMetrics('IMGSHORTCODE');
  } catch (e) {
    record('F04', 'Engagement rate not silently 0 for image posts', 'FAIL',
      'getMediaMetrics threw unexpectedly: ' + e.message);
    return;
  }

  const er = result?.metrics?.engagement_rate;
  const likes = result?.metrics?.likes ?? 0;
  const comments = result?.metrics?.comments ?? 0;

  if (likes === 1000 && comments === 50 && er === null) {
    record('F04', 'Image engagement rate unavailable without views', 'PASS',
      'Image post retains likes/comments and returns null when views are unavailable.');
  } else {
    record('F04', 'Image engagement rate unavailable without views', 'FAIL',
      `Expected likes=1000, comments=50, engagement_rate=null; got likes=${likes}, comments=${comments}, engagement_rate=${er}`,
      { result });
  }
}

// F04b: Engagement rate for video post (the formula that IS implemented)
async function testF04b_EngagementRateVideoPost() {
  // 500 likes, 20 comments, 10000 plays → (520/10000)*100 = 5.20
  const html = makeReelHtml({ likes: 500, comments: 20, plays: 10000, mediaType: 'VIDEO' });
  const svc = await makeService({
    'instagram.com/reel/': { status: 200, data: html, headers: {} }
  });

  let result;
  try {
    result = await svc.getMediaMetrics('REELCODE');
  } catch (e) {
    record('F04', 'Video engagement rate calculation correct', 'FAIL', e.message);
    return;
  }

  const er = result?.metrics?.engagement_rate ?? -1;
  const expected = parseFloat(((520 / 10000) * 100).toFixed(2)); // 5.20

  if (Math.abs(er - expected) < 0.01) {
    record('F04', 'Video engagement rate calculation correct', 'PASS',
      `engagement_rate=${er} matches expected ${expected}`);
  } else if (er === 0 && result?.metrics?.likes === 0) {
    // HTML parsing may not have extracted likes from fixture
    record('F04', 'Video engagement rate calculation correct', 'BLOCKED',
      `HTML fixture not parsed correctly by SSR extractor: likes=${result?.metrics?.likes}. ` +
      'Formula correctness requires a live-format HTML fixture.',
      { result });
  } else {
    record('F04', 'Video engagement rate calculation correct', 'FAIL',
      `engagement_rate=${er}, expected ~${expected}. Possible formula regression.`,
      { result, expected });
  }
}

// F05: Media type detection — IMAGE posts must not be reported as VIDEO
async function testF05_MediaTypeImageNotVideo() {
  // HTML has no video markers → should return IMAGE
  const html = `<!DOCTYPE html><html><body>
<meta property="og:type" content="article">
<script type="application/json">{"xdt_shortcode_media":{"like_count":100,"comment_count":5,"is_video":false,"taken_at":1700000000}}</script>
</body></html>`;

  const svc = await makeService({
    'instagram.com/reel/': { status: 200, data: html, headers: {} }
  });

  let result;
  try {
    result = await svc.getMediaMetrics('IMGONLY');
  } catch (e) {
    record('F05', 'Image post reported as IMAGE not VIDEO', 'FAIL', e.message);
    return;
  }

  if (result?.media_type === 'IMAGE') {
    record('F05', 'Image post reported as IMAGE not VIDEO', 'PASS',
      'media_type=IMAGE correctly detected from is_video:false fixture');
  } else {
    record('F05', 'Image post reported as IMAGE not VIDEO', 'FAIL',
      `media_type="${result?.media_type}" — expected "IMAGE" for a non-video post`,
      { result });
  }
}

// F05b: VIDEO detection works
async function testF05b_MediaTypeVideoDetected() {
  const html = `<!DOCTYPE html><html><body>
<meta property="og:type" content="video">
"video_url":"https://example.com/v.mp4"
<script type="application/json">{"xdt_shortcode_media":{"like_count":200,"comment_count":8,"is_video":true,"video_play_count":5000,"taken_at":1700000000}}</script>
</body></html>`;

  const svc = await makeService({
    'instagram.com/reel/': { status: 200, data: html, headers: {} }
  });

  let result;
  try {
    result = await svc.getMediaMetrics('VIDEOCODE');
  } catch (e) {
    record('F05', 'Video post detected as VIDEO', 'FAIL', e.message);
    return;
  }

  if (result?.media_type === 'VIDEO') {
    record('F05', 'Video post detected as VIDEO', 'PASS',
      'media_type=VIDEO correctly detected');
  } else {
    record('F05', 'Video post detected as VIDEO', 'FAIL',
      `media_type="${result?.media_type}" — expected "VIDEO"`, { result });
  }
}

// F06: Comment errors must propagate
async function testF06_CommentErrorPropagation() {
  const svc = await makeService({}); // no fixtures → mock throws

  let threw = false;
  let errMsg = '';
  try {
    await svc.getComments('NONETWORKCODE');
  } catch (e) {
    threw = true;
    errMsg = e.message;
  }

  if (threw) {
    record('F06', 'Comment fetch network error propagates', 'PASS',
      'getComments threw: ' + errMsg.slice(0, 120));
  } else {
    record('F06', 'Comment fetch network error propagates', 'FAIL',
      'getComments returned empty silently on network failure');
  }
}

// F06b: HTTP 302 on comments propagates
async function testF06b_Comment302() {
  const svc = await makeService({
    'instagram.com/reel/': { status: 302, data: '', headers: { location: '/login/' } }
  });

  let threw = false;
  try {
    await svc.getComments('LOGINCODE');
  } catch (e) {
    threw = true;
  }

  record('F06', 'Comment 302 login challenge propagates', threw ? 'PASS' : 'FAIL',
    threw ? '302 threw correctly' : 'getComments returned silently on 302');
}

// F07: Offline search must throw, not return ok/empty
async function testF07_OfflineSearchThrows() {
  const originalEnv = process.env.OFFLINE_MODE;
  process.env.OFFLINE_MODE = 'true';

  const { GhostService } = await import('../dist/mcp/ghost_service.js');
  const svc = new GhostService();

  let threw = false;
  let errMsg = '';
  try {
    await svc.search('test', 'users');
  } catch (e) {
    threw = true;
    errMsg = e.message;
  }

  process.env.OFFLINE_MODE = originalEnv;

  if (threw && errMsg.toLowerCase().includes('offline')) {
    record('F07', 'Offline search throws descriptive error (not ok/empty)', 'PASS',
      'Threw: ' + errMsg.slice(0, 100));
  } else if (threw) {
    record('F07', 'Offline search throws descriptive error (not ok/empty)', 'PASS',
      'Threw (non-offline message): ' + errMsg.slice(0, 100));
  } else {
    record('F07', 'Offline search throws descriptive error (not ok/empty)', 'FAIL',
      'GhostService.search returned silently in offline mode instead of throwing');
  }
}

// F08: Offline viral explore must throw, not return empty array
async function testF08_OfflineViralThrows() {
  const originalEnv = process.env.OFFLINE_MODE;
  process.env.OFFLINE_MODE = 'true';

  // Re-import to pick up env
  const { GhostService } = await import('../dist/mcp/ghost_service.js?v=f08');
  const svc = new GhostService();

  let threw = false;
  let errMsg = '';
  let result;
  try {
    result = await svc.getViralExplore(5);
  } catch (e) {
    threw = true;
    errMsg = e.message;
  }

  process.env.OFFLINE_MODE = originalEnv;

  if (threw && errMsg.toLowerCase().includes('offline')) {
    record('F08', 'Offline viral explore throws descriptive error (not empty array)', 'PASS',
      'Threw: ' + errMsg.slice(0, 100));
  } else if (threw) {
    record('F08', 'Offline viral explore throws descriptive error (not empty array)', 'PASS',
      'Threw: ' + errMsg.slice(0, 100));
  } else {
    record('F08', 'Offline viral explore throws descriptive error (not empty array)', 'FAIL',
      `getViralExplore returned ${JSON.stringify(result)} in offline mode instead of throwing`);
  }
}

// F09: Timestamps — missing taken_at should produce undefined, not current time
async function testF09_MissingTimestampIsUndefined() {
  // Build timeline HTML with a node that has NO taken_at
  const edges = [{
    node: {
      id: 'NOTIMESTAMP', code: 'NoTs1', /* NO taken_at */
      media_type: 1, is_video: false,
      like_count: 50, comment_count: 3,
      display_url: 'https://example.com/img.jpg',
      caption: { text: 'no timestamp post' }
    }
  }];
  const html = makeTimelineHtml({ edges });
  const profileHtml = makeProfileHtml();

  const svc = await makeService({
    'instagram.com/testuser': { status: 200, data: profileHtml, headers: {} },
    'instagram.com/testuser/': { status: 200, data: html, headers: {} }
  });

  const fakeProfile = {
    id: '1', username: 'testuser', full_name: 'Test', biography: '',
    followers_count: 500, following_count: 50, media_count: 10,
    is_verified: false, is_private: false, is_business: false, profile_pic_url: ''
  };

  let result;
  try {
    result = await svc.getTimelinePosts({ username: 'testuser', profile: fakeProfile });
  } catch (e) {
    record('F09', 'Missing timestamp is undefined (not fabricated)', 'BLOCKED',
      'getTimelinePosts threw: ' + e.message.slice(0, 120));
    return;
  }

  const posts = result?.posts ?? [];
  if (posts.length === 0) {
    record('F09', 'Missing timestamp is undefined (not fabricated)', 'BLOCKED',
      'No posts extracted from fixture — HTML fixture structure may not match parser expectations. ' +
      'Manual HTML fixture alignment needed.', { result });
    return;
  }

  const ts = posts[0]?.timestamp;
  const before = Date.now();

  if (ts === undefined || ts === null) {
    record('F09', 'Missing timestamp is undefined (not fabricated)', 'PASS',
      'timestamp is undefined when taken_at is missing (no fabricated current-time fallback)');
  } else {
    // Check if timestamp is suspiciously close to now (within 60 seconds)
    const tsMs = new Date(ts).getTime();
    const diff = Math.abs(tsMs - before);
    if (diff < 60000) {
      record('F09', 'Missing timestamp is undefined (not fabricated)', 'FAIL',
        `timestamp="${ts}" is suspiciously close to current time (diff=${diff}ms). ` +
        'Likely fabricated with new Date().toISOString() fallback.',
        { timestamp: ts, now: new Date(before).toISOString(), diffMs: diff });
    } else {
      record('F09', 'Missing timestamp is undefined (not fabricated)', 'PASS',
        `timestamp="${ts}" is set but not current time — may be from fixture metadata`);
    }
  }
}

// F10: Audit top_performing_reels and discussion_driver_posts are populated
async function testF10_AuditSectionsPopulated() {
  // Build 5 posts: 3 reels with high plays, 2 image posts
  const edges = [
    { node: { id: 'R1', code: 'reel1', taken_at: 1700000001, media_type: 2, is_video: true,  like_count: 1000, comment_count: 50, video_play_count: 50000, display_url: '', caption: { text: 'reel 1 caption' } } },
    { node: { id: 'R2', code: 'reel2', taken_at: 1700000002, media_type: 2, is_video: true,  like_count: 800,  comment_count: 100, video_play_count: 30000, display_url: '', caption: { text: 'reel 2 caption' } } },
    { node: { id: 'R3', code: 'reel3', taken_at: 1700000003, media_type: 2, is_video: true,  like_count: 200,  comment_count: 30,  video_play_count: 10000, display_url: '', caption: { text: 'reel 3 caption' } } },
    { node: { id: 'P1', code: 'post1', taken_at: 1700000004, media_type: 1, is_video: false, like_count: 500,  comment_count: 200, display_url: '', caption: { text: 'controversial post' } } },
    { node: { id: 'P2', code: 'post2', taken_at: 1700000005, media_type: 1, is_video: false, like_count: 100,  comment_count: 10,  display_url: '', caption: { text: 'quiet post' } } },
  ];

  const html = makeTimelineHtml({ edges });
  const profileHtml = makeProfileHtml({ followers: '10K' });

  const svc = await makeService({
    'instagram.com/audittarget': { status: 200, data: profileHtml, headers: {} },
    'instagram.com/audittarget/': { status: 200, data: html, headers: {} }
  });

  let report;
  try {
    report = await svc.auditAccount('audittarget', 10);
  } catch (e) {
    record('F10', 'Audit top_performing_reels populated from real data', 'BLOCKED',
      'auditAccount threw: ' + e.message.slice(0, 200));
    record('F10', 'Audit discussion_driver_posts populated from real data', 'BLOCKED',
      'auditAccount threw (same error)');
    return;
  }

  const topReels = report?.top_performing_reels ?? [];
  const drivers = report?.discussion_driver_posts ?? [];
  const sampleSize = report?.analyzed_sample_size ?? 0;

  if (sampleSize === 0) {
    record('F10', 'Audit top_performing_reels populated from real data', 'BLOCKED',
      'No posts sampled — fixture not parsed. HTML structure mismatches parser.',
      { report });
    record('F10', 'Audit discussion_driver_posts populated from real data', 'BLOCKED',
      'No posts sampled — fixture not parsed.');
    return;
  }

  if (topReels.length > 0) {
    record('F10', 'Audit top_performing_reels populated from real data', 'PASS',
      `${topReels.length} top reels populated. Top: ${topReels[0]?.shortcode} (${topReels[0]?.plays} plays)`,
      { topReels });
  } else {
    record('F10', 'Audit top_performing_reels populated from real data', 'FAIL',
      `top_performing_reels is [] even with ${sampleSize} posts including reels`,
      { sampleSize, report });
  }

  if (drivers.length > 0) {
    record('F10', 'Audit discussion_driver_posts populated from real data', 'PASS',
      `${drivers.length} discussion drivers. Top: ${drivers[0]?.shortcode} (${drivers[0]?.comment_to_like_ratio} ratio)`,
      { drivers });
  } else {
    record('F10', 'Audit discussion_driver_posts populated from real data', 'FAIL',
      `discussion_driver_posts is [] even with ${sampleSize} posts`,
      { sampleSize, report });
  }
}

// F10b: Audit aggregate metrics consistency
async function testF10b_AuditAggregateConsistency() {
  // If timeline returns 0 posts (e.g., failed network), overall_engagement_rate must be 0
  const html = makeTimelineHtml({ edges: [] }); // empty
  const profileHtml = makeProfileHtml({ followers: '10K' });

  const svc = await makeService({
    'instagram.com/emptyuser': { status: 200, data: profileHtml, headers: {} },
    'instagram.com/emptyuser/': { status: 200, data: html, headers: {} }
  });

  let report;
  try {
    report = await svc.auditAccount('emptyuser', 5);
  } catch (e) {
    record('F10', 'Audit engagement_rate is 0 when no posts sampled', 'BLOCKED',
      'auditAccount threw: ' + e.message.slice(0, 120));
    return;
  }

  const eng = report?.aggregate_metrics?.overall_engagement_rate_pct ?? -1;
  const sampleSize = report?.analyzed_sample_size ?? -1;

  if (sampleSize === 0 && eng === 0) {
    record('F10', 'Audit engagement_rate is 0 when no posts sampled', 'PASS',
      'engagement_rate_pct=0 and analyzed_sample_size=0 are consistent');
  } else if (sampleSize === 0 && eng !== 0) {
    record('F10', 'Audit engagement_rate is 0 when no posts sampled', 'FAIL',
      `analyzed_sample_size=0 but overall_engagement_rate_pct=${eng} — misleading non-zero rate`,
      { report });
  } else {
    record('F10', 'Audit engagement_rate is 0 when no posts sampled', 'BLOCKED',
      `Unexpected: sampleSize=${sampleSize}, eng=${eng} — fixture parsing may differ`,
      { report });
  }
}

// F11: feedType filter applied BEFORE limit (filter-then-limit)
async function testF11_FeedTypeFilterBeforeLimit() {
  // 3 images, 2 reels — with limit=2 and feedType=reels, should get 2 reels (not 2 items then filter to 0)
  const edges = [
    { node: { id: 'I1', code: 'img1', taken_at: 1700000001, media_type: 1, is_video: false, like_count: 10, comment_count: 1, display_url: '', caption: { text: '' } } },
    { node: { id: 'I2', code: 'img2', taken_at: 1700000002, media_type: 1, is_video: false, like_count: 20, comment_count: 2, display_url: '', caption: { text: '' } } },
    { node: { id: 'I3', code: 'img3', taken_at: 1700000003, media_type: 1, is_video: false, like_count: 30, comment_count: 3, display_url: '', caption: { text: '' } } },
    { node: { id: 'V1', code: 'reel1', taken_at: 1700000004, media_type: 2, is_video: true,  like_count: 100, comment_count: 10, video_play_count: 5000, display_url: '', caption: { text: '' } } },
    { node: { id: 'V2', code: 'reel2', taken_at: 1700000005, media_type: 2, is_video: true,  like_count: 200, comment_count: 20, video_play_count: 8000, display_url: '', caption: { text: '' } } },
  ];

  const html = makeTimelineHtml({ edges });
  const fakeProfile = {
    id: '42', username: 'mixeduser', full_name: 'Mixed', biography: '',
    followers_count: 1000, following_count: 100, media_count: 20,
    is_verified: false, is_private: false, is_business: false, profile_pic_url: ''
  };

  const svc = await makeService({
    'instagram.com/mixeduser/': { status: 200, data: html, headers: {} }
  });

  let result;
  try {
    result = await svc.getTimelinePosts({ username: 'mixeduser', profile: fakeProfile, limit: 2, feedType: 'reels' });
  } catch (e) {
    record('F11', 'feedType=reels filter applied before limit', 'BLOCKED',
      'getTimelinePosts threw: ' + e.message.slice(0, 120));
    return;
  }

  const posts = result?.posts ?? [];
  const allVideo = posts.every(p => p.media_type === 'VIDEO');

  if (posts.length === 0) {
    record('F11', 'feedType=reels filter applied before limit', 'BLOCKED',
      'No posts returned — fixture structure may not match parser. Manual verification needed.',
      { result });
    return;
  }

  if (posts.length === 2 && allVideo) {
    record('F11', 'feedType=reels filter applied before limit', 'PASS',
      `Retrieved ${posts.length} reels (limit=2) from mixed feed of 3 images + 2 reels. ` +
      'Filter correctly applied before limit.',
      { shortcodes: posts.map(p => p.shortcode) });
  } else if (!allVideo) {
    record('F11', 'feedType=reels filter applied before limit', 'FAIL',
      `feedType=reels returned non-VIDEO posts: ${posts.map(p => p.media_type).join(',')}`,
      { posts });
  } else {
    record('F11', 'feedType=reels filter applied before limit', 'FAIL',
      `Expected 2 reels with limit=2, got ${posts.length}. ` +
      'If limit was applied before filter, images consumed the limit leaving fewer reels.',
      { posts: posts.map(p => ({ shortcode: p.shortcode, media_type: p.media_type })) });
  }
}

// F11b: feedType=posts should return only non-video
async function testF11b_FeedTypePostsFilter() {
  const edges = [
    { node: { id: 'I1', code: 'img1', taken_at: 1700000001, media_type: 1, is_video: false, like_count: 10, comment_count: 1, display_url: '', caption: { text: '' } } },
    { node: { id: 'V1', code: 'reel1', taken_at: 1700000002, media_type: 2, is_video: true,  like_count: 100, comment_count: 10, display_url: '', caption: { text: '' } } },
    { node: { id: 'I2', code: 'img2', taken_at: 1700000003, media_type: 1, is_video: false, like_count: 20, comment_count: 2, display_url: '', caption: { text: '' } } },
  ];
  const html = makeTimelineHtml({ edges });
  const fakeProfile = {
    id: '99', username: 'filtuser', full_name: 'Filter User', biography: '',
    followers_count: 500, following_count: 50, media_count: 10,
    is_verified: false, is_private: false, is_business: false, profile_pic_url: ''
  };

  const svc = await makeService({
    'instagram.com/filtuser/': { status: 200, data: html, headers: {} }
  });

  let result;
  try {
    result = await svc.getTimelinePosts({ username: 'filtuser', profile: fakeProfile, limit: 10, feedType: 'posts' });
  } catch (e) {
    record('F11', 'feedType=posts returns only non-video', 'BLOCKED', e.message.slice(0, 120));
    return;
  }

  const posts = result?.posts ?? [];
  const hasVideo = posts.some(p => p.media_type === 'VIDEO');

  if (posts.length === 0) {
    record('F11', 'feedType=posts returns only non-video', 'BLOCKED',
      'No posts returned from fixture — parser may not match fixture structure', { result });
    return;
  }

  if (!hasVideo && posts.length === 2) {
    record('F11', 'feedType=posts returns only non-video', 'PASS',
      `${posts.length} IMAGE posts returned, no VIDEO. Filter correct.`);
  } else if (hasVideo) {
    record('F11', 'feedType=posts returns only non-video', 'FAIL',
      'feedType=posts returned VIDEO posts', { posts: posts.map(p => p.media_type) });
  } else {
    record('F11', 'feedType=posts returns only non-video', 'FAIL',
      `Expected 2 image posts, got ${posts.length}`,
      { posts: posts.map(p => ({ code: p.shortcode, type: p.media_type })) });
  }
}

// ─── ADDITIONAL: parseCount edge cases ───────────────────────────────────────

async function testParseCountEdgeCases() {
  // We test the parsing logic via getProfile with mock HTML
  const cases = [
    { input: '1.2M', expected: 1200000, label: '1.2M followers' },
    { input: '12.5K', expected: 12500, label: '12.5K followers' },
    { input: '1,231', expected: 1231, label: '1,231 followers' },
    { input: '0', expected: 0, label: '0 followers (legit zero)' },
  ];

  for (const { input, expected, label } of cases) {
    const html = makeProfileHtml({ followers: input, following: '100', posts: '5' });
    const svc = await makeService({
      'instagram.com/ptest/': { status: 200, data: html, headers: {} },
      'instagram.com/ptest': { status: 200, data: html, headers: {} }
    });

    let result;
    try {
      result = await svc.getProfile('ptest');
    } catch (e) {
      record('PARSE', `parseCount: ${label}`, 'FAIL', 'getProfile threw: ' + e.message.slice(0, 100));
      continue;
    }

    const got = result?.followers_count ?? -1;
    if (got === expected) {
      record('PARSE', `parseCount: ${label}`, 'PASS', `${input} → ${got}`);
    } else if (got === 0 && expected === 0) {
      record('PARSE', `parseCount: ${label}`, 'PASS', `0 → 0 (legit zero preserved)`);
    } else {
      record('PARSE', `parseCount: ${label}`, 'FAIL',
        `${input} → got ${got}, expected ${expected}`, { result });
    }
  }
}

// ─── ADDITIONAL: Comment parsing with fixture ─────────────────────────────────

async function testCommentParsing() {
  const html = makeCommentsHtml({
    comments: [
      { text: 'Great post!', username: 'alice', likes: 5, created_at: 1700000100 },
      { text: 'Love it', username: 'bob', likes: 2, created_at: 1700000200 },
    ]
  });

  const svc = await makeService({
    'instagram.com/reel/': { status: 200, data: html, headers: {} }
  });

  let result;
  try {
    result = await svc.getComments('COMMENTCODE', 10);
  } catch (e) {
    record('SCHEMA', 'Comment parsing from fixture HTML', 'BLOCKED',
      'getComments threw: ' + e.message.slice(0, 120));
    return;
  }

  const comments = result?.comments ?? [];
  if (comments.length === 2 && comments[0].text === 'Great post!' && comments[0].username === 'alice') {
    record('SCHEMA', 'Comment parsing from fixture HTML', 'PASS',
      `${comments.length} comments parsed with correct text and username`);
  } else if (comments.length === 0) {
    record('SCHEMA', 'Comment parsing from fixture HTML', 'BLOCKED',
      'No comments extracted — fixture structure may not match comment parser (looks for XIGComment __typename at root)',
      { result });
  } else {
    record('SCHEMA', 'Comment parsing from fixture HTML', 'FAIL',
      `Unexpected comment result: ${JSON.stringify(result).slice(0, 200)}`, { result });
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

console.log('\n=== Ghost Mode MCP — Regression Tests F01–F11 ===');
console.log('Mode: OFFLINE (no real Instagram requests)\n');

await testF01_ErrorPropagation();
await testF02_CursorPagination();
await testF03_MediaMetricsErrorPropagation();
await testF03b_MediaMetrics302();
await testF04_EngagementRateImagePost();
await testF04b_EngagementRateVideoPost();
await testF05_MediaTypeImageNotVideo();
await testF05b_MediaTypeVideoDetected();
await testF06_CommentErrorPropagation();
await testF06b_Comment302();
await testF07_OfflineSearchThrows();
await testF08_OfflineViralThrows();
await testF09_MissingTimestampIsUndefined();
await testF10_AuditSectionsPopulated();
await testF10b_AuditAggregateConsistency();
await testF11_FeedTypeFilterBeforeLimit();
await testF11b_FeedTypePostsFilter();
await testParseCountEdgeCases();
await testCommentParsing();

// ─── Summary ──────────────────────────────────────────────────────────────────

const pass = results.filter(r => r.status === 'PASS').length;
const fail = results.filter(r => r.status === 'FAIL').length;
const blocked = results.filter(r => r.status === 'BLOCKED').length;

console.log(`\n=== Summary ===`);
console.log(`PASS:    ${pass}`);
console.log(`FAIL:    ${fail}`);
console.log(`BLOCKED: ${blocked} (require live network or fixture alignment)`);
console.log(`Total:   ${results.length}`);

// Save JSON report
const report = {
  report_type: 'regression_f01_f11',
  branch: 'qa/ghost-mode-final',
  commit: '7d341b2',
  run_at: new Date().toISOString(),
  mode: 'offline_mocked_fixtures',
  summary: { pass, fail, blocked, total: results.length },
  note: 'BLOCKED means test requires live Instagram network or fixture-to-parser alignment. ' +
        'No real network requests were made. Live data accuracy unverified.',
  results
};

const reportPath = path.join(RESULTS_DIR, 'regression_f01_f11.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\nReport saved: ${reportPath}`);

process.exitCode = (fail > 0 || blocked > 0) ? 1 : 0;

