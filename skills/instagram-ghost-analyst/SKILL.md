---
name: instagram-ghost-analyst
description: "Instagram Ghost Mode intelligence analyst and reporter using Meta Graph MCP tools. Audits competitor pages, extracts posts, monitors reel views and play counts, calculates engagement rates, and formats professional RTL reports without leaving any footprint."
---

# Instagram Ghost Mode Intelligence Analyst (Skill)

<div dir="rtl">

این اسکیل راهنمای هوش مصنوعی و ایجنت‌ها برای استفاده از ابزارهای **Meta Graph Ghost Mode MCP** جهت استخراج، پایش و تحلیل صفحات اینستاگرام در حالت ۱۰۰٪ روح و ناشناس (بدون ردپا) است.

---

## ۱. ابزارهای در دسترس (MCP Tools)

ایجنت هنگام تحلیل صفحات از ابزارهای زیر که توسط سرور MCP ارائه شده‌اند استفاده می‌کند:

| نام ابزار | کارکرد اصلی | پارامترهای ورودی |
| :--- | :--- | :--- |
| `ghost_get_profile` | استخراج شناسنامه، بیو، آواتار HD، تعداد فالوور و وضعیت پیج | `username` |
| `ghost_get_posts` | استخراج پست‌ها، ریلزها و اسلایدها با امکان صفحه‌بندی (`cursor`) | `username`, `limit`, `feedType`, `cursor` |
| `ghost_get_media_metrics` | استخراج دقیق تعداد پخش (`video_play_count`)، بازدید، لایک، کامنت و ریتنشن | `mediaId` (کد ریلز یا آیدی عددی) |
| `ghost_get_comments` | واکشی ناشناس کامنت‌های یک پست به همراه نام نویسنده و تعداد لایک | `mediaId`, `limit` |
| `ghost_search` | جستجوی مخفیانه یوزرها و هشتگ‌ها بدون ثبت در هیستوری اکانت | `query`, `type` |
| `ghost_explore_viral` | رصد پست‌های وایرال و بحث‌برانگیز اکسپلور با فیلتر نرخ تعامل | `limit`, `minCommentRatio` |
| `ghost_audit_account` | آدیت و گزارش کامل خودکار از عملکرد، میانگین ویوها و نرخ تعامل پیج | `username`, `sampleCount` |

---

## ۲. فرمول‌های استاندارد تحلیل و گزارش‌گیری

هنگام تحلیل داده‌های دریافتی از MCP، محاسبات زیر باید دقیق انجام شده و در گزارش آورده شوند:

### ۲.۱. نرخ تعامل پست‌ها (Engagement Rate):
$$\text{Engagement Rate} = \left( \frac{\text{Likes} + \text{Comments}}{\text{Followers}} \right) \times 100$$

### ۲.۲. نرخ تبدیل تماشا به تعامل در ریلز (View-to-Engagement Ratio):
$$\text{Reel Engagement Rate} = \left( \frac{\text{Likes} + \text{Comments} + \text{Shares} + \text{Saves}}{\text{Plays / Views}} \right) \times 100$$

### ۲.۳. شاخص بحث‌برانگیزی و وایرال (Controversy Score):
$$\text{Controversy Score} = \left( \frac{\text{Comments}}{\max(50, \text{Likes})} \times 70 + \frac{\text{Comments}}{\text{Views}} \times 2000 \right) \times \log_{10}(\text{Comments} + 1)$$

---

## ۳. قالب خروجی گزارش تحلیلی برای کاربر

ایجنت پس از فراخوانی ابزارها موظف است گزارش را کاملاً راست‌چین و در قالب جدول و بخش‌های تفکیک‌شده زیر ارائه دهد:

1. **خلاصه وضعیت پیج (Executive Summary):** فالوور، تعداد کل پست‌ها، نسبت ریلز به پست عکسی.
2. **جدول ۳ ریلز برتر بر اساس بازدید (Top Reels by Plays):** شورت‌کد، تعداد پلی (`video_play_count`)، تعداد لایک، کامنت و موضوع هوک.
3. **پست‌های موتور بحث (Discussion Drivers):** پست‌هایی که نسبت کامنت به لایک بالایی دارند (ایده‌های مناسب برای تولید محتوا).
4. **توصیه استراتژیک:** زمان مناسب انتشار، نقاط ضعف رقبا و فرصت‌های محتوایی.

</div>
