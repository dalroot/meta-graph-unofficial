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

export interface MobileHardwareCodecs {
  video_encoders: string[];
  video_decoders: string[];
  image_encoders: string[];
  audio_encoders: string[];
  audio_decoders: string[];
}

export interface MobileCpuCluster {
  cores: number;
  type: 'performance' | 'efficiency';
  arch: string;
  max_freq_khz: number;
}

export interface MobileGpuSpec {
  renderer: string;
  vendor: string;
  version: string;
  vulkan_supported: boolean;
  vulkan_version?: string;
}

export interface MobileDeviceProfile extends BaseTesterProfile {
  platform: 'MOBILE';
  brand: string;
  manufacturer: string;
  model: string;
  device_code: string;
  board: string;
  product?: string;
  soc_model: string;
  chipset: string;
  abi?: string;
  supported_abis?: string[];
  cpu_clusters?: MobileCpuCluster[];
  gpu?: MobileGpuSpec;
  hardware_codecs?: MobileHardwareCodecs;
  sensors?: string[];
  android_id: string;
  os_release: string;
  os_sdk_int: number;
  build_id: string;
  hyperos_version?: string;
  build_fingerprint?: string;
  kernel_version?: string;
  security_patch?: string;
  resolution: string;
  density_dpi: number;
  refresh_rate_hz?: number;
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
  screen_avail_width?: number;
  screen_avail_height?: number;
  device_pixel_ratio: number;
  accept_language: string;
  sec_ch_ua?: string;
  sec_ch_ua_mobile?: string;
  sec_ch_ua_platform?: string;
  sec_ch_ua_platform_version?: string;
  sec_ch_ua_arch?: string;
  sec_ch_ua_bitness?: string;
  sec_ch_ua_model?: string;
  webgl_vendor?: string;
  webgl_renderer?: string;
}

export type TesterProfile = MobileDeviceProfile | WebBrowserProfile;
