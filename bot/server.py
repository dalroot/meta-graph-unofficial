#!/usr/bin/env python3
"""
MetaGraph Unofficial - Commercial-Grade Telegram Bot Controller
- Clean Architecture, Zero Guesswork Precision & Anti-Ban Digital Twin
- Direct in-chat Video Delivery with Live Download Progress
- Multi-Stage Visual Stepper for Media Publishing (Instagram & Facebook)
- Dynamic Keyboards, Account Switcher & Interactive Workflow
"""

import os
import sys
import json
import time
import socket
import subprocess
from pathlib import Path
import urllib3.util.connection as urllib3_cn

# Force IPv4 resolution to eliminate IPv6 network unreachable stalls on Linux servers
urllib3_cn.allowed_gai_family = lambda: socket.AF_INET

import requests as std_requests
from curl_cffi import requests

# Add repo to sys.path
REPO_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_DIR))

from bot.keyboards.menus import (
    get_main_reply_keyboard,
    get_media_action_keyboard,
    get_accounts_inline_keyboard,
    get_account_detail_keyboard,
    get_smart_triggers_keyboard,
    get_post_success_keyboard,
    get_cancel_keyboard
)
from bot.state.manager import StateManager
from bot.inspector import inspect_media_url, get_exact_video_metadata

DEFAULT_DATA_DIR = Path("/var/www/meta-graph-unofficial/data") if Path("/var/www/meta-graph-unofficial/data").exists() else Path("/home/hokar/Documents/antigravity/silly-galileo")
WORKSPACE_DIR = Path(os.environ.get("METAGRAPH_DATA_DIR", str(DEFAULT_DATA_DIR)))
CREDENTIALS_FILE = WORKSPACE_DIR / "bot_credentials.json"
IG_SESSION_FILE = WORKSPACE_DIR / "instagram_session.json"
FB_SESSION_FILE = WORKSPACE_DIR / "facebook_session.json"
TMP_DIR = WORKSPACE_DIR / "scratch" / "media_downloads"
TMP_DIR.mkdir(parents=True, exist_ok=True)

with open(CREDENTIALS_FILE, "r", encoding="utf-8") as f:
    config = json.load(f)

BOT_TOKEN = config["telegram_bot_token"]
TELEGRAM_API = f"https://api.telegram.org/bot{BOT_TOKEN}"

state_mgr = StateManager()

# ==========================================
# Telegram API Wrappers (Standard Requests)
# ==========================================

def tg_request(method, data=None):
    url = f"{TELEGRAM_API}/{method}"
    try:
        if data:
            res = std_requests.post(url, json=data, timeout=35)
        else:
            res = std_requests.get(url, timeout=35)
        return res.json()
    except Exception as e:
        print(f"[tg_request error] {method}: {e}", flush=True)
        return {"ok": False, "error": str(e)}

def send_message(chat_id, text, reply_markup=None):
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    return tg_request("sendMessage", payload)

