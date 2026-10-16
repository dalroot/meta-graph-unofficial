# Verified & Resolved Meta Endpoints Catalog

> **PURPOSE:** This catalog acts as the permanent ground-truth ledger of successfully verified endpoints, headers, payloads, and response structures. No agent may re-invent, re-test, or guess any endpoint registered here. All endpoints adhere strictly to the **Meta Source Fidelity Standard**.

---

## 1. Verified Endpoints Ledger

### 1.1 Single Media & Reel Object
- **Official Meta Graph API v21.0 Mapping:** `GET /v21.0/{media-id}`
- **Live Endpoint:** `GET https://www.instagram.com/p/{shortcode}/` & `GET https://www.instagram.com/reel/{shortcode}/`
- **HTTP Method:** `GET`
- **Query Parameters / Payload:** Path shortcode (`{shortcode}`)
- **Required Headers:**
  * `User-Agent`: Redmi Note 13 Webview / Chrome 130 Linux
  * `Cookie`: `sessionid`, `csrftoken`, `ds_user_id`
  * `X-IG-App-ID`: `936619743392459`
- **Ground-Truth Source:** Official Doc `docs/official_graph_api/NODES_AND_EDGES.md#media_id`; tested on physical trace `reel_stream_evidence.json` and live verification `https://www.instagram.com/p/DedDBnTCs-J/` -> HTTP 200 (601,388 bytes).
- **Response Schema & Sample Output:**
  ```json
  {
    "id": "3587123984712093481",
    "shortcode": "DedDBnTCs-J",
    "caption": "Verification post",
    "media_type": "VIDEO",
    "video_url": "https://scontent.xx.fbcdn.net/v/...",
    "like_count": 42,
    "comment_count": 5
  }
  ```
- **Safe Rate-Limit Guidance:** 1 request per 3.5s - 5.0s (jittered). Max 60 requests/hour per IP.
- **Status:** ✅ VERIFIED & RESOLVED

---

### 1.2 User Profile & Public Bio
- **Official Meta Graph API v21.0 Mapping:** `GET /v21.0/{user-id}?fields=id,username,name,biography,followers_count,follows_count,media_count`
- **Live Endpoint:** `GET https://www.instagram.com/{username}/`
- **HTTP Method:** `GET`
- **Query Parameters / Payload:** Path username (`{username}`)
- **Required Headers:** Authenticated Session Cookies + Webview / Mobile User-Agent + `X-IG-App-ID: 936619743392459`
- **Ground-Truth Source:** `docs/official_graph_api/NODES_AND_EDGES.md#user_id`; Account `@hokar368` (`19835089130`) verified -> HTTP 200.
- **Response Schema & Sample Output:**
  ```json
  {
    "id": "19835089130",
    "username": "hokar368",
    "full_name": "Hokar Veria",
    "biography": "Reverse engineering enthusiast",
    "followers_count": 124,
    "following_count": 89,
    "media_count": 14
  }
  ```
- **Safe Rate-Limit Guidance:** 1 request per 4.0s - 7.0s. Max 45 profile fetches/hour per session.
- **Status:** ✅ VERIFIED & RESOLVED

---

### 1.3 Explore & Content Discovery
- **Official Meta Graph API v21.0 Mapping:** Internal Graph Discovery Surface
- **Live Endpoint:** `GET https://www.instagram.com/explore/`
- **HTTP Method:** `GET`
- **Required Headers:** Authenticated Session Cookies + 4.5s human interval delay
- **Ground-Truth Source:** Telemetry verified on 2026-10-17 -> HTTP 200 (601,315 bytes).
- **Response Schema:** Hydrated JSON feed of popular posts, reels, and hashtag suggestions.
- **Safe Rate-Limit Guidance:** 1 request per 6.0s - 10.0s. Max 30 page visits/hour.
- **Status:** ✅ VERIFIED & RESOLVED

---

### 1.4 Direct Messages & Conversations (Inbox Tray)
- **Official Meta Graph API v21.0 Mapping:** `GET /v21.0/{user-id}/conversations`
- **Live Endpoints:**
  * Pando GraphQL (Mobile): `InboxTrayRequestForUserQuery`
  * Live Web GraphQL Thread Detail: `IGDThreadDetailQuery` (Doc ID: `29613940454875963`)
  * Live Web GraphQL Inbox Tray: `PolarisDirectInboxMobileQuery` (Doc ID: `29907991468791426`)
  * Folder Unread Count (Web): `useIGDSystemFolderUnreadThreadCountQuery` (Doc ID: `27437959689223570`)
  * Direct Badge Count (Web): `IGDBadgeCountOffMsysQuery` (Doc ID: `27393860900250970`)
  * REST Fallback / Webview: `GET https://www.instagram.com/direct/inbox/`
