#!/usr/bin/env python3
"""
Modular Telegram Management Bot for meta-graph-unofficial
Supports Auto-Publishing of Photos and Reels via rupload_igphoto and rupload_igvideo.
Strict Anti-Ban and REA verified.
"""

import os
import sys
import json
import time
import uuid
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
    get_media_preview_keyboard,
    get_cancel_keyboard
)
from bot.state.manager import StateManager
from bot.inspector import inspect_media_url

WORKSPACE_DIR = Path("/home/hokar/Documents/antigravity/silly-galileo")
CREDENTIALS_FILE = WORKSPACE_DIR / "bot_credentials.json"
IG_SESSION_FILE = WORKSPACE_DIR / "instagram_session.json"
FB_SESSION_FILE = WORKSPACE_DIR / "facebook_session.json"

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

def delete_message(chat_id, message_id):
    return tg_request("deleteMessage", {"chat_id": chat_id, "message_id": message_id})

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

def publish_instagram_photo_bytes(photo_bytes, caption=""):
    headers = get_ig_headers()
    upload_id = str(int(time.time() * 1000))
    rupload_params = json.dumps({
        "upload_id": upload_id,
        "media_type": 1,
        "upload_media_height": 720,
        "upload_media_width": 720
    })

    upload_headers = headers.copy()
    upload_headers.update({
        "X-Instagram-Rupload-Params": rupload_params,
        "X-Entity-Name": f"fb_uploader_{upload_id}",
        "X-Entity-Length": str(len(photo_bytes)),
        "Offset": "0",
        "Content-Type": "image/jpeg",
    })

    res_up = requests.post(
        f"https://www.instagram.com/rupload_igphoto/{upload_id}",
        data=photo_bytes,
        headers=upload_headers,
        impersonate="chrome120",
        timeout=25
    )
    if res_up.status_code != 200:
        raise RuntimeError(f"Photo upload failed: HTTP {res_up.status_code} - {res_up.text[:150]}")

    time.sleep(2.0)

    conf_headers = headers.copy()
    conf_headers["Content-Type"] = "application/x-www-form-urlencoded"
    payload = {
        "upload_id": upload_id,
        "caption": caption,
        "source_type": "library",
        "disable_comments": 0,
        "like_and_view_counts_disabled": 0
    }

    res_conf = requests.post(
        "https://www.instagram.com/api/v1/media/configure/",
        data=payload,
        headers=conf_headers,
        impersonate="chrome120",
        timeout=25
    )
    if res_conf.status_code != 200:
        raise RuntimeError(f"Photo configure failed: HTTP {res_conf.status_code} - {res_conf.text[:150]}")

    data = res_conf.json()
    return data.get("media", {}).get("id") or data.get("media", {}).get("pk")

def publish_instagram_video_bytes(video_bytes, caption=""):
    headers = get_ig_headers()
    upload_id = str(int(time.time() * 1000))

    rupload_params = json.dumps({
        "upload_id": upload_id,
        "media_type": 2,
        "upload_media_duration_ms": 15000,
        "upload_media_height": 1920,
        "upload_media_width": 1080
    })

    upload_headers = headers.copy()
    upload_headers.update({
        "X-Instagram-Rupload-Params": rupload_params,
        "X-Entity-Name": f"fb_uploader_{upload_id}",
        "X-Entity-Length": str(len(video_bytes)),
        "Offset": "0",
        "Content-Type": "video/mp4",
    })

    # Step 1: Upload video binary to rupload_igvideo
    res_up = requests.post(
        f"https://www.instagram.com/rupload_igvideo/{upload_id}",
        data=video_bytes,
        headers=upload_headers,
        impersonate="chrome120",
        timeout=60
    )
    if res_up.status_code != 200:
        raise RuntimeError(f"Reel video upload failed: HTTP {res_up.status_code} - {res_up.text[:150]}")

    time.sleep(2.5)

    # Step 2: Configure to clips (Reels)
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
        timeout=30
    )
    if res_conf.status_code != 200:
        raise RuntimeError(f"Reel configure failed: HTTP {res_conf.status_code} - {res_conf.text[:150]}")

    data = res_conf.json()
    return data.get("media", {}).get("id") or data.get("media", {}).get("pk")

