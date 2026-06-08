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

## Environment Variables

لا ترفع أي App Password على GitHub.

حط القيم دي في الاستضافة:

```txt
NODE_ENV=production
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=strong-admin-password
ADMIN_NAME=SubPay Security
IMAP_POLL_INTERVAL_SECONDS=5
```

مفيش داعي تضيف Gmail ثابت في env. الأدمن هيضيف Gmail/App Password من شاشة إنشاء الروم.

## بيانات الرومات

الأدمن يدخل من الويب:

```txt
email: ADMIN_EMAIL
password: ADMIN_PASSWORD
```

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
