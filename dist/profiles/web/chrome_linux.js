/**
 * Chrome on Linux x86_64 - Legacy / Diagnostic Web Browser Profile
 * Ground-Truth Source: User live authenticated web session on Ubuntu Linux / Chrome 130+
 *
 * ⚠️ CAUTION / SECURITY WARNING:
 * Meta's anti-bot and automated detection algorithms treat desktop Linux web clients with
 * heightened scrutiny (Tier 3 Risk), as consumer Instagram web usage from Linux is statistically
 * rare and heavily correlated with datacenter scraping, automation workers, and bot runners.
 *
 * NOTE: DO NOT DELETE THIS PROFILE.
 * It is preserved for backwards compatibility, native Linux diagnostic comparisons, and internal test suites.
 * For production traffic and maximum residential trust, always use CHROME_WINDOWS_PROFILE.
 */
export const CHROME_LINUX_PROFILE = {
    id: 'chrome_linux_x64',
    name: 'Google Chrome on Linux x86_64 (Legacy/Diagnostic)',
    platform: 'WEB',
    description: 'Desktop Web Client matching active user browser session [Caution: High Scrutiny Risk]',
    browser_name: 'Chrome',
    browser_version: '130.0.0.0',
    os_name: 'Linux',
    os_version: 'x86_64',
    architecture: 'x86_64',
    user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    app_id: '936619743392459', // Official Instagram Web App ID
    viewport_width: 1280,
    viewport_height: 720,
    screen_avail_width: 1280,
    screen_avail_height: 680,
    device_pixel_ratio: 1.4453125,
    accept_language: 'en-US,en;q=0.9,fa;q=0.8',
    sec_ch_ua: '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
    sec_ch_ua_mobile: '?0',
    sec_ch_ua_platform: '"Linux"'
};
