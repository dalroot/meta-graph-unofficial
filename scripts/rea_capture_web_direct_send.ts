/**
 * 🔬 REA DEEP CAPTURE: INSTAGRAM WEB DIRECT MESSAGE SEND TRACE
 * 
 * Objective:
 * Capture the authentic RelayModern GraphQL mutation or HTTP endpoint
 * used by Instagram Web to send a direct message in a thread.
 * 
 * Strict Single-Attempt Execution with Circuit Breaker.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire('/usr/lib/chatgpt/resources/cua_node/lib/node_modules/dummy.js');
const { chromium } = require('playwright');

const WORKSPACE_DIR = '/home/hokar/Documents/antigravity/hopeful-bell';
const SESSION_FILE = path.join(WORKSPACE_DIR, 'instagram_session.json');
const CB_FILE = path.join(WORKSPACE_DIR, 'circuit_breaker.json');
const AUDIT_FILE = path.join(WORKSPACE_DIR, 'scratch/rea_web_direct_trace.json');

function assertCircuitBreaker(): void {
  if (fs.existsSync(CB_FILE)) {
    const cb = JSON.parse(fs.readFileSync(CB_FILE, 'utf-8'));
    if (cb.tripped) {
      console.error(`\n🚨 [CIRCUIT BREAKER] Tripped: ${cb.reason}. Halting immediately.`);
      process.exit(1);
    }
  }
}

async function main(): Promise<void> {
  console.log('================================================================');
  console.log('  🔬 REA DEEP CAPTURE: INSTAGRAM WEB DIRECT MESSAGE PROTOCOL');
  console.log('================================================================');
  assertCircuitBreaker();

  if (!fs.existsSync(SESSION_FILE)) {
    console.error(`[!] Session file missing: ${SESSION_FILE}`);
    process.exit(1);
  }

  const session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
  const targetThreadFbid = '2102378287099186'; // @tawanatallks
  const targetUrl = `https://www.instagram.com/direct/t/${targetThreadFbid}/`;
  const messageText = 'تست سیستم خودکار هوشمند توئین‌گراف';
  const proxyUrl = 'socks5://127.0.0.1:10808';

  console.log(`[*] Target User       : @${session.username} (UID: ${session.ds_user_id})`);
  console.log(`[*] SOCKS5 Proxy      : ${proxyUrl}`);
  console.log(`[*] Target Thread URL : ${targetUrl}`);
  console.log(`[*] Test Message      : "${messageText}"`);

  // Parse cookies
  const cookiesList: any[] = [];
  const rawCookieStr = session.cookie_string || '';
  const parts = rawCookieStr.split(';').map((p: string) => p.trim()).filter(Boolean);

  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx !== -1) {
      const name = part.slice(0, eqIdx).trim();
      const value = part.slice(eqIdx + 1).trim();
      if (name && value) {
        cookiesList.push({
          name,
          value,
          domain: '.instagram.com',
          path: '/',
          httpOnly: name === 'sessionid' || name === 'rur',
          secure: true,
          sameSite: 'None' as const
        });
      }
    }
  }

  console.log('[*] Launching isolated Chrome browser via Playwright CDP engine...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    proxy: { server: proxyUrl },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--disable-web-security'
    ]
  });

  const context = await browser.newContext({
    userAgent: session.digital_twin_fingerprint?.user_agent || 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1.445,
    locale: 'en-US'
  });

  await context.addCookies(cookiesList);
  console.log(`[*] Successfully injected ${cookiesList.length} authenticated session cookies.`);

  const page = await context.newPage();

  const networkTransactions: any[] = [];
  let directSendTransaction: any = null;

  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('instagram.com') && (req.method() === 'POST' || url.includes('direct') || url.includes('graphql'))) {
      networkTransactions.push({
        type: 'request',
        url: url,
        method: req.method(),
        headers: req.headers(),
        post_data: req.postData(),
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('response', async (response) => {
    const req = response.request();
    const url = req.url();
    if (url.includes('instagram.com') && (req.method() === 'POST' || url.includes('direct') || url.includes('graphql'))) {
      let bodyText = '';
      try {
        bodyText = await response.text();
      } catch {
        bodyText = '[Unreadable body]';
      }

      const postData = req.postData() || '';
      const tx = {
        url: url,
        method: req.method(),
        request_headers: req.headers(),
        request_body: postData,
        response_status: response.status(),
        response_headers: response.headers(),
        response_body: bodyText.slice(0, 5000),
        timestamp: new Date().toISOString()
      };

      networkTransactions.push({ type: 'response', ...tx });

      if (
        url.includes('send') ||
        url.includes('broadcast') ||
        (postData && (
          postData.includes('تست') ||
          postData.includes(encodeURIComponent('تست')) ||
          postData.includes(encodeURIComponent(messageText)) ||
          postData.toLowerCase().includes('sendmessage') ||
          postData.toLowerCase().includes('directsend')
        ))
      ) {
        directSendTransaction = tx;
      }
    }
  });

  console.log(`[*] Navigating to direct thread: ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  console.log('[*] DOM loaded. Waiting 6s for chat interface & modals to appear...');
  await page.waitForTimeout(6000);

  // Dismiss any "Turn on Notifications" or promo modal
  try {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const notNowBtn = page.locator('button:text-is("Not Now"), div[role="dialog"] button:has-text("Not Now"), button:has-text("Not Now")');
    if (await notNowBtn.count() > 0 && await notNowBtn.first().isVisible()) {
      console.log('[*] Dismissed "Not Now" notification prompt.');
      await notNowBtn.first().click();
      await page.waitForTimeout(1000);
    }
  } catch {}

  await page.screenshot({ path: path.join(WORKSPACE_DIR, 'scratch/direct_page_screenshot.png') });
  console.log('[*] Saved direct page screenshot to scratch/direct_page_screenshot.png');

  // Locate message input
  console.log('[*] Locating direct message input...');
  const inputLocator = page.locator('div[role="textbox"][contenteditable="true"], div[aria-label="Message"][role="textbox"], div[contenteditable="true"]');
  
  let inputFound = false;
  try {
    await inputLocator.last().waitFor({ state: 'visible', timeout: 10000 });
    inputFound = true;
    console.log('[*] Found message input box!');
  } catch {
    console.log('[!] Direct message input not found in time; capturing fallback snapshot.');
  }

  if (inputFound) {
    const inputElement = inputLocator.last();
    console.log(`[*] Focusing message box and typing: "${messageText}"...`);
    await inputElement.focus();
    await inputElement.click({ force: true });
    await page.waitForTimeout(500);
    await page.keyboard.type(messageText, { delay: 60 });
    console.log('[*] Keystrokes typed into React message box. Waiting 1s...');
    await page.waitForTimeout(1000);

    // Check if a "Send" button appeared or press Enter
    let sent = false;
    try {
      const sendBtn = page.getByRole('button', { name: 'Send', exact: true });
      if (await sendBtn.isVisible({ timeout: 2000 })) {
        console.log('[*] Found Send button, clicking...');
        await sendBtn.click();
        sent = true;
      }
    } catch {}

    if (!sent) {
      console.log('[*] Pressing Enter to send message...');
      await page.keyboard.press('Enter');
    }
    console.log('✅ Sent message action triggered!');

    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(WORKSPACE_DIR, 'scratch/direct_after_send_screenshot.png') });
    console.log('[*] Saved after_send screenshot to scratch/direct_after_send_screenshot.png');
    console.log('[*] Awaiting server response & network settle (6s)...');
    await page.waitForTimeout(6000);
  }

  await browser.close();
  console.log('[*] Browser session closed cleanly.');

  // Save full network audit
  fs.writeFileSync(AUDIT_FILE, JSON.stringify(networkTransactions, null, 2), 'utf-8');
  console.log(`[*] Full REA network transactions (${networkTransactions.length} events) saved to: ${AUDIT_FILE}`);

  if (directSendTransaction) {
    console.log('\n================================================================');
    console.log('🎉 REA EVIDENCE CAPTURED: OFFICIAL WEB DIRECT SEND DETECTED!');
    console.log('================================================================');
    console.log(`Endpoint        : ${directSendTransaction.url}`);
    console.log(`Method          : ${directSendTransaction.method}`);
    console.log(`HTTP Status     : ${directSendTransaction.response_status}`);
    console.log(`Payload Snippet : ${directSendTransaction.request_body.slice(0, 300)}`);
  } else {
    console.log('[*] Specific direct send transaction flag not triggered; inspecting all POST requests...');
  }
}

main().catch((err) => {
  console.error('[!] REA Direct Send Capture failed:', err.message);
  process.exit(1);
});
