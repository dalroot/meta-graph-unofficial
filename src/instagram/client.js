import { HttpClient } from '../core/http.js';
import { AuthMixin } from './mixins/auth.js';
import { UserMixin } from './mixins/user.js';
import { CommentMixin } from './mixins/comment.js';
import { ActivityMixin } from './mixins/activity.js';
import { DownloadMixin } from './mixins/download.js';

export class InstagramClient {
  constructor(options = {}) {
    this.profile = options.profile || {};
    this.http = new HttpClient({ profile: this.profile });
    this.cookies = options.cookies || '';
    this.csrfToken = options.csrfToken || '';
    this.dsUserId = options.dsUserId || '';
    this.appId = '936619743392459';

    Object.assign(this, AuthMixin);
    Object.assign(this, UserMixin);
    Object.assign(this, CommentMixin);
    Object.assign(this, ActivityMixin);
    Object.assign(this, DownloadMixin);
  }

  getHeaders(referer = 'https://www.instagram.com/') {
    return {
      'Cookie': this.cookies,
      'X-CSRFToken': this.csrfToken,
      'X-IG-App-ID': this.appId,
      'Referer': referer,
      'Origin': 'https://www.instagram.com'
    };
  }
}
