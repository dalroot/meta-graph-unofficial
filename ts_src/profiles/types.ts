/**
 * Twin Profiles - Standard Interfaces for Extensible Tester Identities
 * Supports both Mobile Hardware Emulation and Web Browser Fingerprints without hardcoding.
 */

export type TwinPlatform = 'MOBILE' | 'WEB';

export interface BaseTesterProfile {
  id: string;
  name: string;
  platform: TwinPlatform;
  description: string;
}

export interface MobileDeviceProfile extends BaseTesterProfile {
  platform: 'MOBILE';
  brand: string;
  manufacturer: string;
  model: string;
  device_code: string;
  board: string;
  soc_model: string;
  chipset: string;
  android_id: string;
  os_release: string;
  os_sdk_int: number;
  build_id: string;
  resolution: string;
  density_dpi: number;
  user_agent: string;
  app_version: string;
  app_version_code: number;
  app_id: string;
  http_engine: 'Liger' | 'Tigon';
  capabilities: string;
}

export interface WebBrowserProfile extends BaseTesterProfile {
  platform: 'WEB';
  browser_name: string;
  browser_version: string;
  os_name: string;
  os_version: string;
  architecture: string;
  user_agent: string;
  app_id: string;
  viewport_width: number;
  viewport_height: number;
  device_pixel_ratio: number;
  accept_language: string;
  sec_ch_ua?: string;
  sec_ch_ua_mobile?: string;
  sec_ch_ua_platform?: string;
}

export type TesterProfile = MobileDeviceProfile | WebBrowserProfile;
