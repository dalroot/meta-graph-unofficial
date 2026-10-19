/**
 * Deep Comments Extractor - Meta Graph Unofficial
 * 
 * Target: Extract real, live comments from verified viral reels.
 * Safety: Single-attempt execution with circuit breaker, TwinTransport over SOCKS5 proxy.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { TwinTransport } from '../ts_src/twins/transport.js';

const WORKSPACE_DIR = '/home/hokar/Documents/antigravity/hopeful-bell';
const CB_FILE = path.join(WORKSPACE_DIR, 'circuit_breaker.json');
const OUTPUT_FILE = path.join(WORKSPACE_DIR, 'scratch/extracted_comments_audit.json');

// Shortcode base64 decode to Media ID
const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
export function shortcodeToMediaId(shortcode: string): string {
  let id = 0n;
  for (let i = 0; i < shortcode.length; i++) {
    const char = shortcode[i];
    const index = B64_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid shortcode character: ${char}`);
    }
    id = id * 64n + BigInt(index);
  }
  return id.toString();
}

export interface ExtractedComment {
  id: string;
  author: string;
  author_id?: string;
  author_is_verified: boolean;
  author_profile_pic?: string;
  text: string;
  is_gif: boolean;
  gif_url?: string;
  created_at: number;
  created_at_iso: string;
  like_count: number;
  reply_count: number;
}

export interface ExtractedCommentsAudit {
  target: {
    shortcode: string;
    media_id: string;
    post_url: string;
    creator?: {
      username: string;
      full_name?: string;
      id?: string;
    };
    caption?: string;
    total_comments_on_post: number;
    like_count?: number;
  };
  extraction_metadata: {
    extracted_at: string;
    method: string;
    total_extracted: number;
    proxy_used: string;
    response_size_bytes: number;
    has_next_page: boolean;
    end_cursor?: string;
  };
  sample_comments: ExtractedComment[];
  all_comments: ExtractedComment[];
}

function checkCircuitBreaker(): void {
  if (fs.existsSync(CB_FILE)) {
    try {
      const cb = JSON.parse(fs.readFileSync(CB_FILE, 'utf-8'));
      if (cb.tripped) {
        console.error(`🚨 [CIRCUIT BREAKER] Tripped: ${cb.reason}. Halting immediately.`);
        process.exit(1);
      }
    } catch (e) {
      console.warn('[!] Failed to read circuit breaker file, proceeding cautiously:', e);
    }
  }
}

function updateCircuitBreaker(success: boolean, endpoint: string, status: number, reason?: string): void {
  const cb = {
    tripped: !success,
    reason: success ? 'Clear - Safe live comments extraction verified.' : (reason || 'Request failed'),
    last_success_at: success ? new Date().toISOString() : undefined,
    last_status: status,
    endpoint
  };
  fs.writeFileSync(CB_FILE, JSON.stringify(cb, null, 2), 'utf-8');
}

export async function extractReelComments(shortcode: string = 'Dd_sxJDxH6G'): Promise<ExtractedCommentsAudit> {
  const mediaId = shortcodeToMediaId(shortcode);
  const postUrl = `https://www.instagram.com/reel/${shortcode}/`;
  const proxyUrl = 'socks5://127.0.0.1:10808';

  console.log(`[*] Target Shortcode : ${shortcode}`);
  console.log(`[*] Media ID         : ${mediaId}`);
  console.log(`[*] Post URL         : ${postUrl}`);

  checkCircuitBreaker();

  const transport = new TwinTransport({ proxyUrl });

  // Pure guest navigation headers with standard browser fingerprint
  const headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'X-IG-App-ID': '936619743392459',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none'
  };

  const targetUrl = `https://www.instagram.com/p/${shortcode}/`;
  console.log(`[*] Executing safe single-attempt fetch: ${targetUrl}`);

  const response = await transport.request(targetUrl, {
    method: 'GET',
    headers,
    timeoutMs: 30000
  });

  console.log(`[*] Response Status  : ${response.status} ${response.statusText}`);
  console.log(`[*] Response Size    : ${response.data.length} bytes`);

  if (response.status !== 200) {
    updateCircuitBreaker(false, targetUrl, response.status, `HTTP status ${response.status}`);
    throw new Error(`Instagram returned HTTP ${response.status}`);
  }

  const html = response.data;

  // Extract comments_connection JSON structure
  const connMatch = html.match(/"comments_connection":\s*(\{.*?"has_next_page":(?:true|false)\}\})/s);
  if (!connMatch) {
    updateCircuitBreaker(false, targetUrl, response.status, 'comments_connection structure not found in HTML response');
    throw new Error('Failed to locate comments_connection in response HTML.');
  }

  const connData = JSON.parse(connMatch[1]);
  const edges = connData.edges || [];

  // Extract post metadata: total comment count, like count, caption, creator
  let totalCommentsOnPost = 0;
  const countMatch = html.match(/"comment_count":\s*([0-9]+)/);
  if (countMatch) {
    totalCommentsOnPost = parseInt(countMatch[1], 10);
  }

  let totalLikesOnPost = 0;
  const likesMatch = html.match(/"like_count":\s*([0-9]+)/);
  if (likesMatch) {
    totalLikesOnPost = parseInt(likesMatch[1], 10);
  }

  let captionText = '';
  const captionMatch = html.match(/"caption":\s*\{\s*"text":\s*"([^"]+)"/);
  if (captionMatch) {
    try {
      captionText = JSON.parse(`"${captionMatch[1]}"`);
    } catch {
      captionText = captionMatch[1];
    }
  }

  let creatorUsername = '';
  let creatorId = '';
  let creatorFullName = '';
  const creatorMatch = html.match(/"user":\s*\{[^}]*"username":\s*"([^"]+)"[^}]*"id":\s*"([^"]+)"/);
  if (creatorMatch) {
    creatorUsername = creatorMatch[1];
    creatorId = creatorMatch[2];
  }
  const fullNameMatch = html.match(/"full_name":\s*"([^"]+)"/);
  if (fullNameMatch) {
    creatorFullName = fullNameMatch[1];
  }

  const extractedComments: ExtractedComment[] = [];

  for (const edge of edges) {
    const node = edge.node;
    if (!node) continue;

    const isGif = Boolean(node.giphy_media_info);
    let gifUrl: string | undefined = undefined;
    if (isGif && node.giphy_media_info?.first_party_cdn_proxied_images?.original?.url) {
      gifUrl = node.giphy_media_info.first_party_cdn_proxied_images.original.url;
    }

    const text = node.text || (isGif ? '[GIPHY Sticker / GIF]' : '');
    const createdAtSec = typeof node.created_at === 'number' ? node.created_at : Math.floor(Date.now() / 1000);

    extractedComments.push({
      id: String(node.pk || node.id),
      author: node.user?.username || 'unknown',
      author_id: node.user?.pk || node.user?.id ? String(node.user.pk || node.user.id) : undefined,
      author_is_verified: Boolean(node.user?.is_verified),
      author_profile_pic: node.user?.profile_pic_url,
      text,
      is_gif: isGif,
      gif_url: gifUrl,
      created_at: createdAtSec,
      created_at_iso: new Date(createdAtSec * 1000).toISOString(),
      like_count: typeof node.comment_like_count === 'number' ? node.comment_like_count : 0,
      reply_count: typeof node.child_comment_count === 'number' ? node.child_comment_count : 0
    });
  }

  updateCircuitBreaker(true, targetUrl, response.status);

  const auditResult: ExtractedCommentsAudit = {
    target: {
      shortcode,
      media_id: mediaId,
      post_url: postUrl,
      creator: {
        username: creatorUsername,
        full_name: creatorFullName,
        id: creatorId
      },
      caption: captionText,
      total_comments_on_post: totalCommentsOnPost,
      like_count: totalLikesOnPost
    },
    extraction_metadata: {
      extracted_at: new Date().toISOString(),
      method: 'Polaris_Post_Root_Relay_CommentsConnection',
      total_extracted: extractedComments.length,
      proxy_used: proxyUrl,
      response_size_bytes: response.data.length,
      has_next_page: Boolean(connData.page_info?.has_next_page),
      end_cursor: connData.page_info?.end_cursor
    },
    sample_comments: extractedComments.slice(0, 10),
    all_comments: extractedComments
  };

  return auditResult;
}

async function main(): Promise<void> {
  const shortcode = process.argv[2] || 'Dd_sxJDxH6G';
  const result = await extractReelComments(shortcode);

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8');

  console.log(`\n======================================================`);
  console.log(`✅ COMMENTS EXTRACTION AUDIT COMPLETED SUCCESSFULLY`);
  console.log(`======================================================`);
  console.log(`Target Shortcode : ${result.target.shortcode}`);
  console.log(`Target Post URL  : ${result.target.post_url}`);
  console.log(`Creator          : @${result.target.creator?.username || 'unknown'} (${result.target.creator?.full_name || ''})`);
  console.log(`Total Comments   : ${result.target.total_comments_on_post.toLocaleString()}`);
  console.log(`Likes on Post    : ${result.target.like_count?.toLocaleString() || 0}`);
  console.log(`Extracted Count  : ${result.extraction_metadata.total_extracted} live comments`);
  console.log(`Method           : ${result.extraction_metadata.method}`);
  console.log(`Payload Size     : ${(result.extraction_metadata.response_size_bytes / 1024).toFixed(1)} KB`);
  console.log(`Audit Artifact   : ${OUTPUT_FILE}`);
  console.log(`======================================================\n`);

  console.log(`--- Live Real Comments Sample ---`);
  console.table(result.all_comments.map(c => ({
    Username: `@${c.author}${c.author_is_verified ? ' [V]' : ''}`,
    Likes: c.like_count,
    Replies: c.reply_count,
    Text: c.text.length > 55 ? c.text.slice(0, 52) + '...' : c.text,
    Date: c.created_at_iso
  })));
}

if (process.argv[1] && process.argv[1].endsWith('extract_live_comments.ts')) {
  main().catch(err => {
    console.error('Extraction failure:', err);
    process.exit(1);
  });
}
