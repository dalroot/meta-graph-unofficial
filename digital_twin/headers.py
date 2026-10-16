"""
Instagram Client Header Generation Engine
Builds mathematically coherent request headers conforming to official Android app specifications.
"""

import random
from typing import Dict
from digital_twin.profile import DeviceProfile
from digital_twin.signals import SignalSimulator

class HeaderFactory:
    def __init__(self, profile: DeviceProfile, simulator: SignalSimulator):
        self.profile = profile
        self.simulator = simulator
        self.total_bytes_transferred = 1845000

    def get_mobile_api_headers(self, authorization_token: str = "") -> Dict[str, str]:
        net = self.simulator.get_network_telemetry()
        self.total_bytes_transferred += random.randint(2500, 18000)

        headers = {
            "User-Agent": self.profile.get_app_user_agent(),
            "X-IG-App-ID": "1217981644879628",
            "X-IG-Capabilities": "3brTv10=", # Modern 64-bit video & reels capability mask
            "X-IG-App-Locale": self.profile.locale,
            "X-IG-Device-Locale": self.profile.locale,
            "X-IG-Mapped-Locale": self.profile.locale,
            "X-IG-Connection-Type": net["network_type"],
            "X-IG-Connection-Speed": f"{net['downstream_kbps']}kbps",
            "X-IG-Bandwidth-Speed-KBPS": f"{net['downstream_kbps']:.3f}",
            "X-IG-Bandwidth-TotalBytes-B": str(self.total_bytes_transferred),
            "X-IG-Bandwidth-TotalTime-MS": str(int(self.total_bytes_transferred / (net["downstream_kbps"] / 8.0))),
            "X-IG-Android-ID": self.profile.android_id,
            "X-FB-HTTP-Engine": "Liger",
            "X-FB-Client-IP": "True",
            "X-FB-Server-Cluster": "True",
            "Accept-Language": f"{self.profile.locale},en;q=0.9",
            "Accept-Encoding": "gzip, deflate, zstd",
            "Connection": "keep-alive"
        }

        if authorization_token:
            headers["Authorization"] = authorization_token

        return headers

    def get_web_api_headers(self, csrf_token: str = "", cookie_string: str = "") -> Dict[str, str]:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/130.0.0.0 Safari/537.36"
            ),
            "X-IG-App-ID": "936619743392459",
            "X-ASBD-ID": "129477",
            "Sec-CH-UA": "\"Chromium\";v=\"130\", \"Google Chrome\";v=\"130\", \"Not?A_Brand\";v=\"99\"",
            "Sec-CH-UA-Mobile": "?0",
            "Sec-CH-UA-Platform": "\"Linux\"",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Dest": "empty",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9,fa;q=0.8",
            "Origin": "https://www.instagram.com",
            "Referer": "https://www.instagram.com/",
        }
        if csrf_token:
            headers["X-CSRFToken"] = csrf_token
        if cookie_string:
            headers["Cookie"] = cookie_string
        return headers
