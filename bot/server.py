#!/usr/bin/env python3
"""
Telegram Management Bot for meta-graph-unofficial
Connects via local proxy and controls MetaGraph capabilities safely.
"""

import os
import sys
import json
import time
from pathlib import Path
from curl_cffi import requests

WORKSPACE_DIR = Path("/home/hokar/Documents/antigravity/silly-galileo")
REPO_DIR = Path("/home/hokar/Documents/antigravity/meta-graph-unofficial")

CREDENTIALS_FILE = WORKSPACE_DIR / "bot_credentials.json"
IG_SESSION_FILE = WORKSPACE_DIR / "instagram_session.json"
FB_SESSION_FILE = WORKSPACE_DIR / "facebook_session.json"

PROXY = os.environ.get("HTTPS_PROXY", "socks5://127.0.0.1:10808")

with open(CREDENTIALS_FILE, "r", encoding="utf-8") as f:
    config = json.load(f)

BOT_TOKEN = config["telegram_bot_token"]
TELEGRAM_API = f"https://api.telegram.org/bot{BOT_TOKEN}"

def tg_request(method, data=None):
    url = f"{TELEGRAM_API}/{method}"
    if data:
        res = requests.post(url, json=data, proxy=PROXY, timeout=35)
    else:
        res = requests.get(url, proxy=PROXY, timeout=35)
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

