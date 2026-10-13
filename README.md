# MetaGraph Unofficial (`meta-graph-unofficial`) 🌐🚀

> **High-Performance, Multi-Platform Unofficial Meta Graph API Library for Instagram & Facebook.**  
> Built strictly following **REA (Reverse Engineer Anything)** standards with zero browser rendering overhead and strict OS/Browser digital twin profiles.

---

## 🌟 Why MetaGraph Unofficial?

- **Zero Meta Business Verification Hurdles:** No App Review, no legal company papers in the US or Europe, and no arbitrary restrictions.
- **Unified Meta Ecosystem:** Covers both **Instagram** and **Facebook** through a single clean interface.
- **Strict OS Fingerprint Templates (Anti-Detect):** Pre-calibrated templates for Linux, Windows, and macOS that exactly mirror real user browsers down to Client Hints and TLS signatures.
- **REA Evidence-Backed:** Every endpoint is verified against live network observations with zero guesswork.

---

## 📁 Architecture & Modules

```
meta-graph-unofficial/
├── templates/
│   └── os_profiles.json      # Pre-calibrated OS & browser templates (Linux, Win, Mac)
├── src/
│   ├── index.js              # Unified entry point
│   ├── core/
│   │   ├── profile.js        # OS/Browser profile loader
│   │   └── queue.js          # Rate limiter & queuing engine
│   ├── instagram/
│   │   ├── client.js         # Base Instagram HTTP/GraphQL client
│   │   ├── comments.js       # Comment listening & Smart-DM dispatching
│   │   └── media.js          # Photo, Reel, Story upload engines
│   └── facebook/
│       ├── client.js         # Facebook pure GraphQL client
│       └── publisher.js      # Post & interaction methods
└── evidence/
    └── REA_MANIFEST.md       # Provenance ledger & capture logs
```

---

## ⚡ Quick Start

```javascript
import MetaGraph from 'meta-graph-unofficial';

const mg = new MetaGraph({
  osProfile: 'linux_x86_64_chrome' // Or 'windows_11_chrome', 'macos_sonoma_safari'
});

// Configure Instagram session
mg.instagram.setSession({
  cookies: 'sessionid=...; ds_user_id=...',
  csrfToken: '...'
});

// Configure Facebook session
mg.facebook.setSession({
  cookies: 'c_user=...; xs=...',
  fbDtsg: '...'
});
```

---

## 📜 License
MIT License. Created by T4wroot.