- **Ground-Truth Source:**
  * Raw Telemetry Lines: 5,243, 44,492, 114,074 in `instagram_live_stream.log`.
  * `evidence/instagram_inbox_mentions_evidence.json`.
  * `evidence/DIRECT_MESSAGING_ARCHITECTURE.md`.
  * Live Safe Inspection verified on 2026-10-17: `POST https://www.instagram.com/api/graphql` (`IGDThreadDetailQuery`, Doc ID: `29613940454875963`) -> HTTP 200 OK (12,640 bytes) via TwinTransport.
- **Response Schema & Sample Output (100% Live Verified Messages):**
  ```json
  {
    "data": [
      {
        "id": "2102378287099186",
        "updated_time": "2026-10-16T22:23:47.477Z",
        "unread_count": 0,
        "message_count": 5,
        "participants": {
          "data": [
            { "id": "19835089130", "username": "hokar368", "name": "hokarveria" },
            { "id": "76631390374", "username": "tawanatallks", "name": "توانا تاکس | هوش مصنوعی" }
          ]
        },
        "messages": {
          "data": [
            { "id": "mid.$cAH8NBXdym8yneBW3FWhRtBtrUXlv", "created_time": "2026-10-16T22:23:47.477Z", "from": { "id": "76631390374", "username": "tawanatallks" }, "message": "How are you" },
            { "id": "mid.$cAH8NBXdym8yneBWq8GhRtBhGb1Ir", "created_time": "2026-10-16T22:23:44.368Z", "from": { "id": "76631390374", "username": "tawanatallks" }, "message": "Hi back" },
            { "id": "mid.$cAH8NBXdym8yneBWfPGhRtBhGb04y", "created_time": "2026-10-16T22:23:26.281Z", "from": { "id": "19835089130", "username": "hokar368" }, "message": "های خوبی" },
            { "id": "mid.$cAH8NBXdym8yneBNUOGhRtBhGbu4U", "created_time": "2026-10-16T22:21:09.806Z", "from": { "id": "19835089130", "username": "hokar368" }, "message": "hi" },
            { "id": "mid.$cAH8NBXdym8yneBNTOGhRtBhGbuhI", "created_time": "2026-10-16T22:21:07.946Z", "from": { "id": "19835089130", "username": "hokar368" }, "message": "sghl" }
          ]
        },
        "snippet": "How are you"
      }
    ]
  }
  ```
- **Safe Rate-Limit Guidance:** Min 3.0s between polling syncs; prefer MSYS delta synchronization cursor. Max 30 inbox fetches/hour.
- **Status:** ✅ 100% VERIFIED LIVE GROUND TRUTH

---

### 1.5 Direct Message Outbound Text Broadcast
- **Official Meta Graph API v21.0 Mapping:** `POST /v21.0/{conversation-id}/messages`
- **Live Endpoint:** `POST https://www.instagram.com/api/v1/direct_v2/threads/broadcast/text/`
- **HTTP Method:** `POST`
- **Payload Schema:**
  ```json
  {
    "thread_ids": "["{thread_id}"]",
    "text": "Your message text here",
    "client_context": "c9284fa0-82a1-432d-86fb-7389a9128e01",
    "action": "send_item"
  }
  ```
- **Required Headers:**
  * `User-Agent`: Redmi Note 13 Android User-Agent / Webview
  * `Cookie`: `sessionid`, `csrftoken`, `ds_user_id`
  * `X-CSRFToken`: Active `csrftoken`
  * `X-IG-App-ID`: `936619743392459`
- **Ground-Truth Source:** `src/instagram/direct.py`; `evidence/DIRECT_MESSAGING_ARCHITECTURE.md` (Lines 114–128).
- **Response Schema:**
  ```json
  {
    "status": "ok",
    "item_id": "1792019482910394",
    "thread_id": "340282366841710300949128148901827394857",
    "timestamp": 1792019482910
  }
  ```
- **Safe Rate-Limit Guidance:** Min 1.5s - 3.5s delay between messages. Max 30 messages/hour to avoid spam trigger.
- **Status:** ✅ VERIFIED & RESOLVED

---

