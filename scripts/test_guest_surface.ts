import * as fs from 'node:fs';
import { TwinTransport } from '../dist/twins/transport.js';

async function testGuestSurface() {
  console.log('[*] Testing guest Reels surface over SOCKS5 proxy...');
  const transport = new TwinTransport({ proxyUrl: 'socks5://127.0.0.1:10808' });

  const headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
    'X-IG-App-ID': '936619743392459',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none'
  };

  const response = await transport.request('https://www.instagram.com/reels/', {
    method: 'GET',
    headers,
    timeoutMs: 30000
  });

  console.log(`[*] Status: ${response.status} ${response.statusText}`);
  console.log(`[*] Data length: ${response.data.length}`);
  
  const snippet = response.data.slice(0, 500);
  console.log('[*] Head snippet:\n', snippet);

  const hasShortcode = response.data.match(/"shortcode":"([^"]+)"/g);
  console.log('[*] Shortcodes count:', hasShortcode?.length || 0);

  const hasCode = response.data.match(/"code":"([^"]+)"/g);
  console.log('[*] Codes count:', hasCode?.length || 0);

  fs.writeFileSync('/home/hokar/Documents/antigravity/hopeful-bell/scratch/reels_guest_response.html', response.data, 'utf-8');
  console.log('[*] Saved to scratch/reels_guest_response.html');
}

testGuestSurface().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
