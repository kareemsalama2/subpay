# SubPay Deployment

## هل Streamlit مناسب؟

لا، مش مناسب للنسخة الحالية.

المشروع الحالي عبارة عن:
- Node.js server
- Express-style HTTP API بدون dependencies
- PWA frontend
- IMAP polling لقراءة Gmail OTP كل 5 ثواني
- Server-Sent Events لتحديث الروم لحظيا

Streamlit Community Cloud معمول لتطبيقات Python/Streamlit، وليس لتشغيل Node server دائم بنفس الشكل. ينفع فقط لو هنعمل لوحة إدارة Python منفصلة، لكن مش مناسب كتطبيق الموبايل/PWA الأساسي.

## الاستضافة المقترحة

ابدأ بـ Render Free أو Koyeb Free.

Render أسهل كبداية:
- ارفع المشروع على GitHub
- اعمل Web Service
- Start command:

```txt
npm start
```

## أسرار الإنتاج

لا ترفع أي بريد أدمن أو باسورد أو Gmail App Password على GitHub.

حط أسرار الإنتاج داخل لوحة الاستضافة فقط، مثل Render Environment Variables.

النسخة الإنتاجية لن تنشئ حساب أدمن تلقائيا بدون إعداد بيانات الأدمن في الاستضافة.

## بيانات الرومات

الأدمن يدخل من الويب:

استخدم بيانات الأدمن التي وضعتها داخل لوحة الاستضافة.

وبعدين يعمل روم جديد ويدخل:
- اسم الروم
- إيميل الاشتراك
- باسورد الاشتراك
- السعر
- Gmail الذي يستقبل OTP
- Gmail App Password

## مهم قبل GitHub

لا ترفع:

```txt
backend/.env
backend/data/db.json
backend/server.out.log
backend/server.err.log
```

دول موجودين في `.gitignore`.

## موبايل

التطبيق الحالي PWA:
- يفتح من Safari على iPhone
- Add to Home Screen
- يفتح من Chrome على Android
- Install app / Add to Home screen

ده أفضل من Streamlit للموبايل في الحالة دي.
