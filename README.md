# MetaGraph Unofficial (`meta-graph-unofficial`) 🌐⚡

[![GitHub Repo](https://img.shields.io/badge/GitHub-dalroot%2Fmeta--graph--unofficial-blue?logo=github)](https://github.com/dalroot/meta-graph-unofficial)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg?logo=node.js)](https://nodejs.org/)
[![REA Compliant](https://img.shields.io/badge/REA-Evidence--Backed-orange.svg)](docs/REA_METHODOLOGY.md)

> **Enterprise-Grade Unofficial Meta Graph API Client for Instagram & Facebook in Node.js.**  
> Bypasses Meta Business Verification, App Review, and regional sanctions with 100% accurate OS & browser digital twin profiles.

---

## 🚀 Key Features

- **Zero Meta App Review:** Start publishing and managing interactions instantly with session cookies.
- **Unified Ecosystem:** First unified Node.js library supporting **both Instagram and Facebook**.
- **100% REA-Proven Endpoints:** Built strictly using the **Reverse Engineer Anything** standard. No guessed payloads, no stale mobile APIs.
- **Strict Digital Twin Anti-Detect:** Built-in profiles matching real Linux (x86_64), Windows 11, and macOS browsers (Client Hints, headers, screen DPR).
- **Commercial Automation Ready:**
  - Inbound comment listening (`fetchMediaComments`).
  - Comment-to-DM trigger automation (similar to ManyChat and Directam).
  - Story and Feed media uploaders (`rupload_igphoto`).
  - Facebook GraphQL instant publishing.

---

## 📂 Project Structure

```
meta-graph-unofficial/
├── docs/
│   ├── REA_METHODOLOGY.md           # Reverse engineering evidence & provenance guide
│   └── SESSION_EXTRACTION_GUIDE.md  # Step-by-step credentials guide
├── evidence/                        # Raw verified traffic captures (Zero Guesswork)
│   ├── REA_MANIFEST.md
│   ├── instagram_upload_evidence.json
│   ├── instagram_inbox_mentions_evidence.json
│   ├── comments_evidence.json
│   └── facebook_graphql_evidence.json
├── templates/
│   └── os_profiles.json             # OS & browser fingerprint templates
├── src/
│   ├── index.js                     # Unified MetaGraph entry point
│   ├── core/
│   │   ├── profile.js               # OS Profile loader
│   │   └── queue.js                 # Pacing and anti-ban queue manager
│   ├── instagram/
│   │   ├── client.js                # Core Instagram HTTP & GraphQL engine
│   │   ├── comments.js              # Comments listener
│   │   └── media.js                 # Media publisher
│   └── facebook/
│       ├── client.js                # Facebook GraphQL engine
│       └── publisher.js             # Feed publisher
└── package.json
```

---

## 🛠️ Quick Installation & Setup

```bash
git clone https://github.com/dalroot/meta-graph-unofficial.git
cd meta-graph-unofficial
npm install
```

### 1. Extracting Your Session
Read the [Session Extraction Guide](docs/SESSION_EXTRACTION_GUIDE.md) to extract your `sessionid`, `csrftoken`, and `ds_user_id` from your browser.

### 2. Basic Example

```javascript
import MetaGraph from 'meta-graph-unofficial';

const mg = new MetaGraph({
  osProfile: 'linux_x86_64_chrome' // 'linux_x86_64_chrome' | 'windows_11_chrome' | 'macos_sonoma_safari'
});

// Configure Instagram Session
mg.instagram.setSession({
  cookies: 'sessionid=...; ds_user_id=19835089130; csrftoken=...',
  csrfToken: 's51GbHBjwTJ88hKQYjBjbEED8ZqSZ22v',
  dsUserId: '19835089130'
});

// Configure Facebook Session
mg.facebook.setSession({
  cookies: 'c_user=61594901048716; xs=...;',
  fbDtsg: 'NAfwMx3M...',
  cUser: '61594901048716'
});
```

---

## 📊 REA Proven Endpoints Table

All endpoints implemented in this library are rigorously validated and stored in `evidence/`:

| Capability | Target Endpoint | HTTP Method | Evidence Status |
| :--- | :--- | :---: | :---: |
| **Feed Post Upload** | `/rupload_igphoto/{upload_id}` | `POST` | ✅ Verified Live |
| **Feed Post Config** | `/api/v1/media/configure/` | `POST` | ✅ Verified Live |
| **Story Post Config** | `/api/v1/media/configure_to_story/` | `POST` | ✅ Verified Live |
| **Comments Stream** | `/api/v1/media/{media_id}/comments/` | `GET` | ✅ Verified Live |
| **Activity & Mentions** | `/api/v1/news/inbox/?mark_as_read=false` | `GET` | ✅ Verified Live |
| **Facebook Post** | `https://www.facebook.com/api/graphql/` | `POST` | ✅ Verified Live |

For full technical specifications, see [docs/REA_METHODOLOGY.md](docs/REA_METHODOLOGY.md).

---

## 🛡️ Anti-Ban & Rate Limiting Guidelines

Meta strictly monitors request velocity. To guarantee account safety:
1. Always apply jitter (minimum 1.5s - 3.5s delay between requests).
2. Keep OS profiles fixed; never switch Client Hints or User-Agents dynamically within an active session.
3. Queue bulk comment replies through the built-in queue system.

---

## 📄 License

Distributed under the **MIT License**. Maintained by [dalroot](https://github.com/dalroot).
