/**
 * meta-graph-unofficial
 * High-Performance Unofficial Meta Graph API Client for Instagram & Facebook
 * Engineered via REA (Reverse Engineer Anything) standards.
 */

import { InstagramClient } from './instagram/client.js';
import { FacebookClient } from './facebook/client.js';
import { loadOSProfile } from './core/profile.js';

export class MetaGraph {
  constructor(options = {}) {
    this.profile = loadOSProfile(options.osProfile || 'linux_x86_64_chrome');
    this.instagram = new InstagramClient({ profile: this.profile, ...options.instagram });
    this.facebook = new FacebookClient({ profile: this.profile, ...options.facebook });
  }
}

export { InstagramClient, FacebookClient };
export default MetaGraph;
