/**
 * PolarisPostCommentsPaginationQuery Live Test
 * Target: GraphQL Doc ID 6974885689225067
 * Surface: POST https://www.instagram.com/api/graphql
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { TwinTransport } from '../dist/twins/transport.js';

const WORKSPACE_DIR = '/home/hokar/Documents/antigravity/hopeful-bell';
const SESSION_FILE = path.join(WORKSPACE_DIR, 'instagram_session.json');
const OUTPUT_FILE = path.join(WORKSPACE_DIR, 'scratch/live_graphql_comments.json');

async function main(): Promise<void> {
  const session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
  const transport = new TwinTransport({ proxyUrl: 'socks5://127.0.0.1:10808' });

  // Test on viral post DeU-UkmOB4z (media_id: 4005100061208354355)
  const mediaId = '4005100061208354355';
  const shortcode = 'DeU-UkmOB4z';

  const variables = {
    after: null,
    before: null,
    first: 20,
    last: null,
    media_id: mediaId,
    sort_order: 'popular'
  };

  const bodyParams = new URLSearchParams({
    av: '0',
    __d: 'www',
    __user: '0',
    __a: '1',
    __req: '1',
    variables: JSON.stringify(variables),
    doc_id: '6974885689225067',
    fb_api_req_friendly_name: 'PolarisPostCommentsPaginationQuery',
    server_timestamps: 'true'
  });

  console.log(`[*] Requesting comments for ${shortcode} (ID: ${mediaId}) via GraphQL...`);

  const response = await transport.request('https://www.instagram.com/api/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-IG-App-ID': '936619743392459',
      'X-FB-LSD': session.key_tokens.csrftoken,
      'User-Agent': session.digital_twin_fingerprint.user_agent,
      'Accept': '*/*',
      'Origin': 'https://www.instagram.com',
      'Referer': `https://www.instagram.com/p/${shortcode}/`
    },
    body: bodyParams.toString(),
    timeoutMs: 25000
  });

  console.log(`[*] Status: ${response.status} ${response.statusText}`);
  console.log(`[*] Payload size: ${response.data.length} bytes`);
  console.log(`[*] Payload snippet: ${response.data.substring(0, 300)}`);

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, response.data, 'utf-8');
}

main().catch(console.error);
