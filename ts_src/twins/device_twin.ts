/**
 * DeviceTwin - Hardware Fingerprint & Network Protocol Emulation
 * 
 * Accurately models the physical Xiaomi Redmi Note 13 4G (23129RAA4G / sapphire)
 * hardware characteristics, session tokens, Liger/Tigon transport headers,
 * and HMAC payload signing for Instagram private and graph endpoints.
 */

import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
import { DeviceFingerprint, SessionTokens } from '../types/graph.js';

export const DEFAULT_SESSION_PATH = '/home/hokar/Documents/antigravity/silly-galileo/instagram_session.json';
export const IG_SIGNING_KEY = '6dc344682cc5cd2496191b26cc065e8c1b97bfb9cf1ad982798e2ee4e9d56262';
export const IG_APP_ID_MOBILE = '1217981644879628';
export const IG_APP_ID_WEB = '936619743392459';

export interface DeviceTwinSession {
  platform: string;
  username: string;
  full_name: string;
  ds_user_id: string;
  profile_url: string;
  status: string;
  cookie_string: string;
  key_tokens: SessionTokens;
  digital_twin_fingerprint?: {
    device_model: string;
    viewport_width: number;
    viewport_height: number;
    device_pixel_ratio: number;
    user_agent: string;
  };
}

export class DeviceTwin {
  private session: DeviceTwinSession;
  private fingerprint: DeviceFingerprint;

  constructor(sessionPath: string = DEFAULT_SESSION_PATH) {
    // 1. Initialize verified Redmi Note 13 4G hardware fingerprint
    this.fingerprint = {
      brand: 'Redmi',
      manufacturer: 'Xiaomi',
      model: '23129RAA4G',
      device_code: 'sapphire',
      board: 'bengal',
      soc_model: 'SM6225 (Snapdragon 680 4G)',
      chipset: 'qcom',
      android_id: '556f8db9eada6d9c',
      os_release: '15',
      os_sdk_int: 35,
      build_id: 'AQ3A.240829.003',
      resolution: '1080x2400',
      density_dpi: 440,
      user_agent: 'Instagram 451.0.0.53.80 Android (35/15; 440dpi; 1080x2400; Xiaomi; 23129RAA4G; sapphire; qcom; en_US; 385713116)',
      app_version: '451.0.0.53.80',
      app_version_code: 385713116
    };

    // 2. Load session or default to ground truth test device state
    if (fs.existsSync(sessionPath)) {
      try {
        const raw = fs.readFileSync(sessionPath, 'utf-8');
        this.session = JSON.parse(raw);
      } catch {
        this.session = this.getDefaultSession();
      }
    } else {
      this.session = this.getDefaultSession();
    }
  }

  private getDefaultSession(): DeviceTwinSession {
    return {
      platform: 'instagram',
      username: 'hokar368',
      full_name: 'hokarveria',
      ds_user_id: '19835089130',
      profile_url: 'https://www.instagram.com/hokar368/',
      status: 'active_verified',
      cookie_string: 'ds_user_id=19835089130; sessionid=dummy_twin_session; csrftoken=dummy_csrf_token',
      key_tokens: {
        ds_user_id: '19835089130',
        sessionid: 'dummy_twin_session',
        csrftoken: 'dummy_csrf_token',
        mid: 'Z1234567890',
        ig_did: '1121B522-0000-0000-0000-000000000000',
        datr: 'dummy_datr',
        rur: 'NAO\\05419835089130\\0541792019482:01f7'
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

  public getFingerprint(): DeviceFingerprint {
    return { ...this.fingerprint };
  }

  public getSession(): DeviceTwinSession {
    return this.session;
  }

  public getTokens(): SessionTokens {
    return { ...this.session.key_tokens };
  }

  public getUserId(): string {
    return this.session.ds_user_id || '19835089130';
  }

  public getUsername(): string {
    return this.session.username || 'hokar368';
  }

  public getFullName(): string {
    return this.session.full_name || 'hokarveria';
  }

  /**
   * Generates authentic Liger HTTP engine headers
   */
  public getLigerHeaders(friendlyName?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': this.fingerprint.user_agent,
      'X-IG-App-ID': IG_APP_ID_MOBILE,
      'X-IG-Capabilities': '3brTv10=',
      'X-IG-Connection-Type': 'WIFI',
      'X-IG-Bandwidth-Speed-KBPS': '25000',
      'X-IG-Bandwidth-TotalBytes-B': '9283721',
      'X-FB-HTTP-Engine': 'Liger',
      'X-FB-Client-IP': 'True',
      'X-FB-Server-Cluster': 'True',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive'
    };

    if (this.session.cookie_string) {
      headers['Cookie'] = this.session.cookie_string;
    }

    if (this.session.key_tokens.csrftoken) {
      headers['X-CSRFToken'] = this.session.key_tokens.csrftoken;
    }

    if (friendlyName) {
      headers['X-FB-Friendly-Name'] = friendlyName;
    }

    return headers;
  }

  /**
   * Generates Tigon network stack headers (Meta MNS Tigon)
   */
  public getTigonHeaders(friendlyName?: string): Record<string, string> {
    const headers = this.getLigerHeaders(friendlyName);
    headers['X-Tigon-Is-Retry'] = 'False';
    headers['X-FB-Connection-Quality'] = 'EXCELLENT';
    headers['X-IG-Prefetch-Request'] = '0';
    return headers;
  }

  /**
   * Default authenticated headers conforming to physical Redmi Note 13
   */
  public getAuthenticatedHeaders(): Record<string, string> {
    return this.getLigerHeaders();
  }

  /**
   * Generates WebView headers (used for Polaris Web surfaces)
   */
  public getWebviewHeaders(): Record<string, string> {
    const webviewUa = `Mozilla/5.0 (Linux; Android 15; 23129RAA4G Build/AQ3A.240829.003; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/155.0.8059.43 Mobile Safari/537.36 ${this.fingerprint.user_agent}`;
    return {
      'User-Agent': webviewUa,
      'X-IG-App-ID': IG_APP_ID_WEB,
      'X-Requested-With': 'com.instagram.android',
      'Cookie': this.session.cookie_string || '',
      'Accept-Language': 'en-US,en;q=0.9'
    };
  }

  /**
   * HMAC-SHA256 Payload Signing (Meta Private API standard)
   */
  public signPayload(payload: Record<string, any>): string {
    const jsonStr = JSON.stringify(payload);
    const sig = crypto.createHmac('sha256', IG_SIGNING_KEY).update(jsonStr).digest('hex');
    return `SIGNATURE.${sig}.${jsonStr}`;
  }

  /**
   * Signed body formatted for application/x-www-form-urlencoded
   */
  public getSignedBody(payload: Record<string, any>): string {
    const jsonStr = JSON.stringify(payload);
    const sig = crypto.createHmac('sha256', IG_SIGNING_KEY).update(jsonStr).digest('hex');
    const signature = `SIGNATURE.${sig}.${jsonStr}`;
    return `signed_body=${encodeURIComponent(signature)}&ig_sig_key_version=4`;
  }

  /**
   * Verifies an HMAC payload signature
   */
  public verifyPayloadSignature(signatureString: string): boolean {
    const match = signatureString.match(/^SIGNATURE\.([a-f0-9]{64})\.(.*)$/);
    if (!match) return false;
    const [, sig, body] = match;
    const computed = crypto.createHmac('sha256', IG_SIGNING_KEY).update(body).digest('hex');
    return sig === computed;
  }
}
