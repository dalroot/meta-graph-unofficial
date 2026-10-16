"""
Catalog of Reverse-Engineered GraphQL & Pando Operations for Instagram Android.
Observed via live telemetry stream on Redmi Note 13 4G (161,800+ lines).
"""

from typing import Dict, List, Any

INSTAGRAM_GRAPHQL_OPERATIONS: Dict[str, Dict[str, Any]] = {
    # Direct & Messaging
    "InboxTrayRequestForUserQuery": {
        "domain": "direct_messaging",
        "description": "Fetches user direct message inbox threads, stories tray, and pinned conversations.",
        "transport": "PandoGraphQLHybrid / TigonMNS"
    },
    "IGDirectPrivacySettingsQuery": {
        "domain": "direct_messaging",
        "description": "Reads message delivery preferences, read receipt status, and who can message you.",
        "transport": "PandoGraphQLHybrid"
    },
    "IGDirectSearchInitiateWarmStartQuery": {
        "domain": "direct_messaging",
        "description": "Warms client-side search cache for frequent direct recipients.",
        "transport": "PandoGraphQLHybrid"
    },
    "IGDirectGetPresenceQuery": {
        "domain": "direct_messaging",
        "description": "Fetches active now / last active status of direct contacts.",
        "transport": "IrisSyncManager / DGWClient"
    },
    "IGPremiumReactionPackQuery": {
        "domain": "direct_messaging",
        "description": "Returns interactive emoji reaction packs for messages.",
        "transport": "PandoGraphQLHybrid"
    },

    # Stories & Reels
    "IGStorySuggestedUsersMidcardTypedQuery": {
        "domain": "stories_and_feed",
        "description": "Retrieves suggested accounts between story cards.",
        "transport": "PandoGraphQLHybrid"
    },
    "IGStoryAYPromptMidcardQuery": {
        "domain": "stories_and_feed",
        "description": "Interactive question/poll prompts in stories.",
        "transport": "PandoGraphQLHybrid"
    },
    "CXPFbStoriesCurrentPrivacyQuery": {
        "domain": "cross_posting",
        "description": "Checks Facebook Story auto-share sync eligibility and current privacy settings.",
        "transport": "PandoGraphQLHybrid"
    },

    # Bloks UI & Settings
    "IGBloksAppRootQuery": {
        "domain": "bloks_ui",
        "description": "Primary server-driven UI tree hydration query for Settings and Account Center.",
        "transport": "PandoGraphQLHybrid"
    },
    "SettingsAPIGetScreenDependencies": {
        "domain": "settings",
        "description": "Resolves dependency graph for dynamic settings screens.",
        "transport": "PandoGraphQLHybrid"
    },
    "BloksAsyncActionQuery": {
        "domain": "bloks_ui",
        "description": "Executes asynchronous server-driven actions triggered by button clicks and toggles.",
        "transport": "PandoGraphQLHybrid / TigonMNS"
    },
    "SettingsBulkFetchQuery": {
        "domain": "settings",
        "description": "Bulk fetches account settings, security toggles, and notification preferences.",
        "transport": "PandoGraphQLHybrid"
    },
    "GetBooleanSetting": {
        "domain": "settings",
        "description": "Reads specific boolean toggle state in account preferences.",
        "transport": "PandoGraphQLHybrid"
    },

    # Insights & Analytics
    "TypeaheadPopularKeywordsCacheRefreshQuery": {
        "domain": "explore_search",
        "description": "Refreshes explore trending keywords cache.",
        "transport": "PandoGraphQLHybrid"
    },
    "NativeMLModelBatchedQuery": {
        "domain": "on_device_ml",
        "description": "Downloads and executes on-device machine learning models for feed ranking.",
        "transport": "PandoGraphQLHybrid"
    },
    "QuickPromotionSurfaceQueryV3": {
        "domain": "interstitials",
        "description": "In-app interstitials, security notices, and feature announcements.",
        "transport": "PandoGraphQLHybrid"
    }
}
