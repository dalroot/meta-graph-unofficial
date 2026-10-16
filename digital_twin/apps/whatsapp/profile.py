"""
WhatsApp (Family of Apps Linking) Integration Profile.
"""

from typing import Dict, Any

WHATSAPP_LINKING_SPEC: Dict[str, Any] = {
    "package": "com.whatsapp",
    "integration_queries": [
        "FxFoaToWaLinkingUpsellEligibilityQueries"
    ],
    "capabilities": {
        "two_factor_auth_delivery": True,
        "direct_profile_link": True,
        "cross_app_communication": False
    }
}
