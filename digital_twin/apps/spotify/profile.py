"""
Spotify Media & Notes Audio Linking Integration Profile.
"""

from typing import Dict, Any

SPOTIFY_LINKING_SPEC: Dict[str, Any] = {
    "package": "com.spotify.music",
    "integration_queries": [
        "SpotifyAccountLinkingRequest"
    ],
    "capabilities": {
        "notes_audio_sharing": True,
        "story_music_attribution": True
    }
}
