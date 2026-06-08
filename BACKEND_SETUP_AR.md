# تشغيل Backend وربط Gmail

## الموجود حالياً

تم إضافة Backend مستقل داخل فولدر `backend/` بدون أي مكتبات خارجية.

يدعم:

- إنشاء حساب وتسجيل دخول.
- إنشاء روم باسم وكود دعوة ولينك دعوة.
- دخول روم بالكود مثل Google Classroom.
- حفظ إيميل استقبال الرسائل داخل الروم.
- إضافة رسائل واردة للروم.
- استخراج OTP تلقائياً من الرسالة.
- جعل OTP صالحاً لمدة 5 دقائق فقط.
- Gmail OAuth جاهز للربط الحقيقي عند إضافة مفاتيح Google.

## تشغيل السيرفر

من فولدر المشروع:

```powershell
cd backend
node server.js
```

السيرفر يعمل افتراضياً على:

```text
http://localhost:8080
```

## الطريقة المجانية: Gmail App Password + IMAP

هذه هي الطريقة الأسهل والمجانية بدون Google Cloud.

### خطوات Gmail

1. افتح حساب Gmail الذي سيستقبل رسائل الروم.
2. فعل 2-Step Verification.
3. افتح App Passwords من إعدادات Google Account.
4. أنشئ App Password جديد باسم SubPay.
5. انسخ كلمة المرور المكونة من 16 حرف.

### ربط الروم بالإيميل

بعد تشغيل السيرفر، استخدم:

```http
POST /api/rooms/:roomId/imap
Content-Type: application/json

{
  "email": "your-room-gmail@gmail.com",
  "appPassword": "xxxx xxxx xxxx xxxx"
}
```

بعدها السيرفر يقرأ Inbox كل 60 ثانية، وأي رسالة جديدة تظهر في الروم. لو الرسالة تحتوي OTP، يتم استخراجه وصلاحيته 5 دقائق.

### جلب الرسائل يدوياً

```http
POST /api/rooms/:roomId/imap/poll
```

## إعداد Gmail API الحقيقي

هذا خيار بديل، لكنه يحتاج Google Cloud OAuth credentials.

حتى تصل الرسائل من Gmail للروم فعلاً، يجب عمل Google OAuth credentials:

1. افتح Google Cloud Console.
2. أنشئ Project.
3. فعل Gmail API.
4. أنشئ OAuth Client من نوع Web application.
5. أضف Redirect URI:

```text
http://localhost:8080/api/gmail/callback
```

6. انسخ `.env.example` إلى `.env` داخل `backend/`.
7. ضع القيم:

```text
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REDIRECT_URI=http://localhost:8080/api/gmail/callback
```

## ربط روم بحساب Gmail

بعد تشغيل السيرفر وإنشاء روم، افتح:

```text
GET /api/rooms/:roomId/gmail/auth-url
```

الـ API يرجع لك رابط Google. افتحه، وافق على قراءة Gmail، ثم يرجع Google إلى:

```text
/api/gmail/callback
```

بعدها السيرفر يستطيع قراءة الرسائل الجديدة لهذا الحساب وتخزينها في الروم.

## جلب الرسائل يدوياً

```text
POST /api/rooms/:roomId/gmail/poll
```

أو اترك السيرفر يعمل، وسيحاول الجلب تلقائياً كل 60 ثانية.

## ملاحظة مهمة

الـ APK وحده لا يستطيع قراءة Gmail مباشرة بشكل آمن. القراءة الحقيقية يجب أن تتم من Backend، والتطبيق يأخذ الرسائل من API.

## أمثلة API

### إنشاء حساب

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Ahmed",
  "email": "ahmed@example.com",
  "phone": "01000000000"
}
```

### إنشاء روم

```http
POST /api/rooms
Authorization: Bearer SESSION_TOKEN
Content-Type: application/json

{
  "name": "ChatGPT Room",
  "inboundEmail": "chatgpt-room@gmail.com",
  "subscriptionEmail": "team.chatgpt@gmail.com",
  "monthlyPrice": 50
}
```

### دخول روم بالكود

```http
POST /api/rooms/join
Authorization: Bearer SESSION_TOKEN
Content-Type: application/json

{
  "code": "GPT728"
}
```

### إضافة رسالة واردة للروم

```http
POST /api/rooms/:roomId/messages
Authorization: Bearer SESSION_TOKEN
Content-Type: application/json

{
  "subject": "Login OTP",
  "body": "Your code is 123456",
  "from": "noreply@example.com"
}
```
