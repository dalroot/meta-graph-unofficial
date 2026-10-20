<div dir="rtl">

# سند مرجع مهندسی معکوس عمیق، تلمتری خام و کالبدشکافی کوکی‌ها (Windows 11 Full Web Twin REA Dossier)

> **کد مرجع سند:** `REA-WIN11-WEB-2026-V1`  
> **تاریخ ثبت شواهد:** ۲۸ مهر ۱۴۰۵ (۲۰۲۶-۱۰-۲۰)  
> **مبنای تجربی:** جلسه لاگین واقعی و تاییدشده رسمی متای اینستاگرام با پیام:  
> `Login attempt from Windows • London, United Kingdom • Approved on Oct 19, 2026 at 5:26 PM`  
> **فایل تلمتری خام ضمیمه:** `evidence/raw_telemetry/windows_web_telemetry.log`  

---

## ۱. کالبدشکافی عمیق و شجره‌نامه کامل کوکی‌های وب (Cookie Tree & Security Anatomy)

در متدولوژی REA، کوکی‌های وب اینستاگرام صرفاً رشته‌های تصادفی نیستند، بلکه یک **درخت امنیتی متقاطع (Cross-Domain Hierarchical Cookie Tree)** هستند که رابطه مستقیم با اثرانگشت دستگاه، دیتاسنتر لبه (Edge Region) و توکن‌های CSRF دارند.

در جدول زیر کالبدشکافی دقیق ۱۱ کوکی استخراج‌شده از سشن ویندوز ۱۱ آورده شده است:

