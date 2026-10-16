"""
Threads (Codename: Barcelona) Cross-Posting and Synchronization Profile.
Observed via Meta Family of Apps linking queries.
"""

from typing import Dict, Any

THREADS_INTEGRATION_SPEC: Dict[str, Any] = {
    "codename": "barcelona",
    "package": "com.instagram.barcelona",
    "integration_queries": [
        "CrosspostToBarcelonaSettingsQuery",
        "CrossPostingContentCompatibilityConfigV2",
        "CrosspostingUnifiedConfigsQuery"
    ],
    "capabilities": {
        "auto_share_posts": True,
        "rich_text_compatibility": True,
        "fediverse_sharing": False
    }
}