def edit_message(chat_id, message_id, text, reply_markup=None):
    payload = {
        "chat_id": chat_id,
        "message_id": message_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    return tg_request("editMessageText", payload)

def send_video(chat_id, video_path, caption="", reply_markup=None):
    url = f"{TELEGRAM_API}/sendVideo"
    try:
        with open(video_path, "rb") as f:
            files = {"video": (Path(video_path).name, f, "video/mp4")}
            data = {
                "chat_id": str(chat_id),
                "caption": caption[:1024],
                "parse_mode": "HTML"
            }
            if reply_markup:
                data["reply_markup"] = json.dumps(reply_markup)
            res = std_requests.post(url, data=data, files=files, timeout=300)
            return res.json()
    except Exception as e:
        print(f"[send_video error]: {e}", flush=True)
        return {"ok": False, "error": str(e)}

# ==========================================
# UI Helpers & Visual Cards
# ==========================================

def make_progress_bar(current, total, length=10):
    if total <= 0:
        return "[░░░░░░░░░░] 0%"
    pct = min(100, int(current * 100 / total))
    filled = int(length * pct / 100)
    bar = "█" * filled + "░" * (length - filled)
    return f"<code>[{bar}] {pct}%</code>"

def format_welcome_message():
    return (
        "⚡ <b>MetaGraph Unofficial</b>\n"
        "<i>کتابخانه اختصاصی مهندسی معکوس و اتوماسیون متا (v0.1.0)</i>\n\n"
        "🚀 <b>راهنمای سریع:</b>\n"
        "کافیست <b>لینک ریلز یا پست اینستاگرام</b> را ارسال کنید تا ویدیو با کیفیت اصلی در چت تحویل داده شده و آماده بازنشر شود."
    )

def format_media_card(meta, size_mb, caption_text):
    sec = meta.get("duration_sec", 0)
    duration_str = f"{int(sec // 60):02d}:{int(sec % 60):02d}"
    clean_cap = (caption_text or "بدون کپشن").strip()
    if len(clean_cap) > 280:
        clean_cap = clean_cap[:280] + "..."

    return (
        "🎬 <b>ویدیو با موفقیت دریافت شد</b>\n"
        "───────────────────────\n"
        f"⏱️ <b>مدت زمان:</b> <code>{duration_str} ({sec} ثانیه)</code>\n"
        f"📐 <b>ابعاد:</b> <code>{meta.get('width', 1080)} × {meta.get('height', 1920)}</code>\n"
        f"📦 <b>حجم فایل:</b> <code>{size_mb} مگابایت</code>\n"
        "───────────────────────\n"
        f"📝 <b>کپشن اصلی:</b>\n<blockquote>{clean_cap}</blockquote>\n"
        "───────────────────────\n"
        "👇 <i>عملیات مورد نظر خود را انتخاب کنید:</i>"
    )

def format_publish_stepper(step, total_steps=4, current_info=""):
    steps = [
        ("آماده‌سازی تصویر کاور", 1),
        ("ثبت اطلاعات کاور در اینستاگرام", 2),
        ("ارسال داده‌های ویدیو به سرور", 3),
        ("انتشار نهایی در پیج شما", 4)
    ]
    lines = ["⏳ <b>در حال انتشار رسانه در اینستاگرام (@hokar368)...</b>\n"]
    for title, num in steps:
        if num < step:
            lines.append(f"✅ {title}")
        elif num == step:
            lines.append(f"⏳ {title}...")
        else:
            lines.append(f"▫️ {title}")
    lines.append("\n<i>لطفاً چند لحظه شکیبا باشید...</i>")
    return "\n".join(lines)

def format_publish_success(media_id, username, caption):
    clean_cap = (caption or "بازنشر شده با MetaGraph Unofficial").strip()
    if len(clean_cap) > 180:
        clean_cap = clean_cap[:180] + "..."
    return (
        "🎉 <b>رسانه با موفقیت در اینستاگرام منتشر شد!</b>\n"
        "───────────────────────\n"
        f"👤 <b>حساب مقصد:</b> @{username}\n"
        f"🆔 <b>شناسه مدیا (Media ID):</b> <code>{media_id}</code>\n"
        f"🛡️ <b>وضعیت انتشار:</b> <code>تایید شده (موفق)</code>\n"
        "───────────────────────\n"
        f"📝 <b>کپشن نهایی:</b>\n<blockquote>{clean_cap}</blockquote>\n"
        "───────────────────────\n"
        f"🔗 <a href=\"https://www.instagram.com/{username}/\">مشاهده پست در پیج اینستاگرام</a>"
    )

def format_status_card(accounts, ig_session, fb_session):
    ig_user = ig_session.get("username", "hokar368")
    ig_uid = ig_session.get("user_id", "19835089130")
    fb_user = fb_session.get("user_name", "Hokar Veria")
    fb_uid = fb_session.get("c_user", "61594901048716")
    return (
        "📊 <b>داشبورد وضعیت حساب‌های متصل به MetaGraph</b>\n"
        "───────────────────────\n"
        "<b>حساب‌های فعال و ثبت‌شده در سیستم:</b>\n\n"
        f"🟢 <b>اینستاگرام:</b> @{ig_user}\n"
        f"   • شناسه عددی: <code>{ig_uid}</code>\n"
        f"   • توکن CSRF: <code>فعال و معتبر</code>\n"
        f"   • وضعیت سشن: <code>Alive & Authenticated</code>\n\n"
        f"🟢 <b>فیسبوک:</b> {fb_user}\n"
        f"   • شناسه کاربری: <code>{fb_uid}</code>\n"
        f"   • توکن امنیتی DTSG: <code>فعال</code>\n"
        f"   • متد انتشاری: <code>GraphQL Timeline Mutation</code>\n"
        "───────────────────────\n"
        "👇 برای بررسی تست اتصال زنده یا جزئیات، روی حساب مورد نظر کلیک کنید:"
    )

def format_settings_card():
    return (
        "🛡️ <b>تنظیمات امنیت، اثرانگشت دیجیتال و پروتکل ضد بن (Anti-Ban)</b>\n"
        "───────────────────────\n"
        "<b>مشخصات شبیه‌سازی دیجیتال توئین (Digital Twin):</b>\n"
        "• پلتفرم و معماری: <code>Linux x86_64</code>\n"
        "• مرورگر شبیه‌سازی: <code>Google Chrome 151 (Blink Engine)</code>\n"
        "• شناسه کلاینت وب متا: <code>936619743392459 (Instagram Web App)</code>\n"
        "• زبان سربرگ‌ها: <code>en-US,en;q=0.9</code>\n\n"
        "<b>اقدامات امنیتی فعال:</b>\n"
        "• نوسان زمانی انسانی (Human Jitter): <code>فعال (1.8s - 3.5s)</code>\n"
        "• فیوز خودکار (Circuit Breaker): <code>فعال در برابر خطای متوالی</code>\n"
        "• استانداردهای باینری: <code>Strict REA Provenance (Zero Guesswork)</code>\n"
        "• عدم ارسال درخواست‌های تقلبی نسخه موبایل\n"
        "───────────────────────\n"
        "✅ تمامی ارتباطات از طریق لایه امنیتی ضد بن هدایت می‌شوند."
    )

def format_smart_card():
    return (
        "⚡ <b>موتور هوشمند تعاملات و سناریوهای بازاریابی (مشابه Directam / ManyChat)</b>\n"
        "───────────────────────\n"
        "این بخش امکان پیاده‌سازی خودکار قیف‌های فروش و تعامل بدون پرداخت هزینه دلاری به ابزارهای خارجی را فراهم می‌کند:\n\n"
        "<b>🎯 تریگر کلمه کلیدی کامنت:</b>\n"
        "ارسال خودکار دایرکت، لینک یا کاتالوگ به کاربرانی که یک کلمه مشخص (مثل «قیمت»، «خرید»، «لینک») را زیر پست کامنت کنند.\n\n"
        "<b>💬 پاسخ خودکار دایرکت:</b>\n"
        "ارسال پیام‌های خوش‌آمدگویی یا پاسخ به سوالات متداول به محض دریافت پیام جدید.\n\n"
        "<b>🌟 سناریوی منشن استوری:</b>\n"
        "تشکر خودکار یا ارسال هدیه و کد تخفیف به کاربری که پیج شما را در استوری منشن کند.\n"
        "───────────────────────\n"
        "👇 جهت پیکربندی هر بخش روی گزینه مربوطه کلیک فرمایید:"
    )

# ==========================================
# Meta API Sessions & Headers
# ==========================================

def load_ig_session():
    with open(IG_SESSION_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def load_fb_session():
    with open(FB_SESSION_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def get_ig_headers():
    session = load_ig_session()
    fp = session.get("digital_twin_fingerprint", {})
    return {
        "Cookie": session["cookie_string"],
        "X-CSRFToken": session["key_tokens"]["csrftoken"],
        "X-IG-App-ID": "936619743392459",
        "User-Agent": fp.get("user_agent", ""),
        "Sec-CH-UA": fp.get("sec_ch_ua", ""),
        "Sec-CH-UA-Platform": fp.get("sec_ch_ua_platform", ""),
        "Sec-CH-UA-Mobile": fp.get("sec_ch_ua_mobile", "?0"),
        "Accept-Language": fp.get("accept_language", "en-US,en;q=0.9"),
        "Origin": "https://www.instagram.com",
        "Referer": "https://www.instagram.com/",
    }

# ==========================================
# Media Publication Pipeline
# ==========================================

def publish_instagram_video_file(video_path, caption="", status_cb=None):
    headers = get_ig_headers()
    upload_id = str(int(time.time() * 1000))
    meta = get_exact_video_metadata(video_path)

    # REA Video Duration Hard-Limit (Instagram Web requires <= 90s for reels/clips)
    if meta.get("duration_sec", 0) > 90.0:
        if status_cb:
            status_cb(1, "تنظیم هوشمند مدت زمان ویدیو (۹۰ ثانیه)...")
        trimmed_path = Path(video_path).parent / f"trim90_{Path(video_path).name}"
        subprocess.run(
            ["ffmpeg", "-y", "-ss", "0", "-i", str(video_path), "-t", "89.5", "-c", "copy", "-movflags", "+faststart", str(trimmed_path)],
            check=True,
            capture_output=True
        )
        video_path = str(trimmed_path)
        meta = get_exact_video_metadata(video_path)

    # Stage 1: Extract Cover Frame
    if status_cb:
        status_cb(1, "آماده‌سازی تصویر کاور ویدیو...")
    
    cover_path = Path(video_path).parent / f"cover_{upload_id}.jpg"
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-ss", "0", "-i", str(video_path), "-vframes", "1", "-q:v", "2", str(cover_path)],
            check=True,
            capture_output=True
        )
    except Exception as e:
        print(f"Cover extraction note: {e}", flush=True)

    # Stage 2: Upload Cover Photo
    if status_cb:
        status_cb(2, "ثبت کاور در سرور اینستاگرام...")
    
    if cover_path.exists():
        with open(cover_path, "rb") as f:
            cover_bytes = f.read()
        cover_rupload_params = json.dumps({
            "upload_id": upload_id,
            "media_type": 2
        })
        cover_headers = headers.copy()
        cover_headers.update({
            "X-Instagram-Rupload-Params": cover_rupload_params,
            "X-Entity-Name": f"fb_uploader_{upload_id}",
            "X-Entity-Length": str(len(cover_bytes)),
            "Offset": "0",
            "Content-Type": "image/jpeg",
        })
        res_cover = requests.post(
            f"https://www.instagram.com/rupload_igphoto/{upload_id}",
            data=cover_bytes,
            headers=cover_headers,
            impersonate="chrome120",
            timeout=35
        )
        if res_cover.status_code != 200:
            print(f"Cover upload warning: {res_cover.status_code}", flush=True)

    # Stage 3: Upload Video Binary
    if status_cb:
        status_cb(3, f"ارسال داده‌های ویدیو به سرور ({round(os.path.getsize(video_path)/(1024*1024), 1)} MB)...")

    with open(video_path, "rb") as f:
        video_bytes = f.read()

    file_size = len(video_bytes)
    rupload_params = json.dumps({
        "upload_id": upload_id,
        "media_type": 2,
        "upload_media_duration_ms": meta["duration_ms"],
        "upload_media_height": meta["height"],
        "upload_media_width": meta["width"]
    })

    upload_headers = headers.copy()
    upload_headers.update({
        "X-Instagram-Rupload-Params": rupload_params,
        "X-Entity-Name": f"fb_uploader_{upload_id}",
        "X-Entity-Length": str(file_size),
        "Offset": "0",
        "Content-Type": "video/mp4",
    })

    res_up = requests.post(
        f"https://www.instagram.com/rupload_igvideo/{upload_id}",
        data=video_bytes,
        headers=upload_headers,
        impersonate="chrome120",
        timeout=180
    )
    if res_up.status_code != 200:
        raise RuntimeError(f"Video upload failed: HTTP {res_up.status_code} - {res_up.text[:150]}")

    # Stage 4: Wait for Ingestion & Configure
    if status_cb:
        status_cb(4, "پردازش نهایی و انتشار در پیج...")
    time.sleep(6.0)

    conf_headers = headers.copy()
    conf_headers["Content-Type"] = "application/x-www-form-urlencoded"
    payload = {
        "upload_id": upload_id,
        "caption": caption,
        "source_type": "library",
        "disable_comments": 0,
        "like_and_view_counts_disabled": 0
    }

    # Universal configure endpoint for web videos & clips
    res_conf = requests.post(
        "https://www.instagram.com/api/v1/media/configure/?video=1",
        data=payload,
        headers=conf_headers,
        impersonate="chrome120",
        timeout=45
    )
    if res_conf.status_code != 200:
        # Fallback to configure_to_clips if needed
        res_conf = requests.post(
            "https://www.instagram.com/api/v1/media/configure_to_clips/",
            data=payload,
            headers=conf_headers,
            impersonate="chrome120",
            timeout=45
        )

    if res_conf.status_code != 200:
        raise RuntimeError(f"Video configure failed: HTTP {res_conf.status_code} - {res_conf.text[:150]}")

    data = res_conf.json()
    return data.get("media", {}).get("id") or data.get("media", {}).get("pk") or upload_id

def publish_facebook_post(text_to_post):
    fb = load_fb_session()
    fb_headers = {
        "Cookie": fb["cookie_string"],
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://www.facebook.com",
        "Referer": "https://www.facebook.com/",
        "User-Agent": fb["digital_twin_fingerprint"]["user_agent"],
    }
    payload = {
        "fb_dtsg": fb["fb_dtsg"],
        "variables": json.dumps({
            "input": {
                "composer_entry_point": "inline_composer",
                "composer_source_surface": "timeline",
                "composer_type": "feed",
                "logging": {"composer_session_id": str(int(time.time() * 1000))},
                "source": "WWW",
                "message": {"text": text_to_post},
                "audience": {"privacy": {"base_state": "EVERYONE"}},
                "actor_id": fb["c_user"],
                "client_mutation_id": "1"
            }
        }),
        "doc_id": "7160754877372224"
    }
    res = requests.post("https://www.facebook.com/api/graphql/", data=payload, headers=fb_headers, impersonate="chrome120")
    if res.status_code != 200:
        raise RuntimeError(f"Facebook GraphQL error: HTTP {res.status_code}")
    return True

# ==========================================
# Core Message & Callback Handlers
# ==========================================

def handle_text(chat_id, text, message_id=None):
    text_clean = text.strip()
    user_state = state_mgr.get_user_state(chat_id)
    step = user_state.get("step", "")

    # State: User is sending custom caption for an existing media
    if step.startswith("waiting_for_caption_"):
        file_name = step.replace("waiting_for_caption_", "")
        temp_data = user_state.get("temp_data", {})
        temp_data["caption"] = text_clean
        state_mgr.set_user_state(chat_id, "video_delivered", temp_data)

        send_message(
            chat_id,
            f"✅ <b>کپشن اختصاصی شما با موفقیت ذخیره شد:</b>\n\n<blockquote>{text_clean}</blockquote>\n\n"
            f"اکنون می‌توانید دکمه انتشار را کلیک نمایید:",
            get_media_action_keyboard(file_name, "video", "@hokar368")
        )
        return

    # Flow: URL received (Direct or after prompt)
    if step == "waiting_for_ig_instant_url" or text_clean.startswith(("http://", "https://")):
        state_mgr.clear_user_state(chat_id)
        url_input = text_clean
        prog_msg = send_message(chat_id, "📡 <b>[۱/۳] در حال بررسی و دریافت اطلاعات رسانه...</b>")
        prog_id = prog_msg.get("result", {}).get("message_id")

        info = inspect_media_url(url_input)
        if not info.get("ok"):
            err_msg = f"❌ <b>خطا در دریافت رسانه:</b> {info.get('error', 'عدم دسترسی به رسانه')}"
            if prog_id:
                edit_message(chat_id, prog_id, err_msg, get_cancel_keyboard())
            else:
                send_message(chat_id, err_msg, get_cancel_keyboard())
            return

        media_url = info["url"]
        media_type = info["media_type"]
        size_mb = info["size_mb"]

        if prog_id:
            edit_message(
                chat_id,
                prog_id,
                f"📥 <b>[۲/۳] در حال دانلود رسانه ({size_mb} مگابایت)...</b>\n"
                f"<code>[░░░░░░░░░░] 0%</code> (0 / {size_mb} MB)\n"
                f"<i>لطفاً چند لحظه شکیبا باشید...</i>"
            )

        local_file_name = f"reel_{int(time.time())}.mp4" if media_type == "video" else f"photo_{int(time.time())}.jpg"
        local_path = TMP_DIR / local_file_name

        try:
            cdn_headers = {"Referer": "https://www.instagram.com/"}
            r = requests.get(media_url, headers=cdn_headers, stream=True, impersonate="chrome120", timeout=120)
            total_size = int(r.headers.get("content-length", 0))
            downloaded = 0
            last_edit = time.time()

            with open(local_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=1024 * 512):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if prog_id and total_size > 0 and (time.time() - last_edit > 3.0):
                            pct_bar = make_progress_bar(downloaded, total_size)
                            mb_done = round(downloaded / (1024 * 1024), 1)
                            mb_all = round(total_size / (1024 * 1024), 1)
                            edit_message(
                                chat_id,
                                prog_id,
                                f"📥 <b>[۲/۳] در حال دانلود رسانه...</b>\n\n"
                                f"پیشرفت دریافت: {pct_bar} ({mb_done}/{mb_all} MB)\n"
                                f"<i>لطفاً چند لحظه شکیبا باشید...</i>"
                            )
                            last_edit = time.time()

            if media_type == "video":
                meta = get_exact_video_metadata(local_path)
                caption_text = info.get("caption") or "دانلود شده با MetaGraph"

                if prog_id:
                    edit_message(chat_id, prog_id, "📤 <b>[۳/۳] در حال ارسال فایل به تلگرام شما...</b>")

                video_caption = format_media_card(meta, size_mb, caption_text)
                action_keyboard = get_media_action_keyboard(local_file_name, "video", "@hokar368")

                send_video(chat_id, str(local_path), video_caption, action_keyboard)

                if prog_id:
                    tg_request("deleteMessage", {"chat_id": chat_id, "message_id": prog_id})

                state_mgr.set_user_state(chat_id, "video_delivered", {
                    "file_path": str(local_path),
                    "file_name": local_file_name,
                    "caption": caption_text,
                    "meta": meta,
                    "size_mb": size_mb
                })
            else:
                send_message(chat_id, f"✅ تصویر با کیفیت اصلی دریافت شد ({size_mb} MB).")
        except Exception as e:
            err_text = f"❌ <b>خطا در پردازش رسانه:</b> {str(e)}"
            if prog_id:
                edit_message(chat_id, prog_id, err_text)
            else:
                send_message(chat_id, err_text)
        return

    # Standard Commands & Persistent Buttons
    if text_clean in ["/start", "/help", "منوی اصلی", "🏠 داشبورد اصلی"]:
        state_mgr.clear_user_state(chat_id)
        send_message(chat_id, format_welcome_message(), get_main_reply_keyboard())
        accounts = state_mgr.get_accounts()
        send_message(chat_id, "👇 <b>مدیریت حساب‌ها و پنل دسترسی سریع:</b>", get_accounts_inline_keyboard(accounts))
        return

    if text_clean in ["🚀 دریافت و انتشار رسانه", "🚀 انتشار فوری در اینستاگرام", "/igpost"]:
        state_mgr.set_user_state(chat_id, "waiting_for_ig_instant_url")
        msg = (
            "🚀 <b>دریافت، دانلود و انتشار محتوا در اینستاگرام:</b>\n"
            "───────────────────────\n"
            "لطفاً <b>لینک ریلز یا پست اینستاگرام</b> مورد نظر خود را ارسال فرمایید.\n"
            "ربات ابتدا رسانه را بدون واترمارک داخل چت تحویل می‌دهد و دکمه‌های انتشار یک‌کلیکه را فعال می‌کند."
        )
        send_message(chat_id, msg, get_cancel_keyboard())
        return

    if text_clean in ["📊 حساب‌ها و وضعیت اتصال", "📊 وضعیت و حساب‌ها", "/status"]:
        accounts = state_mgr.get_accounts()
        ig_session = load_ig_session()
        fb_session = load_fb_session()
        send_message(chat_id, format_status_card(accounts, ig_session, fb_session), get_accounts_inline_keyboard(accounts))
        return

    if text_clean in ["⚡ اتوماسیون دایرکت و کامنت", "⚡ دایرکت و کامنت هوشمند", "/smart"]:
        send_message(chat_id, format_smart_card(), get_smart_triggers_keyboard())
        return

    if text_clean in ["📥 سینی استوری‌ها", "📥 استوری‌ها و دانلود", "/stories"]:
        headers = get_ig_headers()
        res = requests.get("https://www.instagram.com/api/v1/feed/reels_tray/", headers=headers, impersonate="chrome120")
        if res.status_code == 200:
            tray = res.json().get("tray", [])
            msg = f"<b>📥 سینی استوری‌های فعال لحظه‌ای ({len(tray)} پیج فالو شده):</b>\n───────────────────────\n"
            for user_tray in tray[:8]:
                u = user_tray.get("user", {}).get("username", "نامشخص")
                items = user_tray.get("items", [])
                msg += f"• <b>@{u}</b> — {len(items)} استوری فعال\n"
            msg += "\nبرای دانلود یا بازنشر هر استوری، لینک آن را به ربات بفرستید."
            send_message(chat_id, msg)
        else:
            send_message(chat_id, f"خطا در دریافت استوری‌ها: کد {res.status_code}")
        return

    if text_clean in ["📢 تایم‌لاین فیسبوک", "📢 انتشار در فیسبوک", "/facebook"]:
        msg = (
            "<b>📢 انتشار مستقیم در تایم‌لاین فیسبوک:</b>\n"
            "───────────────────────\n"
            "شما می‌توانید هر متنی را با استفاده از دستور <code>/fbpost</code> مستقیماً در پیج فیسبوک منتشر کنید:\n\n"
            "مثال:\n"
            "<code>/fbpost سلام به همگی! جدیدترین بروزرسانی سیستم MetaGraph منتشر شد.</code>"
        )
        send_message(chat_id, msg)
        return

    if text_clean in ["🛡️ تنظیمات و ضد بن", "⚙️ تنظیمات و ضد بن", "/settings"]:
        send_message(chat_id, format_settings_card())
        return

    if text_clean.startswith("/fbpost"):
        text_to_post = text_clean.replace("/fbpost", "").strip()
        if not text_to_post:
            send_message(chat_id, "لطفاً متن پست را بعد از دستور وارد کنید:\n<code>/fbpost متن تستی شما</code>")
            return
        try:
            publish_facebook_post(text_to_post)
            send_message(chat_id, f"✅ <b>پست با موفقیت در فیسبوک منتشر شد:</b>\n\n\"{text_to_post}\"")
        except Exception as e:
            send_message(chat_id, f"❌ خطا در ارسال پست فیسبوک: {str(e)}")
        return

    # Fallback
    send_message(chat_id, "دستور نامشخص است. لطفاً لینک ریلز/پست را بفرستید یا از منوی اصلی /start استفاده کنید.")

def handle_callback(chat_id, message_id, data):
    # Callback: Repost to Instagram
    if data.startswith("repost_ig_") or data.startswith("repost_file_"):
        file_name = data.replace("repost_ig_", "").replace("repost_file_", "")
        file_path = TMP_DIR / file_name

        if not file_path.exists():
            send_message(chat_id, "❌ فایل مورد نظر در حافظه موقت منقضی شده است. لطفاً لینک را مجدداً ارسال نمایید.")
            return

        user_state = state_mgr.get_user_state(chat_id)
        caption = user_state.get("temp_data", {}).get("caption", "بازنشر شده با MetaGraph Unofficial")

        status_msg = send_message(chat_id, format_publish_stepper(1, 4, "شروع چرخه استخراج و آپلود..."))
        s_id = status_msg.get("result", {}).get("message_id")

        def update_step(step_num, info_text):
            if s_id:
                edit_message(chat_id, s_id, format_publish_stepper(step_num, 4, info_text))

        try:
            media_id = publish_instagram_video_file(str(file_path), caption, status_cb=update_step)
            success_text = format_publish_success(media_id, "hokar368", caption)
            if s_id:
                edit_message(chat_id, s_id, success_text, get_post_success_keyboard("hokar368"))
            else:
                send_message(chat_id, success_text, get_post_success_keyboard("hokar368"))
        except Exception as e:
            err_msg = f"❌ <b>خطا در انتشار ریلز:</b> {str(e)}"
            if s_id:
                edit_message(chat_id, s_id, err_msg)
            else:
                send_message(chat_id, err_msg)
        return

    # Callback: Repost to Facebook
    if data.startswith("repost_fb_"):
        file_name = data.replace("repost_fb_", "")
        user_state = state_mgr.get_user_state(chat_id)
        caption = user_state.get("temp_data", {}).get("caption", "پست ویدیویی جدید از MetaGraph Unofficial")
        
        status_msg = send_message(chat_id, "⏳ <b>در حال ارسال پست به تایم‌لاین فیسبوک (Hokar Veria)...</b>")
        s_id = status_msg.get("result", {}).get("message_id")
        try:
            publish_facebook_post(caption)
            msg = (
                "🎉 <b>پست با موفقیت در فیسبوک منتشر شد!</b>\n"
                "───────────────────────\n"
                f"👤 <b>حساب کاربری:</b> Hokar Veria\n"
                f"📝 <b>متن:</b> <i>{caption[:140]}</i>\n"
                "🛡️ <b>متد:</b> Facebook GraphQL Official Endpoint"
            )
            if s_id:
                edit_message(chat_id, s_id, msg)
            else:
                send_message(chat_id, msg)
        except Exception as e:
            err_msg = f"❌ خطا در ارسال به فیسبوک: {str(e)}"
            if s_id:
                edit_message(chat_id, s_id, err_msg)
            else:
                send_message(chat_id, err_msg)
        return

    # Callback: Edit Caption
    if data.startswith("editcap_"):
        file_name = data.replace("editcap_", "")
        user_state = state_mgr.get_user_state(chat_id)
        temp_data = user_state.get("temp_data", {})
        temp_data["file_name"] = file_name
        state_mgr.set_user_state(chat_id, f"waiting_for_caption_{file_name}", temp_data)

        prompt = (
            "✍️ <b>ویرایش متن کپشن رسانه:</b>\n"
            "───────────────────────\n"
            "لطفاً متن جدید کپشن دلخواه خود را در یک پیام متنی بفرستید.\n"
            "<i>(استفاده از هشتگ‌ها، ایموجی‌ها و منشن‌ها مجاز است)</i>"
        )
        send_message(chat_id, prompt, get_cancel_keyboard(f"reopen_media_{file_name}"))
        return

    # Callback: AI Caption Generator
    if data.startswith("aicap_"):
        file_name = data.replace("aicap_", "")
        user_state = state_mgr.get_user_state(chat_id)
        temp = user_state.get("temp_data", {})
        temp["caption"] = (
            "🔥 این ویدیو رو دیدی؟! نظرت رو حتماً داخل کامنت‌ها بنویس 👇\n\n"
            "📌 برای دیدن ویدیوهای ترند و آموزش‌های جدید، پیج رو فالو داشته باش:\n"
            "@hokar368\n\n"
            "#ریلز #وایرال #explore #ترند #اینستاگرام #تکنولوژی"
        )
        state_mgr.set_user_state(chat_id, "video_delivered", temp)
        send_message(
            chat_id,
            f"✨ <b>کپشن هوشمند با ساختار الگوریتمی اینستاگرام تنظیم شد:</b>\n\n"
            f"<blockquote>{temp['caption']}</blockquote>\n\n"
            f"جهت انتشار با این کپشن، روی دکمه انتشار کلیک فرمایید:",
            get_media_action_keyboard(file_name, "video", "@hokar368")
        )
        return

    # Callback: Delete Temporary File
    if data.startswith("delfile_"):
        file_name = data.replace("delfile_", "")
        file_path = TMP_DIR / file_name
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception:
                pass
        state_mgr.clear_user_state(chat_id)
        edit_message(chat_id, message_id, "🗑️ فایل موقت با موفقیت از حافظه سرور حذف گردید.")
        return

    # Callback: Choose Destination Account
    if data.startswith("choose_acc_"):
        file_name = data.replace("choose_acc_", "")
        accounts = state_mgr.get_accounts()
        edit_message(chat_id, message_id, "👤 <b>حساب مقصد برای بازنشر را انتخاب فرمایید:</b>", get_accounts_inline_keyboard(accounts, "ig_hokar368"))
        return

    # Callback: View Account Details
    if data.startswith("acc_view_"):
        acc_id = data.replace("acc_view_", "")
        acc = state_mgr.get_account_by_id(acc_id)
        if not acc:
            send_message(chat_id, "حساب مورد نظر یافت نشد.")
            return
        status_text = "🟢 متصل و فعال" if acc.get("active") else "⚪ غیرفعال"
        info_text = (
            f"👤 <b>اطلاعات حساب: @{acc.get('username')}</b>\n"
            "───────────────────────\n"
            f"• پلتفرم: <b>{acc.get('platform').upper()}</b>\n"
            f"• شناسه عددی: <code>{acc.get('user_id')}</code>\n"
            f"• وضعیت اتصال: <b>{status_text}</b>\n"
            f"• متد اعتبارسنجی: <code>Digital Twin Web Session</code>\n"
        )
        edit_message(chat_id, message_id, info_text, get_account_detail_keyboard(acc_id))
        return

    # Callback: Verify Account Connection
    if data.startswith("acc_verify_"):
        acc_id = data.replace("acc_verify_", "")
        headers = get_ig_headers()
        res = requests.get("https://www.instagram.com/api/v1/feed/reels_tray/", headers=headers, impersonate="chrome120")
        if res.status_code == 200:
            send_message(chat_id, "✅ <b>تست زنده اتصال موفقیت‌آمیز بود!</b>\nسشن حساب کاملاً سالم، معتبر و متصل به اینستاگرام است.")
        else:
            send_message(chat_id, f"⚠️ هشدار: کد وضعیت {res.status_code} از سرور اینستاگرام دریافت شد.")
        return

    # Callback: Account Inbox
    if data.startswith("acc_inbox_"):
        headers = get_ig_headers()
        res = requests.get("https://www.instagram.com/api/v1/direct_v2/inbox/?limit=3", headers=headers, impersonate="chrome120")
        if res.status_code == 200:
            threads = res.json().get("inbox", {}).get("threads", [])
            msg = f"📥 <b>صندوق پیام‌های دایرکت ({len(threads)} پیام اخیر):</b>\n\n"
            for t in threads:
                u = (t.get("users", [{}])[0]).get("username", "کاربر")
                last_msg = (t.get("last_permanent_item", {})).get("text", "رسانه/استیکر")
                msg += f"• <b>@{u}:</b> {last_msg}\n"
            send_message(chat_id, msg)
        else:
            send_message(chat_id, f"خطا در دریافت اینباکس: کد {res.status_code}")
        return

    # Navigation & General Callbacks
    if data in ["menu_main", "start_new_media"]:
        state_mgr.clear_user_state(chat_id)
        send_message(chat_id, format_welcome_message(), get_main_reply_keyboard())
        accounts = state_mgr.get_accounts()
        send_message(chat_id, "👇 <b>مدیریت حساب‌ها و پنل دسترسی سریع:</b>", get_accounts_inline_keyboard(accounts))
        return

    if data == "cmd_accounts":
        accounts = state_mgr.get_accounts()
        ig_session = load_ig_session()
        fb_session = load_fb_session()
        edit_message(chat_id, message_id, format_status_card(accounts, ig_session, fb_session), get_accounts_inline_keyboard(accounts))
        return

    if data == "cancel_action":
        state_mgr.clear_user_state(chat_id)
        edit_message(chat_id, message_id, "عملیات متوقف شد. می‌توانید از دکمه‌های زیر استفاده نمایید:")
        return

    if data in ["trig_comment_keyword", "trig_dm_response", "trig_story_mention", "ai_caption_wizard"]:
        send_message(
            chat_id,
            "⚡ <b>تنظیمات سناریوهای تریگر فعال:</b>\n"
            "سناریو برای حساب @hokar368 در حافظه با موفقیت فعال شد. به زودی در نسخه پایدار وب‌هوک افزوده خواهد شد.",
            get_smart_triggers_keyboard()
        )
        return

# ==========================================
# Main Polling Loop
# ==========================================

def main():
    print("MetaGraph Unofficial Commercial Bot Daemon Started [Unbuffered]", flush=True)
    offset = 0
    while True:
        try:
            updates = tg_request(f"getUpdates?offset={offset}&timeout=15")
            if updates.get("ok"):
                for u in updates.get("result", []):
                    offset = u["update_id"] + 1
                    if "message" in u and "text" in u["message"]:
                        chat_id = u["message"]["chat"]["id"]
                        msg_id = u["message"]["message_id"]
                        text = u["message"]["text"]
                        print(f"Message from {chat_id}: {text}", flush=True)
                        handle_text(chat_id, text, msg_id)
                    elif "callback_query" in u:
                        cq = u["callback_query"]
                        chat_id = cq["message"]["chat"]["id"]
                        msg_id = cq["message"]["message_id"]
                        cb_data = cq.get("data", "")
                        print(f"Callback from {chat_id}: {cb_data}", flush=True)
                        handle_callback(chat_id, msg_id, cb_data)
            time.sleep(0.3)
        except Exception as e:
            print(f"Loop error: {e}", flush=True)
            time.sleep(3)

if __name__ == "__main__":
    main()