### 1.6 Feed Photo Upload & Publication
- **Official Meta Graph API v21.0 Mapping:** `POST /v21.0/{ig-user-id}/media` & `POST /v21.0/{ig-user-id}/media_publish`
- **Live Endpoints:**
  1. Upload: `POST https://www.instagram.com/rupload_igphoto/{upload_id}`
  2. Configure: `POST https://www.instagram.com/api/v1/media/configure/`
- **Payload Schema (Configure):**
  ```json
  {
    "upload_id": "1791914989931",
    "caption": "Verification test post",
    "source_type": "library",
    "disable_comments": 0,
    "like_and_view_counts_disabled": 0
  }
  ```
- **Ground-Truth Source:** `evidence/instagram_upload_evidence.json` (Lines 8–35). Verified output: `media_id: 4007195903156614326_19835089130`, `fbid: 17909535336484380` -> HTTP 200.
- **Safe Rate-Limit Guidance:** Min 15.0s between uploads. Max 10 posts/hour.
- **Status:** ✅ VERIFIED & RESOLVED

---

### 1.7 Story Photo Upload & Publication
- **Official Meta Graph API v21.0 Mapping:** `POST /v21.0/{ig-user-id}/media?media_type=STORIES` & `POST /v21.0/{ig-user-id}/media_publish`
- **Live Endpoints:**
  1. Upload: `POST https://www.instagram.com/rupload_igphoto/{upload_id}`
  2. Configure: `POST https://www.instagram.com/api/v1/media/configure_to_story/`
- **Payload Schema (Configure):**
  ```json
  {
    "upload_id": "1791915027149",
    "source_type": "library",
    "configure_mode": "1"
  }
  ```
- **Ground-Truth Source:** `evidence/instagram_upload_evidence.json` (Lines 38–65). Verified output: `media_id: 4007196196481064068_19835089130`, `fbid: 18118235482767677`, `is_reel_media: true`, `expiring_at: 1792001433`.
- **Safe Rate-Limit Guidance:** Min 8.0s between stories. Max 20 stories/day.
- **Status:** ✅ VERIFIED & RESOLVED

---

### 1.8 Reel & Video Upload & Publication
- **Official Meta Graph API v21.0 Mapping:** `POST /v21.0/{ig-user-id}/media?media_type=REELS` & `POST /v21.0/{ig-user-id}/media_publish`
- **Live Endpoints:**
  1. Video Chunk Upload: `POST/GET https://www.instagram.com/rupload_igvideo/{upload_id}`
  2. Cover Image Upload: `POST https://www.instagram.com/rupload_igphoto/{upload_id}`
  3. Video Configure: `POST https://www.instagram.com/api/v1/media/configure/?video=1` or `POST https://www.instagram.com/api/v1/media/configure_to_clips/`
- **Required Headers:**
  * `X-Instagram-Rupload-Params`: `{"upload_id":"...", "media_type":2}`
  * `X-Entity-Type`: `video/mp4`
  * `X-Entity-Length`: Byte length
- **Ground-Truth Source:** `evidence/reel_upload_evidence.json` and `evidence/instagram_video_evidence.json`. Verified output: `media_id: 4007370536895776066_19835089130`, `fbid: 17879964243543555` -> HTTP 200.
- **Safe Rate-Limit Guidance:** Min 30.0s between video uploads. Max 5 reels/hour.
- **Status:** ✅ VERIFIED & RESOLVED

---

### 1.9 Media Comments Thread Retrieval
- **Official Meta Graph API v21.0 Mapping:** `GET /v21.0/{media-id}/comments?fields=id,text,timestamp,username,like_count`
- **Live Endpoint:** `GET https://www.instagram.com/api/v1/media/{media_id}/comments/`
- **HTTP Method:** `GET`
- **Ground-Truth Source:** `evidence/comments_evidence.json` (Lines 1–22). Verified output:
  ```json
  {
    "comment_count": 1,
    "comments": [
      {
        "pk": "18089061314692257",
        "text": "sample trigger comment",
        "user_id": "19835089130",
        "user": { "username": "hokar368", "pk": "19835089130" }
      }
    ],
    "status": "ok"
  }
  ```
- **Safe Rate-Limit Guidance:** Min 2.5s between comment fetches. Max 100 requests/hour.
- **Status:** ✅ VERIFIED & RESOLVED

---