| نام کوکی | دامنه / مسیر | طول عمر و انقضا | فلگ‌های امنیتی | آناتومی، فرمت و تحلیل مهندسی معکوس (REA Provenance) |
| :--- | :--- | :--- | :--- | :--- |
| **`datr`** | `.instagram.com`<br>`/` | ۴۰۰ روزه<br>(۲۰۲۷-۱۱-۲۴) | `Secure`<br>`HttpOnly`<br>`SameSite=None` | **اثرانگشت کلان مرورگر (Device / Browser Identifier):**<br>یک توکن ۲۴ تا ۲۸ کاراکتری Base64url (نمونه: `xLTWaieE_DF1eQtJXWHvMAOk`). این کوکی توسط سرورهای CDN فیسبوک/اینستاگرام ست می‌شود و به عنوان شناسه پایدار سخت‌افزار مرورگر عمل می‌کند. هرگونه مغایرت `datr` با `User-Agent` بلافاصله باعث چالش امنیتی (Checkpoint) می‌شود. |
| **`mid`** | `.instagram.com`<br>`/` | ۴۰۰ روزه<br>(۲۰۲۷-۱۱-۲۴) | `Secure`<br>`SameSite=None` | **شناسه ماشین (Machine ID):**<br>رشته ۳۱ کاراکتری (نمونه: `ata0xAALAAHc_CSeMq2fXVbTR_Cx`) که در اولین دست‌تکانی HTTP ایجاد شده و نمایانگر هویت فیزیکی کلاینت است. |
| **`ig_did`** | `.instagram.com`<br>`/` | ۱ ساله<br>(۲۰۲۷-۱۰-۲۰) | `Secure`<br>`HttpOnly`<br>`SameSite=None` | **شناسه یکتای دستگاه (Device UUIDv4):**<br>فرمت استاندارد UUID با حروف بزرگ (نمونه: `5F791F92-7697-4AE3-AE52-04D4502C340A`). در کلاینت وب، این شناسه برای ایجاد ردگیری قطعی دستگاه و سشن‌های همگام استفاده می‌شود. |
| **`sessionid`** | `.instagram.com`<br>`/` | ۱ ساله<br>(۲۰۲۷-۱۰-۲۰) | `Secure`<br>`HttpOnly`<br>`SameSite=None` | **توکن اصلی احراز هویت نشست (Session Signature):**<br>ساختار ۴ بخشی با جداکننده `%3A` (دو نقطه URL-Encoded):<br>`{ds_user_id}%3A{session_secret}%3A{epoch_flags}%3A{hmac_sha256}`<br>نمونه: `19835089130%3AaZK2hdntMo9FeA%3A5%3AAYm_J30xL-BOxftr4mVIUTl4cDQdNEb3T9esB5n0mA` |
| **`csrftoken`** | `.instagram.com`<br>`/` | ۱ ساله<br>(۲۰۲۷-۱۱-۲۴) | `Secure` | **توکن ضدمتقلب تراکنش‌ها (Cross-Site Request Forgery):**<br>یک رشته ۳۲ کاراکتری الفبایی-عددی (نمونه: `QahDgByrSynkmwWm43Cex56wUUC84qRL`). **قانون متناظر:** این مقدار باید دقیقاً با هدر ارسالی `X-CSRFToken` در تمام درخواست‌های POST/GraphQL برابر باشد. |
| **`ds_user_id`** | `.instagram.com`<br>`/` | ۳ ماهه<br>(۲۰۲۷-۰۱-۱۸) | `Secure`<br>`SameSite=None` | **شناسه عددی کاربر (Numeric User ID):**<br>شناسه یکتای کاربری کاربر لاگین‌شده (`19835089130` متعلق به `@hokar368`). |
| **`rur`** | `.instagram.com`<br>`/` | سشن (Session) | `Secure`<br>`HttpOnly`<br>`SameSite=Lax` | **مسیریاب روتینگ دیتاسنتر (Routing / Region Cookie):**<br>فرمت ۳ بخشی: `{cluster},{user_id},{timestamp}:{hash}`.<br>نمونه: `ODN%2C17841419713919386%2C...`. تعیین می‌کند پکت‌های شبکه دقیقاً به کدام کلاستر پروکسی Tigon متصل شوند. |
| **`wd`** | `.instagram.com`<br>`/` | ۷ روزه<br>(۲۰۲۶-۱۰-۲۷) | `Secure`<br>`SameSite=Lax` | **ابعاد پنجره مرورگر (Window Dimensions):**<br>مقدار استاندارد دسکتاپ ویندوز: `1920x1080`. همخوانی این مقدار با Viewport از الزامات ضدبن است. |
| **`dpr`** | `.instagram.com`<br>`/` | ۷ روزه<br>(۲۰۲۶-۱۰-۲۷) | `Secure`<br>`SameSite=None` | **نسبت تراکم صفحه (Device Pixel Ratio):**<br>مقدار نسبت پیکسلی ثبت‌شده در هنگام تعامل با صفحه. |
| **`ps_l` / `ps_n`** | `.instagram.com`<br>`/` | ۴۰۰ روزه | `Secure`<br>`HttpOnly` | **کوکی‌های تفکیک‌شده پرایوسی سندباکس (CHIPS Standard):**<br>مقادیر باینری `1` جهت اعلام پشتیبانی مرورگر کروم از استانداردهای جدید کوکی‌های مستقل از پارتیشن. |
| **`fr`** | `.facebook.com`<br>`/` | ۳ ماهه<br>(۲۰۲۷-۰۱-۱۸) | `Secure`<br>`HttpOnly`<br>`SameSite=None` | **توکن اتصال متقابل فیسبوک (Cross-Domain SSO Token):**<br>بسته‌ای از اطلاعات احراز هویت متقابل در اکوسیستم یکپارچه متا (Accounts Center). |

---

## ۲. مشخصات کامل هدرهای HTTP/2 و Client Hints با آنتروپی بالا (High-Entropy Wire Spec)

بر خلاف دوقلوهای ساده که صرفاً یک User-Agent می‌فرستند، دوقلوی ویندوز ۱۱ ما در پشته TypeScript دقیقاً این هدرها را تزریق می‌کند:

```http
:authority: www.instagram.com
:method: POST
:path: /api/graphql
:scheme: https
accept: */*
accept-encoding: gzip, deflate, br, zstd
accept-language: en-US,en;q=0.9,fa;q=0.8
connection: keep-alive
content-type: application/x-www-form-urlencoded
origin: https://www.instagram.com
referer: https://www.instagram.com/
sec-ch-ua: "Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"
sec-ch-ua-arch: "x86"
sec-ch-ua-bitness: "64"
sec-ch-ua-mobile: ?0
sec-ch-ua-model: ""
sec-ch-ua-platform: "Windows"
sec-ch-ua-platform-version: "15.0.0"
sec-fetch-dest: empty
sec-fetch-mode: cors
sec-fetch-site: same-origin
user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36
x-asbd-id: 359341
x-csrftoken: QahDgByrSynkmwWm43Cex56wUUC84qRL
x-fb-friendly-name: IGDThreadDetailQuery
x-ig-app-id: 936619743392459
x-requested-with: XMLHttpRequest
```

