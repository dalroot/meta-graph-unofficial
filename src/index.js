import { InstagramClient } from './instagram/client.js';
import { FacebookClient } from './facebook/client.js';
import { ProfileManager } from './profiles/manager.js';

export class MetaGraph {
  constructor(options = {}) {
    this.profileManager = new ProfileManager();
    const profileKey = options.osProfile || 'linux_x86_64_chrome';
    this.profile = this.profileManager.getProfile(profileKey);

    this.instagram = new InstagramClient({ profile: this.profile, ...options.instagram });
    this.facebook = new FacebookClient({ profile: this.profile, ...options.facebook });
  }
}

export { InstagramClient, FacebookClient, ProfileManager };
export default MetaGraph;
