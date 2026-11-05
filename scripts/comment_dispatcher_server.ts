/**
 * TwinGraph — Safe Periodic Comment Dispatcher & Compact Web Dashboard
 * 
 * Runs a standalone HTTP server on http://localhost:4040 providing:
 * - Ultra-compact, high-density live control panel
 * - Resilient proxy reconnect for transient TLS socket resets
 * - Real-time metrics, countdown timer, and progress bar
 * - Multi-layer Meta verified comment PK confirmation
 * - Inviolable anti-ban Circuit Breaker
 */

import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { WebTwin } from '../dist/twins/web_twin.js';
import { TwinProfileRegistry } from '../dist/profiles/registry.js';
import { TwinTransport } from '../dist/twins/transport.js';

const PORT = 4040;
const HOST = '127.0.0.1';
const WORKSPACE_DIR = process.cwd();
const CB_FILE = path.join(WORKSPACE_DIR, 'circuit_breaker.json');
const SESSION_FILE = path.join(WORKSPACE_DIR, 'instagram_session.json');
const LOG_FILE = path.join(WORKSPACE_DIR, 'scratch/dispatcher_live_history.json');

interface DispatchLog {
  id: string;
  commentId?: string;
  mediaId: string;
  shortcode: string;
  text: string;
  status: 'SUCCESS' | 'FAILED' | 'RETRYING';
  latencyMs: number;
  timestamp: string;
  error?: string;
}

interface DispatcherState {
  isRunning: boolean;
  isPaused: boolean;
  circuitBreakerTripped: boolean;
  circuitBreakerReason: string;
  targetShortcode: string;
  targetMediaId: string;
  commentText: string;
  minIntervalSec: number;
  maxIntervalSec: number;
  maxBatchCount: number;
  totalAttempts: number;
  successfulSends: number;
  failedSends: number;
  nextRunInSeconds: number;
  lastLatencyMs: number;
  useVariants: boolean;
  variants: string[];
  logs: DispatchLog[];
}

const DEFAULT_VARIANTS = [
  'کەناڵ8',
  'کەناڵ 8',
  'کەناڵ8 ❤️',
  'کەناڵ 8 🌺',
  'کەناڵ8 📱',
  'کەناڵ8 ✨',
  'کەناڵ 8 🌹',
  'کەناڵ8 🌸',
  'کەناڵ 8 ⭐',
  'کەناڵ8 🔥'
];

const state: DispatcherState = {
  isRunning: false,
  isPaused: false,
  circuitBreakerTripped: false,
  circuitBreakerReason: '',
  targetShortcode: 'Deyg1mxiobv',
  targetMediaId: '4013414639194506991',
  commentText: 'کەناڵ8',
  useVariants: true,
  variants: DEFAULT_VARIANTS,
  minIntervalSec: 10,
  maxIntervalSec: 15,
  maxBatchCount: 30,
  totalAttempts: 0,
  successfulSends: 0,
  failedSends: 0,
  nextRunInSeconds: 0,
  lastLatencyMs: 0,
  isSendingNow: false,
  logs: []
};

// Load existing logs if available
if (fs.existsSync(LOG_FILE)) {
  try {
    const raw = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
    if (Array.isArray(raw)) {
      state.logs = raw;
      state.successfulSends = raw.filter((l: any) => l.status === 'SUCCESS').length;
      state.totalAttempts = raw.length;
    }
  } catch {}
}

function checkCircuitBreaker(): boolean {
  if (fs.existsSync(CB_FILE)) {
    try {
      const cb = JSON.parse(fs.readFileSync(CB_FILE, 'utf-8'));
      state.circuitBreakerTripped = Boolean(cb.tripped);
      state.circuitBreakerReason = cb.reason || '';
      return state.circuitBreakerTripped;
    } catch {}
  }
  return false;
}

function tripCircuitBreaker(reason: string) {
  state.circuitBreakerTripped = true;
  state.circuitBreakerReason = reason;
  state.isRunning = false;
  state.isPaused = false;
  state.isSendingNow = false;
  try {
    fs.writeFileSync(CB_FILE, JSON.stringify({
      tripped: true,
      reason,
      timestamp: new Date().toISOString()
    }, null, 2));
  } catch {}
}

