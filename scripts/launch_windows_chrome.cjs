/**
 * launch_windows_chrome.cjs
 * Bulletproof Windows 11 Chrome Digital Twin with:
 * 1. Global CLI --user-agent (applies to ALL tabs/network calls before JS runs)
 * 2. CDP targetcreated listener (every new tab/popup inherits Windows 11 UserAgentMetadata)
 * 3. WebGL Hook (masks Linux Mesa/radeonsi driver with NVIDIA Direct3D11)
 * 4. Screen Geometry Hook (masks 1536x864 with standard 1920x1080 Win32)
 */

const path = require('node:path');
const fs = require('node:fs');

let puppeteer;
try {
  puppeteer = require('puppeteer-core');
} catch (e) {
  const fallbackPath = '/home/hokar/Documents/antigravity/silly-galileo/node_modules/puppeteer-core';
  if (fs.existsSync(fallbackPath)) {
    puppeteer = require(fallbackPath);
  } else {
    console.error('puppeteer-core not found!');
    process.exit(1);
  }
}

const WIN11_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const WIN11_METADATA = {
  userAgent: WIN11_UA,
  acceptLanguage: 'en-US,en;q=0.9,fa;q=0.8',
  platform: 'Win32',
  userAgentMetadata: {
    brands: [
      { brand: 'Chromium', version: '130' },
      { brand: 'Google Chrome', version: '130' },
      { brand: 'Not?A_Brand', version: '99' }
    ],
    fullVersion: '130.0.6723.70',
    platform: 'Windows',
    platformVersion: '15.0.0', // Windows 11 Final
    architecture: 'x86',
    model: '',
    mobile: false,
    bitness: '64'
  }
};

async function applyWindowsStealth(page) {
  try {
    const client = await page.target().createCDPSession();
    await client.send('Network.setUserAgentOverride', WIN11_METADATA);
  } catch (err) {
    // Session might already be closed or detaching
  }

  await page.evaluateOnNewDocument(() => {
    // 1. Hide Automation / WebDriver
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

    // 2. Mock Platform to Win32
    Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
    Object.defineProperty(navigator, 'oscpu', { get: () => 'Windows NT 10.0; Win64; x64' });

    // 3. WebGL Spoofing (Replace Linux Mesa radeonsi ACO with Windows NVIDIA Direct3D11)
    const spoofWebGL = (proto) => {
      if (!proto) return;
      const origGetParameter = proto.getParameter;
      proto.getParameter = function(param) {
        // UNMASKED_VENDOR_WEBGL
        if (param === 37445) return 'Google Inc. (NVIDIA)';
        // UNMASKED_RENDERER_WEBGL
        if (param === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)';
        return origGetParameter.apply(this, arguments);
      };
    };

    if (window.WebGLRenderingContext) spoofWebGL(WebGLRenderingContext.prototype);
    if (window.WebGL2RenderingContext) spoofWebGL(WebGL2RenderingContext.prototype);

    // 4. Standard Desktop 1080p Screen Metrics
    Object.defineProperty(screen, 'width', { get: () => 1920 });
    Object.defineProperty(screen, 'height', { get: () => 1080 });
    Object.defineProperty(screen, 'availWidth', { get: () => 1920 });
    Object.defineProperty(screen, 'availHeight', { get: () => 1040 });
    Object.defineProperty(window, 'devicePixelRatio', { get: () => 1 });
  });
}

async function main() {
  console.log('[*] Initializing Bulletproof Windows 11 Chrome Digital Twin...');

  const chromePath = '/usr/bin/google-chrome';
  const userDataDir = path.resolve(__dirname, '../.chrome_windows_profile');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    userDataDir,
    defaultViewport: null,
    args: [
      `--user-agent=${WIN11_UA}`, // Hardcoded into browser engine for ALL requests & tabs
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080',
      '--start-maximized',
      '--lang=en-US,en'
    ],
    env: {
      ...process.env,
      DISPLAY: process.env.DISPLAY || ':0'
    }
  });

  // Automatically apply Windows 11 stealth to EVERY new tab or popup
  browser.on('targetcreated', async (target) => {
    if (target.type() === 'page') {
      const newPage = await target.page();
      if (newPage) {
        console.log('[+] New tab detected! Applying Windows 11 stealth...');
        await applyWindowsStealth(newPage);
      }
    }
  });

  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();
  await applyWindowsStealth(page);

  // Navigate directly to bot detection test
  console.log('[*] Navigating to Sannysoft Bot Detection test...');
  await page.goto('https://bot.sannysoft.com');

  console.log('[✔] Bulletproof Windows 11 Chrome is live on your desktop!');

  browser.on('disconnected', () => {
    console.log('[*] Browser closed.');
    process.exit(0);
  });
}

main().catch(err => {
  console.error('[!] Error:', err);
  process.exit(1);
});
