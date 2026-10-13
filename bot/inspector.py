"""
Media Inspector Utility
Probes URLs and extracts media metadata (type, dimensions, duration, content-type)
without downloading entire heavy files when possible.
"""

from curl_cffi import requests

def inspect_media_url(url):
    try:
        # Perform HEAD or stream GET request to inspect content-type and size
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
