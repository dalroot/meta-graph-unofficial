# MetaGraph Unofficial (`meta-graph-unofficial`)

High-performance, modular unofficial Meta Graph API client for Instagram and Facebook in Node.js.
Designed following clean mixin architecture and backed by the Reverse Engineer Anything (REA) framework.

---

## Overview

MetaGraph Unofficial is an engineering-first SDK designed to interface with Meta's private web endpoints and internal GraphQL services without browser emulation overhead.

- Zero Meta App Review or business verification required.
- Modular mixin architecture (similar to `instagrapi` in Python, built natively for Node.js).
- Pre-calibrated operating system and browser fingerprint profiles (Client Hints, viewport geometry, headers).
- Every implemented API endpoint is verified against recorded HTTP traffic traces in `evidence/`.

---

## Architecture

The library follows a domain-driven mixin pattern:

```
meta-graph-unofficial/
├── docs/
│   ├── REA_METHODOLOGY.md            # Reverse engineering standards & trace catalog
│   └── SESSION_EXTRACTION_GUIDE.md   # Step-by-step authentication extraction
├── evidence/                         # Verified traffic captures
├── templates/
│   └── os_profiles.json              # Fingerprint definitions (Linux, Windows, macOS)
├── src/
│   ├── index.js                      # Unified MetaGraph export
│   ├── core/
│   │   ├── http.js                   # High-performance HTTP client with jitter
│   │   ├── profile.js                # Profile loader
│   │   └── utils.js                  # Jitter and cookie parsing helpers
│   ├── instagram/
│   │   ├── client.js                 # InstagramClient composed of domain mixins
│   │   └── mixins/
│   │       ├── auth.js               # Session configuration & state
│   │       ├── user.js               # Profile retrieval & user queries
│   │       ├── comment.js            # Media comment retrieval & stream
│   │       └── activity.js           # News inbox, mentions & notification badges
│   └── facebook/
│       ├── client.js                 # FacebookClient
│       └── mixins/
│           └── post.js               # Native GraphQL feed post publishing
└── package.json
```

---

## Installation

```bash
npm install meta-graph-unofficial
```

Or clone directly:

```bash
git clone https://github.com/dalroot/meta-graph-unofficial.git
cd meta-graph-unofficial
npm install
```

---

## Quick Start

### 1. Initialize Client with OS Profile

```javascript
import MetaGraph from 'meta-graph-unofficial';

const mg = new MetaGraph({
  osProfile: 'linux_x86_64_chrome' // Available: 'linux_x86_64_chrome', 'windows_11_chrome', 'macos_sonoma_safari'
});
```

### 2. Configure Instagram Authentication

```javascript
mg.instagram.setSession({
  cookies: 'sessionid=YOUR_SESSION_ID; ds_user_id=YOUR_USER_ID; csrftoken=YOUR_CSRF_TOKEN;',
  csrfToken: 'YOUR_CSRF_TOKEN',
  dsUserId: 'YOUR_USER_ID'
});
```

### 3. Retrieve Media Comments

```javascript
const commentsData = await mg.instagram.getMediaComments('4007195903156614326');
console.log(`Total Comments: ${commentsData.commentCount}`);

for (const comment of commentsData.comments) {
  console.log(`[${comment.username}]: ${comment.text}`);
}
```

### 4. Fetch Activity & Notification Inbox

```javascript
const inbox = await mg.instagram.getNotificationsInbox();
console.log('Unread Counts:', inbox.counts);
```

### 5. Publish to Facebook Feed via Pure GraphQL

```javascript
mg.facebook.setSession({
  cookies: 'c_user=YOUR_C_USER; xs=YOUR_XS_TOKEN;',
  fbDtsg: 'YOUR_FB_DTSG_TOKEN',
  cUser: 'YOUR_C_USER'
});

const result = await mg.facebook.publishTextPost('Automated update via MetaGraph Unofficial');
```

---

## Verified Endpoints Specification

| Domain | Action | Method | Target Path | Evidence Reference |
| :--- | :--- | :---: | :--- | :--- |
| Instagram | Media Comments | `GET` | `/api/v1/media/{media_id}/comments/` | `evidence/comments_evidence.json` |
| Instagram | News Inbox | `GET` | `/api/v1/news/inbox/?mark_as_read=false` | `evidence/instagram_inbox_mentions_evidence.json` |
| Instagram | Photo Upload | `POST` | `/rupload_igphoto/{upload_id}` | `evidence/instagram_upload_evidence.json` |
| Instagram | Feed Configure | `POST` | `/api/v1/media/configure/` | `evidence/instagram_upload_evidence.json` |
| Instagram | Story Configure| `POST` | `/api/v1/media/configure_to_story/` | `evidence/instagram_upload_evidence.json` |
| Facebook | Publish Post | `POST` | `https://www.facebook.com/api/graphql/` | `evidence/facebook_graphql_evidence.json` |

---

## Verification & Tests

To execute the test suite:

```bash
npm test
```

---

## License

MIT License. Authored and maintained by the [dalroot](https://github.com/dalroot) research collective.