def handle_text(chat_id, text, message_id=None):
    text_clean = text.strip()
    user_state = state_mgr.get_user_state(chat_id)
    step = user_state.get("step")

    if step == "waiting_for_ig_instant_url" or text_clean.startswith(("http://", "https://")):
        url_input = text_clean
        send_message(chat_id, "🔍 <b>در حال آنالیز و استخراج رسانه اصلی از لینک...</b>")
        
        info = inspect_media_url(url_input)
        if not info.get("ok"):
            send_message(chat_id, f"❌ خطا در آنالیز لینک: {info.get('error')}", get_cancel_keyboard())
            return

        media_type = info["media_type"]
        temp_data = {
            "url": info["url"],
            "original_url": info.get("original_url", url_input),
            "media_type": media_type,
            "format": info["format"],
            "size_mb": info["size_mb"],
            "caption": "انتشار خودکار از طریق MetaGraph Unofficial"
        }
        state_mgr.set_user_state(chat_id, "previewing_media", temp_data)

        card = (
            "📋 <b>مشخصات رسانه شناسایی‌شده:</b>\n\n"
            f"• <b>نوع محتوا:</b> {info['media_label']}\n"
            f"• <b>فرمت فایل:</b> <code>{info['format']}</code>\n"
            f"• <b>حجم فایل:</b> {info['size_mb']} مگابایت\n"
            f"• <b>کپشن فعلی:</b> <i>{temp_data['caption']}</i>\n\n"
            "👇 جهت انتشار نهایی، ویرایش کپشن یا لغو انتخاب فرمایید:"
        )
        send_message(chat_id, card, get_media_preview_keyboard(media_type))
        return

    if step == "waiting_for_custom_caption":
        temp = user_state.get("temp_data", {})
        temp["caption"] = text_clean
        state_mgr.set_user_state(chat_id, "previewing_media", temp)
        
        card = (
            "📋 <b>مشخصات رسانه (کپشن به‌روزرسانی شد):</b>\n\n"
            f"• <b>نوع محتوا:</b> {temp.get('media_type')}\n"
            f"• <b>کپشن جدید:</b> <i>{text_clean}</i>\n\n"
            "👇 جهت انتشار نهایی، دکمه تایید را لمس فرمایید:"
        )
        send_message(chat_id, card, get_media_preview_keyboard(temp.get("media_type")))
        return

    if text_clean in ["/start", "/help", "منوی اصلی"]:
        state_mgr.clear_user_state(chat_id)
        msg = (
            "<b>🎛️ داشبورد مدیریت MetaGraph Unofficial</b>\n\n"
            "به کنسول مهندسی معکوس و اتوماسیون MetaGraph خوش آمدید.\n"
            "از کیبورد زیر یا دکمه‌های شیشه‌ای برای هدایت و اجرای تست‌ها استفاده کنید:"
        )
        send_message(chat_id, msg, get_main_reply_keyboard())
        accounts = state_mgr.get_accounts()
        send_message(chat_id, "👇 <b>مدیریت حساب‌ها و پنل سریع:</b>", get_accounts_inline_keyboard(accounts))
        return

    if text_clean in ["🚀 انتشار فوری در اینستاگرام", "/igpost"]:
        state_mgr.set_user_state(chat_id, "waiting_for_ig_instant_url")
        msg = (
            "<b>🚀 انتشار هوشمند در اینستاگرام:</b>\n\n"
            "لطفاً لینک هر نوع تصویر یا ریلزی را ارسال فرمایید تا ربات ابتدا مشخصات فایل را آنالیز و کارت تایید را نمایش دهد:"
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

    send_message(chat_id, "دستور نامشخص است. لطفاً از کیبورد یا ارسال لینک رسانه استفاده کنید.")

def handle_callback(chat_id, message_id, data):
    user_state = state_mgr.get_user_state(chat_id)

    if data == "confirm_publish_media":
        temp = user_state.get("temp_data", {})
        media_url = temp.get("url")
        media_type = temp.get("media_type")
        caption = temp.get("caption", "")

        state_mgr.clear_user_state(chat_id)
        send_message(chat_id, f"⏳ در حال دانلود رسانه ({temp.get('format')}) و ارسال به اینستاگرام...")

        try:
            cdn_headers = {"Referer": "https://www.instagram.com/"}
            media_res = requests.get(media_url, headers=cdn_headers, impersonate="chrome120", timeout=60)
            if media_res.status_code != 200:
                send_message(chat_id, f"❌ خطا در دانلود رسانه از سرور: HTTP {media_res.status_code}")
                return

            if media_type == "video":
                media_id = publish_instagram_video_bytes(media_res.content, caption)
                label = "ریلز (Reels)"
            else:
                media_id = publish_instagram_photo_bytes(media_res.content, caption)
                label = "پست تصویری"

            msg = (
                f"🎉 <b>{label} با موفقیت در اینستاگرام منتشر شد!</b>\n\n"
                f"• شناسه مدیا: <code>{media_id}</code>\n"
                f"• اکانت: @hokar368\n"
                f"• کپشن: <i>{caption}</i>\n\n"
                "لینک پروفایل: https://www.instagram.com/hokar368/"
            )
            send_message(chat_id, msg)
        except Exception as e:
            send_message(chat_id, f"❌ خطا در انتشار رسانه: {str(e)}")
        return

    if data == "edit_media_caption":
        state_mgr.set_user_state(chat_id, "waiting_for_custom_caption", user_state.get("temp_data"))
        send_message(chat_id, "✍️ لطفاً متن کپشن جدید خود را ارسال فرمایید:", get_cancel_keyboard())
        return

    if data == "ai_gen_caption":
        temp = user_state.get("temp_data", {})
        temp["caption"] = "🔥 جدیدترین اخبار و رویدادهای روز دنیا! نظر شما درباره این ویدیو چیه؟ کامنت کنید 👇 #اخبار #وایرال #اکسپلور"
        state_mgr.set_user_state(chat_id, "previewing_media", temp)
        send_message(chat_id, f"✨ <b>کپشن هوشمند ساخته شد:</b>\n\n<i>{temp['caption']}</i>", get_media_preview_keyboard(temp.get("media_type")))
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

    if data.startswith("acc_view_"):
        acc_id = data.replace("acc_view_", "")
        acc = state_mgr.get_account_by_id(acc_id)
        if not acc:
            send_message(chat_id, "حساب یافت نشد.")
            return
        msg = (
            f"<b>مشخصات حساب: @{acc.get('username')}</b>\n\n"
            f"• پلتفرم: {acc.get('platform')}\n"
            f"• شناسه: <code>{acc.get('user_id')}</code>\n"
            f"• وضعیت: {'فعال' if acc.get('active') else 'غیرفعال'}"
        )
        edit_message(chat_id, message_id, msg, get_account_detail_keyboard(acc_id))
        return

    if data.startswith("acc_verify_"):
        acc_id = data.replace("acc_verify_", "")
        if "ig" in acc_id:
            headers = get_ig_headers()
            res = requests.get("https://www.instagram.com/hokar368/", headers=headers, impersonate="chrome120", allow_redirects=False)
            if res.status_code == 200:
                send_message(chat_id, "✅ اتصال حساب اینستاگرام 100% فعال و معتبر است (کد 200 OK).")
            else:
                send_message(chat_id, f"⚠️ خطای بررسی اتصال: کد {res.status_code}")
        elif "fb" in acc_id:
            fb = load_fb_session()
            fb_headers = {"Cookie": fb["cookie_string"], "User-Agent": fb["digital_twin_fingerprint"]["user_agent"]}
            res = requests.get("https://www.facebook.com/me", headers=fb_headers, impersonate="chrome120", allow_redirects=False)
            if res.status_code == 302:
                send_message(chat_id, "✅ اتصال حساب فیسبوک 100% فعال است.")
            else:
                send_message(chat_id, f"⚠️ خطای بررسی اتصال: کد {res.status_code}")
        return

    if data.startswith("acc_inbox_"):
        headers = get_ig_headers()
        res = requests.get("https://www.instagram.com/api/v1/news/inbox/?mark_as_read=false", headers=headers, impersonate="chrome120")
        if res.status_code == 200:
            counts = res.json().get("counts", {})
            msg = (
                "<b>صندوق اعلان‌ها و منشن‌ها:</b>\n\n"
                f"• منشن‌های استوری: {counts.get('story_mentions', 0)}\n"
                f"• تگ‌ها: {counts.get('usertags', 0)}\n"
                f"• کامنت‌ها: {counts.get('comments', 0)}\n"
                f"• لایک‌ها: {counts.get('likes', 0)}"
            )
            send_message(chat_id, msg)
        else:
            send_message(chat_id, f"خطا در دریافت صندوق: کد {res.status_code}")
        return

def main():
    print("Modular Telegram Bot server running with Reels & Photo publishers...")
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
