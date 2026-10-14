"""
Telegram Keyboards Suite for MetaGraph Unofficial
Provides persistent Reply Keyboards and high-conversion Inline Keyboards
with clean UI/UX and clear workflow status transitions.
"""

def get_main_reply_keyboard():
    return {
        "keyboard": [
            [
                {"text": "🚀 دریافت و انتشار رسانه"},
                {"text": "📊 حساب‌ها و وضعیت اتصال"}
            ],
            [
                {"text": "⚡ اتوماسیون دایرکت و کامنت"},
                {"text": "📥 سینی استوری‌ها"}
            ],
            [
                {"text": "📢 تایم‌لاین فیسبوک"},
                {"text": "🛡️ تنظیمات و ضد بن"}
            ]
        ],
        "resize_keyboard": True,
        "is_persistent": True
    }

def get_media_action_keyboard(file_name, media_type="video", target_account="@hokar368"):
    pub_text = f"🚀 انتشار روی اینستاگرام ({target_account})" if media_type == "video" else f"🚀 انتشار پست ({target_account})"
    return {
        "inline_keyboard": [
            [
                {"text": pub_text, "callback_data": f"repost_ig_{file_name}"}
            ],
            [
                {"text": "📢 بازنشر در تایم‌لاین فیسبوک", "callback_data": f"repost_fb_{file_name}"}
            ],
            [
                {"text": "✍️ ویرایش کپشن", "callback_data": f"editcap_{file_name}"},
                {"text": "✨ کپشن‌نویس هوش مصنوعی", "callback_data": f"aicap_{file_name}"}
            ],
            [
                {"text": "👤 تغییر حساب مقصد", "callback_data": f"choose_acc_{file_name}"},
                {"text": "🗑️ حذف موقت فایل", "callback_data": f"delfile_{file_name}"}
            ]
        ]
    }

def get_accounts_inline_keyboard(accounts, current_selected=None):
    inline = []
    for acc in accounts:
        status_icon = "🟢" if acc.get("active") else "⚪"
        is_selected = " [انتخاب‌شده]" if current_selected and acc.get("id") == current_selected else ""
        label = f"{status_icon} @{acc.get('username')} ({acc.get('platform').upper()}){is_selected}"
        inline.append([
            {"text": label, "callback_data": f"acc_view_{acc.get('id')}"}
        ])
    
    inline.append([
        {"text": "➕ افزودن حساب جدید", "callback_data": "acc_add"}
    ])
    inline.append([
        {"text": "🔙 بازگشت به داشبورد اصلی", "callback_data": "menu_main"}
    ])
    return {"inline_keyboard": inline}

def get_account_detail_keyboard(acc_id):
    return {
        "inline_keyboard": [
            [
                {"text": "🔄 تست اتصال زنده (Live Verify)", "callback_data": f"acc_verify_{acc_id}"},
                {"text": "📥 استعلام اینباکس و نوتیفیکیشن", "callback_data": f"acc_inbox_{acc_id}"}
            ],
            [
                {"text": "⭐ تنظیم به عنوان حساب پیش‌فرض", "callback_data": f"acc_setdefault_{acc_id}"}
            ],
            [
                {"text": "🔙 بازگشت به فهرست حساب‌ها", "callback_data": "cmd_accounts"}
            ]
        ]
    }

def get_smart_triggers_keyboard():
    return {
        "inline_keyboard": [
            [
                {"text": "🎯 تریگر کلمه کلیدی کامنت", "callback_data": "trig_comment_keyword"},
                {"text": "💬 سناریوی پاسخ خودکار دایرکت", "callback_data": "trig_dm_response"}
            ],
            [
                {"text": "🌟 سناریوی پاسخ به منشن استوری", "callback_data": "trig_story_mention"}
            ],
            [
                {"text": "✨ بهینه‌ساز کپشن با الگوریتم اینستاگرام", "callback_data": "ai_caption_wizard"}
            ],
            [
                {"text": "🔙 بازگشت به داشبورد اصلی", "callback_data": "menu_main"}
            ]
        ]
    }

def get_post_success_keyboard(username="hokar368"):
    return {
        "inline_keyboard": [
            [
                {"text": f"🔗 مشاهده پست در پیج (@{username})", "url": f"https://www.instagram.com/{username}/"}
            ],
            [
                {"text": "🚀 دریافت و انتشار یک رسانه جدید", "callback_data": "start_new_media"},
                {"text": "🏠 داشبورد اصلی", "callback_data": "menu_main"}
            ]
        ]
    }

def get_cancel_keyboard(callback_data="menu_main"):
    return {
        "inline_keyboard": [
            [
                {"text": "❌ انصراف و بازگشت", "callback_data": callback_data}
            ]
        ]
    }
