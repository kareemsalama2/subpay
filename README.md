# SubPay

SubPay is a mobile-first subscription room manager. Each room can be linked to a Gmail inbox through IMAP so OTP codes appear inside the correct room in near real time. OTP codes expire after 5 minutes.

## Project layout

- `files/` - the PWA frontend served by the backend.
- `backend/` - the Node.js API, IMAP polling, OTP extraction, and realtime events.
- `app/src/main/assets/www/` - Android WebView shell assets from the earlier mobile wrapper.
- `app/src/main/java/com/subpay/app/MainActivity.java` - Android WebView shell.
- `SUBPAY_PRODUCT_SPEC_AR.md` - Arabic product notes and MVP scope.
- `DEPLOYMENT_AR.md` - Arabic deployment notes.

## Build APK

This folder is ready as an Android project, but this machine currently needs Java + Android SDK/Gradle installed to produce an APK.

When the Android toolchain is available:

```powershell
gradle assembleDebug
```

The APK will be generated at:

```text
app/build/outputs/apk/debug/app-debug.apk
```

## Backend

Backend code is available in `backend/`.

It provides users, admin-created rooms, invite codes, room messages, OTP extraction/expiry, Gmail IMAP polling, and realtime room updates through Server-Sent Events.

Arabic setup docs: `BACKEND_SETUP_AR.md`.

## Run locally

```powershell
npm start
```

Open:

```text
http://localhost:8080
```

## Deploy

Use Render or Koyeb for the current Node/PWA app. Configure production secrets only in the hosting dashboard, never in the public repo.

For Railway, add a persistent Volume and set:

```text
DATA_PATH=/data/db.json
IMAP_POLL_INTERVAL_SECONDS=60
```

Without a persistent Volume, registered users and rooms can disappear after a restart or redeploy because the app stores its JSON database on disk.
