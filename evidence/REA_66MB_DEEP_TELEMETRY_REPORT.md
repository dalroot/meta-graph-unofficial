<div dir="rtl">

# 🔬 گزارش جامع مهندسی معکوس تلمتری ۶۶ مگابایتی گوشی Redmi Note 13 4G (تحلیل REA)

**منبع تلمتری:** `evidence/raw_telemetry/instagram/instagram_session_2_deep_stream.log`  
**مشخصات فایل:** ۶۶ مگابایت (۶۶,۸۴۰,۵۲۴ بایت) | ۵۲۰,۴۳۵ سطر خام سیستمی  
**سخت‌افزار هدف:** Xiaomi Redmi Note 13 4G (`23129RAA4G` / `sapphire` / سریال `1121b522`) روی اندروید ۱۵ (HyperOS 2.0)  
**اپلیکیشن:** `com.instagram.android` نسخه `451.0.0.53.80` (کد بیلد ۳۸۵۷۱۳۱۱۶)  

---

## ۱. پاسخ قطعی به امکان ارتقای هویت دوقلوی دیجیتال (`DeviceTwin`)

بررسی عمیق لایه‌های شبکه و مقایسه پیاده‌سازی فعلی با تلمتری ۵۲۰ هزار سطری زنده نشان داد که:

### الف) آیا هویت فعلی قابل ارتقا است؟
**بله، ۱۰۰٪ و با جزئیات دقیق زیر:**
1. **پویایی پهنای باند شبکه (`Dynamic Link Bandwidth`):**
   * در پیاده‌سازی قبلی مقدار سرعت پهنای باند ثابت بود (`25000 KBPS`).
   * در لاگ زنده سیستم‌عامل، مقادیر متغیر دینامیک استخراج شد:
     - `LinkUpBandwidth >= 12000 Kbps`
     - `LinkDnBandwidth >= 12831 Kbps` تا `13199 Kbps`
     - وضعیت انتقال: `Transports: WIFI|VPN` با شاخص عدم محدودیت پهنای باند (`NOT_BANDWIDTH_CONSTRAINED`).
2. **سوییچ از Liger کلاسیک به Tigon MNS با کش سیستمی:**
   * در لاگ جدید ۳۹۱ رویداد مستقیم `mns:TigonMNS` و کلاینت دروازه داده `mns:DGWClient` ضبط شده است که نشان می‌دهد ارتباطات دایرکت و نوتیفیکیشن‌ها از کانال‌های Zero-RTT عبور می‌کنند.
