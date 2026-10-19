/**
 * 4 Safe, Read-Only Verification Tests for TwinGraph Schema Engine
 */

import { TwinGraph } from '../dist/index.js';

async function main() {
  console.log('===============================================================');
  console.log('🔍 اجرای ۴ آزمون کاملاً بی‌خطر (Read-Only) توئین‌گراف جدید');
  console.log('===============================================================\n');

  const tg = new TwinGraph();

  // تست ۱: فراخوانی نود رسانه با فیلتر دقیق فیلدها
  console.log('📌 تست ۱: دریافت اطلاعات رسانه با فیلتر دقیق فیلدها (GET /v21.0/{media-id})');
  const test1 = await tg.get('/v21.0/4010857192890410435', {
    fields: 'id,caption,media_type,like_count'
  });
  console.log('نتیجه تست ۱:');
  console.dir(test1, { depth: null });
  console.log('---------------------------------------------------------------\n');

  // تست ۲: دریافت پروفایل کاربر با فیلتر فیلدها
  console.log('📌 تست ۲: دریافت اطلاعات پروفایل کاربر (GET /v21.0/me)');
  const test2 = await tg.get('/v21.0/me', {
    fields: 'id,username,followers_count'
  });
  console.log('نتیجه تست ۲:');
  console.dir(test2, { depth: null });
  console.log('---------------------------------------------------------------\n');

  // تست ۳: فراخوانی شیءگرای فیسبوک بیزینس با پروکسی نود (tg.nodeMedia)
  console.log('📌 تست ۳: استفاده از پروکسی شیءگرا شبیه به SDK رسمی فیسبوک (tg.nodeMedia)');
  const test3 = await tg.nodeMedia('4010857192890410435').get(['id', 'caption', 'permalink']);
  console.log('نتیجه تست ۳:');
  console.dir(test3, { depth: null });
  console.log('---------------------------------------------------------------\n');

  // تست ۴: خواندن کامنت‌های رسانه از طریق اِج رسمی
  console.log('📌 تست ۴: خواندن لیست کامنت‌ها از طریق اِج رسمی (GET /v21.0/{media-id}/comments)');
  const test4 = await tg.get('/v21.0/4010857192890410435/comments', {
    fields: 'id,text,like_count',
    limit: 2
  });
  console.log('نتیجه تست ۴:');
  console.dir(test4, { depth: null });
  console.log('---------------------------------------------------------------\n');

  console.log('✅ هر ۴ آزمون با موفقیت کامل و بدون کوچک‌ترین ریسک یا تغییری اجرا شدند.');
}

main().catch(err => {
  console.error('Error running safe tests:', err);
});
