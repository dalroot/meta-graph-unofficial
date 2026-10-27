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
import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
/**
 * Parses a standard HTTP cookie string into key-value pairs
 */
export function parseCookieString(raw) {
    const result = {};
    if (!raw || typeof raw !== 'string')
        return result;
    const parts = raw.split(';');
    for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed)
            continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim();
            result[key] = val;
        }
    }
    return result;
}
/**
 * Formats a clean, canonical mobile cookie header string
 */
export function formatMobileCookie(session) {
    const parts = [];
    if (session.sessionid)
        parts.push(`sessionid=${session.sessionid}`);
    if (session.ds_user_id)
        parts.push(`ds_user_id=${session.ds_user_id}`);
    if (session.csrftoken)
        parts.push(`csrftoken=${session.csrftoken}`);
    if (session.mid)
        parts.push(`mid=${session.mid}`);
    if (session.device_id)
        parts.push(`ig_did=${session.device_id}`);
    if (session.rur)
        parts.push(`rur=${session.rur}`);
    if (session.datr)
        parts.push(`datr=${session.datr}`);
    return parts.join('; ');
}
/**
 * Parses any mobile session format (cookie string, JSON string, or object)
 * into a standardized MobileSession.
 */
export function parseMobileSession(input) {
    let parsedObj = null;
    if (typeof input === 'string') {
        const trimmed = input.trim();
        // Check if input is a JSON string
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                parsedObj = JSON.parse(trimmed);
            }
            catch {
                parsedObj = null;
            }
        }
        // If not JSON, treat as raw cookie string
        if (!parsedObj) {
            const cookies = parseCookieString(trimmed);
            const dsUserId = cookies.ds_user_id || (cookies.sessionid ? cookies.sessionid.split('%3A')[0].split(':')[0] : '');
            const deviceId = cookies.ig_did || crypto.randomUUID().toUpperCase();
            const phoneId = crypto.randomUUID();
            const session = {
                ds_user_id: dsUserId,
                sessionid: cookies.sessionid || '',
                csrftoken: cookies.csrftoken || 'missing_csrf',
                mid: cookies.mid,
                device_id: deviceId,
                phone_id: phoneId,
                rur: cookies.rur,
                datr: cookies.datr,
                cookie_string: formatMobileCookie({
                    sessionid: cookies.sessionid,
                    ds_user_id: dsUserId,
                    csrftoken: cookies.csrftoken,
                    mid: cookies.mid,
                    device_id: deviceId,
                    rur: cookies.rur,
                    datr: cookies.datr
                })
            };
            return session;
        }
    }
    else {
        parsedObj = input;
    }
    // Handle Puppeteer / HAR cookie array: [ { name: "...", value: "..." } ]
    if (Array.isArray(parsedObj)) {
        const cookieMap = {};
        for (const c of parsedObj) {
            if (c && c.name && c.value) {
                cookieMap[c.name] = c.value;
            }
        }
        return parseMobileSession(Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join('; '));
    }
    // Handle object with cookies array: { cookies: [ ... ] }
    if (Array.isArray(parsedObj.cookies)) {
        return parseMobileSession(parsedObj.cookies);
    }
    // Extract from key_tokens if nested
    const tokens = parsedObj.key_tokens || {};
    const cookieStringMap = parsedObj.cookie_string ? parseCookieString(parsedObj.cookie_string) : {};
    const dsUserId = String(parsedObj.ds_user_id ||
        tokens.ds_user_id ||
        cookieStringMap.ds_user_id ||
        (parsedObj.sessionid ? String(parsedObj.sessionid).split('%3A')[0].split(':')[0] : '') ||
        '19835089130');
    const sessionId = String(parsedObj.sessionid ||
        tokens.sessionid ||
        cookieStringMap.sessionid ||
        '');
    const csrfToken = String(parsedObj.csrftoken ||
        tokens.csrftoken ||
        cookieStringMap.csrftoken ||
        'missing_csrf');
    const mid = parsedObj.mid || tokens.mid || cookieStringMap.mid;
    const deviceId = parsedObj.device_id || tokens.ig_did || tokens.device_id || cookieStringMap.ig_did || crypto.randomUUID().toUpperCase();
    const phoneId = parsedObj.phone_id || tokens.phone_id || crypto.randomUUID();
    const rur = parsedObj.rur || tokens.rur || cookieStringMap.rur;
    const datr = parsedObj.datr || tokens.datr || cookieStringMap.datr;
    const authorization = parsedObj.authorization || tokens.authorization;
    const username = parsedObj.username;
    const fullName = parsedObj.full_name || parsedObj.name;
    const cookieString = parsedObj.cookie_string && parsedObj.cookie_string.includes('sessionid=')
        ? parsedObj.cookie_string
        : formatMobileCookie({
            sessionid: sessionId,
            ds_user_id: dsUserId,
            csrftoken: csrfToken,
            mid,
            device_id: deviceId,
            rur,
            datr
        });
    return {
        ds_user_id: dsUserId,
        sessionid: sessionId,
        csrftoken: csrfToken,
        mid,
        device_id: deviceId,
        phone_id: phoneId,
        authorization,
        rur,
        datr,
        username,
        full_name: fullName,
        cookie_string: cookieString
    };
}
/**
 * Loads a mobile session from a filepath, raw cookie string, or JSON string.
 */
export function loadMobileSession(filePathOrRaw) {
    if (fs.existsSync(filePathOrRaw)) {
        try {
            const content = fs.readFileSync(filePathOrRaw, 'utf-8');
            return parseMobileSession(content);
        }
        catch (err) {
            throw new Error(`Failed to load mobile session file from ${filePathOrRaw}: ${err.message}`);
        }
    }
    // Treat directly as raw content
    return parseMobileSession(filePathOrRaw);
}
/**
 * Saves a MobileSession cleanly to disk.
 */
export function saveMobileSession(filePath, session) {
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf-8');
}
