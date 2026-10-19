<p align="center">
  <img src="assets/banner.png" alt="MetaGraph Unofficial Banner" width="100%" />
</p>

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
├── ts_src/                            # Modern TypeScript TwinGraph SDK
│   ├── twin_graph.ts                  # Unified TwinGraph Client (Meta Graph API v21.0)
│   ├── index.ts                       # Public SDK entrypoint
│   ├── schema/                        # Declarative In-Memory SQLite Schema Catalog
│   │   ├── catalog_schema.ts          # DDL tables & official Meta v21.0 seed definitions
│   │   ├── graph_catalog.ts           # Schema registry powered by Node.js native node:sqlite
│   │   ├── field_projector.ts         # Dynamic ?fields= projection & Android client cleanup
│   │   └── index.ts
│   ├── router/                        # Versioned Meta Graph API Route Dispatcher
│   │   ├── graph_router.ts            # Dispatches /v21.0/{node}/{edge} to twins
│   │   └── index.ts
│   ├── nodes/                         # Fluent Node Proxies (Meta Business SDK style)
│   │   ├── node_proxies.ts            # GraphMediaProxy, GraphUserProxy, GraphConversationProxy
│   │   └── index.ts
│   ├── utils/                         # Zero-Dependency Native Utilities
│   │   ├── downloader.ts              # CDN media downloader, high-res poster & MP3 extractor
│   │   └── index.ts
│   ├── profiles/                      # Hardware & Browser Digital Twin Profiles
│   │   └── device_profiles.ts         # Redmi Note 13 4G + Clean Web Chrome
│   ├── twins/                         # Empirical Engine Twins
│   │   ├── device_twin.ts             # Redmi Note 13 4G Hardware Twin (Tigon/Liger HMAC)
│   │   ├── web_twin.ts                # Web RelayModern Twin (Direct & Comments)
│   │   ├── direct_twin.ts             # Direct Messaging & Pando GraphQL
│   │   ├── media_twin.ts              # Media, Carousel, Story & Insights Twin
│   │   ├── discovery_twin.ts          # Hashtag, Search & Explore Twin
│   │   ├── dashboard_twin.ts          # Professional Dashboard & Monetization
│   │   └── transport.ts               # HTTP transport with anti-ban jitter & circuit breaker
│   └── types/
│       └── graph.ts                   # 1:1 Meta Graph API v21.0 Type Definitions
├── evidence/                          # Sanitized Empirical REA Evidence Ledger
│   ├── raw_telemetry/                 # 161,827+ lines of live Redmi Note 13 telemetry
│   ├── RESOLVED_ENDPOINTS_CATALOG.md  # 57 verified endpoints with 100% REA backing
│   └── web_comment_evidence.json      # Live web GraphQL comment traces
├── docs/
│   ├── VERIFIED_CAPABILITIES_AND_ROADMAP.md # 30 verified live capabilities ledger
│   ├── CONTRIBUTING.md                # Inviolable project rules & REA standards
│   └── SESSION_EXTRACTION_GUIDE.md    # Session extraction instructions
├── scripts/
│   ├── run_4_safe_tests.ts            # 4 safe read-only tests with v21.0 projection
│   └── test_schema_engine.ts          # Unit tests for SQLite catalog & router
├── instagram_session.json             # Validated session tokens
├── circuit_breaker.json               # Anti-ban safety circuit breaker
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

### 1. Unified TwinGraph Client (Meta Graph API v21.0)

```typescript
import { TwinGraph } from 'meta-graph-unofficial';

// Initialize the twin with active session cookies
const tg = new TwinGraph({
  cookies: 'sessionid=YOUR_SESSION_ID; ds_user_id=YOUR_USER_ID; csrftoken=YOUR_CSRF_TOKEN;',
});

// Fluent Node Proxy: Media Node
const media = tg.nodeMedia('Db-mzoXM6ik');

// Fetch media with exact Graph API field projection
const mediaData = await media.get(['id', 'caption', 'media_type', 'media_url', 'like_count']);
console.log('Clean v21.0 Media Payload:', mediaData);

// Direct download media (video/audio/cover poster) without external scripts
const downloaded = await media.download('./downloads', 'both');
console.log('Saved files:', downloaded);
```

### 2. Direct Messaging & Fluent Conversation Proxy

```typescript
// Fluent Conversation Proxy: Threads & Direct Messages
const thread = tg.nodeConversation('17841400000000000');

// Read inbox messages
const messages = await thread.getMessages(10);
console.log(`Retrieved ${messages.length} messages.`);

// Send message without browser automation
await thread.sendMessage('Hello from TwinGraph v21.0!');
```

### 3. Dynamic Versioned Router (`/v21.0/...`)

```typescript
// Query any verified node or edge directly using official v21.0 paths:
const userProfile = await tg.get('/v21.0/me', { fields: 'id,username,followers_count,biography' });
const mediaComments = await tg.get('/v21.0/Db-mzoXM6ik/comments', { fields: 'id,text,from' });
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
