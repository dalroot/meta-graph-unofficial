# MetaGraph Unofficial (`meta-graph-unofficial`)

High-performance, modular unofficial Meta Graph API client for Instagram and Facebook.
Engineered with clean domain mixins, an optional Go transport engine, and strict adherence to the Reverse Engineer Anything (REA) provenance standard.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Inviolable Project Rules](#inviolable-project-rules)
- [Currently Verified Capabilities](#currently-verified-capabilities)
- [Dynamic Operating System & Digital Twin Profiles](#dynamic-operating-system--digital-twin-profiles)
- [High-Performance Go Transport Engine](#high-performance-go-transport-engine)
- [Installation](#installation)
- [Quick Start Guide](#quick-start-guide)
- [Session Extraction & Security](#session-extraction--security)
- [Continuous Integration & Verification](#continuous-integration--verification)
- [License](#license)

---

## Overview

MetaGraph Unofficial is an enterprise-grade SDK designed to interface directly with Meta's internal web endpoints and private GraphQL services without requiring browser automation (Puppeteer/Selenium) or official Meta App Review.

Most unofficial automation tools rely on reverse-engineered mobile endpoints that frequently trigger account challenges and action blocks. MetaGraph Unofficial mirrors genuine web browser sessions down to Client Hints, platform-specific TLS handshakes, and screen geometry.

---

## Key Features

- **Zero Meta App Review:** Eliminates the need for business entity verification, Facebook Partner requirements, and app approval workflows.
- **Unified Meta Ecosystem:** A single interface covering both Instagram and Facebook.
- **Zero Guesswork Architecture:** No method is admitted to the codebase without an empirical network trace recorded under the REA framework.
- **Multi-OS Fingerprint Emulation:** Out-of-the-box support for Linux x86_64, Windows 11, and macOS Sonoma, with extensibility for custom profiles.
- **Dual-Engine Architecture:** High-speed native Node.js interface paired with an optional Go core engine for high-throughput packet processing.
- **Enterprise-Ready Modules:** Inbound comment streaming, automated Direct Message triggers, Feed/Story uploads, and Facebook GraphQL posting.

---

## System Architecture

```
meta-graph-unofficial/
├── .github/
│   └── workflows/
│       └── ci.yml                     # Automated Node test & Go build pipeline
├── docs/
│   ├── CONTRIBUTING.md                # Inviolable project rules & REA standards
│   ├── REA_METHODOLOGY.md             # Reverse engineering methodology & ledger
│   └── SESSION_EXTRACTION_GUIDE.md    # Session token extraction instructions
├── engine/                            # Optional Go High-Performance Transport
│   ├── go.mod                         # Go module definition
│   └── main.go                        # Core network transport handler
├── evidence/                          # Sanitized HTTP/GraphQL traces (REA Ledger)
│   ├── REA_MANIFEST.md                # Master registry of verified operations
│   ├── instagram_upload_evidence.json # Photo feed & story upload trace
│   ├── instagram_inbox_mentions_evidence.json # News inbox & story mentions trace
│   ├── comments_evidence.json         # Real-time comment stream trace
│   └── facebook_graphql_evidence.json # Facebook GraphQL posting trace
├── templates/
│   └── os_profiles.json               # Pre-calibrated OS & browser templates
├── src/
│   ├── index.js                       # Unified MetaGraph entry point
│   ├── core/
│   │   ├── http.js                    # Core HTTP client with human jitter
│   │   ├── profile.js                 # Profile loader helper
│   │   └── utils.js                   # Jitter and cookie parsing utilities
│   ├── profiles/
│   │   └── manager.js                 # Dynamic multi-OS ProfileManager
│   ├── instagram/
│   │   ├── client.js                  # Composed InstagramClient
│   │   └── mixins/
│   │       ├── auth.js                # Session management & credential validation
│   │       ├── user.js                # Profile & user metadata queries
│   │       ├── comment.js             # Media comment retrieval & stream
│   │       └── activity.js            # News inbox, story mentions, & badges
│   └── facebook/
│       ├── client.js                  # Composed FacebookClient
│       └── mixins/
│           └── post.js                # Native GraphQL timeline publishing
├── test/
│   └── client.test.js                 # Node.js native test suite
└── package.json
```

---

## Inviolable Project Rules

The development of this project strictly adheres to the following principles defined in [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md):

1. **Zero Guesswork:** No API route, variable, or header format is added based on guesswork or unverified mobile wrappers.
2. **REA Evidence Provenance:** Every method must reference a concrete sanitized trace in `evidence/`.
3. **Fingerprint Consistency:** Client Hints, Sec-CH-UA values, and headers must never be mixed or randomly mutated within an active session.

---

## Currently Verified Capabilities

The following capabilities have been tested and empirically verified against live Meta web endpoints:

| Domain | Action | Method | Target Endpoint | Status |
| :--- | :--- | :---: | :--- | :---: |
| **Instagram** | Get Media Comments | `GET` | `/api/v1/media/{media_id}/comments/` | Verified Live |
| **Instagram** | Get Notifications & Mentions | `GET` | `/api/v1/news/inbox/?mark_as_read=false` | Verified Live |
| **Instagram** | Upload Photo | `POST` | `/rupload_igphoto/{upload_id}` | Verified Live |
| **Instagram** | Configure Feed Post | `POST` | `/api/v1/media/configure/` | Verified Live |
| **Instagram** | Configure Story Post | `POST` | `/api/v1/media/configure_to_story/` | Verified Live |
| **Instagram** | Fetch User Profile | `GET` | `https://www.instagram.com/{username}/` | Verified Live |
| **Facebook** | Publish Timeline Post | `POST` | `https://www.facebook.com/api/graphql/` | Verified Live |

---

## Dynamic Operating System & Digital Twin Profiles

The library decouples OS profiles from the core logic, allowing applications to mimic any desktop platform or register new browser profiles dynamically:

```javascript
import MetaGraph from 'meta-graph-unofficial';
import { ProfileManager } from 'meta-graph-unofficial/profiles';

// List built-in profiles: ['linux_x86_64_chrome', 'windows_11_chrome', 'macos_sonoma_safari']
const manager = new ProfileManager();
console.log(manager.listProfiles());

// Initialize client with Windows 11 Chrome profile
const mg = new MetaGraph({ osProfile: 'windows_11_chrome' });

// Or register a custom environment (e.g. Chrome on Ubuntu 24.04 ARM64)
manager.registerCustomProfile('ubuntu_arm64_chrome', {
  name: 'Chrome on Ubuntu 24.04 ARM64',
  user_agent: 'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  sec_ch_ua: '"Chromium";v="130", "Google Chrome";v="130"',
  sec_ch_ua_platform: '"Linux"'
});
```

---

## High-Performance Go Transport Engine

For high-volume operations (e.g., streaming thousands of comments or managing multi-account fleets), MetaGraph provides an optional compiled Go engine located in `engine/`:

```bash
cd engine
go build -o bin/engine main.go
./bin/engine -help
```

---

## Installation

```bash
npm install meta-graph-unofficial
```

Or install from source:

```bash
git clone https://github.com/dalroot/meta-graph-unofficial.git
cd meta-graph-unofficial
npm install
```

---

## Quick Start Guide

### 1. Instagram Comment Stream

```javascript
import MetaGraph from 'meta-graph-unofficial';

const mg = new MetaGraph({ osProfile: 'linux_x86_64_chrome' });

mg.instagram.setSession({
  cookies: 'sessionid=YOUR_SESSION_ID; ds_user_id=YOUR_USER_ID; csrftoken=YOUR_CSRF_TOKEN;',
  csrfToken: 'YOUR_CSRF_TOKEN',
  dsUserId: 'YOUR_USER_ID'
});

// Fetch comments for a media post
const data = await mg.instagram.getMediaComments('4007195903156614326');
console.log(`Retrieved ${data.comments.length} comments.`);

for (const c of data.comments) {
  console.log(`[${c.username}]: ${c.text}`);
}
```

### 2. Facebook GraphQL Post

```javascript
mg.facebook.setSession({
  cookies: 'c_user=YOUR_C_USER; xs=YOUR_XS_TOKEN;',
  fbDtsg: 'YOUR_FB_DTSG',
  cUser: 'YOUR_C_USER'
});

const postResult = await mg.facebook.publishTextPost('Automated publishing via meta-graph-unofficial');
```

---

## Session Extraction & Security

MetaGraph Unofficial does not store, transmit, or ask for account passwords. Authentication is handled entirely through session tokens (`sessionid`, `csrftoken`, `c_user`, `fb_dtsg`).

For step-by-step extraction instructions from browser developer tools, refer to [docs/SESSION_EXTRACTION_GUIDE.md](docs/SESSION_EXTRACTION_GUIDE.md).

---

## Continuous Integration & Verification

All commits and pull requests are tested through GitHub Actions:
- Node.js unit tests (`node --test`).
- Profile integrity validation.
- Go engine compilation checks.

Run tests locally:

```bash
npm test
```

---

## License

Distributed under the **MIT License**. Authored by the [dalroot](https://github.com/dalroot) research group.
