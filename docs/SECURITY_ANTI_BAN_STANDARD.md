# Meta Anti-Ban, Security & Safe Request Execution Standard

This document defines the strict, non-negotiable security protocol governing all request executions within the `meta-graph-unofficial` ecosystem. Adherence to this specification prevents Meta security checkpoints, IP challenges, and session invalidations (`sessionid=deleted`).

---

## 1. Root Cause Analysis: Why Sessions Get Flagged

Empirical investigation via REA shows that Meta flags accounts for three specific operational violations:

1. **Architecture Mismatch (Header/Endpoint Poisoning):**
   - *The Danger:* Sending a web browser User-Agent (`Google Chrome on Linux`) to mobile-only endpoints (e.g. `i.instagram.com/api/v1/direct_v2/threads/broadcast/text/`) or vice-versa.
   - *Meta's Response:* Deems the session compromised by an unauthorized third-party script and immediately invalidates `sessionid`.

2. **Burst Velocity & Zero-Jitter Automation (Robotic Polling):**
   - *The Danger:* Sending back-to-back requests within milliseconds without human-like delays.
   - *Meta's Response:* Rate-limit penalties (`429 Too Many Requests` or temporary Action Block).

3. **In-Flight Fingerprint Mutation:**
   - *The Danger:* Altering Client Hints, User-Agent, or viewport dimensions during an established session.
   - *Meta's Response:* Checkpoint challenge (SMS / Email verification required).

---

## 2. The 5 Inviolable Rules for Safe Execution

### Rule 1: Zero Guesswork on API Routes
- **Policy:** Never trigger an endpoint that has not been observed directly from a genuine, active web browser session.
- **Enforcement:** If an endpoint is unverified, it is strictly forbidden from running against live accounts. It must first be sniffed passively via the REA protocol.

### Rule 2: Strict Digital Twin Isolation
- All outbound headers (`Sec-CH-UA`, `Sec-CH-UA-Platform`, `Sec-CH-UA-Mobile`, `User-Agent`, `Accept-Language`, `Origin`, `Referer`) must match the host machine or active profile with 100% fidelity.
- Never forge mobile application headers while communicating with `www.instagram.com`.

### Rule 3: Mandatory Human Jitter Engine
- No request is dispatched without an asynchronous sleep interval between **1.8s and 3.5s**.
- Repeated polling loops (e.g. checking comments) must apply a backoff interval of at least **30s to 60s**.

### Rule 4: Read-Only Verification First
- When a new session is introduced, only safe, read-only endpoints may be called:
  - Profile retrieval: `GET https://www.instagram.com/{username}/`
  - Comment stream: `GET /api/v1/media/{media_id}/comments/`
  - News inbox: `GET /api/v1/news/inbox/?mark_as_read=false`
- Write actions (POSTing comments, DMs, or media configuration) require explicit confirmation and verified pre-flight headers.

### Rule 5: Fail-Safe Circuit Breaker
- If any endpoint returns `401 Unauthorized`, `403 Forbidden`, or redirects to `https://www.instagram.com/#` or `login/`, **all background queues must halt immediately**.
- Do not retry failing authenticated endpoints in a loop; halt and await updated session credentials.

---

## 3. Pre-Flight Verification Checklist Before Any Request

- [ ] Is the endpoint an approved web route (not a mobile private route)?
- [ ] Are all headers aligned with the active profile in `templates/os_profiles.json`?
- [ ] Is `X-CSRFToken` populated and matching the `csrftoken` cookie?
- [ ] Is `X-IG-App-ID` set to `936619743392459`?
- [ ] Has human jitter been calculated and applied?
- [ ] Is the action covered by an existing REA evidence ledger?
