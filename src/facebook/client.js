/**
 * Facebook Client - Direct Pure GraphQL / Meta Internal API
 */

export class FacebookClient {
  constructor(options = {}) {
    this.profile = options.profile;
    this.cookies = options.cookies || '';
    this.fbDtsg = options.fbDtsg || '';
    this.cUser = options.cUser || '';
  }

  setSession({ cookies, fbDtsg, cUser }) {
    if (cookies) this.cookies = cookies;
    if (fbDtsg) this.fbDtsg = fbDtsg;
    if (cUser) this.cUser = cUser;
  }

  getHeaders() {
    return {
      'Cookie': this.cookies,
      'User-Agent': this.profile?.user_agent || 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.75 Safari/537.36',
      'Sec-CH-UA': this.profile?.sec_ch_ua || '',
      'Sec-CH-UA-Platform': this.profile?.sec_ch_ua_platform || '',
      'Origin': 'https://www.facebook.com',
      'Referer': 'https://www.facebook.com/',
      'Content-Type': 'application/x-www-form-urlencoded'
    };
  }
}
