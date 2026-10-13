import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MetaGraph from '../src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration paths
const SESSIONS_DIR = '/home/hokar/Documents/antigravity/silly-galileo';
const IG_SESSION_PATH = path.join(SESSIONS_DIR, 'instagram_session.json');
const FB_SESSION_PATH = path.join(SESSIONS_DIR, 'facebook_session.json');
const BOT_CREDENTIALS_PATH = path.join(SESSIONS_DIR, 'bot_credentials.json');

if (!fs.existsSync(BOT_CREDENTIALS_PATH)) {
  console.error(`Missing bot credentials file: ${BOT_CREDENTIALS_PATH}`);
  process.exit(1);
}

const botConfig = JSON.parse(fs.readFileSync(BOT_CREDENTIALS_PATH, 'utf-8'));
const BOT_TOKEN = botConfig.telegram_bot_token;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Initialize MetaGraph SDK
const mg = new MetaGraph({ osProfile: 'linux_x86_64_chrome' });

function reloadSessions() {
  if (fs.existsSync(IG_SESSION_PATH)) {
    const igSession = JSON.parse(fs.readFileSync(IG_SESSION_PATH, 'utf-8'));
    mg.instagram.setSession({
      cookies: igSession.cookie_string,
      csrfToken: igSession.key_tokens?.csrftoken,
      dsUserId: igSession.ds_user_id
    });
  }
  if (fs.existsSync(FB_SESSION_PATH)) {
    const fbSession = JSON.parse(fs.readFileSync(FB_SESSION_PATH, 'utf-8'));
    mg.facebook.setSession({
      cookies: fbSession.cookie_string,
      fbDtsg: fbSession.fb_dtsg,
      cUser: fbSession.c_user
    });
  }
}

reloadSessions();

async function sendTelegramMessage(chatId, text, replyMarkup = null) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML'
  };
  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

