# Evidence & Provenance Manifest (REA Standard)

This directory maintains captured network records, verified GraphQL schemas, hardware acceleration signatures, and REST response shapes observed under legitimate physical device and browser executions.

## Rules of Engagement:
1. **Zero Guesswork:** No endpoint or method is implemented into `src/` without an associated entry here.
2. **Provenance Linkage:** Every method in `src/instagram/` and `src/facebook/` cites the verified endpoint, required tokens, and behavior boundary.

---

## Physical Device Baseline (REA Gold Master):
- **Device Hardware:** Xiaomi Redmi Note 13 4G (`23129RAA4G`, codename `sapphire`, serial `1121b522`)
- **SoC & Architecture:** Qualcomm SM6225 (`ro.hardware=qcom`, 64-bit ARMv8.2-A)
- **GPU & Compositor HAL:** Qualcomm Adreno 610, SurfaceFlinger VSYNC @ 120Hz, 1080x2400 (440 DPI)
- **OS Build:** Android 15 (`AQ3A.240829.003`, Xiaomi HyperOS 2.0 `OS2.0.213.0.VNGMIXM` release-keys, API level 35)
- **Installed Target Package:** `com.instagram.android` v451.0.0.53.80 (version code: `385713116`, Play Store install)

---

## Verified Hardware Codec Signatures:
- `c2.qti.heic.encoder`: Qualcomm Hardware HEIC encoder for high-resolution Story photos.
- `c2.qti.hevc.encoder`: Qualcomm Hardware H.265 / HEVC encoder for 60fps Reels and video clips.
- `c2.qti.hevc.decoder`: Qualcomm Hardware H.265 decoder for Reels timeline rendering.
- `c2.qti.avc.decoder`: Qualcomm Hardware H.264 decoder for legacy feed media.
- `c2.android.aac.encoder`: High-fidelity stereo AAC audio encoder (44.1kHz, 128kbps).
- `c2.android.aac.decoder`: AAC audio decoder for Reel audio mixing.

---

## Verified REST Endpoints:
- `POST /api/v1/accounts/login/`: Native authentication with HMAC-SHA256 device-signed payload.
- `GET /api/v1/insights/account_overview/`: Professional Dashboard account-level reach, impressions, and follower growth.
- `GET /api/v1/insights/media_insights/`: Granular "View Insights" metrics for Posts, Reels, and Stories.
- `POST /rupload_igphoto/{upload_id}`: Binary image upload protocol with HEIC support.
- `POST /rupload_igvideo/{upload_id}`: Segmented video upload protocol with HEVC support.
- `POST /api/v1/media/configure/`: Feed post configuration with aspect-ratio enforcement.
- `POST /api/v1/media/configure_to_story/`: Story media configuration with font typography and interactive sticker overlays.
- `POST /api/v1/media/configure_to_clips/`: Reels configuration with audio cluster and sticky track binding.
- `GET /api/v1/direct_v2/inbox/`: Direct messaging inbox and thread summaries.
- `GET /api/v1/direct_v2/threads/{thread_id}/`: Full conversation history.
- `POST /api/v1/direct_v2/threads/broadcast/text/`: Direct message text broadcast.
- `POST /api/v1/direct_v2/threads/broadcast/media/`: Direct message media broadcast.
- `GET /api/v1/media/{media_id}/comments/`: Inbound comments retrieval.
- `GET /api/v1/news/inbox/?mark_as_read=false`: Notifications and story mentions intake.
- `POST https://www.facebook.com/api/graphql/`: Facebook Native post publisher.

---

## Verified Pando & Meta GraphQL Operations:
Observed directly during physical device interactive sessions across app sections:

### 1. Direct Messaging & Inbox
- `InboxTrayRequestForUserQuery`: Inbox tray metadata, active threads, and unread counts.
- `IGDirectGetPresenceQuery`: Real-time active presence indicator.
- `IGDirectPrivacySettingsQuery`: DM privacy settings and read receipt toggles.
- `IGDirectSearchInitiateWarmStartQuery`: Warm-start search cache prefetch.
- `IGPremiumReactionPackQuery`: Custom and animated emoji reaction packs.

### 2. Stories, Reels & Feed
- `IGStorySuggestedUsersMidcardTypedQuery`: Stories carousel suggested users midcard.
- `IGStoryAYPromptMidcardQuery`: Stories "Add Yours" prompt widget.
- `CXPFbStoriesCurrentPrivacyQuery`: Cross-platform Instagram/Facebook story sharing privacy.

### 3. Settings & Meta Bloks Framework
- `IGBloksAppRootQuery`: Primary Bloks UI tree hydration query.
- `BloksAsyncActionQuery`: Bloks server-driven action/button click resolver.
- `BloksAsyncComponentQuery`: Asynchronous Bloks dynamic component tree retrieval.
- `SettingsBulkFetchQuery`: Bulk retrieval of application settings and toggles.
- `GetBooleanSetting`: Granular boolean setting query.

### 4. Account Center & Cross-Account Identity
- `FxIgLogNativeAuthAppStartDataMutation`: Native Account Center authorization telemetry mutation.
- `FxIgXavSwitcherBadgingDataQuery`: Cross-Account View (XAV) badging.
- `FxFoaToWaLinkingUpsellEligibilityQueries`: Meta Family of Apps to WhatsApp linkage eligibility.
- `CrosspostToBarcelonaSettingsQuery`: Instagram to Threads (Barcelona) synchronization.
- `CrossPostingContentCompatibilityConfigV2`: Media cross-posting format compatibility rules.

### 5. Autofill, Compliance & On-Device ML
- `AutofillFetchContactDataQuery`: Autofill profile contact data resolver.
- `AutofillPersonalizationQuery`: Personalized autofill heuristics.
- `PFRClientServerSyncMutation`: Privacy and feature rule synchronization.
- `FetchCXPNoticesQuery`: Cross-platform account notices.
- `RecordCXPNoticeInteractionMutation`: User acknowledgment of cross-app privacy notices.
- `NativeMLModelBatchedQuery`: On-device ML model weights and capabilities fetch.
- `QuickPromotionSurfaceQueryV3`: In-app interstitials and announcements.
- `MetaSubsEntrypointExperienceBatchQuery`: Meta Verified subscription entrypoints.

---

## Real-Time Messaging & Protocol Subsystems:
- **MSync Modular Sync:** `ModularSyncService_rust_impl::service_ffi` handling real-time mailbox delta sync.
- **Direct Gateway Client (`mns:DGWClient`):** Multiplexed persistent binary RPC and WebSocket streaming.
- **Tigon Meta Network Stack (`mns:TigonMNS`):** Unified HTTP/2, HTTP/3, and QUIC transports with Fizzy TLS 1.3 (`MNSSecureTCP`).
- **Iris Sync Manager (`IrisSyncManager`):** Real-time subscription lifecycle.
- **OneFabric Telemetry:** Structured event telemetry (`ig_camera_apply_sticker`).
