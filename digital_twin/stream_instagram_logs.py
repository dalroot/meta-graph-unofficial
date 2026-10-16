#!/usr/bin/env python3
"""
Ultra-High-Throughput Raw ADB Streamer for Instagram Telemetry & Media Composer
Optimized for ZERO DROPS, direct-to-disk write, minimal CPU overhead.
"""

import os
import sys
import time
import signal
import subprocess
import argparse

DEFAULT_DEVICE = "1121b522"
DEFAULT_STREAM_LOG = "/home/hokar/Documents/antigravity/meta-graph-unofficial/evidence/raw_telemetry/instagram_live_stream.log"
DEFAULT_COMPOSER_LOG = "/home/hokar/Documents/antigravity/meta-graph-unofficial/evidence/raw_telemetry/media_composer_creation.log"
INSTAGRAM_PACKAGE = "com.instagram.android"
INSTAGRAM_UID = "10324"

# Fast lookup set of allowed tags
ALLOWED_TAGS = {
    "liger", "mqtt", "mqtt-mini", "fbhttp", "instagram", "graphql", "banzai",
    "appops", "msys", "msync", "tigonmns", "tigon", "dgwclient", "irissyncmanager",
    "onefabric", "onefabriceventhandler", "proxygen", "fbdna", "lacrima",
    "idlequeuepayloadbasedservicelayer", "stagram.android", "ighttpdatasource",
    "cachemanager_default", "fbnsaidlclientmanager", "soft_error.cpp",
    "pando", "bloks", "falco", "flipper", "fblite", "fb_analytics",
    "storieseditor", "creationmedia", "storyoverlay", "storytext", "clips", "camera",
    "rupload", "igfilterengine", "igvideoplayer", "mediaconfigure", "cameracore",
    "optic", "audiotrackimpl", "mediacodec", "ccodec", "ccodecbufferchannel",
    "ccodecconfig", "inputmethodmanager", "hwui", "backinterceptedittext",
    "igautocompletetextview", "miuiinput", "texttool", "stickertool", "modalactivity",
    "clipscreation", "storydraft", "analytics2", "qpl", "eventlog",
    "quickperformancelogger", "insights", "navigationtracker", "slowappcomponent"
}

# Substring keywords for composer/creation routing (fast string check)
COMPOSER_KEYWORDS = (
    "modalactivity", "storieseditor", "creationmedia", "storyoverlay",
    "storytext", "clips", "camera", "rupload", "igfilterengine",
    "igvideoplayer", "mediaconfigure", "cameracore", "optic", "caption_input",
    "search_edit_text", "igautocompletetextview", "backinterceptedittext",
    "mediacodec", "ccodec", "hevc", "audiotrackimpl", "banzai", "analytics2",
    "qpl", "eventlog", "quickperformancelogger", "insights", "motioninput",
    "miuiinput", "softinput", "font", "sticker", "overlay", "draft", "bloks"
)

# Fast privacy blacklist substring checks
PRIVACY_BLACKLIST = (
    "com.google.android.apps.messaging",
    "com.android.mms",
    "com.android.contacts",
    "com.google.android.contacts",
    "org.telegram.messenger",
    "com.whatsapp",
    "com.viber.voip",
    "org.signal.messenger",
    "sms_provider",
    "mms_provider",
    "password",
    "passwd",
    "credit_card",
    "bank_account"
)

SPAM_NOISE = ("mi-sf", "surfaceflinger", "previewdisappear")

def main():
    parser = argparse.ArgumentParser(description="Ultra-Fast Raw ADB Streamer")
    parser.add_argument("--device", default=DEFAULT_DEVICE)
    parser.add_argument("--stream-log", default=DEFAULT_STREAM_LOG)
    parser.add_argument("--composer-log", default=DEFAULT_COMPOSER_LOG)
    args = parser.parse_args()

    os.makedirs(os.path.dirname(args.stream_log), exist_ok=True)
    os.makedirs(os.path.dirname(args.composer_log), exist_ok=True)

    stream_out = open(args.stream_log, "a", encoding="utf-8", buffering=65536)
    composer_out = open(args.composer_log, "a", encoding="utf-8", buffering=65536)

    instagram_pids = set()

    def refresh_pids():
        try:
            res = subprocess.run(["adb", "-s", args.device, "shell", "ps -A -o PID,NAME"],
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=3)
            if res.returncode == 0:
                for line in res.stdout.splitlines():
                    if INSTAGRAM_PACKAGE in line:
                        parts = line.strip().split()
                        if parts and parts[0].isdigit():
                            instagram_pids.add(int(parts[0]))
        except Exception:
            pass

    refresh_pids()
    print(f"[*] RAW Streamer started on device {args.device}")
    print(f"[*] Initial Instagram PIDs: {instagram_pids}")
    print(f"[*] Output 1: {args.stream_log}")
    print(f"[*] Output 2: {args.composer_log}")

    cmd = ["adb", "-s", args.device, "logcat", "-v", "threadtime"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=65536)

    running = True
    def stop(sig, frame):
        nonlocal running
        running = False

    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)

    total_stream_lines = 0
    total_composer_lines = 0
    last_pid_refresh = time.time()
    last_flush = time.time()

    try:
        while running and proc.poll() is None:
            line = proc.stdout.readline()
            if not line:
                time.sleep(0.005)
                continue

            lower_line = line.lower()

            # Fast privacy check
            if any(b in lower_line for b in PRIVACY_BLACKLIST):
                continue

            # Check PID and tag
            is_relevant = False
            parts = line.split(maxsplit=5)
            if len(parts) >= 6 and parts[2].isdigit():
                pid = int(parts[2])
                tag = parts[5].split(":", 1)[0].strip().lower().rstrip(":")

                if tag in SPAM_NOISE:
                    continue

                if pid in instagram_pids:
                    is_relevant = True
                elif tag in ALLOWED_TAGS:
                    if tag == "appops":
                        is_relevant = (INSTAGRAM_PACKAGE in line or INSTAGRAM_UID in line)
                    else:
                        is_relevant = True
            elif INSTAGRAM_PACKAGE in line:
                if not any(noise in lower_line for noise in SPAM_NOISE):
                    is_relevant = True

            # Dynamic PID detection from proc start
            if "com.instagram.android" in line and ("am_proc_start:" in line or "start proc " in lower_line):
                is_relevant = True
                if len(parts) >= 6 and parts[2].isdigit():
                    instagram_pids.add(int(parts[2]))

            if is_relevant:
                stream_out.write(line)
                total_stream_lines += 1

                if any(kw in lower_line for kw in COMPOSER_KEYWORDS):
                    composer_out.write(line)
                    total_composer_lines += 1

            now = time.time()
            if now - last_flush > 2.0:
                stream_out.flush()
                composer_out.flush()
                last_flush = now

            if now - last_pid_refresh > 4.0:
                refresh_pids()
                last_pid_refresh = now

    finally:
        proc.terminate()
        try: proc.wait(timeout=1)
        except Exception: proc.kill()
        stream_out.flush(); stream_out.close()
        composer_out.flush(); composer_out.close()
        print(f"[*] Stream closed cleanly. Stream lines: {total_stream_lines}, Composer lines: {total_composer_lines}")

if __name__ == "__main__":
    main()
