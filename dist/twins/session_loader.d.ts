/**
 * Mobile Session Loader & Parser
 *
 * Standardized schema and parser for Instagram Mobile Client sessions.
 * Supports:
 * 1. Raw mobile cookie string ("sessionid=...; ds_user_id=...;")
 * 2. Flat or nested JSON session formats (including key_tokens and Puppeteer cookie arrays)
 * 3. File path loading with fallback resolution
 * 4. Automatic canonical mobile cookie header generation
 */
export interface MobileSession {
    ds_user_id: string;
    sessionid: string;
    csrftoken?: string;
    mid?: string;
    device_id?: string;
    phone_id?: string;
    authorization?: string;
    rur?: string;
    datr?: string;
    username?: string;
    full_name?: string;
    cookie_string: string;
}
/**
 * Parses a standard HTTP cookie string into key-value pairs
 */
export declare function parseCookieString(raw: string): Record<string, string>;
/**
 * Formats a clean, canonical mobile cookie header string
 */
export declare function formatMobileCookie(session: Partial<MobileSession>): string;
/**
 * Parses any mobile session format (cookie string, JSON string, or object)
 * into a standardized MobileSession.
 */
export declare function parseMobileSession(input: string | Record<string, any>): MobileSession;
/**
 * Loads a mobile session from a filepath, raw cookie string, or JSON string.
 */
export declare function loadMobileSession(filePathOrRaw: string): MobileSession;
/**
 * Saves a MobileSession cleanly to disk.
 */
export declare function saveMobileSession(filePath: string, session: MobileSession): void;