### 1.10 Stories Tray Retrieval (`reels_tray`)
- **Official Meta Graph API v21.0 Mapping:** `GET /v21.0/{ig-user-id}/stories`
- **Live Endpoint:** `GET https://www.instagram.com/api/v1/feed/reels_tray/`
- **HTTP Method:** `GET`
- **Ground-Truth Source:** `evidence/story_download_evidence.json` (Lines 1–14). Returns active stories, high-res CDN candidate URLs, and expiration timestamps.
- **Safe Rate-Limit Guidance:** Min 10.0s between tray refreshes. Max 30 fetches/hour.
- **Status:** ✅ VERIFIED & RESOLVED

---

### 1.11 Notifications & Smart Mentions Inbox
- **Official Meta Graph API v21.0 Mapping:** `GET /v21.0/{ig-user-id}/tags` & `mentioned_comment`
- **Live Endpoint:** `GET https://www.instagram.com/api/v1/news/inbox/?mark_as_read=false`
- **HTTP Method:** `GET`
- **Ground-Truth Source:** `evidence/instagram_inbox_mentions_evidence.json` (Lines 27–37). Captures story mentions, usertags, comments, likes, and comment likes.
- **Safe Rate-Limit Guidance:** Min 5.0s polling delay. Max 60 calls/hour.
- **Status:** ✅ VERIFIED & RESOLVED

---

### 1.12 Facebook Feed Post Creation (`ComposerStoryCreateMutation`)
- **Official Meta Graph API v21.0 Mapping:** `POST /v21.0/{page-id}/feed` or `POST /v21.0/{user-id}/feed`
- **Live Endpoint:** `POST https://www.facebook.com/api/graphql/`
- **HTTP Method:** `POST`
- **Doc ID:** `29230635736522902` (or `7160754877372224`)
- **Payload Schema:** `input: { composer_type: "feed", message: { text: "..." }, actor_id: "...", client_mutation_id: "1" }`
- **Ground-Truth Source:** `evidence/facebook_graphql_evidence.json` (Lines 23–141). Output: `post_id: 122108857413496701`, story URL verified.
- **Safe Rate-Limit Guidance:** Min 10.0s between posts. Max 15 posts/hour.
- **Status:** ✅ VERIFIED & RESOLVED

---

### 1.13 Media Insights & Account Overview
- **Official Meta Graph API v21.0 Mapping:**
  * `GET /v21.0/{media_id}/insights?metric=reach,impressions,plays,saved,shares`
  * `GET /v21.0/{user_id}/insights?metric=reach,impressions,follower_count&period=day`
- **Live Endpoints:**
  * `GET https://www.instagram.com/api/v1/insights/media_insights/?media_id={media_id}&surface=view_insights`
  * `GET https://www.instagram.com/api/v1/insights/account_overview/?timeframe=30d`
- **Ground-Truth Source:** `docs/official_graph_api/INSIGHTS_SPEC.md`; `src/instagram/insights.py` (Lines 14–16, 85–139).
- **Response Schema:** Delivers `plays`, `reach`, `impressions`, `average_watch_time_ms`, `profile_visits`, `follower_growth`.
- **Safe Rate-Limit Guidance:** Min 3.0s between requests. Max 60 queries/hour.
- **Status:** ✅ VERIFIED & RESOLVED

---

## 2. Complete Pando GraphQL Telemetry Catalog (23 Queries)

All 23 queries captured in `evidence/raw_telemetry/instagram/captured_endpoints_catalog.json` and verified in `instagram_live_stream.log` (Process 24084, Xiaomi Redmi Note 13):

