/**
 * Browser Login & Session Extractor
 * 
 * Automates Instagram session extraction using local Google Chrome / Chromium.
 * Opens real browser, allows 1-click or quick manual login, and automatically
 * captures all required security cookies (sessionid, ds_user_id, csrftoken, mid, etc.)
 * via Chrome DevTools Protocol (CDP), saving directly to instagram_session.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import puppeteer, { Browser, Page } from 'puppeteer-core';
import { saveMobileSession, parseMobileSession, MobileSession } from '../twins/session_loader.js';
import { DEFAULT_SESSION_PATH } from '../twins/device_twin.js';

export interface LoginOptions {
  chromePath?: string;
  userDataDir?: string;
  outputPath?: string;
  proxyUrl?: string;
  timeoutSeconds?: number;
}

export function normalizeChromeProxy(rawProxy?: string): string | undefined {
  if (!rawProxy || typeof rawProxy !== 'string') return undefined;
  let cleaned = rawProxy.trim().replace(/\/+$/, '');
  if (!cleaned) return undefined;

  // Chrome only recognizes socks5:// or socks4://, not generic socks:// or socks5h://
  if (cleaned.startsWith('socks://')) {
    cleaned = 'socks5://' + cleaned.slice(8);
  } else if (cleaned.startsWith('socks5h://')) {
    cleaned = 'socks5://' + cleaned.slice(10);
  }
  return cleaned;
}

export function findSystemChrome(): string {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    'Google Chrome or Chromium executable not found.\n' +
    'Please set CHROME_PATH environment variable or install Google Chrome.'
  );
}

export async function runBrowserLogin(options: LoginOptions = {}): Promise<MobileSession> {
  const executablePath = options.chromePath || findSystemChrome();
  const outputPath = options.outputPath || DEFAULT_SESSION_PATH;
  const timeoutSeconds = options.timeoutSeconds || 180;

  // Use a dedicated persistent profile so user only logs in once
  const userDataDir = options.userDataDir || path.join(os.homedir(), '.config', 'twingraph', 'chrome_profile');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const args = [
    '--no-default-browser-check',
    '--no-first-run',
    '--disable-blink-features=AutomationControlled',
    '--start-maximized'
  ];

  // Auto-proxy routing with Chrome normalization
  const rawProxy = options.proxyUrl || process.env.ALL_PROXY || process.env.HTTPS_PROXY || process.env.all_proxy;
  const proxy = normalizeChromeProxy(rawProxy);
  if (proxy) {
    args.push(`--proxy-server=${proxy}`);
  }

  console.log(`[TwinGraph Login] Launching Chrome: ${executablePath}`);
  if (proxy) console.log(`[TwinGraph Login] Active Proxy: ${proxy}`);
  console.log(`[TwinGraph Login] User Profile: ${userDataDir}`);
  console.log(`[TwinGraph Login] Target Session File: ${outputPath}`);
  console.log(`[TwinGraph Login] Waiting for Instagram authentication (timeout: ${timeoutSeconds}s)...`);

  const browser: Browser = await puppeteer.launch({
    executablePath,
    headless: false,
    userDataDir,
    defaultViewport: null,
    args,
    ignoreDefaultArgs: ['--enable-automation']
  });

  try {
    const pages = await browser.pages();
    const page: Page = pages.length > 0 ? pages[0] : await browser.newPage();

    // Navigate to Instagram
    await page.goto('https://www.instagram.com/accounts/login/', {
      waitUntil: 'domcontentloaded'
    });

    const startTime = Date.now();
    let sessionData: MobileSession | null = null;

    // Polling loop to detect sessionid and ds_user_id
    while (Date.now() - startTime < timeoutSeconds * 1000) {
      const cdp = await page.createCDPSession();
      const { cookies } = await cdp.send('Network.getAllCookies');
      await cdp.detach();

      const igCookies = cookies.filter((c: any) => c.domain.includes('instagram.com'));
      const sessionidCookie = igCookies.find((c: any) => c.name === 'sessionid');
      const dsUserIdCookie = igCookies.find((c: any) => c.name === 'ds_user_id');

      if (sessionidCookie && sessionidCookie.value && dsUserIdCookie && dsUserIdCookie.value) {
        // Try to obtain username from page context if available
        let username = '';
        try {
          username = await page.evaluate(() => {
            const el = document.querySelector('a[href^="/"][role="link"] span');
            if (el && el.textContent) return el.textContent.trim();
            const metas = document.querySelectorAll('meta[property="og:title"]');
            if (metas.length > 0) {
              const content = metas[0].getAttribute('content') || '';
              const match = content.match(/\(@([^)]+)\)/);
              if (match) return match[1];
            }
            return '';
          });
        } catch {
          // Non-blocking
        }

        const cookieMap: Record<string, string> = {};
        for (const c of igCookies) {
          cookieMap[c.name] = c.value;
        }

        sessionData = parseMobileSession(
          Object.entries(cookieMap)
            .map(([k, v]) => `${k}=${v}`)
            .join('; ')
        );

        if (username) {
          sessionData.username = username;
        }

        saveMobileSession(outputPath, sessionData);
        console.log('\n============================================================');
        console.log('🎉 Instagram Session Successfully Captured!');
        console.log(`👤 User ID:     ${sessionData.ds_user_id}`);
        if (sessionData.username) {
          console.log(`🏷️  Username:    @${sessionData.username}`);
        }
        console.log(`📁 Saved to:    ${outputPath}`);
        console.log('🔑 Key Tokens:  sessionid, ds_user_id, csrftoken, mid, ig_did');
        console.log('============================================================\n');
        break;
      }

      await new Promise((r) => setTimeout(r, 1500));
    }

    if (!sessionData) {
      throw new Error(`Login timed out after ${timeoutSeconds} seconds. Could not find sessionid cookie.`);
    }

    return sessionData;
  } finally {
    try {
      await browser.close();
    } catch {
      // Ignore cleanup error
    }
  }
}
