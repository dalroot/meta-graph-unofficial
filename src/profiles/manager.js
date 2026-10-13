import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_PATH = path.resolve(__dirname, '../../templates/os_profiles.json');

export class ProfileManager {
  constructor() {
    this.profiles = this.loadAllProfiles();
  }

  loadAllProfiles() {
    if (!fs.existsSync(TEMPLATES_PATH)) {
      throw new Error(`Profile templates file missing: ${TEMPLATES_PATH}`);
    }
    return JSON.parse(fs.readFileSync(TEMPLATES_PATH, 'utf-8'));
  }

  getProfile(key) {
    const profile = this.profiles[key];
    if (!profile) {
      throw new Error(`Unknown Profile: "${key}". Available profiles: ${this.listProfiles().join(', ')}`);
    }
    return profile;
  }

  listProfiles() {
    return Object.keys(this.profiles);
  }

  registerCustomProfile(key, profileData) {
    const required = ['name', 'user_agent', 'sec_ch_ua', 'sec_ch_ua_platform'];
    for (const field of required) {
      if (!profileData[field]) {
        throw new Error(`Invalid custom profile: missing required field "${field}"`);
      }
    }
    this.profiles[key] = {
      ...profileData,
      isCustom: true,
      registeredAt: new Date().toISOString()
    };
    return this.profiles[key];
  }
}
