"""
Digital Twin Engine for MetaGraph Unofficial
Provides comprehensive hardware cloning, dynamic OS telemetry,
and anti-ban signal synthesis based on real physical device observations.
"""

from digital_twin.profile import DeviceProfile
from digital_twin.signals import SignalSimulator
from digital_twin.headers import HeaderFactory
from digital_twin.attestation import AttestationEngine

class DigitalTwin:
    def __init__(self, profile_file=None):
        self.profile = DeviceProfile()
        self.simulator = SignalSimulator()
        self.headers = HeaderFactory(self.profile, self.simulator)
        self.attestation = AttestationEngine(self.profile, self.simulator)

    @property
    def identity(self) -> str:
        return f"{self.profile.manufacturer} {self.profile.model} ({self.profile.brand}) - Android {self.profile.android_release}"

    def get_headers(self, auth_token: str = ""):
        return self.headers.get_mobile_api_headers(auth_token)

    def get_web_headers(self, csrf_token: str = "", cookie_string: str = ""):
        return self.headers.get_web_api_headers(csrf_token, cookie_string)

    def get_device_identifiers(self):
        return self.attestation.get_device_identifiers()

    def get_live_signals(self):
        return {
            "battery": self.simulator.get_battery_signal(),
            "sensors": self.simulator.get_sensor_jitter(),
            "network": self.simulator.get_network_telemetry(),
            "memory": self.simulator.get_memory_telemetry()
        }

    def sleep_human(self, min_sec: float = 1.8, max_sec: float = 4.2):
        return self.simulator.human_delay(min_sec, max_sec)

__all__ = [
    "DigitalTwin",
    "DeviceProfile",
    "SignalSimulator",
    "HeaderFactory",
    "AttestationEngine"
]
