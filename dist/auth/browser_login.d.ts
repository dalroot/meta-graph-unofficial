/**
 * Browser Login & Session Extractor
 *
 * Automates Instagram session extraction using local Google Chrome / Chromium.
 * Opens real browser, allows 1-click or quick manual login, and automatically
 * captures all required security cookies (sessionid, ds_user_id, csrftoken, mid, etc.)
 * via Chrome DevTools Protocol (CDP), saving directly to instagram_session.json.
 */
import { MobileSession } from '../twins/session_loader.js';
export interface LoginOptions {
    chromePath?: string;
    userDataDir?: string;
    outputPath?: string;
    proxyUrl?: string;
    timeoutSeconds?: number;
}
export declare function normalizeChromeProxy(rawProxy?: string): string | undefined;
export declare function findSystemChrome(): string;
export declare function runBrowserLogin(options?: LoginOptions): Promise<MobileSession>;
