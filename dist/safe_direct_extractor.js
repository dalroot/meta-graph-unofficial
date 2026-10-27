/**
 * Safe Single-Pass Read-Only Direct Inbox Extractor
 * Strictly follows AGENTS.md Meta Source Fidelity Standard & Anti-Ban Rules
 */
import * as fs from 'node:fs';
import { TwinTransport } from './twins/transport.js';
// Enforce local socks5 proxy for TwinTransport
process.env.ALL_PROXY = process.env.ALL_PROXY || 'socks5://127.0.0.1:10808';
process.env.HTTPS_PROXY = process.env.HTTPS_PROXY || 'socks5://127.0.0.1:10808';
const CB_PATH = '/home/hokar/Documents/antigravity/hopeful-bell/circuit_breaker.json';
const SESSION_PATH = '/home/hokar/Documents/antigravity/hopeful-bell/instagram_session.json';
const OUTPUT_PATH = '/home/hokar/Documents/antigravity/hopeful-bell/scratch/extracted_direct_threads.json';
function tripCircuitBreaker(reason) {
    console.error(`[!] TRIPPING CIRCUIT BREAKER: ${reason}`);
    if (fs.existsSync(CB_PATH)) {
        try {
            const cb = JSON.parse(fs.readFileSync(CB_PATH, 'utf-8'));
            cb.tripped = true;
            cb.reason = reason;
            cb.tripped_at = new Date().toISOString();
            fs.writeFileSync(CB_PATH, JSON.stringify(cb, null, 2), 'utf-8');
            console.error('[!] circuit_breaker.json updated to tripped: true');
        }
        catch (e) {
            console.error('[!] Failed to update circuit_breaker.json:', e.message);
        }
    }
}
async function main() {
    console.log('[*] ========================================================');
    console.log('[*] CAUTIOUS DIRECT INBOX EXTRACTOR - SINGLE-PASS EXECUTION');
    console.log('[*] Target Account: @hokar368 (ds_user_id: 19835089130)');
    console.log('[*] Target Subject: @tawanatallks');
    console.log('[*] ========================================================');
    // PRE-FLIGHT VERIFICATION 1: Circuit breaker check
    if (!fs.existsSync(CB_PATH)) {
        console.error(`[!] Circuit breaker file not found: ${CB_PATH}`);
        process.exit(1);
    }
    const cb = JSON.parse(fs.readFileSync(CB_PATH, 'utf-8'));
    if (cb.tripped) {
        console.error(`[!] ABORT: Circuit breaker is ALREADY TRIPPED. Reason: ${cb.reason}`);
        process.exit(1);
    }
    console.log('[+] Pre-flight Check 1: Circuit breaker is NOT tripped (tripped: false).');
    // PRE-FLIGHT VERIFICATION 2: Active user verification
    if (!fs.existsSync(SESSION_PATH)) {
        console.error(`[!] Session file not found: ${SESSION_PATH}`);
        process.exit(1);
    }
    const session = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf-8'));
    if (session.ds_user_id !== '19835089130' || session.username !== 'hokar368') {
        console.error(`[!] Active user mismatch: found ${session.username} (${session.ds_user_id}), expected hokar368 (19835089130)`);
        process.exit(1);
    }
    console.log(`[+] Pre-flight Check 2: Active user verified: @${session.username} (ID: ${session.ds_user_id})`);
    const transport = new TwinTransport();
    let jsonResponseData = null;
    let endpointUsed = '';
    // ----------------------------------------------------
    // ATTEMPT 1: Web GraphQL Direct Inbox
    // Target: POST https://www.instagram.com/api/graphql (NO trailing slash!)
    // ----------------------------------------------------
    const graphqlUrl = 'https://www.instagram.com/api/graphql';
    const graphqlBody = 'fb_dtsg=NAfw8W7ebWzCXgq0gDYP4btWup7cCuOpz9Kol06NSSfi1T0LBs6hZ_g%3A17855905060073950%3A1791915565&jazoest=26281&doc_id=27909866362025854&variables=%7B%7D';
    const graphqlHeaders = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-FB-Friendly-Name': 'PolarisDirectInboxQuery',
        'X-CSRFToken': session.key_tokens.csrftoken,
        'X-IG-App-ID': '936619743392459',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://www.instagram.com/direct/inbox/',
        'Origin': 'https://www.instagram.com',
        'User-Agent': session.digital_twin_fingerprint.user_agent,
        'Cookie': session.cookie_string,
        'Content-Length': String(Buffer.byteLength(graphqlBody, 'utf-8')),
        'Accept': '*/*'
    };
    console.log('\n[*] Attempt 1: POST https://www.instagram.com/api/graphql (PolarisDirectInboxQuery)');
    let resp1 = null;
    const t0 = Date.now();
    try {
        resp1 = await transport.request(graphqlUrl, {
            method: 'POST',
            headers: graphqlHeaders,
            body: graphqlBody,
            timeoutMs: 25000
        });
    }
    catch (err) {
        console.error(`[!] Attempt 1 Network error: ${err.message}`);
    }
    let attempt1NeedsFallback = true;
    if (resp1) {
        const elapsed1 = Date.now() - t0;
        console.log(`[*] Attempt 1 HTTP Response: ${resp1.status} ${resp1.statusText} (${elapsed1}ms, ${resp1.data.length} bytes)`);
        if (resp1.status === 200) {
            const trimmed = resp1.data.trim();
            const isHtml = trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.includes('<body');
            if (isHtml) {
                console.log('[*] Attempt 1 returned HTML shell rather than JSON payload.');
                attempt1NeedsFallback = true;
            }
            else {
                try {
                    const parsed = JSON.parse(resp1.data);
                    // Check if threads exist in GraphQL response
                    const hasData = parsed.data && (parsed.data.viewer || parsed.data.inbox || parsed.data.message_threads);
                    if (hasData) {
                        console.log('[+] Attempt 1 returned valid GraphQL JSON with viewer/inbox data!');
                        jsonResponseData = parsed;
                        endpointUsed = 'POST https://www.instagram.com/api/graphql';
                        attempt1NeedsFallback = false;
                    }
                    else {
                        console.log('[*] Attempt 1 JSON lacks direct threads or returned empty data.');
                        attempt1NeedsFallback = true;
                    }
                }
                catch (e) {
                    console.log('[*] Attempt 1 response could not be parsed as JSON:', e.message);
                    attempt1NeedsFallback = true;
                }
            }
        }
        else {
            console.log(`[*] Attempt 1 returned non-200 status (${resp1.status}). Evaluating fallback.`);
            attempt1NeedsFallback = true;
        }
    }
    // ----------------------------------------------------
    // ATTEMPT 2: Mobile Native Direct Inbox Endpoint (if Attempt 1 needs fallback)
    // Target: GET https://i.instagram.com/api/v1/direct_v2/inbox/?persistentBadging=true&folder=&limit=10&thread_message_limit=10
    // ----------------------------------------------------
    if (attempt1NeedsFallback) {
        console.log('\n[*] Fallback Triggered: Executing official Mobile Native Direct Inbox endpoint (Single Attempt)...');
        const mobileUrl = 'https://i.instagram.com/api/v1/direct_v2/inbox/?persistentBadging=true&folder=&limit=10&thread_message_limit=10';
        const mobileHeaders = {
            'User-Agent': 'Instagram 451.0.0.53.80 Android (35/15; 440dpi; 1080x2400; Xiaomi; 23129RAA4G; sapphire; qcom; en_US; 385713116)',
            'X-IG-App-ID': '1217981644879628',
            'X-IG-Capabilities': '3brTv10=',
            'X-IG-Connection-Type': 'WIFI',
            'X-FB-HTTP-Engine': 'Liger',
            'Cookie': session.cookie_string,
            'Accept': '*/*'
        };
        const t1 = Date.now();
        let resp2 = null;
        try {
            resp2 = await transport.request(mobileUrl, {
                method: 'GET',
                headers: mobileHeaders,
                timeoutMs: 25000
            });
        }
        catch (err) {
            console.error(`[!] Attempt 2 Network error: ${err.message}`);
            tripCircuitBreaker(`Attempt 2 Network failure on ${mobileUrl}: ${err.message}`);
            process.exit(1);
        }
        const elapsed2 = Date.now() - t1;
        console.log(`[*] Attempt 2 HTTP Response: ${resp2.status} ${resp2.statusText} (${elapsed2}ms, ${resp2.data.length} bytes)`);
        if (resp2.status !== 200) {
            tripCircuitBreaker(`HTTP ${resp2.status} on Mobile Direct Inbox: ${resp2.data.substring(0, 300)}`);
            process.exit(1);
        }
        try {
            jsonResponseData = JSON.parse(resp2.data);
            endpointUsed = 'GET https://i.instagram.com/api/v1/direct_v2/inbox/?persistentBadging=true&folder=&limit=10&thread_message_limit=10';
            console.log('[+] Attempt 2 cleanly returned valid JSON direct inbox payload!');
        }
        catch (e) {
            console.error('[!] Failed to parse Mobile Direct Inbox response as JSON:', e.message);
            tripCircuitBreaker(`Invalid JSON from Mobile Direct Inbox: ${resp2.data.substring(0, 200)}`);
            process.exit(1);
        }
    }
    // ----------------------------------------------------
    // THREAD PARSING & SEARCH FOR @tawanatallks
    // ----------------------------------------------------
    console.log('\n[*] ========================================================');
    console.log('[*] Parsing threads from response payload...');
    console.log(`[*] Endpoint Used: ${endpointUsed}`);
    // Find all thread objects in payload
    const rawThreads = [];
    function searchThreads(node) {
        if (!node || typeof node !== 'object')
            return;
        if (Array.isArray(node)) {
            for (const item of node)
                searchThreads(item);
            return;
        }
        // Mobile native threads have thread_id and users
        if ((node.thread_id || node.thread_v2_id) && (node.users || node.items || node.last_permanent_item)) {
            rawThreads.push(node);
            return;
        }
        // Web GraphQL edges
        if (node.__typename === 'DirectThread' || node.thread_id) {
            rawThreads.push(node);
            return;
        }
        for (const k of Object.keys(node)) {
            if (typeof node[k] === 'object') {
                searchThreads(node[k]);
            }
        }
    }
    // Check top-level inbox.threads first (standard mobile format)
    if (jsonResponseData.inbox && Array.isArray(jsonResponseData.inbox.threads)) {
        for (const t of jsonResponseData.inbox.threads) {
            rawThreads.push(t);
        }
    }
    else {
        searchThreads(jsonResponseData);
    }
    console.log(`[*] Total raw threads discovered: ${rawThreads.length}`);
    // Locate @tawanatallks thread
    let tawanaThread = null;
    for (const th of rawThreads) {
        const users = th.users || [];
        const title = (th.thread_title || '').toLowerCase();
        const usernames = users.map((u) => (u.username || '').toLowerCase());
        if (usernames.includes('tawanatallks') || title.includes('tawanatallks')) {
            tawanaThread = th;
            break;
        }
    }
    if (tawanaThread) {
        console.log(`[+] SUCCESS: Found thread with @tawanatallks! Thread ID: ${tawanaThread.thread_id || tawanaThread.thread_v2_id}`);
    }
    else {
        console.log(`[*] Direct thread matching username 'tawanatallks' not found in current inbox page.`);
        console.log('[*] Available threads in inbox:');
        for (const th of rawThreads) {
            const uNames = (th.users || []).map((u) => u.username).join(', ');
            console.log(`  - Thread ID: ${th.thread_id || th.thread_v2_id}, Title: "${th.thread_title || ''}", Users: [${uNames}]`);
        }
    }
    // Selected target thread is tawanaThread if present, else top thread
    const targetThread = tawanaThread || (rawThreads.length > 0 ? rawThreads[0] : null);
    // ----------------------------------------------------
    // CONVERT TO META GRAPH API v21.0 SCHEMA
    // ----------------------------------------------------
    const selfUser = {
        id: session.ds_user_id,
        username: session.username,
        name: session.full_name
    };
    const graphConversations = [];
    const graphMessagesMap = {};
    for (const th of rawThreads) {
        const threadId = String(th.thread_id || th.thread_v2_id || `th_${Date.now()}`);
        const participants = [];
        if (Array.isArray(th.users)) {
            for (const u of th.users) {
                participants.push({
                    id: String(u.pk || u.pk_id || u.id || ''),
                    username: u.username || 'unknown',
                    name: u.full_name || u.name || ''
                });
            }
        }
        if (!participants.some(p => p.username === selfUser.username)) {
            participants.push(selfUser);
        }
        const items = th.items || [];
        const parsedMessages = [];
        for (const item of items) {
            let tsNum = Number(item.timestamp || 0);
            if (tsNum > 1e14)
                tsNum = Math.floor(tsNum / 1000); // Microseconds to ms
            else if (tsNum < 1e11 && tsNum > 0)
                tsNum = tsNum * 1000; // Seconds to ms
            const isoTime = tsNum ? new Date(tsNum).toISOString() : new Date().toISOString();
            let text = item.text || '';
            if (!text && item.item_type === 'link') {
                text = item.link?.text || item.link?.link_context?.link_url || '[Link]';
            }
            else if (!text && item.item_type === 'media') {
                text = '[Media]';
            }
            else if (!text && item.item_type === 'animated_media') {
                text = '[GIF / Animated Media]';
            }
            else if (!text && item.item_type === 'clip') {
                text = '[Reel / Clip]';
            }
            else if (!text && item.item_type === 'like') {
                text = '❤️';
            }
            else if (!text && item.item_type === 'action_log') {
                text = item.action_log?.description || '[Action Log]';
            }
            const senderId = String(item.user_id || '');
            const sender = participants.find(p => p.id === senderId) || {
                id: senderId,
                username: senderId === selfUser.id ? selfUser.username : 'unknown'
            };
            parsedMessages.push({
                id: String(item.item_id || `msg_${Date.now()}`),
                created_time: isoTime,
                from: {
                    id: sender.id,
                    username: sender.username
                },
                message: text,
                item_type: item.item_type || 'text'
            });
        }
        // Determine last message snippet
        const lastItem = th.last_permanent_item || (items.length > 0 ? items[0] : null);
        let snippet = lastItem?.text || (parsedMessages.length > 0 ? parsedMessages[0].message : '');
        if (!snippet && lastItem?.item_type)
            snippet = `[${lastItem.item_type}]`;
        let updatedTime = new Date().toISOString();
        if (lastItem?.timestamp) {
            let lts = Number(lastItem.timestamp);
            if (lts > 1e14)
                lts = Math.floor(lts / 1000);
            else if (lts < 1e11 && lts > 0)
                lts = lts * 1000;
            updatedTime = new Date(lts).toISOString();
        }
        else if (parsedMessages.length > 0) {
            updatedTime = parsedMessages[0].created_time;
        }
        graphConversations.push({
            id: threadId,
            updated_time: updatedTime,
            unread_count: th.read_state === 0 ? 1 : (th.unseen_count || 0),
            participants: {
                data: participants
            },
            snippet: snippet
        });
        graphMessagesMap[threadId] = parsedMessages;
    }
    // Target thread specific details
    let targetDetails = null;
    if (targetThread) {
        const targetId = String(targetThread.thread_id || targetThread.thread_v2_id);
        const targetParticipants = (targetThread.users || []).map((u) => ({
            id: String(u.pk || u.pk_id || u.id),
            username: u.username,
            name: u.full_name
        }));
        if (!targetParticipants.some((p) => p.username === selfUser.username)) {
            targetParticipants.push(selfUser);
        }
        const msgs = graphMessagesMap[targetId] || [];
        const lastMsg = msgs.length > 0 ? msgs[0] : { message: targetThread.last_permanent_item?.text || '', created_time: new Date().toISOString() };
        targetDetails = {
            thread_id: targetId,
            thread_v2_id: targetThread.thread_v2_id,
            thread_title: targetThread.thread_title || (targetParticipants.find((p) => p.username !== selfUser.username)?.username || ''),
            is_group: !!targetThread.is_group,
            muted: !!targetThread.muted,
            participants: targetParticipants,
            last_message: lastMsg,
            recent_messages: msgs
        };
    }
    // Build final structured JSON output
    const finalOutput = {
        extraction_metadata: {
            timestamp: new Date().toISOString(),
            account: {
                username: session.username,
                id: session.ds_user_id
            },
            endpoint_used: endpointUsed,
            total_threads_extracted: rawThreads.length,
            tawana_thread_found: !!tawanaThread
        },
        meta_graph_api_v21: {
            get_user_conversations: {
                data: graphConversations,
                paging: {
                    cursors: {
                        before: jsonResponseData.inbox?.oldest_cursor || null,
                        after: jsonResponseData.inbox?.prev_cursor || null
                    }
                }
            },
            get_conversation_messages: targetDetails ? {
                conversation_id: targetDetails.thread_id,
                data: targetDetails.recent_messages
            } : null
        },
        target_conversation_detail: targetDetails,
        raw_threads_summary: rawThreads.map(th => ({
            thread_id: th.thread_id || th.thread_v2_id,
            title: th.thread_title,
            users: (th.users || []).map((u) => u.username),
            last_item: th.last_permanent_item?.text || (th.items?.[0]?.text) || '[No text]',
            items_count: (th.items || []).length
        }))
    };
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalOutput, null, 2), 'utf-8');
    console.log(`\n[+] Structured response successfully saved to: ${OUTPUT_PATH}`);
    console.log('\n================== EXTRACTION SUMMARY ==================');
    console.log(`Endpoint: ${endpointUsed}`);
    console.log(`Total Threads: ${rawThreads.length}`);
    console.log(`Tawana Talks Thread Found: ${tawanaThread ? 'YES ✅' : 'NO ⚠️'}`);
    if (targetDetails) {
        console.log(`Target Thread ID: ${targetDetails.thread_id}`);
        console.log(`Participants: ${targetDetails.participants.map((p) => `${p.username} (${p.id})`).join(', ')}`);
        console.log(`Last Message: "${targetDetails.last_message?.message || targetDetails.last_message?.text}" at ${targetDetails.last_message?.created_time}`);
        console.log(`Messages Count: ${targetDetails.recent_messages.length}`);
        for (const m of targetDetails.recent_messages) {
            console.log(`  - [${m.created_time}] ${m.from.username}: ${m.message}`);
        }
    }
    console.log('========================================================\n');
}
main().catch(err => {
    console.error('[!] Uncaught fatal error:', err);
    tripCircuitBreaker(`Fatal unhandled script exception: ${err.message}`);
    process.exit(1);
});
