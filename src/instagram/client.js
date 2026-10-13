/**
 * Instagram Client - Direct Web REST & GraphQL Engine
 */

export class InstagramClient {
  constructor(options = {}) {
    this.profile = options.profile;
    this.cookies = options.cookies || '';
    this.csrfToken = options.csrfToken || '';
    this.dsUserId = options.dsUserId || '';
    this.appId = '936619743392459'; // Official Instagram Web App ID
  }

  setSession({ cookies, csrfToken, dsUserId }) {
    if (cookies) this.cookies = cookies;
    if (csrfToken) this.csrfToken = csrfToken;
    if (dsUserId) this.dsUserId = dsUserId;
  }

  getHeaders(referer = 'https://www.instagram.com/') {
    return {
      'Cookie': this.cookies,
      'X-CSRFToken': this.csrfToken,
      'X-IG-App-ID': this.appId,
      'User-Agent': this.profile?.user_agent || '',
      'Sec-CH-UA': this.profile?.sec_ch_ua || '',
      'Sec-CH-UA-Platform': this.profile?.sec_ch_ua_platform || '',
      'Sec-CH-UA-Mobile': this.profile?.sec_ch_ua_mobile || '?0',
      'Accept-Language': this.profile?.accept_language || 'en-US,en;q=0.9',
      'Origin': 'https://www.instagram.com',
      'Referer': referer
    };
  }
}