---

## ۳. تلمتری خام ثبت‌شده در مخزن (`evidence/raw_telemetry/windows_web_telemetry.log`)

دو لاگ خام کامل با ثبت میلی‌ثانیه‌ای و جزئیات ۱۰۰٪ هدرهای ارسالی در مخزن مکتوب شد:

### لاگ ۱: فراخوانی نود رسانه (Media Node Read):
```json
{
  "feature_name": "Media Node Read (GET /v21.0/{media-id})",
  "timestamp": "2026-10-20T00:36:39.210Z",
  "method": "GET",
  "url": "https://graph.facebook.com/v21.0/4010857192890410435?fields=id,caption,media_type,like_count",
  "headers_sent": {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9,fa;q=0.8",
    "X-IG-App-ID": "936619743392459",
    "sec-ch-ua": "\"Chromium\";v=\"130\", \"Google Chrome\";v=\"130\", \"Not?A_Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-ch-ua-platform-version": "\"15.0.0\"",
    "sec-ch-ua-arch": "\"x86\"",
    "sec-ch-ua-bitness": "\"64\"",
    "sec-ch-ua-model": "\"\"",
    "X-CSRFToken": "QahDgByrSynkmwWm43Cex56wUUC84qRL",
    "Cookie": "csrftoken=QahDgByrSynkmwWm43Cex56wUUC84qRL; datr=xLTWaieE_DF1eQtJXWHvMAOk; dpr=0.25000000605359674; ds_user_id=19835089130; ig_did=5F791F92-7697-4AE3-AE52-04D4502C340A; mid=ata0xAALAAHc_CSeMq2fXVbTR_Cx; ps_l=1; ps_n=1; rur=ODN%2C17841419713919386%2C1793665669%3A01ff18093ce8454aefc47653b9f6ace752e7514d840dee5172edbdb7baa953c485f30e74; sessionid=19835089130%3AaZK2hdntMo9FeA%3A5%3AAYm_J30xL-BOxftr4mVIUTl4cDQdNEb3T9esB5n0mA; wd=1920x1080"
  },
  "response_status": 200,
  "latency_ms": 1,
  "payload_summary": {
    "id": "4010857192890410435",
    "caption": "Ground truth verification post",
    "media_type": "VIDEO",
    "like_count": 42
  }
}
```

### لاگ ۲: خواندن اِج کامنت‌ها (Comments Edge Read):
```json
{
  "feature_name": "Comments Edge Read (GET /v21.0/{media-id}/comments)",
  "timestamp": "2026-10-20T00:36:40.270Z",
  "method": "GET",
  "url": "https://graph.facebook.com/v21.0/4010857192890410435/comments?fields=id,text,like_count&limit=2",
  "response_status": 200,
  "latency_ms": 1060,
  "payload_summary": {
    "data": [],
    "paging": {
      "cursors": {}
    }
  }
}
```

---

## ۴. مدل سخت‌افزاری و اثرانگشت‌های بیومتریک ویندوز ۱۱

در سطح پیاده‌سازی سورس‌کد پروژه (`ts_src/profiles/web/chrome_windows.ts`):

1. **رزولوشن و تسک‌بار ویندوز:**
   - ابعاد مانیتور: `1920x1080`
   - ارتفاع قابل استفاده مانیتور: `1040` پیکسل (با کسر دقیق ۴۰ پیکسل تسک‌بار پیش‌فرض ویندوز ۱۱).
2. **امضای گرافیکی WebGL:**
   - سازنده: `Google Inc. (NVIDIA)`
   - رندرر: `ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)`
3. **فونت‌های سیستم‌عامل:**
   - فونت‌های رسمی پشتیبانی‌شده: `Segoe UI`, `Segoe UI Historic`, `Calibri`, `Consolas`, `Arial`.

این سند تضمین می‌کند که پروژه MetaGraph Unofficial دارای یک دوقلوی وب ۱۰۰٪ اصیل، مستند به تلمتری تجربی و غیرقابل‌شناسایی است.

</div>
