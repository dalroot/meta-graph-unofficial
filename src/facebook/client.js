import { HttpClient } from '../core/http.js';
import { FacebookPostMixin } from './mixins/post.js';

export class FacebookClient {
  constructor(options = {}) {
    this.profile = options.profile || {};
    this.http = new HttpClient({ profile: this.profile });
    this.cookies = options.cookies || '';
    this.fbDtsg = options.fbDtsg || '';
    this.cUser = options.cUser || '';

    Object.assign(this, FacebookPostMixin);
  }

  setSession({ cookies, fbDtsg, cUser }) {
    if (cookies) this.cookies = cookies;
    if (fbDtsg) this.fbDtsg = fbDtsg;
    if (cUser) this.cUser = cUser;
  }

  getHeaders() {
    return {
      'Cookie': this.cookies,
      'Origin': 'https://www.facebook.com',
      'Referer': 'https://www.facebook.com/',
      'Content-Type': 'application/x-www-form-urlencoded'
    };
  }
}
