# Xiaomi Redmi Note 13 4G (sapphire) - Digital Twin Device Spec

This directory contains the physical REA reverse-engineered model of the Xiaomi Redmi Note 13 4G (`23129RAA4G`).

## Hardware Specifications
- **Model:** `23129RAA4G` (Marketed as Redmi Note 13 4G)
- **Board / Platform:** `bengal`
- **SoC:** Qualcomm SM6225 (Snapdragon 685, 6nm, 8-Core Kryo)
- **GPU:** Qualcomm Adreno 610 (OpenGL ES 3.2 V@0615.91)
- **Display:** 1080x2400 AMOLED @ 120Hz, 440 DPI
- **RAM / Storage:** 8GB LPDDR4X, 256GB UFS 2.2
- **Biometrics:** Optical In-display Fingerprint Sensor (`fod=true`, `location=low`)

## Firmware & OS Identity
- **Android Version:** Android 15 (API 35)
- **Build ID:** `AQ3A.240829.003`
- **HyperOS Version:** `OS2.0.213.0.VNGMIXM` (Release Keys)
- **Fingerprint:** `Redmi/sapphire_global/sapphire:15/AQ3A.240829.003/OS2.0.213.0.VNGMIXM:user/release-keys`
- **Security Patch:** `2026-08-01`
- **Hardware Android ID:** `556f8db9eada6d9c`

## Raw Evidence Linkage
- Hardware Properties: `evidence/raw_telemetry/hardware_system/system_layers_snapshot.txt`
- AppOps Policy: `evidence/raw_telemetry/hardware_system/dumpsys_appops.txt`
- Sensor & Window HAL: `evidence/raw_telemetry/hardware_system/dumpsys_sensorservice.txt` & `dumpsys_window.txt`
