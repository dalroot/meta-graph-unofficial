"""
Media Inspector Utility
Extracts clean, signed direct CDN URLs for Instagram Reels, Posts, and general web media
without breaking signed parameters.
"""

import re
import json
from curl_cffi import requests

def extract_instagram_reel_mp4(reel_url):
    try:
        # Match shortcode from reel/p URL
        match = re.search(r"/(?:reel|reels|p)/([A-Za-z0-9_-]+)", reel_url)
        if not match:
            return None
        shortcode = match.group(1)

        headers = {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }
        res = requests.get(f"https://www.instagram.com/reel/{shortcode}/", headers=headers, impersonate="chrome120", timeout=15)
        if res.status_code != 200:
            return None

        # Extract direct clean signed MP4 URL
        block = re.search(r"\"video_versions\":\[\{.*?\"url\":\"([^\"]+)\"", res.text)
        if block:
            raw_url = block.group(1)
            clean_url = json.loads(f"\"{raw_url}\"")
            return clean_url
        return None
    except Exception:
        return None

def inspect_media_url(url):
    try:
        # 1. If it is an Instagram Reel/Post link, extract direct media URL first
        if "instagram.com" in url and any(x in url for x in ["/reel/", "/reels/", "/p/"]):
            mp4_url = extract_instagram_reel_mp4(url)
            if mp4_url:
                # Probe direct CDN MP4
                res = requests.get(mp4_url, stream=True, impersonate="chrome120", timeout=15)
                size_bytes = int(res.headers.get("content-length", 0))
                size_mb = round(size_bytes / (1024 * 1024), 2)
                return {
                    "ok": True,
                    "url": mp4_url,
                    "original_url": url,
                    "media_type": "video",
                    "media_label": "ویدیو / ریلز اینستاگرام (HD MP4)",
                    "format": "MP4 (Instagram CDN)",
                    "size_mb": size_mb,
                    "content_type": "video/mp4"
                }

        # 2. General direct URL inspection
        res = requests.get(url, stream=True, impersonate="chrome120", timeout=15)
        headers = res.headers
        content_type = headers.get("content-type", "").lower()
        content_length = headers.get("content-length")
        size_mb = round(int(content_length) / (1024 * 1024), 2) if content_length else "نامشخص"

        is_video = "video" in content_type or url.endswith((".mp4", ".mov", ".m4v", ".webm"))
        is_image = "image" in content_type or url.endswith((".jpg", ".jpeg", ".png", ".webp"))

        if is_video:
            media_type = "video"
            media_label = "ویدیو / ریلز (Reel/Video)"
            format_name = "MP4 / Video"
        elif is_image:
            media_type = "image"
            media_label = "تصویر تکی (Photo)"
            format_name = content_type.split("/")[-1].upper() if "/" in content_type else "JPEG"
        else:
            media_type = "unknown"
            media_label = "نامشخص / رسانه وب"
            format_name = content_type or "Unknown"

        return {
            "ok": True,
            "url": url,
            "media_type": media_type,
            "media_label": media_label,
            "format": format_name,
            "size_mb": size_mb,
            "content_type": content_type
        }
    except Exception as e:
        return {
            "ok": False,
            "error": str(e)
        }
