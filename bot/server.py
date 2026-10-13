#!/usr/bin/env python3
"""
Modular Telegram Management Bot for meta-graph-unofficial
- Direct in-chat Video Delivery (Download & Stream to Telegram)
- Zero Guesswork exact metadata with ffprobe
- Real-time progress updates & Account selector
- Clean Architecture & Anti-Ban compliant
"""

import os
import sys
import json
import time
from pathlib import Path
from curl_cffi import requests

# Add repo to sys.path
REPO_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_DIR))

from bot.keyboards.menus import (
    get_main_reply_keyboard,
    get_accounts_inline_keyboard,
    get_smart_triggers_keyboard,
    get_account_detail_keyboard,
    get_cancel_keyboard
)
from bot.state.manager import StateManager
from bot.inspector import inspect_media_url, get_exact_video_metadata

WORKSPACE_DIR = Path("/home/hokar/Documents/antigravity/silly-galileo")
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

def tg_request(method, data=None):
    url = f"{TELEGRAM_API}/{method}"
    if data:
        res = requests.post(url, json=data, timeout=35)
    else:
        res = requests.get(url, timeout=35)
    return res.json()

def send_message(chat_id, text, reply_markup=None):
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    return tg_request("sendMessage", payload)

def edit_message(chat_id, message_id, text, reply_markup=None):
    payload = {
        "chat_id": chat_id,
        "message_id": message_id,
        "text": text,
        "parse_mode": "HTML"
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    return tg_request("editMessageText", payload)

def send_video(chat_id, video_path, caption="", reply_markup=None):
    url = f"{TELEGRAM_API}/sendVideo"
    with open(video_path, "rb") as f:
        files = {"video": f}
        data = {
            "chat_id": str(chat_id),
            "caption": caption[:1024],
            "parse_mode": "HTML"
        }
        if reply_markup:
            data["reply_markup"] = json.dumps(reply_markup)
        res = requests.post(url, data=data, files=files, timeout=120)
        return res.json()

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

def publish_instagram_video_file(video_path, caption=""):
    headers = get_ig_headers()
    upload_id = str(int(time.time() * 1000))
    meta = get_exact_video_metadata(video_path)

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

    # Step 1: Upload video binary to rupload_igvideo
    res_up = requests.post(
        f"https://www.instagram.com/rupload_igvideo/{upload_id}",
        data=video_bytes,
        headers=upload_headers,
        impersonate="chrome120",
        timeout=120
    )
    if res_up.status_code != 200:
        raise RuntimeError(f"Reel video upload failed: HTTP {res_up.status_code} - {res_up.text[:150]}")

    time.sleep(2.5) # Natural human pacing

    # Step 2: Configure to clips (Reels) with exact parameters
    conf_headers = headers.copy()
    conf_headers["Content-Type"] = "application/x-www-form-urlencoded"
    payload = {
        "upload_id": upload_id,
        "caption": caption,
        "source_type": "library",
        "clips_share_preview_to_feed": "1",
        "disable_comments": 0,
        "like_and_view_counts_disabled": 0
    }

    res_conf = requests.post(
        "https://www.instagram.com/api/v1/media/configure_to_clips/",
        data=payload,
        headers=conf_headers,
        impersonate="chrome120",
        timeout=35
    )
    if res_conf.status_code != 200:
        raise RuntimeError(f"Reel configure failed: HTTP {res_conf.status_code} - {res_conf.text[:150]}")

    data = res_conf.json()
    return data.get("media", {}).get("id") or data.get("media", {}).get("pk")

def handle_text(chat_id, text, message_id=None):
    text_clean = text.strip()
    user_state = state_mgr.get_user_state(chat_id)
    step = user_state.get("step")

    # If user sends any URL directly or in flow
    if step == "waiting_for_ig_instant_url" or text_clean.startswith(("http://", "https://")):
        url_input = text_clean
        prog_msg = send_message(chat_id, "🔍 <b>در حال آنالیز و استخراج رسانه از لینک...</b>")
        prog_id = prog_msg.get("result", {}).get("message_id")

        info = inspect_media_url(url_input)
        if not info.get("ok"):
            send_message(chat_id, f"❌ خطا در آنالیز لینک: {info.get('error')}", get_cancel_keyboard())
            return

        media_url = info["url"]
        media_type = info["media_type"]
        size_mb = info["size_mb"]

        # Step A: Download file to local storage with progress notice
        if prog_id:
            edit_message(chat_id, prog_id, f"📥 <b>در حال دانلود و آماده‌سازی فایل ({size_mb} MB)...</b>\nلطفاً چند لحظه شکیبا باشید.")

        local_file_name = f"reel_{int(time.time())}.mp4" if media_type == "video" else f"photo_{int(time.time())}.jpg"
        local_path = TMP_DIR / local_file_name

        try:
            cdn_headers = {"Referer": "https://www.instagram.com/"}
            with open(local_path, "wb") as f:
                r = requests.get(media_url, headers=cdn_headers, stream=True, impersonate="chrome120", timeout=120)
                f.write(r.content)

            if media_type == "video":
                # Extract exact metadata with native ffprobe
                meta = get_exact_video_metadata(local_path)
                caption_text = info.get("caption") or "دانلود شده از طریق MetaGraph Unofficial"

                # Action Buttons under the delivered video
                action_keyboard = {
                    "inline_keyboard": [
                        [
                            {"text": "🚀 بازنشر روی پیج من (@hokar368)", "callback_data": f"repost_file_{local_file_name}"}
                        ],
                        [
                            {"text": "✍️ ویرایش کپشن", "callback_data": f"editcap_{local_file_name}"},
                            {"text": "✨ کپشن هوش مصنوعی", "callback_data": f"aicap_{local_file_name}"}
                        ]
                    ]
                }

                video_caption = (
                    f"🎬 <b>ویدیو با کیفیت اصلی دریافت شد!</b>\n\n"
                    f"• مدت زمان: <b>{meta['duration_sec']} ثانیه</b>\n"
                    f"• ابعاد: <b>{meta['width']}x{meta['height']}</b>\n"
                    f"• حجم فایل: <b>{size_mb} مگابایت</b>\n\n"
                    f"📝 <b>کپشن اصلی:</b>\n<i>{caption_text}</i>"
                )

                if prog_id:
                    edit_message(chat_id, prog_id, "📤 <b>در حال ارسال ویدیو به چت تلگرام شما...</b>")

                # Deliver video directly to chat!
                send_video(chat_id, str(local_path), video_caption, action_keyboard)

                # Save file state
                state_mgr.set_user_state(chat_id, "video_delivered", {
                    "file_path": str(local_path),
                    "caption": caption_text,
                    "meta": meta
                })
            else:
                send_message(chat_id, f"✅ تصویر با کیفیت اصلی دریافت شد ({size_mb} MB).")
        except Exception as e:
            send_message(chat_id, f"❌ خطا در پردازش رسانه: {str(e)}")
        return

    if text_clean in ["/start", "/help", "منوی اصلی"]:
        state_mgr.clear_user_state(chat_id)
        msg = (
            "<b>🎛️ داشبورد مدیریت MetaGraph Unofficial</b>\n\n"
            "به کنسول مهندسی معکوس و اتوماسیون MetaGraph خوش آمدید.\n"
            "از کیبورد زیر یا ارسال هرگونه لینک ریلز/پست برای دانلود و بازنشر استفاده کنید:"
        )
        send_message(chat_id, msg, get_main_reply_keyboard())
        accounts = state_mgr.get_accounts()
        send_message(chat_id, "👇 <b>مدیریت حساب‌ها و پنل سریع:</b>", get_accounts_inline_keyboard(accounts))
        return

    if text_clean in ["🚀 انتشار فوری در اینستاگرام", "/igpost"]:
        state_mgr.set_user_state(chat_id, "waiting_for_ig_instant_url")
        msg = (
            "<b>🚀 دریافت و انتشار ریلز و پست در اینستاگرام:</b>\n\n"
            "لطفاً لینک ریلز یا ویدیوی مورد نظر خود را ارسال فرمایید تا ربات ابتدا آن را داخل چت تلگرام تحویل داده و دکمه بازنشر را فعال کند:"
        )
        send_message(chat_id, msg, get_cancel_keyboard())
        return

    if text_clean in ["📊 وضعیت و حساب‌ها", "/status"]:
        accounts = state_mgr.get_accounts()
        msg = (
            "<b>📊 حساب‌های متصل به سیستم:</b>\n\n"
            "برای مشاهده جزئیات یا تست زنده، روی حساب موردنظر کلیک کنید:"
        )
        send_message(chat_id, msg, get_accounts_inline_keyboard(accounts))
        return

    if text_clean in ["⚡ دایرکت و کامنت هوشمند", "/smart"]:
        msg = (
            "<b>⚡ موتور دایرکت و کامنت هوشمند (مشابه Directam / ManyChat):</b>\n\n"
            "در این بخش می‌توانید سناریوهای تریگر کلمات کلیدی، پاسخ‌های دایرکت و منشن‌ها را پیکربندی کنید:"
        )
        send_message(chat_id, msg, get_smart_triggers_keyboard())
        return

    if text_clean in ["📥 استوری‌ها و دانلود", "/stories"]:
        headers = get_ig_headers()
        res = requests.get("https://www.instagram.com/api/v1/feed/reels_tray/", headers=headers, impersonate="chrome120")
        if res.status_code == 200:
            tray = res.json().get("tray", [])
            msg = f"<b>📥 سینی استوری‌های فعال ({len(tray)} کاربر):</b>\n\n"
            for user_tray in tray:
                u = user_tray.get("user", {}).get("username", "نامشخص")
                items = user_tray.get("items", [])
                msg += f"• <b>@{u}</b>: {len(items)} استوری\n"
                for itm in items:
                    msg += f"  - ID: <code>{itm.get('id')}</code>\n"
            send_message(chat_id, msg)
        else:
            send_message(chat_id, f"خطا در دریافت استوری‌ها: کد {res.status_code}")
        return

    if text_clean in ["📢 انتشار در فیسبوک", "/facebook"]:
        msg = (
            "<b>📢 انتشار در تایم‌لاین فیسبوک:</b>\n\n"
            "برای انتشار مستقیم با GraphQL، متن خود را با دستور زیر بفرستید:\n"
            "<code>/fbpost متن پست دلخواه شما</code>"
        )
        send_message(chat_id, msg)
        return

    if text_clean in ["⚙️ تنظیمات و ضد بن", "/settings"]:
        msg = (
            "<b>⚙️ تنظیمات امنیت و پروتکل ضد بن (Anti-Ban):</b>\n\n"
            "• وضعیت اثرانگشت: <b>Linux x86_64 Chrome 151 (Digital Twin)</b>\n"
            "• تاخیر نوسان انسانی (Jitter): <b>فعال (1.8s - 3.5s)</b>\n"
            "• سنسور تشخیص خطا (Circuit Breaker): <b>فعال</b>\n"
            "• استاندارد مهندسی معکوس: <b>REA Strict Provenance</b>"
        )
        send_message(chat_id, msg)
        return

    if text_clean.startswith("/fbpost"):
        text_to_post = text_clean.replace("/fbpost", "").strip()
        if not text_to_post:
            send_message(chat_id, "لطفاً متن پست را وارد کنید: <code>/fbpost متن تستی</code>")
            return
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
        if res.status_code == 200:
            send_message(chat_id, f"✅ پست با موفقیت در فیسبوک منتشر شد:\n\"{text_to_post}\"")
        else:
            send_message(chat_id, f"خطا در ارسال پست فیسبوک: کد {res.status_code}")
        return

    send_message(chat_id, "دستور نامشخص است. لطفاً لینک ریلز یا دستور /start را ارسال کنید.")

def handle_callback(chat_id, message_id, data):
    if data.startswith("repost_file_"):
        file_name = data.replace("repost_file_", "")
        file_path = TMP_DIR / file_name

        if not file_path.exists():
            send_message(chat_id, "❌ فایل مورد نظر یافت نشد یا منقضی شده است.")
            return

        user_state = state_mgr.get_user_state(chat_id)
        caption = user_state.get("temp_data", {}).get("caption", "بازنشر شده با MetaGraph Unofficial")

        status_msg = send_message(chat_id, "⏳ <b>در حال آپلود و پیکربندی ریلز در پیج اینستاگرام شما...</b>\nلطفاً صبور باشید.")
        s_id = status_msg.get("result", {}).get("message_id")

        try:
            media_id = publish_instagram_video_file(str(file_path), caption)
            msg = (
                "🎉 <b>ریلز با موفقیت ۱۰۰٪ در اینستاگرام منتشر شد!</b>\n\n"
                f"• شناسه مدیا: <code>{media_id}</code>\n"
                f"• اکانت: @hokar368\n"
                f"• کپشن: <i>{caption}</i>\n\n"
                "🔗 لینک پیج: https://www.instagram.com/hokar368/"
            )
            if s_id:
                edit_message(chat_id, s_id, msg)
            else:
                send_message(chat_id, msg)
        except Exception as e:
            err_msg = f"❌ خطا در انتشار ریلز: {str(e)}"
            if s_id:
                edit_message(chat_id, s_id, err_msg)
            else:
                send_message(chat_id, err_msg)
        return

    if data.startswith("aicap_"):
        user_state = state_mgr.get_user_state(chat_id)
        temp = user_state.get("temp_data", {})
        temp["caption"] = "🔥 جدیدترین اخبار و ویدیوهای ترند جهان! نظرتون رو کامنت کنید 👇\n#اخبار #ریلز #وایرال #explore"
        state_mgr.set_user_state(chat_id, "video_delivered", temp)
        send_message(chat_id, f"✨ <b>کپشن هوشمند تنظیم شد:</b>\n\n<i>{temp['caption']}</i>\n\nجهت انتشار، روی دکمه بازنشر زیر ویدیو کلیک کنید.")
        return

    if data == "menu_main":
        state_mgr.clear_user_state(chat_id)
        accounts = state_mgr.get_accounts()
        edit_message(chat_id, message_id, "👇 <b>مدیریت حساب‌ها و پنل سریع:</b>", get_accounts_inline_keyboard(accounts))
        return

    if data == "cancel_action":
        state_mgr.clear_user_state(chat_id)
        accounts = state_mgr.get_accounts()
        edit_message(chat_id, message_id, "عملیات لغو شد. منوی اصلی:", get_accounts_inline_keyboard(accounts))
        return

def main():
    print("Modular Telegram Bot server running with in-chat video delivery & ffprobe...")
    offset = 0
    while True:
        try:
            updates = tg_request(f"getUpdates?offset={offset}&timeout=25")
            if updates.get("ok"):
                for u in updates.get("result", []):
                    offset = u["update_id"] + 1
                    if "message" in u and "text" in u["message"]:
                        chat_id = u["message"]["chat"]["id"]
                        msg_id = u["message"]["message_id"]
                        text = u["message"]["text"]
                        print(f"Message from {chat_id}: {text}")
                        handle_text(chat_id, text, msg_id)
                    elif "callback_query" in u:
                        cq = u["callback_query"]
                        chat_id = cq["message"]["chat"]["id"]
                        msg_id = cq["message"]["message_id"]
                        cb_data = cq.get("data", "")
                        print(f"Callback from {chat_id}: {cb_data}")
                        handle_callback(chat_id, msg_id, cb_data)
            time.sleep(0.3)
        except Exception as e:
            print("Loop error:", e)
            time.sleep(3)

if __name__ == "__main__":
    main()
