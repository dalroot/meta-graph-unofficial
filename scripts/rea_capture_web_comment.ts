/**
 * REA Deep Network Protocol Capture & Reconstruction Runner
 * 
 * Target: Instagram Web Comment Mutation & Navigation Lifecycle
 * Ground Truth Standard: Reverse Engineer Anything (REA) Protocol Trace
 * Intercepts authentic Chrome requests, headers, CSRF tokens, GraphQL/REST mutations,
 * and records complete evidence for TwinGraph SDK Web Twin.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire('/usr/lib/chatgpt/resources/cua_node/lib/node_modules/dummy.js');
const { chromium } = require('playwright');

const WORKSPACE_DIR = '/home/hokar/Documents/antigravity/hopeful-bell';
const SESSION_FILE = path.join(WORKSPACE_DIR, 'instagram_session.json');
const EVIDENCE_FILE = path.join(WORKSPACE_DIR, 'evidence/web_comment_evidence.json');
const AUDIT_FILE = path.join(WORKSPACE_DIR, 'scratch/rea_web_comment_trace.json');

async function main() {
  console.log('================================================================');
  console.log('  🔬 REA DEEP CAPTURE: INSTAGRAM WEB COMMENT & PROTOCOL TRACE');
  console.log('================================================================');

  if (!fs.existsSync(SESSION_FILE)) {
    throw new Error(`Session file not found: ${SESSION_FILE}`);
  }

  const sessionData = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
  const tokens = sessionData.key_tokens || {};
  console.log(`[*] Target User       : @${sessionData.username} (UID: ${sessionData.ds_user_id})`);
  console.log(`[*] SOCKS5 Proxy      : socks5://127.0.0.1:10808`);

  const shortcode = 'DepbV3TDaXD';
  const targetUrl = `https://www.instagram.com/p/${shortcode}/`;
  const commentText = 'تست هوشمند توئین‌گراف - تاییدیه عمیق REA';

  console.log(`[*] Target URL        : ${targetUrl}`);
  console.log(`[*] Test Comment Text : "${commentText}"`);

  console.log('[*] Launching isolated Chrome browser via Playwright CDP engine...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    proxy: { server: 'socks5://127.0.0.1:10808' },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--window-size=1280,720'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1.4453125,
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    locale: 'en-US'
  });

  // Inject authentic session cookies for .instagram.com
  const cookieList = [
    { name: 'sessionid', value: tokens.sessionid, domain: '.instagram.com', path: '/', secure: true, httpOnly: true },
    { name: 'csrftoken', value: tokens.csrftoken, domain: '.instagram.com', path: '/', secure: true, httpOnly: false },
    { name: 'ds_user_id', value: tokens.ds_user_id, domain: '.instagram.com', path: '/', secure: true, httpOnly: false },
    { name: 'datr', value: tokens.datr, domain: '.instagram.com', path: '/', secure: true, httpOnly: true },
    { name: 'mid', value: tokens.mid, domain: '.instagram.com', path: '/', secure: true, httpOnly: false },
    { name: 'ig_did', value: tokens.ig_did, domain: '.instagram.com', path: '/', secure: true, httpOnly: false },
    { name: 'rur', value: tokens.rur, domain: '.instagram.com', path: '/', secure: true, httpOnly: true }
  ];

  await context.addCookies(cookieList);
  console.log(`[*] Successfully injected ${cookieList.length} authenticated session cookies.`);

  const page = await context.newPage();

  const networkTransactions: any[] = [];
  let commentPostTransaction: any = null;

  // Intercept and log every network request and response
  page.on('request', (request: any) => {
    const url = request.url();
    if (url.includes('instagram.com') && (request.method() === 'POST' || url.includes('comment') || url.includes('graphql'))) {
      networkTransactions.push({
        type: 'request',
        url: url,
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('response', async (response: any) => {
    const req = response.request();
    const url = req.url();
    if (url.includes('instagram.com') && (req.method() === 'POST' || url.includes('comment'))) {
      let bodyText = '';
      try {
        bodyText = await response.text();
      } catch {
        bodyText = '[Unreadable body]';
      }

      const tx = {
        url: url,
        method: req.method(),
        request_headers: req.headers(),
        request_body: req.postData(),
        response_status: response.status(),
        response_headers: response.headers(),
        response_body: bodyText.slice(0, 5000),
        timestamp: new Date().toISOString()
      };

      networkTransactions.push({ type: 'response', ...tx });

      const postData = req.postData() || '';
      if (
        url.includes('comment') ||
        (req.method() === 'POST' && url.includes('add')) ||
        (postData && (
          postData.toLowerCase().includes('comment') ||
          postData.includes('تست') ||
          postData.includes(encodeURIComponent('تست')) ||
          (url.includes('graphql') && postData.includes('client_mutation_id'))
        ))
      ) {
        commentPostTransaction = tx;
      }
    }
  });

  console.log(`[*] Navigating to post: ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  console.log('[*] DOM content loaded. Waiting for network idle & interactive state...');
  await page.waitForTimeout(5000);

  const pageTitle = await page.title();
  console.log(`[*] Page Title: "${pageTitle}"`);

  await page.screenshot({ path: path.join(WORKSPACE_DIR, 'scratch/post_page_screenshot.png') });
  console.log('[*] Saved page screenshot to scratch/post_page_screenshot.png');

  // Look for comment textarea / input
  console.log('[*] Locating comment input element...');
  const textareaSelector = 'textarea[aria-label*="comment" i], textarea[placeholder*="comment" i], textarea, form textarea';
  
  let inputFound = false;
  try {
    await page.waitForSelector(textareaSelector, { timeout: 10000 });
    inputFound = true;
    console.log('[*] Found comment input area!');
  } catch {
    console.log('[!] Direct comment textarea not immediately found; checking alternative selectors...');
  }

  if (inputFound) {
    // 1. Dismiss any existing modal dialog (e.g. "Boost unavailable" or promo popups) if present
    try {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      const dialogOkButton = page.locator('div[role="dialog"] button:has-text("OK"), div[role="dialog"] button, button:has-text("OK")');
      if (await dialogOkButton.count() > 0 && await dialogOkButton.first().isVisible()) {
        console.log('[*] Detected modal dialog on screen. Dismissing with OK button...');
        await dialogOkButton.first().click();
        await page.waitForTimeout(1000);
      }
    } catch {}

    console.log(`[*] Clicking comment box and typing with human keystrokes: "${commentText}"...`);
    await page.click(textareaSelector);
    await page.waitForTimeout(500);
    // Clear any previous text
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(200);

    await page.keyboard.type(commentText, { delay: 65 });
    console.log('[*] Keystrokes typed into React comment box. Waiting 1.5s...');
    await page.waitForTimeout(1500);

    // 2. Identify the comment submit button strictly within the comment form or exact match
    console.log('[*] Locating comment submit button (strictly excluding Boost post)...');
    let clickedPost = false;

    // Selector Strategy 1: Look inside the form containing the textarea
    try {
      const formSubmitBtn = page.locator('form button[type="submit"], form div[role="button"]:text-is("Post"), form button:text-is("Post")');
      if (await formSubmitBtn.count() > 0 && await formSubmitBtn.first().isVisible({ timeout: 2000 })) {
        console.log('[*] Found comment form submit button, clicking...');
        await formSubmitBtn.first().click();
        clickedPost = true;
      }
    } catch (e) {
      console.log(`[*] Strategy 1 note: ${e}`);
    }

    // Selector Strategy 2: Exact button match with name 'Post' (NOT 'Boost post')
    if (!clickedPost) {
      try {
        const exactPostBtn = page.getByRole('button', { name: 'Post', exact: true });
        if (await exactPostBtn.isVisible({ timeout: 2000 })) {
          console.log('[*] Found exact Post button via getByRole(exact: true), clicking...');
          await exactPostBtn.click();
          clickedPost = true;
        }
      } catch (e) {
        console.log(`[*] Strategy 2 note: ${e}`);
      }
    }

    // Selector Strategy 3: Press Enter key directly on the textarea (native Instagram Web comment submission)
    if (!clickedPost) {
      console.log('[*] Post button not clickable directly; pressing Enter in comment textarea...');
      await page.focus(textareaSelector);
      await page.keyboard.press('Enter');
      clickedPost = true;
    }

    console.log('✅ Comment submission triggered!');

    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(WORKSPACE_DIR, 'scratch/after_post_screenshot.png') });
    console.log('[*] Saved after_post screenshot to scratch/after_post_screenshot.png');
    console.log('[*] Awaiting server response & network settle (7 seconds)...');
    await page.waitForTimeout(7000);
  } else {
    // If textarea is not found on screen (e.g. login dialog or layout variation), capture page snapshot
    const currentUrl = page.url();
    console.log(`[!] Current Page URL: ${currentUrl}`);
    const content = await page.content();
    fs.writeFileSync(path.join(WORKSPACE_DIR, 'scratch/page_snapshot.html'), content, 'utf-8');
    console.log('[*] Saved HTML snapshot to scratch/page_snapshot.html for inspection.');
  }

  await browser.close();
  console.log('[*] Browser session closed cleanly.');

  // Save full trace
  fs.writeFileSync(AUDIT_FILE, JSON.stringify(networkTransactions, null, 2), 'utf-8');
  console.log(`[*] Full REA network transactions (${networkTransactions.length} events) saved to: ${AUDIT_FILE}`);

  if (commentPostTransaction) {
    console.log('\n================================================================');
    console.log('🎉 REA EVIDENCE CAPTURED: OFFICIAL WEB COMMENT MUTATION DETECTED!');
    console.log('================================================================');
    console.log(`Endpoint        : ${commentPostTransaction.url}`);
    console.log(`Method          : ${commentPostTransaction.method}`);
    console.log(`HTTP Status     : ${commentPostTransaction.response_status}`);
    console.log(`Payload         : ${commentPostTransaction.request_body}`);
    console.log(`Response Snippet: ${commentPostTransaction.response_body.slice(0, 300)}`);

    const evidencePayload = {
      platform: 'instagram_web',
      evidence_type: 'rea_live_web_comment_mutation',
      verified_at: new Date().toISOString(),
      account: `@${sessionData.username}`,
      target_post: {
        shortcode,
        url: targetUrl
      },
      comment_mutation: commentPostTransaction
    };

    fs.writeFileSync(EVIDENCE_FILE, JSON.stringify(evidencePayload, null, 2), 'utf-8');
    console.log(`[*] Official Evidence written to: ${EVIDENCE_FILE}`);
  } else {
    console.log('\n[!] No dedicated comment POST was observed in this interactive cycle.');
    console.log('    Review scratch/rea_web_comment_trace.json for recorded events.');
  }
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