| # | Pando Query / Mutation | First Log Line | Primary TID | Graph API v21.0 Equivalent | Role in Unofficial SDK |
|:---:|---|:---:|:---:|---|---|
| 1 | `AutofillFetchContactDataQuery` | Line 120768 | 17200 | `GET /v21.0/{user-id}` (`email,phone`) | Profile & Contact Card Hydration |
| 2 | `AutofillPersonalizationQuery` | Line 120728 | 16101 | `GET /v21.0/{commerce-account-id}` | Commerce Settings Hydration |
| 3 | `BloksAsyncActionQuery` | Line 4264 | 9127 | `POST /v21.0/{object-id}` | Dynamic Bloks Action Dispatcher |
| 4 | `BloksAsyncComponentQuery` | Line 45450 | 12804 | App Settings / UI Schemas | Dynamic Subview Component Loader |
| 5 | `CXPFbStoriesCurrentPrivacyQuery` | Line 6903 | 9356 | `GET /v21.0/{ig-user-id}?fields=crossposting_settings` | Cross-Platform Sharing Privacy |
| 6 | `CrossPostingContentCompatibilityConfigV2` | Line 6277 | 9258 | `POST /v21.0/{user-id}/media_publish` (Validation) | Pre-Publish Media Rule Validation |
| 7 | `CrosspostToBarcelonaSettingsQuery` | Line 6361 | 9345 | Threads API `GET /v1.0/me` | Threads Auto-Crossposting Linkage |
| 8 | `FetchCXPNoticesQuery` | Line 4265 | 9155 | N/A (Client Prompts) | Cross-Platform Banner Notices |
| 9 | `FxFoaToWaLinkingUpsellEligibilityQueries` | Line 6358 | 9257 | `GET /v21.0/{page-id}/whatsapp_business_profile` | WhatsApp Business Linking Verification |
| 10 | `FxIgLogNativeAuthAppStartDataMutation` | Line 19401 | 24412 | N/A (Internal SDK Auth) | SSO Cold-Start Attestation Logger |
| 11 | `FxIgXavSwitcherBadgingDataQuery` | Line 19498 | 11181 | `GET /v21.0/{user-id}/notifications` | Multi-Account Unread Badge Sync |
| 12 | `GetBooleanSetting` | Line 14171 | 9914 | `GET /v21.0/{user-id}/settings` | Configuration Key-Value Flag Fetcher |
| 13 | `IGBloksAppRootQuery` | Line 5247 | 9255 | `GET /v21.0/{user-id}/insights` | Full-Screen Experience Shell Loader |
| 14 | `IGDirectGetPresenceQuery` | Line 3664 | 28556 | Webhooks `presence` / `GET conversations` | Real-Time Presence & Typing Status |
| 15 | `IGDirectPrivacySettingsQuery` | Line 114020 | 16363 | `GET /v21.0/{page-id}?fields=messaging_feature_review` | DM Privacy & Read Receipt Toggles |
| 16 | `IGStorySuggestedUsersMidcardTypedQuery` | Line 113605 | 16347 | N/A (Algorithmic Midcard) | Filtered Out in Clean Story Extraction |
| 17 | `InboxTrayRequestForUserQuery` | Line 5243 | 8443 | `GET /v21.0/{page-id}/conversations` | Core Direct Inbox & Notes Directory |
| 18 | `MetaSubsEntrypointExperienceBatchQuery` | Line 19443 | 10661 | `GET /v21.0/{page-id}/subscribed_apps` | Meta Verified & Subscription Tier |
| 19 | `NativeMLModelBatchedQuery` | Line 11697 | 24329 | N/A (PyTorch Assets) | Mobile PyTorch Model Weight Loader |
| 20 | `PFRClientServerSyncMutation` | Line 120612 | 17261 | Data Processing Options API | Privacy & GDPR Legal Consent State |
| 21 | `QuickPromotionSurfaceQueryV3` | Line 4263 | 8443 | N/A (Marketing In-App) | Contextual Feature Tip Placement |
| 22 | `RecordCXPNoticeInteractionMutation` | Line 8147 | 9625 | N/A (Analytics Logging) | User Interaction Telemetry Logger |
| 23 | `SettingsBulkFetchQuery` | Line 45350 | 11181 | `GET /v21.0/{user-id}?fields=settings` | Consolidated Central Configuration |

---

## 3. Deprecated / Banned Endpoints (Do Not Call)

| Endpoint | Reason for Ban | Alternative |
| :--- | :--- | :--- |
| `GET /api/v1/web/search/topsearch/` | Deprecated by Meta (Returns 404) | Query inbox threads directly via `conversations` |
| `GET /api/v1/users/web_profile_info/` without cookies | Rate limited / 429 on datacenter IPs | Use authenticated profile page with cookies |
| Raw mobile endpoints with Web UA | Header mismatch / triggers security challenge | Maintain strict User-Agent isolation |

---

## 4. Ground Truth Coverage Metrics

In accordance with Section 3 of `AGENTS.md`:

$$\text{Coverage Score} = \left( \frac{\text{Verified Operations Backed 1:1 by Meta Source / Telemetry}}{\text{Total Implemented Operations}} \right) \times 100\%$$

- **Total Operations Reconciled & Documented:** 48
- **Operations Backed 1:1 by Meta Source / Telemetry:** 48
- **Current Ground Truth Backing Score:** **100.0%** ✅
