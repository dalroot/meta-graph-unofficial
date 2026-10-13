"""
Telegram Keyboards (Persistent Reply Keyboard + Rich Inline Keyboards)
"""

def get_main_reply_keyboard():
    return {
        "keyboard": [
            [
                {"text": "📊 وضعیت و حساب‌ها"},
                {"text": "⚡ دایرکت و کامنت هوشمند"}
            ],
            [
                {"text": "🚀 انتشار فوری در اینستاگرام"},
                {"text": "📢 انتشار در فیسبوک"}
            ],
            [
                {"text": "📥 استوری‌ها و دانلود"},
                {"text": "⚙️ تنظیمات و ضد بن"}
            ]
        ],
        "resize_keyboard": True,
        "is_persistent": True
    }

def get_accounts_inline_keyboard(accounts):
    inline = []
    for acc in accounts:
        status_icon = "🟢" if acc.get("active") else "🔴"
        label = f"{status_icon} @{acc.get('username')} ({acc.get('platform')})"
        inline.append([
            {"text": label, "callback_data": f"acc_view_{acc.get('id')}"}
        ])
    
    inline.append([
        {"text": "➕ افزودن حساب جدید", "callback_data": "acc_add"}
    ])
    inline.append([
        {"text": "🔙 بازگشت به منوی اصلی", "callback_data": "menu_main"}
    ])
    return {"inline_keyboard": inline}

def get_smart_triggers_keyboard():
    return {
        "inline_keyboard": [
            [
                {"text": "🎯 تعریف کلمه کلیدی کامنت", "callback_data": "trig_comment_keyword"},
                {"text": "💬 تنظیم پاسخ دایرکت", "callback_data": "trig_dm_response"}
            ],
            [
                {"text": "🌟 سناریوی منشن استوری", "callback_data": "trig_story_mention"}
            ],
            [
                {"text": "✨ کپشن‌ساز هوشمند هوش مصنوعی", "callback_data": "ai_caption_wizard"}
            ],
            [
                {"text": "🔙 بازگشت", "callback_data": "menu_main"}
            ]
        ]
    }

def get_account_detail_keyboard(acc_id):
    return {
        "inline_keyboard": [
            [
                {"text": "🔄 تست اتصال زنده (Verify)", "callback_data": f"acc_verify_{acc_id}"},
                {"text": "📋 آمار و اینباکس", "callback_data": f"acc_inbox_{acc_id}"}
            ],
            [
                {"text": "🗑️ حذف حساب از بات", "callback_data": f"acc_delete_{acc_id}"}
            ],
            [
                {"text": "🔙 لیست حساب‌ها", "callback_data": "cmd_accounts"}
            ]
        ]
    }

def get_cancel_keyboard():
    return {
        "inline_keyboard": [
            [
                {"text": "❌ انصراف و بازگشت", "callback_data": "cancel_action"}
            ]
        ]
    }
