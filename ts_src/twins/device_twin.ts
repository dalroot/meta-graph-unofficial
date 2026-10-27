/**
 * DeviceTwin - Hardware Fingerprint & Network Protocol Emulation
 * 
 * Accurately models the physical Xiaomi Redmi Note 13 4G (23129RAA4G / sapphire)
 * hardware characteristics, session tokens, Liger/Tigon transport headers,
 * and HMAC payload signing for Instagram private and mobile endpoints.
 */

import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
import { DeviceFingerprint, SessionTokens } from '../types/graph.js';
import { TwinProfileRegistry, MobileDeviceProfile } from '../profiles/index.js';
import {
  MobileSession,
  parseMobileSession,
  loadMobileSession,
  formatMobileCookie
} from './session_loader.js';

export const DEFAULT_SESSION_PATH = '/home/hokar/Documents/antigravity/hopeful-bell/instagram_session.json';
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
  private mobileSession: MobileSession;
  private fingerprint: DeviceFingerprint;

  constructor(
    sessionInput: string | MobileSession | DeviceTwinSession | Record<string, any> = DEFAULT_SESSION_PATH,
    customProfile?: MobileDeviceProfile
  ) {
    // 1. Initialize verified mobile hardware profile dynamically (default: Redmi Note 13 4G)
    const activeProfile = customProfile || TwinProfileRegistry.getDefaultMobile();
    this.fingerprint = {
      brand: activeProfile.brand,
      manufacturer: activeProfile.manufacturer,
      model: activeProfile.model,
      device_code: activeProfile.device_code,
      board: activeProfile.board,
      soc_model: activeProfile.soc_model,
      chipset: activeProfile.chipset,
      android_id: activeProfile.android_id,
      os_release: activeProfile.os_release,
      os_sdk_int: activeProfile.os_sdk_int,
      build_id: activeProfile.build_id,
      resolution: activeProfile.resolution,
      density_dpi: activeProfile.density_dpi,
      user_agent: activeProfile.user_agent,
      app_version: activeProfile.app_version,
      app_version_code: activeProfile.app_version_code
    };

    // 2. Parse session input into standardized MobileSession & DeviceTwinSession
    try {
      if (typeof sessionInput === 'string') {
        this.mobileSession = loadMobileSession(sessionInput);
      } else if (sessionInput && 'key_tokens' in sessionInput) {
        // DeviceTwinSession format
        this.mobileSession = parseMobileSession(sessionInput as any);
      } else {
        // MobileSession object
        this.mobileSession = parseMobileSession(sessionInput as any);
      }
    } catch {
      this.mobileSession = this.getDefaultMobileSession();
    }

    // Ensure session has sane defaults if empty
    if (!this.mobileSession.sessionid) {
      this.mobileSession = this.getDefaultMobileSession();
    }

    // Build unified DeviceTwinSession representation
    this.session = {
      platform: 'instagram',
      username: this.mobileSession.username || 'hokar368',
      full_name: this.mobileSession.full_name || 'hokarveria',
      ds_user_id: this.mobileSession.ds_user_id || '19835089130',
      profile_url: `https://www.instagram.com/${this.mobileSession.username || 'hokar368'}/`,
      status: this.hasActiveSession() ? 'active_verified' : 'simulated_twin',
      cookie_string: this.mobileSession.cookie_string,
      key_tokens: {
        ds_user_id: this.mobileSession.ds_user_id || '19835089130',
        sessionid: this.mobileSession.sessionid,
        csrftoken: this.mobileSession.csrftoken || 'dummy_csrf_token',
        mid: this.mobileSession.mid || 'Z1234567890',
        ig_did: this.mobileSession.device_id || '1121B522-0000-0000-0000-000000000000',
        device_id: this.mobileSession.device_id,
        phone_id: this.mobileSession.phone_id,
        authorization: this.mobileSession.authorization,
        datr: this.mobileSession.datr,
        rur: this.mobileSession.rur
      },
      digital_twin_fingerprint: {
        device_model: 'Xiaomi 23129RAA4G (Redmi Note 13 4G)',
        viewport_width: 1080,
        viewport_height: 2400,
        device_pixel_ratio: 2.75,
        user_agent: this.fingerprint.user_agent
      }
    };
  }

  private getDefaultMobileSession(): MobileSession {
    const dsUserId = '19835089130';
    const sessionId = 'dummy_twin_session';
    const csrfToken = 'dummy_csrf_token';
    const mid = 'Z1234567890';
    const deviceId = '1121B522-0000-0000-0000-000000000000';
    const rur = 'NAO\\05419835089130\\0541792019482:01f7';

    return {
      ds_user_id: dsUserId,
      sessionid: sessionId,
      csrftoken: csrfToken,
      mid: mid,
      device_id: deviceId,
      phone_id: crypto.randomUUID(),
      rur: rur,
      username: 'hokar368',
      full_name: 'hokarveria',
      cookie_string: formatMobileCookie({
        sessionid: sessionId,
        ds_user_id: dsUserId,
        csrftoken: csrfToken,
        mid: mid,
        device_id: deviceId,
        rur: rur
      })
    };
  }

  /**
   * Returns true if session is real (not placeholder or empty)
   */
  public hasActiveSession(): boolean {
    return Boolean(
      this.mobileSession.sessionid &&
      this.mobileSession.sessionid !== 'dummy_twin_session' &&
      this.mobileSession.sessionid.length > 10
    );
  }

  public getFingerprint(): DeviceFingerprint {
    return { ...this.fingerprint };
  }

  public getSession(): DeviceTwinSession {
    return this.session;
  }

  public getMobileSession(): MobileSession {
    return { ...this.mobileSession };
  }

  public getSessionCookie(): string {
    return this.mobileSession.cookie_string || '';
  }

  public getTokens(): SessionTokens {
    return { ...this.session.key_tokens };
  }

  public getUserId(): string {
    return this.mobileSession.ds_user_id || this.session.ds_user_id || '19835089130';
  }

  public getUsername(): string {
    return this.mobileSession.username || this.session.username || 'hokar368';
  }

  public getFullName(): string {
    return this.mobileSession.full_name || this.session.full_name || 'hokarveria';
  }

  /**
   * Generates authentic Redmi Note 13 Android Liger HTTP headers (100% Mobile Client)
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
      'Accept-Language': 'en-US',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Host': 'i.instagram.com',
      'Accept': '*/*'
    };

    if (this.mobileSession.cookie_string) {
      headers['Cookie'] = this.mobileSession.cookie_string;
    }

    if (this.mobileSession.csrftoken) {
      headers['X-CSRFToken'] = this.mobileSession.csrftoken;
    }

    if (this.mobileSession.mid) {
      headers['X-MID'] = this.mobileSession.mid;
    }

    if (this.mobileSession.device_id) {
      headers['X-IG-Device-ID'] = this.mobileSession.device_id;
    }

    if (this.mobileSession.authorization) {
      headers['Authorization'] = this.mobileSession.authorization;
    }

    headers['X-IG-Android-ID'] = this.fingerprint.android_id;

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
   * Generates WebView headers (used for Polaris Web surfaces)
   */
  public getWebviewHeaders(): Record<string, string> {
    const webviewUa = `Mozilla/5.0 (Linux; Android 15; 23129RAA4G Build/AQ3A.240829.003; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/155.0.8059.43 Mobile Safari/537.36 ${this.fingerprint.user_agent}`;
    return {
      'User-Agent': webviewUa,
      'X-IG-App-ID': IG_APP_ID_WEB,
      'X-Requested-With': 'com.instagram.android',
      'Cookie': this.mobileSession.cookie_string || '',
      'Accept-Language': 'en-US,en;q=0.9'
    };
  }

  /**
   * Default authenticated headers conforming to physical Redmi Note 13
   */
  public getAuthenticatedHeaders(): Record<string, string> {
    return this.getLigerHeaders();
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
