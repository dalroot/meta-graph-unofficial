"""
Digital Twin Profile Module
Provides structured, validated hardware, OS, and application profiles
derived from physical device REA observations.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional

DEFAULT_CLONE_FILE = Path(__file__).resolve().parent.parent / "evidence" / "raw_device_clone" / "digital_twin_full_clone.json"

class DeviceProfile:
    def __init__(self, data: Optional[Dict[str, Any]] = None):
        if data is None:
            if DEFAULT_CLONE_FILE.exists():
                with open(DEFAULT_CLONE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
            else:
                data = {}
        self.raw_data = data
        self.hardware = data.get("device_hardware", {})
        self.os = data.get("os_build", {})
        self.display = data.get("display_metrics", {})
        self.apps = data.get("app_ecosystem", {})
        self.signatures = data.get("reconstructed_headers", {})

    @property
    def brand(self) -> str:
        return self.hardware.get("brand", "Redmi")

    @property
    def manufacturer(self) -> str:
        return self.hardware.get("manufacturer", "Xiaomi")

    @property
    def model(self) -> str:
        return self.hardware.get("model", "23129RAA4G")

    @property
    def device_code(self) -> str:
        return self.hardware.get("device_code", "sapphire")

    @property
    def chipset(self) -> str:
        return self.hardware.get("chipset", "qcom")

    @property
    def soc_model(self) -> str:
        return self.hardware.get("soc_model", "SM6225")

    @property
    def android_id(self) -> str:
        return self.hardware.get("android_id", "556f8db9eada6d9c")

    @property
    def gpu_renderer(self) -> str:
        return self.hardware.get("gpu_renderer", "Adreno (TM) 610")

    @property
    def opengles_version(self) -> str:
        return self.hardware.get("opengles_version", "OpenGL ES 3.2 V@0615.91")

    @property
    def android_release(self) -> str:
        return str(self.os.get("release", "15"))

    @property
    def sdk_int(self) -> int:
        return int(self.os.get("sdk_int", 35))

    @property
    def build_fingerprint(self) -> str:
        return self.os.get("fingerprint", "Redmi/sapphire_global/sapphire:15/AQ3A.240829.003/OS2.0.213.0.VNGMIXM:user/release-keys")

    @property
    def timezone(self) -> str:
        return self.os.get("timezone", "Asia/Tehran")

    @property
    def locale(self) -> str:
        return self.os.get("locale", "en-US")

    @property
    def density_dpi(self) -> int:
        return int(self.display.get("density_dpi", 440))

    @property
    def resolution_str(self) -> str:
        w = self.display.get("width", 1080)
        h = self.display.get("height", 2400)
        return f"{w}x{h}"

    @property
    def instagram_version(self) -> str:
        return self.apps.get("instagram", {}).get("version_name", "451.0.0.53.80")

    @property
    def version_code(self) -> int:
        return int(self.apps.get("instagram", {}).get("version_code", 385713116))

    def get_app_user_agent(self) -> str:
        # Strict REA APK Signature:
        # Instagram {ver} Android ({sdk}/{os}; {dpi}dpi; {res}; {mfr}; {model}; {dev}; {cpu}; {loc}; {vcode})
        return (
            f"Instagram {self.instagram_version} Android "
            f"({self.sdk_int}/{self.android_release}; {self.density_dpi}dpi; {self.resolution_str}; "
            f"{self.manufacturer}; {self.model}; {self.device_code}; {self.chipset}; {self.locale}; {self.version_code})"
        )

    def get_webview_user_agent(self) -> str:
        wv_ver = self.apps.get("webview", {}).get("version_name", "155.0.8059.43")
        build_id = self.os.get("build_id", "AQ3A.240829.003")
        return (
            f"Mozilla/5.0 (Linux; Android {self.android_release}; {self.model} Build/{build_id}; wv) "
            f"AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/{wv_ver} Mobile Safari/537.36 "
            f"{self.get_app_user_agent()}"
        )
