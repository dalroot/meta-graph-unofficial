/**
 * launch_playwright_windows.cjs
 * Launches a clean Playwright browser with a native Windows 11 Desktop BrowserContext.
 */

const path = require('node:path');

// Resolve playwright from npx cache or local
let playwright;
try {
  playwright = require('playwright');
} catch (e) {
  playwright = require('/home/hokar/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
}

const { chromium } = playwright;

async function main() {
  console.log('[*] Launching Playwright with Windows 11 Desktop Identity...');

  // Launch Google Chrome (or Playwright Chromium)
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome', // Uses system official Google Chrome
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--start-maximized'
    ]
  });

  // Create clean Windows 11 BrowserContext
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    locale: 'en-US',
    timezoneId: 'Europe/London',
    colorScheme: 'dark',
    extraHTTPHeaders: {
      'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-ch-ua-platform-version': '"15.0.0"'
    }
  });

  // Playwright's addInitScript automatically executes in ALL tabs, popups and iframes
  await context.addInitScript(() => {
    // 1. Win32 Platform
    Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });

    // 2. High-Entropy Client Hints Mocking for navigator.userAgentData
    if (navigator.userAgentData) {
      const origGet = navigator.userAgentData.getHighEntropyValues;
      navigator.userAgentData.getHighEntropyValues = async function(hints) {
        const res = await origGet.call(this, hints);
        res.platform = 'Windows';
        res.platformVersion = '15.0.0';
        res.architecture = 'x86';
        res.bitness = '64';
        res.model = '';
        return res;
      };
      Object.defineProperty(navigator.userAgentData, 'platform', { get: () => 'Windows' });
    }

    // 3. WebGL Driver Mocking (Replace Linux Mesa driver with Windows Direct3D11)
    const spoofWebGL = (proto) => {
      if (!proto) return;
      const orig = proto.getParameter;
      proto.getParameter = function(param) {
        if (param === 37445) return 'Google Inc. (NVIDIA)';
        if (param === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)';
        return orig.apply(this, arguments);
      };
    };
    if (window.WebGLRenderingContext) spoofWebGL(WebGLRenderingContext.prototype);
    if (window.WebGL2RenderingContext) spoofWebGL(WebGL2RenderingContext.prototype);
  });

  const page = await context.newPage();

  console.log('[*] Navigating to SannySoft Bot Detection...');
  await page.goto('https://bot.sannysoft.com', { waitUntil: 'domcontentloaded' });

  console.log('[✔] Playwright Windows 11 Chrome is running live on your desktop!');

  // Listen for console logs and network traffic to inspect Web Twin signatures
  page.on('response', (response) => {
    if (response.url().includes('instagram.com') || response.url().includes('graph.facebook.com')) {
      console.log(`[HTTP ${response.status()}] ${response.request().method()} ${response.url()}`);
    }
  });

  browser.on('disconnected', () => {
    console.log('[*] Playwright browser closed.');
    process.exit(0);
  });
}

main().catch(err => {
  console.error('[!] Playwright Launch Error:', err);
  process.exit(1);
});
