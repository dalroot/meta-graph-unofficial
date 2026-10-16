"""
Facebook Cross-App Synchronization & Native Publishing Profile.
"""

from typing import Dict, Any

FACEBOOK_INTEGRATION_SPEC: Dict[str, Any] = {
    "package": "com.facebook.katana",
    "integration_queries": [
        "CXPFbStoriesCurrentPrivacyQuery",
        "XAVSwitcherFetchFBNTAEligibilityQuery",
        "FetchCXPNoticesQuery",
        "RecordCXPNoticeInteractionMutation"
    ],
    "native_graphql_endpoint": "https://www.facebook.com/api/graphql/",
    "capabilities": {
        "story_cross_sharing": True,
        "page_publishing": True,
        "unified_account_center": True
    }
}
