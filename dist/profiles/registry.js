/**
 * TwinProfileRegistry - Dynamic, Extensible Tester Profile Management
 * Enables registering and selecting mobile or web tester profiles without hardcoding.
 */
import { REDMI_NOTE_13_PROFILE } from './mobile/redmi_note_13.js';
import { CHROME_LINUX_PROFILE } from './web/chrome_linux.js';
import { CHROME_WINDOWS_PROFILE } from './web/chrome_windows.js';
export class TwinProfileRegistry {
    static profiles = new Map();
    static defaultMobileId = REDMI_NOTE_13_PROFILE.id;
    static defaultWebId = CHROME_WINDOWS_PROFILE.id;
    static {
        // Register initial ground-truth profiles
        this.register(REDMI_NOTE_13_PROFILE);
        this.register(CHROME_LINUX_PROFILE);
        this.register(CHROME_WINDOWS_PROFILE);
    }
    static register(profile) {
        this.profiles.set(profile.id, profile);
    }
    static get(profileId) {
        return this.profiles.get(profileId);
    }
    static getDefaultMobile() {
        const profile = this.profiles.get(this.defaultMobileId);
        if (!profile || profile.platform !== 'MOBILE') {
            return REDMI_NOTE_13_PROFILE;
        }
        return profile;
    }
    static getDefaultWeb() {
        const profile = this.profiles.get(this.defaultWebId);
        if (!profile || profile.platform !== 'WEB') {
            return CHROME_LINUX_PROFILE;
        }
        return profile;
    }
    static listByPlatform(platform) {
        return Array.from(this.profiles.values()).filter(p => p.platform === platform);
    }
    static listAll() {
        return Array.from(this.profiles.values());
    }
    static setDefaultMobile(profileId) {
        if (this.profiles.has(profileId)) {
            this.defaultMobileId = profileId;
        }
    }
    static setDefaultWeb(profileId) {
        if (this.profiles.has(profileId)) {
            this.defaultWebId = profileId;
        }
    }
}
