/**
 * TwinProfileRegistry - Dynamic, Extensible Tester Profile Management
 * Enables registering and selecting mobile or web tester profiles without hardcoding.
 */
import { TesterProfile, MobileDeviceProfile, WebBrowserProfile, TwinPlatform } from './types.js';
export declare class TwinProfileRegistry {
    private static profiles;
    private static defaultMobileId;
    private static defaultWebId;
    static register(profile: TesterProfile): void;
    static get(profileId: string): TesterProfile | undefined;
    static getDefaultMobile(): MobileDeviceProfile;
    static getDefaultWeb(): WebBrowserProfile;
    static listByPlatform(platform: TwinPlatform): TesterProfile[];
    static listAll(): TesterProfile[];
    static setDefaultMobile(profileId: string): void;
    static setDefaultWeb(profileId: string): void;
}
