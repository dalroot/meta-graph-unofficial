"""
Android OS Signals & Telemetry Simulation Engine
Simulates dynamic physical device loops: battery curve, sensor jitter,
network telemetry, memory subsystem fluctuations, and human touch intervals.
"""

import time
import math
import random
from typing import Dict, Any

class SignalSimulator:
    def __init__(self, initial_battery: int = 82):
        self._start_time = time.time()
        self._initial_battery = initial_battery
        self._step_counter = 4210
        self._connection_type = "WIFI"

    def get_battery_signal(self) -> Dict[str, Any]:
        """
        Simulates natural Android battery discharge over active session time.
        """
        elapsed_hours = (time.time() - self._start_time) / 3600.0
        discharge = int(elapsed_hours * 6.0) # ~6% per hour of screen-on usage
        current_level = max(5, self._initial_battery - discharge)
        
        # Temperature fluctuates between 29.5C and 34.0C depending on load
        temp_c = round(31.2 + 2.0 * math.sin(time.time() / 120.0) + random.uniform(-0.3, 0.4), 1)
        
        return {
            "level": current_level,
            "scale": 100,
            "status": 3, # BatteryManager.BATTERY_STATUS_DISCHARGING
            "health": 2, # BatteryManager.BATTERY_HEALTH_GOOD
            "temperature_c": temp_c,
            "voltage_mv": 3950 - (100 - current_level) * 4,
            "technology": "Li-poly"
        }

    def get_sensor_jitter(self) -> Dict[str, Any]:
        """
        Simulates authentic physical IMU micro-tremors (accelerometer + gyro)
        characteristic of a human holding a smartphone.
        """
        t = time.time()
        # Gravity baseline around ~9.8 m/s^2 on Z-axis with tilt
        accel_x = round(0.15 * math.sin(t * 1.5) + random.gauss(0, 0.04), 4)
        accel_y = round(4.82 + 0.25 * math.cos(t * 1.2) + random.gauss(0, 0.05), 4)
        accel_z = round(8.41 + 0.20 * math.sin(t * 0.9) + random.gauss(0, 0.06), 4)
        
        # Gyro angular velocity in rad/s
        gyro_x = round(random.gauss(0, 0.008), 5)
        gyro_y = round(random.gauss(0, 0.008), 5)
        gyro_z = round(random.gauss(0, 0.006), 5)

        # Ambient light sensor (indoor room 120 - 350 lux)
        light_lux = round(210.0 + 35.0 * math.sin(t / 60.0) + random.uniform(-10, 10), 1)

        return {
            "accelerometer": {"x": accel_x, "y": accel_y, "z": accel_z},
            "gyroscope": {"x": gyro_x, "y": gyro_y, "z": gyro_z},
            "light_lux": light_lux,
            "step_count": self._step_counter + int((time.time() - self._start_time) / 45.0)
        }

    def get_network_telemetry(self) -> Dict[str, Any]:
        """
        Simulates authentic network signal metrics (RSSI, bandwidth, latency).
        """
        # Realistic WiFi 5GHz link speed & RSSI in dBm
        rssi = int(-52 + 4 * math.sin(time.time() / 30.0) + random.uniform(-2, 2))
        downstream_kbps = int(random.uniform(45000, 85000)) # 45 - 85 Mbps
        upstream_kbps = int(random.uniform(18000, 32000))
        rtt_ms = int(random.gauss(38, 5))

        return {
            "network_type": self._connection_type,
            "wifi_rssi_dbm": rssi,
            "link_speed_mbps": 433, # 802.11ac 1x1
            "downstream_kbps": downstream_kbps,
            "upstream_kbps": upstream_kbps,
            "rtt_ms": max(15, rtt_ms)
        }

    def get_memory_telemetry(self, total_ram_mb: int = 8192) -> Dict[str, Any]:
        """
        Calculates realistic Dalvik & native memory footprint for Android 15.
        """
        t = time.time()
        used_mb = int(3800 + 400 * math.sin(t / 180.0) + random.uniform(-80, 120))
        free_mb = total_ram_mb - used_mb

        return {
            "total_ram_mb": total_ram_mb,
            "available_ram_mb": free_mb,
            "threshold_mb": 512,
            "low_memory": False,
            "instagram_dalvik_heap_mb": round(random.uniform(95.0, 145.0), 1),
            "instagram_native_heap_mb": round(random.uniform(160.0, 240.0), 1)
        }

    @staticmethod
    def human_delay(min_sec: float = 1.8, max_sec: float = 4.2):
        """
        Performs natural Gaussian-distributed delay mimicking human cognitive pause.
        """
        mean = (min_sec + max_sec) / 2.0
        sigma = (max_sec - min_sec) / 4.0
        delay = random.gauss(mean, sigma)
        delay = max(min_sec, min(delay, max_sec))
        time.sleep(delay)
        return delay
