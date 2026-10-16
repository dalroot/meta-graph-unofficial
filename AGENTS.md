# Meta Graph Unofficial — Agent Operating Guidelines & Rules (AGENTS.md)

> **PRIMARY DIRECTIVE:** All AI agents, subagents, and automated workers operating in this repository MUST strictly adhere to the **Meta Source Fidelity Standard**. Guesswork, ad-hoc web-scraping patterns, and deprecated unofficial hacks are strictly prohibited.

---

## 1. The Core Ground Truth Hierarchy

Before attempting **ANY** task, API call, or code implementation for the first time, every agent MUST consult the sources in the following strict order:

```mermaid
graph TD
    A[New Task / Endpoint Request] --> B[1. Official Meta Graph API v21.0 Docs]
    B --> C[2. REA Raw Telemetry from Physical Redmi Note 13]
    C --> D[3. Validated Endpoints Catalog]
    D --> E{Source Backed?}
    E -- Yes --> F[Execute Safe Request with Circuit Breaker]
    E -- No --> G[Quarantine & Require User Review]
    F -- Success --> H[Register into Resolved Catalog]
    F -- Failure --> I[Trip Circuit Breaker & Halt Immediately]
```

1. **Source 1: Official Meta Graph API v21.0 Specification (`docs/official_graph_api/`)**
   - We model our public SDK interface, parameter names, error structures, and response shapes **1:1** on the official Meta Graph API v21.0.
   - Example: Direct messaging is modeled after `POST /{page_id}/messages` and `GET /{user_id}/conversations`.
2. **Source 2: Authentic REA Raw Telemetry (`evidence/raw_telemetry/`)**
   - 161,827+ lines of real, live telemetry captured from the physical Xiaomi Redmi Note 13 4G (`instagram_live_stream.log`, `media_composer_creation.log`, `captured_endpoints_catalog.json`).
   - Ground truth for mobile Pando GraphQL queries (`InboxTrayRequestForUserQuery`, `IGDirectGetPresenceQuery`), Tigon network stack, and real client headers.
3. **Source 3: Validated Endpoints Ledger (`evidence/RESOLVED_ENDPOINTS_CATALOG.md`)**
   - Persistent registry of previously resolved, verified, and battle-tested endpoints.
   - **Rule:** Never re-invent the wheel. If an endpoint is already verified in this catalog, reuse its exact protocol.

---

## 2. Inviolable Anti-Ban & Execution Rules

1. **Zero Guesswork / No Deprecated Endpoints:**
   - NEVER call deprecated web-scraping endpoints (e.g. `/api/v1/web/search/topsearch/`). If an endpoint returns 404 or unexpected behavior, DO NOT try random permutations.
2. **Strict Digital Twin Header Isolation:**
   - Never send desktop browser User-Agents (`Chrome on Linux`) to mobile-native endpoints (`i.instagram.com`), and never send mobile App headers to web-only endpoints.
3. **No Automated Retry Loops (Circuit Breaker):**
   - Execute exactly **1 attempt** per test.
   - If HTTP status != 200, immediately trip the circuit breaker (`circuit_breaker.json`), persist the log, and **STOP**. Never loop.
4. **Mandatory Documentation Upon Success:**
   - As soon as any endpoint or feature succeeds (HTTP 200), the agent MUST update `evidence/RESOLVED_ENDPOINTS_CATALOG.md` with:
     * Endpoint URI & Method
     * Query Parameters / Payload Schema
     * Ground-Truth Source (Official Doc / Raw Telemetry line reference)
     * Response Schema & Sample Output
     * Safe Rate-Limit Guidance

---

## 3. Ground-Truth Coverage & Success Scorecard

Every agent must report and track the repository's **Source-Backing Percentage**:

$$\text{Coverage Score} = \left( \frac{\text{Verified Endpoints Backed 1:1 by Meta Source / Telemetry}}{\text{Total Implemented Endpoints}} \right) \times 100\%$$

| Component | Official Graph API v21.0 Backing | REA Raw Telemetry Backing | Verification Status |
| :--- | :---: | :---: | :---: |
| **Media Insights (`getMediaInsights`)** | `/{media-id}/insights` | Captured & Verified | ✅ 100% Ground Truth |
| **User Profile / Insights** | `/{user-id}?fields=...` | Captured & Verified | ✅ 100% Ground Truth |
| **Direct Inbox / Conversations** | `/{user-id}/conversations` | `InboxTrayRequestForUserQuery` | ✅ 100% Ground Truth |
| **Direct Message Send** | `/{conversation-id}/messages` | `broadcast/text` + Pando | 🔄 In Progress |
| **Reel / Media Fetch** | `/{media-id}` | Captured & Verified | ✅ 100% Ground Truth |
| **Explore Feed** | N/A (Internal Navigation) | Captured & Verified | ✅ 100% Ground Truth |

---

## 4. Subagent Protocol Checklist

Before starting any task, a subagent must verify:
- [ ] Have I searched `evidence/raw_telemetry/` for relevant queries and logs?
- [ ] Have I verified the official Meta Graph API v21.0 equivalent in `docs/`?
- [ ] Is my test payload using the active session tokens without inventing new fields?
- [ ] Am I respecting the 1-attempt limit and ready to stop on any failure?
- [ ] Am I ready to document successful results immediately into `RESOLVED_ENDPOINTS_CATALOG.md`?
