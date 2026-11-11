/**
 * WebTwin - Desktop Web Browser Fingerprint & Network Protocol Emulation
 *
 * Accurately models desktop web clients (Chrome on Linux/Windows/macOS)
 * and interfaces directly with Meta's official web endpoints (www.instagram.com).
 * Completely eliminates identity clashes with mobile Liger/Tigon stacks.
 */
import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
import { TwinTransport } from './transport.js';
import { TwinProfileRegistry } from '../profiles/registry.js';
import { DEFAULT_SESSION_PATH } from './device_twin.js';
export class WebTwin {
    profile;
    session;
    transport;
    constructor(profile, sessionPath = DEFAULT_SESSION_PATH, transport) {
        this.profile = profile || TwinProfileRegistry.getDefaultWeb();
        this.transport = transport || new TwinTransport();
        this.session = this.loadSession(sessionPath);
    }
    loadSession(sessionPath) {
        if (fs.existsSync(sessionPath)) {
            try {
                const raw = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
                const tokens = raw.key_tokens || raw;
                return {
                    username: raw.username || '',
                    full_name: raw.full_name || '',
                    ds_user_id: raw.ds_user_id || tokens.ds_user_id || '',
                    cookie_string: raw.cookie_string || '',
                    csrftoken: tokens.csrftoken || raw.csrftoken,
                    sessionid: tokens.sessionid || raw.sessionid,
                    mid: tokens.mid || raw.mid,
                    ig_did: tokens.ig_did || raw.ig_did,
                    datr: tokens.datr || raw.datr,
                    rur: tokens.rur || raw.rur,
                    fb_dtsg: tokens.fb_dtsg || raw.fb_dtsg,
                    lsd: tokens.lsd || raw.lsd,
                    jazoest: tokens.jazoest || raw.jazoest
                };
            }
            catch {
                // Fallback below
            }
        }
        return {
            username: '',
            full_name: '',
            ds_user_id: '',
            cookie_string: ''
        };
    }
    getProfile() {
        return { ...this.profile };
    }
    getSession() {
        return { ...this.session };
    }
    hasActiveSession() {
        return Boolean(this.session.sessionid && this.session.sessionid.length > 10);
    }
    /**
     * Generates authentic Web Browser headers conforming to Chrome on Linux
     */
    getWebHeaders(referer = 'https://www.instagram.com/') {
        const headers = {
            'User-Agent': this.profile.user_agent,
            'Accept': '*/*',
            'Accept-Language': this.profile.accept_language,
            'X-IG-App-ID': this.profile.app_id,
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': 'https://www.instagram.com',
            'Referer': referer,
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Connection': 'keep-alive'
        };
        if (this.profile.sec_ch_ua) {
            headers['sec-ch-ua'] = this.profile.sec_ch_ua;
        }
        if (this.profile.sec_ch_ua_mobile) {
            headers['sec-ch-ua-mobile'] = this.profile.sec_ch_ua_mobile;
        }
        if (this.profile.sec_ch_ua_platform) {
            headers['sec-ch-ua-platform'] = this.profile.sec_ch_ua_platform;
        }
        if (this.profile.sec_ch_ua_platform_version) {
            headers['sec-ch-ua-platform-version'] = this.profile.sec_ch_ua_platform_version;
        }
        if (this.profile.sec_ch_ua_arch) {
            headers['sec-ch-ua-arch'] = this.profile.sec_ch_ua_arch;
        }
        if (this.profile.sec_ch_ua_bitness) {
            headers['sec-ch-ua-bitness'] = this.profile.sec_ch_ua_bitness;
        }
        if (this.profile.sec_ch_ua_model) {
            headers['sec-ch-ua-model'] = this.profile.sec_ch_ua_model;
        }
        if (this.session.csrftoken) {
            headers['X-CSRFToken'] = this.session.csrftoken;
        }
        if (this.session.cookie_string) {
            headers['Cookie'] = this.session.cookie_string;
        }
        return headers;
    }
    /**
     * Posts an authentic comment on a media object via official Web RelayModern GraphQL mutation
     * Query: PolarisPostCommentInputRevampedMutation (doc_id: 27261905640092552)
     * Endpoint: POST https://www.instagram.com/api/graphql
     */
    async postComment(mediaId, message, options = {}) {
        await this.ensureWebTokens();
        const text = message ? message.trim() : '';
        if (!text) {
            throw new Error('Comment message cannot be empty.');
        }
        const cleanMediaId = mediaId.includes('_') ? mediaId.split('_')[0] : mediaId;
        const referer = options.shortcode
            ? `https://www.instagram.com/p/${options.shortcode}/`
            : 'https://www.instagram.com/';
        const headers = this.getWebHeaders(referer);
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        headers['x-fb-friendly-name'] = 'PolarisPostCommentInputRevampedMutation';
        headers['x-asbd-id'] = '359341';
        if (this.session.lsd) {
            headers['x-fb-lsd'] = this.session.lsd;
        }
        const params = new URLSearchParams();
        params.set('av', this.session.ds_user_id || '17841419713919386');
        params.set('__d', 'www');
        params.set('__user', '0');
        params.set('__a', '1');
        if (this.session.fb_dtsg) {
            params.set('fb_dtsg', this.session.fb_dtsg);
        }
        if (this.session.jazoest) {
            params.set('jazoest', this.session.jazoest);
        }
        if (this.session.lsd) {
            params.set('lsd', this.session.lsd);
        }
        params.set('fb_api_caller_class', 'RelayModern');
        params.set('fb_api_req_friendly_name', 'PolarisPostCommentInputRevampedMutation');
        params.set('server_timestamps', 'true');
        params.set('doc_id', '27261905640092552');
        const variables = {
            connections: [
                `client:root:__PolarisPostComments__xdt_api__v1__media__media_id__comments__connection_connection(data:{},media_id:"${cleanMediaId}",sort_order:"popular")`
            ],
            data: {
                comment_text: text,
                media_id: cleanMediaId
            }
        };
        if (options.parentCommentId) {
            variables.data.replied_to_comment_id = options.parentCommentId;
        }
        params.set('variables', JSON.stringify(variables));
        const bodyData = params.toString();
        headers['Content-Length'] = Buffer.byteLength(bodyData, 'utf-8').toString();
        const url = 'https://www.instagram.com/api/graphql';
        const res = await this.transport.request(url, {
            method: 'POST',
            headers,
            body: bodyData,
            timeoutMs: 25000
        });
        if (res.status === 200) {
            let parsed;
            try {
                const cleanData = res.data.replace(/^\s*for\s*\(\s*;\s*;\s*\)\s*;/, '');
                parsed = JSON.parse(cleanData);
            }
            catch {
                throw new Error(`Web Media Comment on ${cleanMediaId} returned unparseable JSON: ${res.data.slice(0, 200)}`);
            }
            if (parsed.error) {
                const errDetail = parsed.errorSummary || parsed.errorDescription || JSON.stringify(parsed.error);
                throw new Error(`Instagram mutation rejected with error ${parsed.error}: ${errDetail}`);
            }
            if (parsed.errors && parsed.errors.length > 0) {
                throw new Error(`Web Media Comment GraphQL error: ${parsed.errors[0].message || JSON.stringify(parsed.errors)}`);
            }
            const commentCreate = parsed.data?.xig_comment_create;
            if (commentCreate?.comment_dict?.pk) {
                const dict = commentCreate.comment_dict;
                return {
                    id: String(dict.pk),
                    text: dict.text || text,
                    timestamp: dict.created_at ? new Date(dict.created_at * 1000).toISOString() : new Date().toISOString(),
                    like_count: 0,
                    from: {
                        id: String(dict.user?.pk || this.session.ds_user_id),
                        username: dict.user?.username || this.session.username,
                        name: dict.user?.full_name || this.session.full_name
                    },
                    status: 'ok'
                };
            }
            throw new Error(`Web Media Comment on ${cleanMediaId} failed: Server did not return a valid comment PK (Response: ${res.data.slice(0, 300)})`);
        }
        throw new Error(`Web Media Comment on ${cleanMediaId} returned HTTP ${res.status}: ${res.data.slice(0, 300)}`);
    }
    /**
     * Retrieves comments on a media object via official Web endpoint
     * Endpoint: GET https://www.instagram.com/api/v1/media/{cleanMediaId}/comments/
     */
    async getComments(mediaId, options = {}) {
        const cleanMediaId = mediaId.includes('_') ? mediaId.split('_')[0] : mediaId;
        const referer = options.shortcode
            ? `https://www.instagram.com/p/${options.shortcode}/`
            : 'https://www.instagram.com/';
        const params = new URLSearchParams();
        if (options.limit)
            params.set('limit', String(options.limit));
        if (options.min_id)
            params.set('min_id', options.min_id);
        const qs = params.toString();
        const url = `https://www.instagram.com/api/v1/media/${cleanMediaId}/comments/${qs ? `?${qs}` : ''}`;
        const headers = this.getWebHeaders(referer);
        const res = await this.transport.request(url, {
            method: 'GET',
            headers,
            timeoutMs: 20000
        });
        if (res.status === 200) {
            const parsed = JSON.parse(res.data);
            const rawComments = parsed.comments || [];
            const comments = rawComments.map((c) => ({
                id: String(c.pk || c.id || ''),
                text: c.text || '',
                timestamp: c.created_at ? new Date(c.created_at * 1000).toISOString() : undefined,
                like_count: c.comment_like_count || 0,
                from: c.user ? {
                    id: String(c.user.pk || c.user_id || ''),
                    username: c.user.username || '',
                    name: c.user.full_name || ''
                } : undefined,
                status: 'ok'
            }));
            return {
                data: comments,
                paging: {
                    cursors: {
                        after: parsed.next_max_id || parsed.next_min_id
                    }
                }
            };
        }
        throw new Error(`Web Comments retrieval on ${cleanMediaId} returned HTTP ${res.status}: ${res.data.slice(0, 300)}`);
    }
    /**
     * Retrieves messages from a direct conversation thread via official Web GraphQL
     * Query: IGDThreadDetailQuery (doc_id: 29613940454875963)
     * Endpoint: POST https://www.instagram.com/api/graphql
     */
    async getThreadMessages(threadFbid, options = {}) {
        const limit = options.limit || 20;
        const directUrl = 'https://www.instagram.com/api/graphql';
        const docId = '29613940454875963';
        const directVariables = {
            min_uq_seq_id: null,
            thread_fbid: threadFbid,
            __relay_internal__pv__IGDEnableOffMsysChatThemesQErelayprovider: false,
            __relay_internal__pv__IGDInitialMessagePageCountrelayprovider: limit
        };
        const referer = 'https://www.instagram.com/direct/inbox/';
        const headers = this.getWebHeaders(referer);
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        headers['x-fb-friendly-name'] = 'IGDThreadDetailQuery';
        headers['x-asbd-id'] = '359341';
        if (this.session.lsd) {
            headers['x-fb-lsd'] = this.session.lsd;
        }
        const params = new URLSearchParams();
        params.set('av', this.session.ds_user_id || '17841419713919386');
        params.set('__d', 'www');
        params.set('__user', '0');
        params.set('__a', '1');
        if (this.session.fb_dtsg) {
            params.set('fb_dtsg', this.session.fb_dtsg);
        }
        if (this.session.jazoest) {
            params.set('jazoest', this.session.jazoest);
        }
        if (this.session.lsd) {
            params.set('lsd', this.session.lsd);
        }
        params.set('fb_api_caller_class', 'RelayModern');
        params.set('fb_api_req_friendly_name', 'IGDThreadDetailQuery');
        params.set('server_timestamps', 'true');
        params.set('doc_id', docId);
        params.set('variables', JSON.stringify(directVariables));
        const bodyData = params.toString();
        headers['Content-Length'] = Buffer.byteLength(bodyData, 'utf-8').toString();
        const res = await this.transport.request(directUrl, {
            method: 'POST',
            headers,
            body: bodyData,
            timeoutMs: 25000
        });
        if (res.status === 200) {
            let parsed;
            try {
                const cleanData = res.data.replace(/^for\s*\(\s*;\s*;\s*\)\s*;/, '');
                parsed = JSON.parse(cleanData);
            }
            catch {
                throw new Error(`IGDThreadDetailQuery returned unparseable JSON: ${res.data.slice(0, 200)}`);
            }
            const thread = parsed.data?.get_slide_thread_nullable?.as_ig_direct_thread;
            const edges = thread?.slide_messages?.edges || [];
            const messages = edges.map((e) => {
                const node = e.node || {};
                const senderFbid = node.sender_fbid || node.sender?.id || node.sender?.igid;
                const isSelf = senderFbid === this.session.ds_user_id || node.sender?.user_dict?.username === this.session.username;
                return {
                    id: String(node.message_id || node.id || `msg_${Date.now()}`),
                    created_time: node.timestamp_ms ? new Date(Number(node.timestamp_ms)).toISOString() : new Date().toISOString(),
                    from: {
                        id: String(senderFbid || ''),
                        username: node.sender?.user_dict?.username || (isSelf ? this.session.username : 'user'),
                        name: node.sender?.user_dict?.full_name || (isSelf ? this.session.full_name : '')
                    },
                    message: node.content?.text_body || node.text_body || '',
                    item_type: node.content_type || 'TEXT'
                };
            });
            return {
                id: thread?.thread_fbid || threadFbid,
                snippet: messages[0]?.message,
                message_count: messages.length,
                messages: {
                    data: messages
                }
            };
        }
        throw new Error(`IGDThreadDetailQuery on thread ${threadFbid} returned HTTP ${res.status}: ${res.data.slice(0, 300)}`);
    }
    async ensureWebTokens() {
        if (this.session.fb_dtsg && this.session.jazoest)
            return;
        const res = await this.transport.request('https://www.instagram.com/', {
            headers: this.getWebHeaders('https://www.instagram.com/')
        });
        const dtsgMatch = res.data.match(/"DTSGInitialData",\[\],\{"token":"([^"]+)"/);
        if (dtsgMatch) {
            this.session.fb_dtsg = dtsgMatch[1];
            let sum = 0;
            for (let i = 0; i < this.session.fb_dtsg.length; i++) {
                sum += this.session.fb_dtsg.charCodeAt(i);
            }
            this.session.jazoest = `2${sum}`;
        }
        const lsdMatch = res.data.match(/"LSD",\[\],\{"token":"([^"]+)"/);
        if (lsdMatch) {
            this.session.lsd = lsdMatch[1];
        }
    }
    /**
     * Sends a direct text message to a conversation thread or recipient via official Web RelayModern GraphQL
     * Query: IGDirectTextSendMutation (doc_id: 26911679871773184)
     * Endpoint: POST https://www.instagram.com/api/graphql
     */
    async sendDirectMessage(targetId, text) {
        await this.ensureWebTokens();
        const message = text ? text.trim() : '';
        if (!message) {
            throw new Error('Direct message text cannot be empty.');
        }
        const directUrl = 'https://www.instagram.com/api/graphql';
        const docId = '26911679871773184';
        const isThread = targetId.startsWith('th_');
        const referer = isThread ? `https://www.instagram.com/direct/t/${targetId}/` : 'https://www.instagram.com/direct/inbox/';
        const headers = this.getWebHeaders(referer);
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        headers['x-fb-friendly-name'] = 'IGDirectTextSendMutation';
        headers['x-asbd-id'] = '359341';
        if (this.session.lsd) {
            headers['x-fb-lsd'] = this.session.lsd;
        }
        // Generate random 64-bit offline threading id
        const randomSuffix = Math.floor(Math.random() * 900000 + 100000);
        const offlineThreadingId = `${Date.now()}${randomSuffix}`;
        const variables = {
            offline_threading_id: offlineThreadingId,
            replied_to_client_context: null,
            replied_to_item_id: null,
            reply_to_message_id: null,
            sampled: null,
            text: {
                sensitive_string_value: message
            },
            mentions: [],
            mentioned_user_ids: [],
            commands: null,
            forwarded_from_thread_id: null,
            is_forwarded_from_own_message: null,
            send_attribution: isThread ? 'igd_web_chat_tab:in_thread' : 'direct_thread'
        };
        if (isThread) {
            variables.ig_thread_igid = targetId;
            variables.recipient_igids = null;
        }
        else {
            variables.ig_thread_igid = null;
            variables.recipient_igids = [targetId];
        }
        const params = new URLSearchParams();
        params.set('av', this.session.ds_user_id || '17841419713919386');
        params.set('__d', 'www');
        params.set('__user', '0');
        params.set('__a', '1');
        if (this.session.fb_dtsg) {
            params.set('fb_dtsg', this.session.fb_dtsg);
        }
        if (this.session.jazoest) {
            params.set('jazoest', this.session.jazoest);
        }
        if (this.session.lsd) {
            params.set('lsd', this.session.lsd);
        }
        params.set('fb_api_caller_class', 'RelayModern');
        params.set('fb_api_req_friendly_name', 'IGDirectTextSendMutation');
        params.set('server_timestamps', 'true');
        params.set('doc_id', docId);
        params.set('variables', JSON.stringify(variables));
        const bodyData = params.toString();
        headers['Content-Length'] = Buffer.byteLength(bodyData, 'utf-8').toString();
        const res = await this.transport.request(directUrl, {
            method: 'POST',
            headers,
            body: bodyData,
            timeoutMs: 25000
        });
        if (res.status === 200) {
            let parsed;
            try {
                const cleanData = res.data.replace(/^for\s*\(\s*;\s*;\s*\)\s*;/, '');
                parsed = JSON.parse(cleanData);
            }
            catch {
                throw new Error(`IGDirectTextSendMutation returned unparseable JSON: ${res.data.slice(0, 200)}`);
            }
            const sendResponse = parsed.data?.xig_direct_text_send_with_slide_messaging_response;
            if (sendResponse?.message_id) {
                return {
                    message_id: sendResponse.message_id,
                    thread_id: targetId,
                    timestamp: sendResponse.timestamp_ms ? Number(sendResponse.timestamp_ms) : Date.now(),
                    status: 'ok'
                };
            }
            if (parsed.errors && parsed.errors.length > 0) {
                throw new Error(`IGDirectTextSendMutation error: ${parsed.errors[0].message || JSON.stringify(parsed.errors)}`);
            }
            throw new Error(`IGDirectTextSendMutation unexpected response shape: ${res.data.slice(0, 300)}`);
        }
        throw new Error(`IGDirectTextSendMutation on target ${targetId} returned HTTP ${res.status}: ${res.data.slice(0, 300)}`);
    }
    /**
     * Retrieves conversations from the direct inbox via official Web RelayModern GraphQL endpoint
     * Conforms to official Meta Graph API v21.0 format: GET /{user-id}/conversations
     */
    async getConversations(options = {}) {
        await this.ensureWebTokens();
        const params = new URLSearchParams();
        params.set('av', this.session.ds_user_id || '19835089130');
        params.set('__d', 'www');
        params.set('__user', '0');
        params.set('__a', '1');
        if (this.session.fb_dtsg)
            params.set('fb_dtsg', this.session.fb_dtsg);
        if (this.session.jazoest)
            params.set('jazoest', this.session.jazoest);
        if (this.session.lsd)
            params.set('lsd', this.session.lsd);
        params.set('fb_api_caller_class', 'RelayModern');
        params.set('fb_api_req_friendly_name', 'PolarisDirectInboxQuery');
        params.set('server_timestamps', 'true');
        params.set('doc_id', '27909866362025854');
        const variables = {
            device_id_for_iris_subscription: this.session.ig_did || '7A5EF1EB-ABF2-4DBC-A319-0B9D61B199B8',
            __relay_internal__pv__IGDIsProfessionalAccountGKrelayprovider: true,
            __relay_internal__pv__IGDPinnedThreadsRenderEnabledGKrelayprovider: true,
            __relay_internal__pv__IGDMaxUnreadMessagesCountrelayprovider: options.limit || 10,
            __relay_internal__pv__IGDThreadListActionsEnabledGKrelayprovider: true
        };
        params.set('variables', JSON.stringify(variables));
        const headers = this.getWebHeaders('https://www.instagram.com/direct/inbox/');
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        headers['x-fb-friendly-name'] = 'PolarisDirectInboxQuery';
        const res = await this.transport.request('https://www.instagram.com/api/graphql', {
            method: 'POST',
            headers,
            body: params.toString(),
            timeoutMs: 25000
        });
        if (res.status === 200) {
            try {
                const parsed = JSON.parse(res.data);
                const edges = parsed.data?.get_slide_mailbox_for_iris_subscription?.threads_by_folder?.edges || [];
                const conversations = [];
                for (const edge of edges) {
                    const th = edge.node?.as_ig_direct_thread;
                    if (!th)
                        continue;
                    const threadId = String(th.thread_fbid || th.id || th.thread_id || '');
                    const participants = (th.users || []).map((u) => ({
                        id: String(u.id || u.pk || ''),
                        username: u.username || 'unknown',
                        name: u.full_name || u.name
                    }));
                    const messages = th.slide_messages?.edges || [];
                    const lastMsg = messages[0]?.node || {};
                    let updatedTime = new Date().toISOString();
                    if (th.last_activity_timestamp_ms) {
                        updatedTime = new Date(Number(th.last_activity_timestamp_ms)).toISOString();
                    }
                    conversations.push({
                        id: threadId,
                        updated_time: updatedTime,
                        unread_count: th.marked_as_unread ? 1 : 0,
                        participants: { data: participants },
                        snippet: lastMsg.text_body || lastMsg.igd_snippet || ''
                    });
                    if (options.limit && conversations.length >= options.limit)
                        break;
                }
                return { data: conversations };
            }
            catch (err) {
                throw new Error(`Failed to parse PolarisDirectInboxQuery response: ${err.message}`);
            }
        }
        throw new Error(`Web Direct Inbox returned HTTP ${res.status}: ${res.data.slice(0, 200)}`);
    }
    /**
     * Publishes a story photo live to Instagram
     * Step 1: POST https://www.instagram.com/rupload_igphoto/{upload_id}
     * Step 2: POST https://www.instagram.com/api/v1/media/configure_to_story/
     */
    async publishStory(imageInput) {
        if (!this.hasActiveSession()) {
            throw new Error('Active authenticated session is required to publish story.');
        }
        let imageBuffer;
        if (Buffer.isBuffer(imageInput)) {
            imageBuffer = imageInput;
        }
        else if (typeof imageInput === 'string' && (imageInput.startsWith('http://') || imageInput.startsWith('https://'))) {
            const imgRes = await this.transport.requestBuffer(imageInput);
            imageBuffer = imgRes.data;
        }
        else if (typeof imageInput === 'string' && fs.existsSync(imageInput)) {
            imageBuffer = fs.readFileSync(imageInput);
        }
        else {
            throw new Error(`Invalid image input: file not found or unsupported URL '${imageInput}'`);
        }
        const uploadId = Date.now().toString();
        const waterfallId = crypto.randomUUID();
        const uploadUrl = `https://www.instagram.com/rupload_igphoto/${uploadId}`;
        const baseHeaders = this.getWebHeaders('https://www.instagram.com/');
        const ruploadParams = JSON.stringify({
            upload_id: uploadId,
            media_type: 1
        });
        const uploadHeaders = {
            ...baseHeaders,
            'X_FB_PHOTO_WATERFALL_ID': waterfallId,
            'X-Entity-Type': 'image/jpeg',
            'X-Entity-Name': `${uploadId}.jpg`,
            'X-Entity-Length': imageBuffer.length.toString(),
            'Offset': '0',
            'Content-Type': 'image/jpeg',
            'X-Instagram-Rupload-Params': ruploadParams
        };
        const uploadRes = await this.transport.request(uploadUrl, {
            method: 'POST',
            headers: uploadHeaders,
            body: imageBuffer,
            timeoutMs: 35000
        });
        if (uploadRes.status !== 200) {
            throw new Error(`Upload step failed with HTTP ${uploadRes.status}: ${uploadRes.data.slice(0, 200)}`);
        }
        const configureUrl = 'https://www.instagram.com/api/v1/media/configure_to_story/';
        const configurePayload = new URLSearchParams({
            upload_id: uploadId,
            source_type: 'library',
            configure_mode: '1'
        }).toString();
        const configureHeaders = {
            ...this.getWebHeaders('https://www.instagram.com/'),
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        };
        const configRes = await this.transport.request(configureUrl, {
            method: 'POST',
            headers: configureHeaders,
            body: configurePayload,
            timeoutMs: 35000
        });
        if (configRes.status !== 200) {
            throw new Error(`Configure step failed with HTTP ${configRes.status}: ${configRes.data.slice(0, 200)}`);
        }
        const parsed = JSON.parse(configRes.data);
        const mediaObj = parsed.media || {};
        return {
            id: String(mediaObj.id || parsed.media_id || uploadId),
            media_id: String(mediaObj.id || parsed.media_id || uploadId),
            fbid: String(mediaObj.fbid || uploadId),
            is_reel_media: true,
            expiring_at: mediaObj.expiring_at || Math.floor(Date.now() / 1000) + 86400,
            status: parsed.status || 'ok',
            raw: mediaObj
        };
    }
    /**
     * Publishes a feed photo live to Instagram
     * Step 1: POST https://www.instagram.com/rupload_igphoto/{upload_id}
     * Step 2: POST https://www.instagram.com/api/v1/media/configure/
     */
    async publishFeedPost(params) {
        if (!this.hasActiveSession()) {
            throw new Error('Active authenticated session is required to publish feed post.');
        }
        let imageBuffer;
        if (Buffer.isBuffer(params.imageInput)) {
            imageBuffer = params.imageInput;
        }
        else if (typeof params.imageInput === 'string' && (params.imageInput.startsWith('http://') || params.imageInput.startsWith('https://'))) {
            const imgRes = await this.transport.requestBuffer(params.imageInput);
            imageBuffer = imgRes.data;
        }
        else if (typeof params.imageInput === 'string' && fs.existsSync(params.imageInput)) {
            imageBuffer = fs.readFileSync(params.imageInput);
        }
        else {
            throw new Error(`Invalid image input: file not found or unsupported URL '${params.imageInput}'`);
        }
        const uploadId = Date.now().toString();
        const waterfallId = crypto.randomUUID();
        const uploadUrl = `https://www.instagram.com/rupload_igphoto/${uploadId}`;
        const baseHeaders = this.getWebHeaders('https://www.instagram.com/');
        const ruploadParams = JSON.stringify({
            upload_id: uploadId,
            media_type: 1
        });
        const uploadHeaders = {
            ...baseHeaders,
            'X_FB_PHOTO_WATERFALL_ID': waterfallId,
            'X-Entity-Type': 'image/jpeg',
            'X-Entity-Name': `${uploadId}.jpg`,
            'X-Entity-Length': imageBuffer.length.toString(),
            'Offset': '0',
            'Content-Type': 'image/jpeg',
            'X-Instagram-Rupload-Params': ruploadParams
        };
        const uploadRes = await this.transport.request(uploadUrl, {
            method: 'POST',
            headers: uploadHeaders,
            body: imageBuffer,
            timeoutMs: 35000
        });
        if (uploadRes.status !== 200) {
            throw new Error(`Upload step failed with HTTP ${uploadRes.status}: ${uploadRes.data.slice(0, 200)}`);
        }
        const configureUrl = 'https://www.instagram.com/api/v1/media/configure/';
        const configurePayload = new URLSearchParams({
            upload_id: uploadId,
            caption: params.caption || '',
            source_type: 'library',
            disable_comments: '0',
            like_and_view_counts_disabled: '0'
        }).toString();
        const configureHeaders = {
            ...this.getWebHeaders('https://www.instagram.com/'),
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        };
        const configRes = await this.transport.request(configureUrl, {
            method: 'POST',
            headers: configureHeaders,
            body: configurePayload,
            timeoutMs: 35000
        });
        if (configRes.status !== 200) {
            throw new Error(`Configure step failed with HTTP ${configRes.status}: ${configRes.data.slice(0, 200)}`);
        }
        const parsed = JSON.parse(configRes.data);
        const mediaObj = parsed.media || {};
        return {
            id: String(mediaObj.id || parsed.media_id || uploadId),
            media_id: String(mediaObj.id || parsed.media_id || uploadId),
            fbid: String(mediaObj.fbid || uploadId),
            status: parsed.status || 'ok',
            shortcode: mediaObj.code,
            raw: mediaObj
        };
    }
}