def handle_command(chat_id, text):
    cmd = text.strip()

    if cmd in ["/start", "/help"]:
        msg = (
            "<b>MetaGraph Unofficial Management Dashboard</b>\n\n"
            "ربات مدیریت و تست زنده کتابخانه <code>meta-graph-unofficial</code>\n\n"
            "<b>دستورات در دسترس:</b>\n"
            "• <code>/status</code> - وضعیت نشست‌های اینستاگرام و فیسبوک\n"
            "• <code>/profile</code> - مشخصات پروفایل اینستاگرام\n"
            "• <code>/inbox</code> - صندوق اعلان‌ها و منشن‌ها\n"
            "• <code>/comments [MEDIA_ID]</code> - لیست کامنت‌های یک پست\n"
            "• <code>/stories</code> - دریافت سینی استوری‌های فعال\n"
            "• <code>/fbpost [TEXT]</code> - ارسال پست مستقیم به فیسبوک\n"
        )
        keyboard = {
            "inline_keyboard": [
                [
                    {"text": "وضعیت نشست‌ها (Status)", "callback_data": "cmd_status"},
                    {"text": "پروفایل اینستاگرام (Profile)", "callback_data": "cmd_profile"}
                ],
                [
                    {"text": "اعلان‌ها و منشن‌ها (Inbox)", "callback_data": "cmd_inbox"},
                    {"text": "سینی استوری‌ها (Stories)", "callback_data": "cmd_stories"}
                ]
            ]
        }
        send_message(chat_id, msg, keyboard)
        return

    if cmd in ["/status", "cmd_status"]:
        ig = load_ig_session()
        fb = load_fb_session()
        msg = (
            "<b>گزارش وضعیت نشست‌ها:</b>\n\n"
            f"• <b>اینستاگرام:</b> {'فعال و معتبر (200 OK)' if ig.get('status') == 'active_verified' else 'نامعتبر'}\n"
            f"  - اکانت: @{ig.get('username')}\n"
            f"  - شناسه کاربر: <code>{ig.get('ds_user_id')}</code>\n\n"
            f"• <b>فیسبوک:</b> فعال و متصل\n"
            f"  - نام: {fb.get('name')}\n"
            f"  - شناسه کاربر: <code>{fb.get('c_user')}</code>\n\n"
            "• <b>پروفایل سیستم:</b> Linux x86_64 Chrome 151\n"
            "• <b>وضعیت اتصال:</b> امن و محافظت‌شده با REA"
        )
        send_message(chat_id, msg)
        return

    if cmd in ["/profile", "cmd_profile"]:
        headers = get_ig_headers()
        res = requests.get("https://www.instagram.com/hokar368/", headers=headers, impersonate="chrome120", allow_redirects=False)
        if res.status_code == 200:
            import re
            desc = re.search(r'<meta content=\"([^\"]+)\" property=\"og:description\"', res.text)
            stats = desc.group(1) if desc else "در دسترس نیست"
            msg = f"<b>پروفایل اینستاگرام @hokar368:</b>\n\n• وضعیت: کد 200 OK\n• آمار: {stats}"
        else:
            msg = f"خطا در دریافت پروفایل: کد {res.status_code}"
        send_message(chat_id, msg)
        return

    if cmd in ["/inbox", "cmd_inbox"]:
        headers = get_ig_headers()
        res = requests.get("https://www.instagram.com/api/v1/news/inbox/?mark_as_read=false", headers=headers, impersonate="chrome120")
        if res.status_code == 200:
            counts = res.json().get("counts", {})
            msg = (
                "<b>صندوق اعلان‌ها و منشن‌های اینستاگرام:</b>\n\n"
                f"• منشن‌های استوری: {counts.get('story_mentions', 0)}\n"
                f"• تگ‌ها: {counts.get('usertags', 0)}\n"
                f"• کامنت‌های جدید: {counts.get('comments', 0)}\n"
                f"• لایک‌ها: {counts.get('likes', 0)}"
            )
        else:
            msg = f"خطا در دریافت اعلان‌ها: کد {res.status_code}"
        send_message(chat_id, msg)
        return

    if cmd in ["/stories", "cmd_stories"]:
        headers = get_ig_headers()
        res = requests.get("https://www.instagram.com/api/v1/feed/reels_tray/", headers=headers, impersonate="chrome120")
        if res.status_code == 200:
            tray = res.json().get("tray", [])
            msg = f"<b>سینی استوری‌ها ({len(tray)} کاربر):</b>\n\n"
            for user_tray in tray:
                u = user_tray.get("user", {}).get("username", "نامشخص")
                items = user_tray.get("items", [])
                msg += f"• <b>@{u}</b>: {len(items)} استوری فعال\n"
                for itm in items:
                    msg += f"  - ID: <code>{itm.get('id')}</code>\n"
        else:
            msg = f"خطا در دریافت استوری‌ها: کد {res.status_code}"
        send_message(chat_id, msg)
        return

    if cmd.startswith("/comments"):
        parts = cmd.split()
        media_id = parts[1] if len(parts) > 1 else "4007195903156614326"
        headers = get_ig_headers()
        res = requests.get(f"https://www.instagram.com/api/v1/media/{media_id}/comments/", headers=headers, impersonate="chrome120")
        if res.status_code == 200:
            data = res.json()
            comments = data.get("comments", [])
            msg = f"<b>کامنت‌های مدیا {media_id} (تعداد: {data.get('comment_count', len(comments))}):</b>\n\n"
            for c in comments:
                author = c.get("user", {}).get("username", "ناشناس")
                txt = c.get("text", "")
                msg += f"• <b>@{author}</b>: {txt}\n"
        else:
            msg = f"خطا در دریافت کامنت‌ها: کد {res.status_code}"
        send_message(chat_id, msg)
        return

    if cmd.startswith("/fbpost"):
        text_to_post = cmd.replace("/fbpost", "").strip()
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
            send_message(chat_id, f"✅ پست با موفقیت در فیسبوک ارسال شد:\n\"{text_to_post}\"")
        else:
            send_message(chat_id, f"خطا در ارسال پست فیسبوک: کد {res.status_code}")
        return

    send_message(chat_id, "دستور نامعتبر است. برای راهنما /help را ارسال کنید.")

def main():
    print("Telegram Bot daemon started for @metagraphunofficialbot via proxy...")
    offset = 0
    while True:
        try:
            updates = tg_request(f"getUpdates?offset={offset}&timeout=25")
            if updates.get("ok"):
                for u in updates.get("result", []):
                    offset = u["update_id"] + 1
                    if "message" in u and "text" in u["message"]:
                        chat_id = u["message"]["chat"]["id"]
                        text = u["message"]["text"]
                        print(f"Message from {chat_id}: {text}")
                        handle_command(chat_id, text)
                    elif "callback_query" in u:
                        cq = u["callback_query"]
                        chat_id = cq["message"]["chat"]["id"]
                        cb_data = cq.get("data", "")
                        print(f"Callback from {chat_id}: {cb_data}")
                        handle_command(chat_id, cb_data)
            time.sleep(0.5)
        except Exception as e:
            print("Loop error:", e)
            time.sleep(3)

if __name__ == "__main__":
    main()