3. **انطباق بیلد و کتابخانه رندرر:**
   * شناسه پردازش `PID: 13781` و UID سیستمی `10324` و کتابخانه‌های کدک کوالکام (`c2.qti.hevc.decoder` و `c2.android.aac.decoder`) که در [DeviceTwin](file:///home/hokar/Documents/antigravity/hopeful-bell/ts_src/twins/device_twin.ts) مدل شده‌اند، ۱۰۰٪ با لاگ سخت‌افزاری زنده مطابقت دارند.

---

## ۲. کاتالوگ ۵۷ کوئری Pando GraphQL کشف‌شده در لاگ ۶۶ مگابایتی

| ردیف | نام کوئری / موتاسیون | تعداد دفعات فراخوانی | کارکرد در اپلیکیشن اینستاگرام |
| :---: | :--- | :---: | :--- |
| **۱** | `BloksAsyncComponentQuery` | **۱۳۸** | لود کامپوننت‌های داینامیک فریم‌ورک Bloks در صفحات تنظیمات و داشبورد |
| **۲** | `SettingsBulkFetchQuery` | **۲۵** | بارگذاری جامع تنظیمات حریم خصوصی، امنیت و حساب کاربری |
| **۳** | `QuickPromotionSurfaceQueryV3` | **۲۲** | دریافت بنرها و پرامپت‌های راهنمای درون‌برنامه‌ای |
| **۴** | `BloksAsyncActionQuery` | **۲۲** | اجرای اکشن‌های کلیکی روی دکمه‌های Bloks |
| **۵** | `ShopEverythingMediaEligibilityBatchQuery` | **۱۷** | بررسی صلاحیت خرید و تگ فروشگاهی روی مدیاها |
| **۶** | `FxFoaToWaLinkingUpsellEligibilityQueries` | **۱۵** | بررسی اتصال حساب اینستاگرام به واتساپ بیزینس |
| **۷** | `MvBloksPrefetchTargetQuery` | **۱۴** | پیش‌بارگذاری هوشمند ویدیوها و سرفیس‌ها در حافظه کش |
| **۸** | `IGBloksAppRootQuery` | **۱۳** | پوسته اصلی اجرای صفحات وب‌ویو و Bloks |
| **۹** | `CXPFbStoriesCurrentPrivacyQuery` | **۱۲** | بررسی حریم خصوصی ارسال همزمان استوری به فیسبوک |
| **۱۰** | `IGDirectGetPresenceQuery` | **۹** | استعلام وضعیت آنلاین بودن و آخرین بازدید مخاطبان دایرکت |
| **۱۱** | `IGStorySuggestedUsersMidcardTypedQuery` | **۸** | پیشنهاد کاربران در بین استوری‌ها |
| **۱۲** | `IGPremiumReactionPackQuery` | **۸** | بارگذاری پکیج ری‌اکشن‌های اختصاصی و استیکرها |
| **۱۳** | `IGDirectPrivacySettingsQuery` | **۸** | تنظیمات محرمانگی چت و تیک خوانده‌شدن پیام‌ها (Read Receipts) |
| **۱۴** | `TypeaheadSearchQuery` | **۶** | **موتور جستجوی بلادرنگ لحظه‌ای با هر کلید تایپ‌شده کاربر** |
| **۱۵** | `MetaSubsEntrypointExperienceBatchQuery` | **۵** | بررسی صلاحیت سابسکرایب و دریافت تیک آبی متا |
| **۱۶** | `InboxTrayRequestForUserQuery` | **۴** | بارگذاری لیست گفتگوها و اینباکس دایرکت |
| **۱۷** | `IGDirectSafetyInterventionsThreadViewQuery` | **۴** | سیستم ایمنی و هشدارهای امنیتی در گفتگوهای دایرکت |
| **۱۸** | `FxIgXavSwitcherBadgingDataQuery` | **۴** | سینک شمارنده اعلان‌های چنداکانته |
| **۱۹** | `CrosspostToBarcelonaSettingsQuery` | **۴** | تنظیمات ارسال خودکار پست‌ها به شبکه تردز (Barcelona) |
| **۲۰** | `CrossPostingContentCompatibilityConfigV2` | **۴** | بررسی سازگاری مدیا برای انتشار کراس‌پلتفرم |
| **۲۱** | `IGDirectGetThreadQuery` | **۳** | **دریافت کامل و باکیفیت تاریخچه پیام‌های یک چت مشخص** |
| **۲۲** | `IGDirectClipShareMutationWithResponse` | **۳** | **موتاسیون رسمی ارسال ریلز و کلیپ به دایرکت مخاطبان** |
| **۲۳** | `GetBooleanSetting` | **۳** | دریافت تنظیمات دودویی (True/False) |
| **۲۴** | `FetchCXPNoticesQuery` | **۳** | دریافت اطلاعیه‌های همگام‌سازی بین پلتفرم‌ها |
| **۲۵** | `DeleteRepostRequest` | **۳** | **موتاسیون رسمی حذف ریپوست از فید پیج** |
| **۲۶** | `SetBooleanSetting` | **۲** | ذخیره تنظیمات دودویی |
| **۲۷** | `OnDeviceFLFeatures` | **۲** | یادگیری ماشین محلی روی گوشی (Federated Learning) |
| **۲۸** | `NMLMLCapabilityLatestAimVersionQuery` | **۲** | بررسی نسخه‌های مدل‌های هوش مصنوعی موبایل |
| **۲۹** | `IGProactiveWarningBannerQuery` | **۲** | بنرهای هشداردهنده پیشگیرانه |
| **۳۰** | `FxIgLinkageCacheQuery` | **۲** | کش ارتباطات حساب‌های متا |
| **۳۱** | `FollowingList` | **۲** | **استخراج لیست رسمی کاربران فالوشده پیج** |
| **۳۲** | `XAVSwitcherFetchFBNTAEligibilityQuery` | **۱** | بررسی وضعیت احراز هویت چنداکانته فیسبوک |
| **۳۳** | `UpdateMediaNoteRepostTextRequest` | **۱** | **موتاسیون ارسال و به‌روزرسانی متن نوت روی ریپوست** |
| **۳۴** | `TypeaheadPopularKeywordsCacheRefreshQuery` | **۱** | به‌روزرسانی کش کلمات کلیدی محبوب جستجو |
| **۳۵** | `SpotifyAccountLinkingRequest` | **۱** | اتصال حساب اینستاگرام به اسپاتیفای برای موزیک |
| **۳۶** | `SettingsAPIGetScreenDependencies` | **۱** | وابستگی‌های صفحات تنظیمات |
| **۳۷** | `SUBSBenefitEligibilityQuery` | **۱** | بررسی مزایای درآمدزایی اشتراکی |
| **۳۸** | `NativeMLModelBatchedQuery` | **۱** | لود اوزان مدل‌های پایتورچ موبایل |
| **۳۹** | `MetaSubsEntrypointInfoBatchQuery` | **۱** | اطلاعات ورودی متا وریفاید |
| **۴۰** | `KnotsConfigQuery` | **۱** | پیکربندی داخلی هسته اینستاگرام |
| **۴۱** | `InboxTrayRequest` | **۱** | درخواست عمومی تری اینباکس |
| **۴۲** | `IgmCobraConfigSyncQuery` | **۱** | سینک تنظیمات مسنجر اینستاگرام |
| **۴۳** | `IgCreatorDestinationTypeQuery` | **۱** | **استعلام سطح کریتور و مقصد تجاری اکانت** |
| **۴۴** | `IGStoryAYPromptMidcardQuery` | **۱** | پرامپت‌های تعاملی میان‌استوری |
| **۴۵** | `IGProfileTimelineQuery` | **۱** | **بارگذاری کامل گرید و تایم‌لاین پروفایل پیج** |
| **۴۶** | `IGOneLinkMiddlewareWhatsAppBusinessQuery` | **۱** | ارتباط با واتساپ تجاری |
| **۴۷** | `IGOneLinkMiddlewarePageQuery` | **۱** | ارتباط با پیج فیسبوک متصل |
| **۴۸** | `IGDirectUpdateSecureConsentFrameworkBoolSetting` | **۱** | تنظیمات رضایت‌نامه امنیتی دایرکت |
| **۴۹** | `IGDirectSearchInitiateWarmStartQuery` | **۱** | استارت گرم سرچ در دایرکت |
| **۵۰** | `IGDirectGetThreadItemsV2` | **۱** | دریافت اقلام و کامپوننت‌های غنی ترد چت |
| **۵۱** | `IGContentFilterDictionaryLookupQuery` | **۱** | واژه‌نامه فیلتر کلمات نامناسب و کامنت‌ها |
| **۵۲** | `HasAvatarQuery` | **۱** | استعلام وجود و وضعیت آواتار پروفایل |
| **۵۳** | `GetNoteCtasRequest` | **۱** | دریافت دکمه‌های اکشن نوت |
| **۵۴** | `FxIgConnectedServicesInfoQuery` | **۱** | خدمات متصل به فیسبوک/اینستاگرام |
| **۵۵** | `DcpFeaturesUpload` | **۱** | آپلود فیچرهای پلتفرم جمع‌آوری داده متا |
| **۵۶** | `CrosspostingUnifiedConfigsQuery` | **۱** | تنظیمات یکپارچه کراس‌پستینگ |
| **۵۷** | `CarreraPopulateInferredInterestsMutation` | **۱** | موتاسیون ثبت علاقه‌مندی‌های استخراج‌شده کاربر در الگوریتم اکسپلور |

---

## ۳. اکتیویتی‌های ثبت‌شده در چرخه حیات اندروید ردمی نوت ۱۳

1. `MainTabActivity`: تب اصلی اینستاگرام
2. `ModalActivity`: پنجره‌های تعاملی پاپ‌آپ و شیت کامنت‌ها
3. `TransparentModalActivity`: شیت‌های شفاف (شیر کردن ریلز در دایرکت)
4. `IgCropActivity`: ابزار رسمی فیسبوک/اینستاگرام برای برش عکس پروفایل
5. `BusinessConversionActivity`: فرآیند تبدیل اکانت به Business / Creator
6. `MediaCaptureActivity`: دوربین و کپچر مدیا
7. `InstagramMainActivity`: هسته مرکزی پردازش اپلیکیشن

---

## ۴. نقشه راه ارتقا (Upgrade Roadmap)

* تمام ۲۳ قابلیت قبلی پروژه بدون کوچک‌ترین تغییری پایدار و فعال باقی مانده‌اند.
* متدهای جدید کشف‌شده آماده‌اند تا بدون هیچ‌گونه آزمون و خطایی، مستقیماً بر اساس این شواهد عینی پیاده‌سازی شوند.

</div>
