/**
 * TwinProfileRegistry - Dynamic, Extensible Tester Profile Management
 * Enables registering and selecting mobile or web tester profiles without hardcoding.
 */

import { TesterProfile, MobileDeviceProfile, WebBrowserProfile, TwinPlatform } from './types.js';
import { REDMI_NOTE_13_PROFILE } from './mobile/redmi_note_13.js';
import { CHROME_LINUX_PROFILE } from './web/chrome_linux.js';
import { CHROME_WINDOWS_PROFILE } from './web/chrome_windows.js';

export class TwinProfileRegistry {
  private static profiles: Map<string, TesterProfile> = new Map();
  private static defaultMobileId: string = REDMI_NOTE_13_PROFILE.id;
  private static defaultWebId: string = CHROME_WINDOWS_PROFILE.id;

  static {
    // Register initial ground-truth profiles
    this.register(REDMI_NOTE_13_PROFILE);
    this.register(CHROME_LINUX_PROFILE);
    this.register(CHROME_WINDOWS_PROFILE);
  }

  public static register(profile: TesterProfile): void {
    this.profiles.set(profile.id, profile);
  }

  public static get(profileId: string): TesterProfile | undefined {
    return this.profiles.get(profileId);
  }

  public static getDefaultMobile(): MobileDeviceProfile {
    const profile = this.profiles.get(this.defaultMobileId);
    if (!profile || profile.platform !== 'MOBILE') {
      return REDMI_NOTE_13_PROFILE;
    }
    return profile as MobileDeviceProfile;
  }

  public static getDefaultWeb(): WebBrowserProfile {
    const profile = this.profiles.get(this.defaultWebId);
    if (!profile || profile.platform !== 'WEB') {
      return CHROME_LINUX_PROFILE;
    }
    return profile as WebBrowserProfile;
  }

  public static listByPlatform(platform: TwinPlatform): TesterProfile[] {
    return Array.from(this.profiles.values()).filter(p => p.platform === platform);
  }

  public static listAll(): TesterProfile[] {
    return Array.from(this.profiles.values());
  }

  public static setDefaultMobile(profileId: string): void {
    if (this.profiles.has(profileId)) {
      this.defaultMobileId = profileId;
    }
  }

  public static setDefaultWeb(profileId: string): void {
    if (this.profiles.has(profileId)) {
      this.defaultWebId = profileId;
    }
  }
}
