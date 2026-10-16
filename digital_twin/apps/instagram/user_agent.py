"""
Instagram User-Agent and Header Signature Generator
Models Instagram version 451.0.0.53.80 on Xiaomi Redmi Note 13 4G (sapphire).
"""

from typing import Dict
from digital_twin.devices.xiaomi_redmi_note_13.spec import REDMI_NOTE_13_SPEC

INSTAGRAM_APP_VERSION = "451.0.0.53.80"
INSTAGRAM_VERSION_CODE = 385713116
CHROME_WEBVIEW_VERSION = "155.0.8059.43"

def build_instagram_app_user_agent() -> str:
    """
    Format:
    Instagram {app_version} Android ({sdk}/{os}; {dpi}dpi; {res}; {mfr}; {model}; {dev}; {cpu}; {loc}; {vcode})
    """
    spec = REDMI_NOTE_13_SPEC
    ident = spec["device_identity"]
    os_info = spec["os_and_firmware"]
    disp = spec["display"]

    return (
        f"Instagram {INSTAGRAM_APP_VERSION} Android "
        f"({os_info['sdk_int']}/{os_info['android_version']}; {disp['density_dpi']}dpi; "
        f"{disp['width_px']}x{disp['height_px']}; {ident['manufacturer']}; {ident['model']}; "
        f"{ident['device_code']}; {ident['hardware']}; {os_info['locale'].replace('-', '_')}; {INSTAGRAM_VERSION_CODE})"
    )

def build_instagram_webview_user_agent() -> str:
    """
    Format:
    Mozilla/5.0 (Linux; Android {os}; {model} Build/{build_id}; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/{chrome_ver} Mobile Safari/537.36 {app_ua}
    """
    spec = REDMI_NOTE_13_SPEC
    ident = spec["device_identity"]
    os_info = spec["os_and_firmware"]
    app_ua = build_instagram_app_user_agent()

    return (
        f"Mozilla/5.0 (Linux; Android {os_info['android_version']}; {ident['model']} Build/{os_info['build_id']}; wv) "
        f"AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/{CHROME_WEBVIEW_VERSION} Mobile Safari/537.36 "
        f"{app_ua}"
    )

def get_instagram_client_headers() -> Dict[str, str]:
    """Generates authentic HTTP request headers for Instagram Android client."""
    return {
        "User-Agent": build_instagram_app_user_agent(),
        "X-IG-App-ID": "385713116",
        "X-IG-Capabilities": "3brTvw==",
        "X-IG-App-Locale": "en_US",
        "X-IG-Device-Locale": "en_US",
        "X-IG-Mapped-Locale": "en_US",
        "X-IG-Connection-Type": "WIFI",
        "X-IG-Bandwidth-Speed-KBPS": "12500",
        "X-IG-Bandwidth-TotalBytes-B": "35000000",
        "X-IG-Bandwidth-TotalTime-MS": "2800",
        "X-FB-HTTP-Engine": "Liger",
        "X-FB-Client-IP": "True",
        "X-FB-Server-Cluster": "True",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive"
    }