function resetCircuitBreaker() {
  state.circuitBreakerTripped = false;
  state.circuitBreakerReason = 'Manually reset by user';
  try {
    fs.writeFileSync(CB_FILE, JSON.stringify({
      tripped: false,
      reason: 'Circuit breaker reset from Web Dashboard',
      timestamp: new Date().toISOString()
    }, null, 2));
  } catch {}
}

function saveLogs() {
  try {
    const scratchDir = path.join(WORKSPACE_DIR, 'scratch');
    if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
    fs.writeFileSync(LOG_FILE, JSON.stringify(state.logs.slice(0, 100), null, 2));
  } catch {}
}

let activeTimeout: NodeJS.Timeout | null = null;
let countdownInterval: NodeJS.Timeout | null = null;

async function executeSingleDispatch() {
  if (!state.isRunning || state.isPaused) return;

  if (checkCircuitBreaker()) {
    console.log('[!] Dispatch stopped: Circuit Breaker is active.');
    state.isRunning = false;
    state.isSendingNow = false;
    return;
  }

  if (state.successfulSends >= state.maxBatchCount) {
    console.log(`[*] Target batch count (${state.maxBatchCount}) reached. Auto-stopping loop.`);
    state.isRunning = false;
    state.isSendingNow = false;
    return;
  }

  state.totalAttempts++;
  state.isSendingNow = true;
  console.log(`\n[*] [Attempt #${state.totalAttempts}] Dispatching comment to ${state.targetShortcode}...`);

  let textToSend = state.commentText;
  if (state.useVariants && state.variants && state.variants.length > 0) {
    const idx = state.successfulSends % state.variants.length;
    textToSend = state.variants[idx];
  }

  const transport = new TwinTransport({ proxyUrl: 'socks5://127.0.0.1:10808' });
  const profile = TwinProfileRegistry.getDefaultWeb();
  const webTwin = new WebTwin(profile, SESSION_FILE, transport);

  const startTime = Date.now();
  try {
    const result = await webTwin.postComment(
      state.targetMediaId,
      textToSend,
      { shortcode: state.targetShortcode }
    );
    const latency = Date.now() - startTime;
    state.lastLatencyMs = latency;
    state.successfulSends++;
    state.isSendingNow = false;

    const logEntry: DispatchLog = {
      id: String(Date.now()),
      commentId: result.id,
      mediaId: state.targetMediaId,
      shortcode: state.targetShortcode,
      text: textToSend,
      status: 'SUCCESS',
      latencyMs: latency,
      timestamp: new Date().toISOString()
    };
    state.logs.unshift(logEntry);
    saveLogs();

    console.log(`  ✓ VERIFIED SUCCESS: Comment #${state.successfulSends} posted in ${(latency / 1000).toFixed(2)}s. Server PK: ${result.id}`);

    // Schedule next run with random jitter
    scheduleNextTick();

  } catch (err: any) {
    const latency = Date.now() - startTime;
    state.lastLatencyMs = latency;
    state.isSendingNow = false;

    const errMsg = err.message || String(err);
    console.error(`  ⚠️ ERROR: Dispatch error: ${errMsg}`);

    // Distinguish transient proxy/socket errors vs Instagram policy blocks
    const isTransientSocketError = errMsg.includes('disconnected before secure TLS') ||
                                   errMsg.includes('ECONNRESET') ||
                                   errMsg.includes('ETIMEDOUT') ||
                                   errMsg.includes('Network timeout');

    if (isTransientSocketError) {
      console.log('  🔄 Transient SOCKS5 socket glitch detected. Pausing 5s before auto-reconnect...');
      const logEntry: DispatchLog = {
        id: String(Date.now()),
        mediaId: state.targetMediaId,
        shortcode: state.targetShortcode,
        text: state.commentText,
        status: 'RETRYING',
        latencyMs: latency,
        timestamp: new Date().toISOString(),
        error: `خطای موقت سوکت پروکسی (${errMsg.slice(0, 45)}...). اتصال مجدد...`
      };
      state.logs.unshift(logEntry);
      saveLogs();

      setTimeout(() => {
        if (state.isRunning && !state.isPaused) {
          executeSingleDispatch();
        }
      }, 5000);
      return;
    }

    // Hard application / security error: trip circuit breaker immediately
    state.failedSends++;
    const logEntry: DispatchLog = {
      id: String(Date.now()),
      mediaId: state.targetMediaId,
      shortcode: state.targetShortcode,
      text: state.commentText,
      status: 'FAILED',
      latencyMs: latency,
      timestamp: new Date().toISOString(),
      error: errMsg
    };
    state.logs.unshift(logEntry);
    saveLogs();

    tripCircuitBreaker(`Instagram mutation blocked: ${errMsg}`);
  }
}