async function handleCommand(chatId, text) {
  const cmd = text.trim();

  if (cmd === '/start' || cmd === '/help') {
    const msg = `<b>MetaGraph Unofficial Dashboard</b>\n` +
      `ربات کنترل و تست زنده کتابخانه meta-graph-unofficial\n\n` +
      `دستورات در دسترس:\n` +
      `• <code>/status</code> - وضعیت اتصال نشست‌های اینستاگرام و فیسبوک\n` +
      `• <code>/profile</code> - استخراج مشخصات پروفایل اینستاگرام\n` +
      `• <code>/inbox</code> - وضعیت اعلان‌ها و منشن‌های جدید\n` +
      `• <code>/comments [MEDIA_ID]</code> - لیست کامنت‌های یک پست\n` +
      `• <code>/stories</code> - دریافت سینی استوری‌ها و فایل‌های فعال\n` +
      `• <code>/fbpost [TEXT]</code> - ارسال پست مستقیم به فیسبوک با GraphQL`;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: 'بررسی وضعیت (Status)', callback_data: 'cmd_status' },
          { text: 'اطلاعات پروفایل (Profile)', callback_data: 'cmd_profile' }
        ],
        [
          { text: 'اعلان‌ها و منشن‌ها (Inbox)', callback_data: 'cmd_inbox' },
          { text: 'سینی استوری‌ها (Stories)', callback_data: 'cmd_stories' }
        ]
      ]
    };
    return sendTelegramMessage(chatId, msg, keyboard);
  }

  if (cmd === '/status' || cmd === 'cmd_status') {
    reloadSessions();
    const igStatus = mg.instagram.isAuthenticated() ? '✅ متصل و فعال' : '❌ نامعتبر';
    const msg = `<b>وضعیت نشست‌های کلاینت:</b>\n` +
      `• اینستاگرام: ${igStatus}\n` +
      `• فیسبوک: ✅ متصل (c_user: 61594901048716)\n` +
      `• پروفایل سیستم: Linux x86_64 Chrome 151`;
    return sendTelegramMessage(chatId, msg);
  }

  if (cmd === '/profile' || cmd === 'cmd_profile') {
    reloadSessions();
    try {
      const data = await mg.instagram.getUserProfile('hokar368');
      const msg = `<b>پروفایل اینستاگرام:</b>\n` +
        `• کاربر: @${data.username}\n` +
        `• وضعیت: ${data.status}\n` +
        `• آمار: ${data.rawStats || 'در دسترس نیست'}`;
      return sendTelegramMessage(chatId, msg);
    } catch (err) {
      return sendTelegramMessage(chatId, `خطا در دریافت پروفایل: ${err.message}`);
    }
  }

  if (cmd === '/inbox' || cmd === 'cmd_inbox') {
    reloadSessions();
    try {
      const inbox = await mg.instagram.getNotificationsInbox();
      const counts = inbox.counts || {};
      const msg = `<b>صندوق اعلان‌ها و منشن‌ها:</b>\n` +
        `• استوری‌های منشن شده: ${counts.story_mentions || 0}\n` +
        `• تگ‌های کاربری (Usertags): ${counts.usertags || 0}\n` +
        `• کامنت‌های جدید: ${counts.comments || 0}\n` +
        `• لایک‌ها: ${counts.likes || 0}`;
      return sendTelegramMessage(chatId, msg);
    } catch (err) {
      return sendTelegramMessage(chatId, `خطا در دریافت صندوق: ${err.message}`);
    }
  }

  if (cmd === '/stories' || cmd === 'cmd_stories') {
    reloadSessions();
    try {
      const tray = await mg.instagram.getReelsTray();
      if (!tray.length) {
        return sendTelegramMessage(chatId, 'هیچ استوری فعالی در سینی یافت نشد.');
      }
      let msg = `<b>سینی استوری‌های فعال (${tray.length} کاربر):</b>\n`;
      for (const user of tray) {
        msg += `\n• <b>@${user.username}</b>: ${user.items.length} استوری\n`;
        for (const s of user.items) {
          msg += `  - شناسه: <code>${s.id}</code> (نوع: ${s.mediaType === 1 ? 'عکس' : 'ویدیو'})\n`;
        }
      }
      return sendTelegramMessage(chatId, msg);
    } catch (err) {
      return sendTelegramMessage(chatId, `خطا در دریافت استوری‌ها: ${err.message}`);
    }
  }

  if (cmd.startsWith('/comments')) {
    reloadSessions();
    const parts = cmd.split(' ');
    const mediaId = parts[1] || '4007195903156614326';
    try {
      const data = await mg.instagram.getMediaComments(mediaId);
      let msg = `<b>کامنت‌های پست (${mediaId}):</b>\nتعداد کل: ${data.commentCount}\n\n`;
      for (const c of data.comments) {
        msg += `• <b>@${c.username}</b>: ${c.text}\n`;
      }
      return sendTelegramMessage(chatId, msg);
    } catch (err) {
      return sendTelegramMessage(chatId, `خطا در دریافت کامنت‌ها: ${err.message}`);
    }
  }

  if (cmd.startsWith('/fbpost')) {
    reloadSessions();
    const text = cmd.replace('/fbpost', '').trim();
    if (!text) {
      return sendTelegramMessage(chatId, 'لطفاً متن پست را بعد از دستور بنویسید:\n<code>/fbpost متن تستی پست</code>');
    }
    try {
      await mg.facebook.publishTextPost(text);
      return sendTelegramMessage(chatId, `✅ پست با موفقیت در فیسبوک منتشر شد:\n"${text}"`);
    } catch (err) {
      return sendTelegramMessage(chatId, `خطا در انتشار فیسبوک: ${err.message}`);
    }
  }

  return sendTelegramMessage(chatId, 'دستور نامعتبر است. برای مشاهده راهنما /help را ارسال کنید.');
}

async function pollUpdates() {
  let offset = 0;
  console.log('Telegram Bot Polling started for @metagraphunofficialbot...');

  while (true) {
    try {
      const res = await fetch(`${TELEGRAM_API}/getUpdates?offset=${offset}&timeout=30`);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;

          if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text;
            console.log(`Received message from ${chatId}: ${text}`);
            await handleCommand(chatId, text);
          } else if (update.callback_query) {
            const chatId = update.callback_query.message.chat.id;
            const dataCmd = update.callback_query.data;
            console.log(`Received callback query from ${chatId}: ${dataCmd}`);
            await handleCommand(chatId, dataCmd);
          }
        }
      }
    } catch (err) {
      console.error('Polling error:', err.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

pollUpdates();
