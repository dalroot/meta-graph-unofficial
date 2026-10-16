"""
Hardware and Operating System Specification for Xiaomi Redmi Note 13 4G (sapphire).
Derived from physical REA device extraction (serial: 1121b522).
"""

from typing import Dict, Any

REDMI_NOTE_13_SPEC: Dict[str, Any] = {
    "device_identity": {
        "manufacturer": "Xiaomi",
        "brand": "Redmi",
        "model": "23129RAA4G",
        "product": "missi",
        "device_code": "sapphire",
        "board": "bengal",
        "platform": "bengal",
        "hardware": "qcom",
        "android_id": "556f8db9eada6d9c"
    },
    "soc_and_cpu": {
        "chipset": "Qualcomm Technologies, Inc SM6225",
        "soc_model": "SM6225",
        "marketing_name": "Snapdragon 685 (6nm)",
        "abi": "arm64-v8a",
        "supported_abis": ["arm64-v8a", "armeabi-v7a", "armeabi"],
        "core_count": 8,
        "clusters": [
            {"cores": 4, "type": "performance", "arch": "Cortex-A73", "max_freq_khz": 2803200},
            {"cores": 4, "type": "efficiency", "arch": "Cortex-A53", "max_freq_khz": 1900800}
        ]
    },
    "gpu_and_graphics": {
        "renderer": "Adreno (TM) 610",
        "vendor": "Qualcomm",
        "version": "OpenGL ES 3.2 V@0615.91 (GIT@4207aebe73, I7bf89f36f2, 1721644728) (Date:07/22/24)",
        "egl_vendor": "Qualcomm",
        "egl_version": "1.5 Qualcomm EGL",
        "vulkan_supported": True,
        "vulkan_version": "1.1.128"
    },
    "display": {
        "width_px": 1080,
        "height_px": 2400,
        "refresh_rate_hz": 120.0,
        "density_dpi": 440,
        "xdpi": 396.0,
        "ydpi": 395.0,
        "hdr_supported": False,
        "screen_layout": "normal-long-notround"
    },
    "os_and_firmware": {
        "android_version": "15",
        "sdk_int": 35,
        "preview_sdk": 0,
        "build_id": "AQ3A.240829.003",
        "miui_version": "OS2.0.213.0.VNGMIXM",
        "hyperos_version": "2.0",
        "build_flavor": "missi-user",
        "build_type": "user",
        "build_tags": "release-keys",
        "security_patch": "2026-08-01",
        "fingerprint": "Redmi/sapphire_global/sapphire:15/AQ3A.240829.003/OS2.0.213.0.VNGMIXM:user/release-keys",
        "kernel_version": "Linux version 7.0.0-generic (builder@pangu) (clang 19.0.2) #1 SMP PREEMPT Wed Sep 9 20:17:06 CST 2026",
        "timezone": "Asia/Tehran",
        "locale": "en-US"
    },
    "hardware_codecs": {
        "video_encoders": ["c2.qti.hevc.encoder", "c2.qti.avc.encoder"],
        "video_decoders": ["c2.qti.hevc.decoder", "c2.qti.avc.decoder", "c2.qti.vp9.decoder"],
        "image_encoders": ["c2.qti.heic.encoder"],
        "audio_codecs": ["c2.android.aac.encoder", "c2.android.aac.decoder", "c2.android.opus.encoder"]
    },
    "biometrics_and_sensors": {
        "fod_fingerprint": True,
        "fod_location": "low",
        "sensors": ["bmi26x_acc", "bmi26x_gyro", "stk3399_alsps", "mmc5603_mag"]
    }
}
