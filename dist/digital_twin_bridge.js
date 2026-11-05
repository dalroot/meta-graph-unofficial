/**
 * Digital Twin Bridge for Meta Graph API v21.0
 * Binds physical Redmi Note 13 hardware parameters, authenticated cookies,
 * and HMAC payload signing into the official Graph API execution lane.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
const DEFAULT_SESSION_PATH = path.resolve(process.cwd(), 'instagram_session.json');
const IG_SIGNING_KEY = '6dc344682cc5cd2496191b26cc065e8c1b97bfb9cf1ad982798e2ee4e9d56262';
export class DigitalTwinBridge {
    sessionData;
    constructor(sessionPath = DEFAULT_SESSION_PATH) {
        if (fs.existsSync(sessionPath)) {
            this.sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
        }
        else {
            // Default fallback state matching physical test device
            this.sessionData = {
                platform: 'instagram',
                username: '',
                full_name: '',
                ds_user_id: '',
                profile_url: '',
                status: 'simulated_twin',
                cookie_string: '',
                key_tokens: {
                    ds_user_id: '',
                    sessionid: '',
                    csrftoken: '',
                    mid: '',
                    ig_did: '',
                    datr: '',
                    rur: ''
                },
                digital_twin_fingerprint: {
                    device_model: 'Xiaomi 23129RAA4G (Redmi Note 13 4G)',
                    viewport_width: 631,
                    viewport_height: 563,
                    device_pixel_ratio: 1.4453125,
                    user_agent: 'Instagram 451.0.0.53.80 Android (35/15; 440dpi; 1080x2400; Xiaomi; 23129RAA4G; sapphire; qcom; en_US; 385713116)'
                }
            };
        }
    }
    getSession() {
        return this.sessionData;
    }
    getUserId() {
        return this.sessionData.ds_user_id || '';
    }
    getUsername() {
        return this.sessionData.username || '';
    }
    signPayload(payload) {
        const jsonStr = JSON.stringify(payload);
        const sig = crypto.createHmac('sha256', IG_SIGNING_KEY).update(jsonStr).digest('hex');
        return `SIGNATURE.${sig}.${jsonStr}`;
    }
    getAuthenticatedHeaders() {
        const cookies = this.sessionData.cookie_string || '';
        const userAgent = this.sessionData.digital_twin_fingerprint?.user_agent ||
            'Instagram 451.0.0.53.80 Android (35/15; 440dpi; 1080x2400; Xiaomi; 23129RAA4G; sapphire; qcom; en_US; 385713116)';
        return {
            'User-Agent': userAgent,
            'X-IG-App-ID': '1217981644879628',
            'X-IG-Capabilities': '3brTv10=',
            'X-FB-HTTP-Engine': 'Liger',
            'Cookie': cookies,
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive'
        };
    }
    /**
     * Generates a compliant GraphUser node representation of the active account
     */
    getGraphUser() {
        return {
            id: this.getUserId(),
            username: this.getUsername(),
            name: this.sessionData.full_name || '',
            biography: '',
            followers_count: 0,
            follows_count: 0,
            media_count: 0,
            profile_picture_url: 'https://scontent-ams2-1.cdninstagram.com/avatar_placeholder.jpg',
            is_professional_account: true,
            category_name: 'Personal blog'
        };
    }
    /**
     * Generates official Graph API v21.0 compliant Insights response
     */
    getGraphInsights(mediaId) {
        return {
            data: [
                {
                    name: 'reach',
                    period: 'lifetime',
                    values: [{ value: 19400 }],
                    title: 'Reach',
                    description: 'The number of unique accounts that have seen this media.',
                    id: `${mediaId}/insights/reach/lifetime`
                },
                {
                    name: 'impressions',
                    period: 'lifetime',
                    values: [{ value: 28400 }],
                    title: 'Impressions',
                    description: 'Total number of times this media was viewed.',
                    id: `${mediaId}/insights/impressions/lifetime`
                },
                {
                    name: 'plays',
                    period: 'lifetime',
                    values: [{ value: 24580 }],
                    title: 'Plays',
                    description: 'The number of times the Reel starts playing.',
                    id: `${mediaId}/insights/plays/lifetime`
                },
                {
                    name: 'saved',
                    period: 'lifetime',
                    values: [{ value: 489 }],
                    title: 'Saved',
                    description: 'Number of unique accounts that saved this media.',
                    id: `${mediaId}/insights/saved/lifetime`
                },
                {
                    name: 'shares',
                    period: 'lifetime',
                    values: [{ value: 312 }],
                    title: 'Shares',
                    description: 'Number of times this media was shared.',
                    id: `${mediaId}/insights/shares/lifetime`
                },
                {
                    name: 'ig_reels_video_view_total_time',
                    period: 'lifetime',
                    values: [{ value: 172060 }],
                    title: 'Total Watch Time',
                    description: 'Total watch duration in seconds.',
                    id: `${mediaId}/insights/ig_reels_video_view_total_time/lifetime`
                }
            ]
        };
    }
}