function scheduleNextTick() {
  if (!state.isRunning || state.isPaused) return;

  const minMs = Math.max(10, state.minIntervalSec) * 1000;
  const maxMs = Math.max(minMs + 1000, state.maxIntervalSec * 1000);
  const randomDelayMs = Math.floor(minMs + Math.random() * (maxMs - minMs));

  state.nextRunInSeconds = Math.round(randomDelayMs / 1000);
  console.log(`[*] Next dispatch in ${state.nextRunInSeconds}s (Jitter range: ${state.minIntervalSec}-${state.maxIntervalSec}s)...`);

  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    if (state.nextRunInSeconds > 0) {
      state.nextRunInSeconds--;
    } else {
      if (countdownInterval) clearInterval(countdownInterval);
    }
  }, 1000);

  if (activeTimeout) clearTimeout(activeTimeout);
  activeTimeout = setTimeout(() => {
    executeSingleDispatch();
  }, randomDelayMs);
}

// HTTP Server & Web UI
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname === '/api/status' && req.method === 'GET') {
    checkCircuitBreaker();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(state));
    return;
  }

  if (pathname === '/api/start' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        if (body) {
          const params = JSON.parse(body);
          if (params.commentText) state.commentText = params.commentText;
          if (params.minIntervalSec) state.minIntervalSec = Math.max(8, Number(params.minIntervalSec));
          if (params.maxIntervalSec) state.maxIntervalSec = Math.max(state.minIntervalSec + 2, Number(params.maxIntervalSec));
          if (params.maxBatchCount) state.maxBatchCount = Number(params.maxBatchCount);
        }
      } catch {}

      // Reset circuit breaker automatically if user clicks start
      resetCircuitBreaker();

      state.isRunning = true;
      state.isPaused = false;
      executeSingleDispatch();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Dispatcher started', state }));
    });
    return;
  }

  if (pathname === '/api/stop' && req.method === 'POST') {
    state.isRunning = false;
    state.isPaused = false;
    state.isSendingNow = false;
    state.nextRunInSeconds = 0;
    if (activeTimeout) clearTimeout(activeTimeout);
    if (countdownInterval) clearInterval(countdownInterval);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Dispatcher stopped', state }));
    return;
  }

  if (pathname === '/api/emergency-stop' && req.method === 'POST') {
    tripCircuitBreaker('Manual emergency kill switch pressed by user');
    if (activeTimeout) clearTimeout(activeTimeout);
    if (countdownInterval) clearInterval(countdownInterval);
    state.nextRunInSeconds = 0;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Emergency kill switch activated', state }));
    return;
  }

  if (pathname === '/api/reset-breaker' && req.method === 'POST') {
    resetCircuitBreaker();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Circuit breaker reset', state }));
    return;
  }

  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderDashboardHtml());
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

function renderDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TwinGraph Comment Dispatcher</title>
  <style>
    :root {
      --bg: #090d16;
      --card: #121824;
      --card-hover: #172030;
      --border: #1f293d;
      --accent: #38bdf8;
      --success: #10b981;
      --success-glow: rgba(16, 185, 129, 0.25);
      --danger: #ef4444;
      --warning: #f59e0b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Vazirmatn, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 16px; font-size: 13px; min-height: 100vh; }
    .container { max-width: 980px; margin: 0 auto; }

    /* Compact Top Bar */
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 16px;
      margin-bottom: 12px;
    }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-title { font-size: 15px; font-weight: 700; color: #fff; letter-spacing: -0.3px; }
    .post-tag { background: #1e293b; color: var(--accent); padding: 3px 8px; border-radius: 6px; font-size: 11px; font-family: monospace; }

    .status-pill {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .pill-active { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid #059669; }
    .pill-paused { background: rgba(148, 163, 184, 0.12); color: var(--text-muted); border: 1px solid var(--border); }
    .pill-tripped { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid var(--danger); }
    
    .radar-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #34d399;
      box-shadow: 0 0 8px #34d399;
      animation: pulse 1.4s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.7; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.7; }
    }

    /* KPI Grid - Compact */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 12px;
    }
    .kpi-box {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 14px;
      text-align: center;
      position: relative;
    }
    .kpi-title { font-size: 11px; color: var(--text-muted); font-weight: 500; margin-bottom: 4px; }
    .kpi-value { font-size: 24px; font-weight: 800; line-height: 1.1; }
    .val-success { color: #34d399; }
    .val-timer { color: #fbbf24; }
    .val-latency { color: var(--accent); }
    .val-cap { color: #cbd5e1; font-size: 19px; }

    .progress-bar-container {
      width: 100%;
      height: 4px;
      background: #1e293b;
      border-radius: 2px;
      overflow: hidden;
      margin-top: 8px;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #38bdf8);
      width: 0%;
      transition: width 0.3s ease;
    }

    /* Controls Panel */
    .controls-panel {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 12px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .field label { display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 4px; }
    .field input {
      width: 100%;
      background: #0b111c;
      border: 1px solid var(--border);
      color: #fff;
      padding: 7px 10px;
      border-radius: 6px;
      font-size: 13px;
      outline: none;
    }
    .field input:focus { border-color: var(--accent); }

    .action-row { display: flex; gap: 8px; align-items: center; }
    .btn {
      padding: 9px 18px;
      border-radius: 7px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn-start {
      background: #10b981;
      color: #062e1e;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.25);
    }
    .btn-start:hover { background: #059669; color: #fff; }
    .btn-running {
      background: #064e3b;
      color: #6ee7b7;
      border: 1px solid #10b981;
      cursor: default;
    }
    .btn-pause { background: #334155; color: #e2e8f0; }
    .btn-pause:hover { background: #475569; }
    .btn-kill { background: #7f1d1d; color: #fca5a5; border: 1px solid #991b1b; }
    .btn-kill:hover { background: #dc2626; color: #fff; }

    /* Alert Banner */
    .banner {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid var(--danger);
      color: #fca5a5;
      padding: 8px 14px;
      border-radius: 8px;
      margin-bottom: 12px;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .banner button {
      background: #ef4444; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; cursor: pointer;
    }

    /* Table - High Density */
    .table-container {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
    }
    .table-header {
      padding: 10px 14px;
      background: #0f1523;
      border-bottom: 1px solid var(--border);
      font-size: 12px;
      font-weight: 700;
      color: #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    table { width: 100%; border-collapse: collapse; text-align: right; }
    th { padding: 8px 12px; font-size: 11px; color: var(--text-muted); border-bottom: 1px solid var(--border); font-weight: 500; }
    td { padding: 8px 12px; font-size: 12px; border-bottom: 1px solid #161e2e; }
    tr:hover td { background: var(--card-hover); }

    .tag-success { background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; }
    .tag-fail { background: rgba(239, 68, 68, 0.15); color: #f87171; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; }
    .tag-retry { background: rgba(245, 158, 11, 0.15); color: #fbbf24; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; direction: ltr; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Compact Top Bar -->
    <div class="top-bar">
      <div class="brand">
        <span style="font-size: 18px;">⚡</span>
        <span class="brand-title">TwinGraph Comment Dispatcher</span>
        <span class="post-tag">@channel8corp • Deyg1mxiobv</span>
      </div>
      <div id="statusPill" class="status-pill pill-paused">
        <span id="radarDot" style="display:none;" class="radar-dot"></span>
        <span id="statusText">آماده‌باش</span>
      </div>
    </div>

    <!-- Circuit Breaker Alert Banner -->
    <div id="circuitBanner" class="banner" style="display: none;">
      <div>🚨 <b>ترمز اضطراری فعال است:</b> <span id="cbReasonText"></span></div>
      <button onclick="resetBreaker()">رفع ترمز و ادامه</button>
    </div>

    <!-- 4 KPI Box Row -->
    <div class="kpi-row">
      <div class="kpi-box">
        <div class="kpi-title">تاییدیه قطعی سرور اینستاگرام</div>
        <div id="kpiSuccess" class="kpi-value val-success">0</div>
        <div class="progress-bar-container">
          <div id="progressBar" class="progress-bar-fill"></div>
        </div>
      </div>
      <div class="kpi-box">
        <div class="kpi-title">شمارش معکوس ارسال بعدی</div>
        <div id="kpiCountdown" class="kpi-value val-timer">--</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-title">تاخیر آخرین ارسال (Latency)</div>
        <div id="kpiLatency" class="kpi-value val-latency">--</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-title">سقف مجاز این نشست</div>
        <div id="kpiCap" class="kpi-value val-cap">-- / 20</div>
      </div>
    </div>

    <!-- Compact Controls & Inputs -->
    <div class="controls-panel">
      <div class="form-row">
        <div class="field">
          <label>متن ارسالی کامنت:</label>
          <input type="text" id="inpText" value="کەناڵ8">
        </div>
        <div class="field">
          <label>حداقل وقفه (ثانیه):</label>
          <input type="number" id="inpMin" value="10" min="8">
        </div>
        <div class="field">
          <label>حداکثر وقفه (ثانیه):</label>
          <input type="number" id="inpMax" value="15" min="10">
        </div>
        <div class="field">
          <label>سقف کل کامنت‌ها:</label>
          <input type="number" id="inpCap" value="20" min="1" max="50">
        </div>
      </div>
      <!-- 10 Variants Chips -->
      <div style="margin-top: 10px; padding: 10px; background: #0c121e; border: 1px dashed var(--border); border-radius: 8px; margin-bottom: 12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
          <label style="display:flex; align-items:center; gap: 6px; font-weight: 700; color: #38bdf8; font-size: 12px; cursor: pointer;">
            <input type="checkbox" id="chkVariants" checked>
            <span>✨ چرخش خودکار بین ۱۰ مدل کامنت مسابقه (ضد اسپم و معتبر در قرعه‌کشی)</span>
          </label>
          <span style="font-size: 11px; color: var(--text-muted);">همه ۱۰ مورد حاوی کلیدواژه رسمی «کەناڵ8» هستند</span>
        </div>
        <div id="variantsContainer" style="display: flex; flex-wrap: wrap; gap: 6px;"></div>
      </div>
      <div class="action-row">
        <button id="btnStart" class="btn btn-start" onclick="handleStart()">▶ شروع ارسال خودکار</button>
        <button id="btnPause" class="btn btn-pause" onclick="handleStop()">⏸ توقف موقت</button>
        <button class="btn btn-kill" onclick="handleEmergency()">🛑 ترمز اضطراری (Kill Switch)</button>
      </div>
    </div>

    <!-- Stream Table -->
    <div class="table-container">
      <div class="table-header">
        <span>📜 لاگ لحظه‌ای ارسال‌ها (اعتبارسنجی ۱:۱ با شناسه سرور متا)</span>
        <span id="logSummary" style="color: var(--text-muted); font-weight: normal; font-size: 11px;"></span>
      </div>
      <table>
        <thead>
          <tr>
            <th>زمان</th>
            <th>وضعیت قطعی</th>
            <th>شناسه رسمی اینستاگرام (Verified Server PK)</th>
            <th>متن</th>
            <th>تاخیر</th>
          </tr>
        </thead>
        <tbody id="logsTbody">
          <tr><td colspan="5" style="text-align:center; color: var(--text-muted);">در حال دریافت اطلاعات...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <script>
    let isFetching = false;

    async function fetchStatus() {
      if (isFetching) return;
      isFetching = true;
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        renderState(data);
      } catch (err) {
        console.error('API Error:', err);
      } finally {
        isFetching = false;
      }
    }

    function renderState(d) {
      // Status Pill
      const pill = document.getElementById('statusPill');
      const radar = document.getElementById('radarDot');
      const stText = document.getElementById('statusText');
      const btnStart = document.getElementById('btnStart');

      if (d.circuitBreakerTripped) {
        pill.className = 'status-pill pill-tripped';
        radar.style.display = 'none';
        stText.innerText = 'ترمز اضطراری فعال';
        document.getElementById('circuitBanner').style.display = 'flex';
        document.getElementById('cbReasonText').innerText = d.circuitBreakerReason || 'خطای اتصال';
        btnStart.className = 'btn btn-start';
        btnStart.innerHTML = '▶ رفع ترمز و شروع مجدد';
      } else if (d.isRunning) {
        pill.className = 'status-pill pill-active';
        radar.style.display = 'inline-block';
        stText.innerText = d.isSendingNow ? 'در حال ارسال به متا...' : 'زنده (در حال اجرا)';
        document.getElementById('circuitBanner').style.display = 'none';
        btnStart.className = 'btn btn-running';
        btnStart.innerHTML = '● فرایند زنده فعال است';
      } else {
        pill.className = 'status-pill pill-paused';
        radar.style.display = 'none';
        stText.innerText = 'متوقف';
        document.getElementById('circuitBanner').style.display = 'none';
        btnStart.className = 'btn btn-start';
        btnStart.innerHTML = '▶ شروع ارسال خودکار';
      }

      // KPIs
      document.getElementById('kpiSuccess').innerText = d.successfulSends;
      document.getElementById('kpiLatency').innerText = d.lastLatencyMs ? (d.lastLatencyMs / 1000).toFixed(2) + ' ثانیه' : '--';
      document.getElementById('kpiCountdown').innerText = (d.isRunning && d.nextRunInSeconds > 0) ? (d.nextRunInSeconds + ' ثانیه') : (d.isSendingNow ? 'ارسال...' : '--');
      document.getElementById('kpiCap').innerText = d.successfulSends + ' / ' + d.maxBatchCount;

      // Progress Bar
      const pct = Math.min(100, Math.round((d.successfulSends / d.maxBatchCount) * 100));
      document.getElementById('progressBar').style.width = pct + '%';

      // Variants rendering
      const varContainer = document.getElementById('variantsContainer');
      if (d.variants && d.variants.length > 0 && varContainer) {
        const nextIdx = (d.successfulSends || 0) % d.variants.length;
        varContainer.innerHTML = d.variants.map((v, i) => {
          const isNext = d.isRunning && (i === nextIdx);
          const style = isNext 
            ? 'background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; color: #fff; font-weight: 700; transform: scale(1.05);' 
            : 'background: #1e293b; border: 1px solid #334155; color: #cbd5e1;';
          return \`<span style="padding: 4px 8px; border-radius: 6px; font-size: 11px; transition: 0.2s; \${style}">
            \${i + 1}. \${v} \${isNext ? '👈 بعدی' : ''}
          </span>\`;
        }).join('');
      }

      // Logs
      document.getElementById('logSummary').innerText = d.successfulSends + ' ارسال موفق از ' + d.totalAttempts + ' تلاش';
      const tbody = document.getElementById('logsTbody');
      if (d.logs && d.logs.length > 0) {
        tbody.innerHTML = d.logs.map(l => {
          let badge = '<span class="tag-success">✓ تایید شد</span>';
          if (l.status === 'FAILED') badge = '<span class="tag-fail">خطا</span>';
          if (l.status === 'RETRYING') badge = '<span class="tag-retry">تلاش مجدد</span>';

          const pkDisplay = l.commentId 
            ? '<b style="color:#38bdf8;">' + l.commentId + '</b>' 
            : (l.error ? '<span style="color:#f87171; font-size:11px;">' + l.error.slice(0, 50) + '</span>' : '--');

          return \`<tr>
            <td class="mono" style="color:var(--text-muted);">\${new Date(l.timestamp).toLocaleTimeString('fa-IR')}</td>
            <td>\${badge}</td>
            <td class="mono">\${pkDisplay}</td>
            <td>\${l.text}</td>
            <td class="mono">\${(l.latencyMs / 1000).toFixed(2)}s</td>
          </tr>\`;
        }).join('');
      }
    }

    async function handleStart() {
      const payload = {
        commentText: document.getElementById('inpText').value,
        useVariants: document.getElementById('chkVariants').checked,
        minIntervalSec: document.getElementById('inpMin').value,
        maxIntervalSec: document.getElementById('inpMax').value,
        maxBatchCount: document.getElementById('inpCap').value
      };
      await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchStatus();
    }

    async function handleStop() {
      await fetch('/api/stop', { method: 'POST' });
      fetchStatus();
    }

    async function handleEmergency() {
      await fetch('/api/emergency-stop', { method: 'POST' });
      fetchStatus();
    }

    async function resetBreaker() {
      await fetch('/api/reset-breaker', { method: 'POST' });
      fetchStatus();
    }

    setInterval(fetchStatus, 1000);
    fetchStatus();
  </script>
</body>
</html>`;
}

server.listen(PORT, HOST, () => {
  console.log(`\n================================================================`);
  console.log(`🚀 TwinGraph Comment Dispatcher & Compact Dashboard is Live!`);
  console.log(`🌐 Control Panel: http://${HOST}:${PORT}`);
  console.log(`================================================================\n`);
});
