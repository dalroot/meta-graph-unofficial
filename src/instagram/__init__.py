"""
Instagram Client Modules Package
Synthesized from Physical Device REA Observations (Xiaomi Redmi Note 13, Device 1121b522).
"""

from src.instagram.insights import (
    InstagramInsightsClient,
    PostReelInsights,
    AccountOverviewInsights,
    MediaMetricBreakdown
)
from src.instagram.media import (
    InstagramMediaClient,
    StoryTextOverlay,
    InteractiveSticker,
    MediaCodecMetadata,
    FontType
)
from src.instagram.direct import (
    InstagramDirectClient,
    DirectMessage,
    DirectPresence,
    MSyncState
)
from src.instagram.auth import (
    InstagramAuthClient,
    DeviceFingerprint,
    AuthSession
)

__all__ = [
    "InstagramInsightsClient",
    "PostReelInsights",
    "AccountOverviewInsights",
    "MediaMetricBreakdown",
    "InstagramMediaClient",
    "StoryTextOverlay",
    "InteractiveSticker",
    "MediaCodecMetadata",
    "FontType",
    "InstagramDirectClient",
    "DirectMessage",
    "DirectPresence",
    "MSyncState",
    "InstagramAuthClient",
    "DeviceFingerprint",
    "AuthSession"
]
