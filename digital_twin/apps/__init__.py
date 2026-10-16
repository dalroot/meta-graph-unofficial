"""Apps subpackage for Digital Twin."""
from .instagram.user_agent import build_instagram_app_user_agent, build_instagram_webview_user_agent, get_instagram_client_headers
from .instagram.graphql_catalog import INSTAGRAM_GRAPHQL_OPERATIONS
from .instagram.composer_codecs import INSTAGRAM_MEDIA_COMPOSER_SPEC
from .threads.profile import THREADS_INTEGRATION_SPEC
from .facebook.profile import FACEBOOK_INTEGRATION_SPEC
from .whatsapp.profile import WHATSAPP_LINKING_SPEC
from .spotify.profile import SPOTIFY_LINKING_SPEC

__all__ = [
    "build_instagram_app_user_agent",
    "build_instagram_webview_user_agent",
    "get_instagram_client_headers",
    "INSTAGRAM_GRAPHQL_OPERATIONS",
    "INSTAGRAM_MEDIA_COMPOSER_SPEC",
    "THREADS_INTEGRATION_SPEC",
    "FACEBOOK_INTEGRATION_SPEC",
    "WHATSAPP_LINKING_SPEC",
    "SPOTIFY_LINKING_SPEC"
]
