# Firebase Cloud Messaging Setup

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add Project** → name it "YesBill"
3. Disable Google Analytics (optional for now)

## 2. Add Android App

1. In Firebase Console → **Project Settings** → **Your apps** → **+ Add app** → Android
2. **Android package name**: `com.yesbill.yesbill_mobile`
3. **App nickname**: YesBill Android
4. Click **Register app**

## 3. Download google-services.json

1. Click **Download google-services.json**
2. Place at: `android/app/google-services.json`
3. This file is gitignored — each developer and CI must download their own

## 4. Verify Android Files

The following are already configured:

**`android/build.gradle`**:
```groovy
classpath 'com.google.gms:google-services:4.4.2'
```

**`android/app/build.gradle`**:
```groovy
apply plugin: 'com.google.gms.google-services'
```

**`pubspec.yaml`**:
```yaml
firebase_core: ^3.3.0
firebase_messaging: ^15.1.0
```

## 5. Notification Types Supported

| Type | Trigger | Payload Keys | Deep Link |
|------|---------|-------------|-----------|
| `bill_generated` | Bill generation complete | `bill_id`, `year_month` | `/bills/:bill_id` |
| `bill_due_reminder` | Monthly due date | `year_month` | `/bills/generate` |
| `delivery_reminder` | Daily per service | `service_id`, `service_name` | `/calendar` |
| `payment_confirmed` | Bill marked paid | `bill_id` | `/bills/:bill_id` |
| `service_expiry` | Service end date in 7 days | `service_id` | `/services/:service_id` |

## 6. Backend: Register FCM Token

The `FcmService` POSTs the device token to:
```
POST /notifications/register-token
{ "token": "fcm_device_token_here" }
```

**Note**: This endpoint needs to be added to the FastAPI backend. It should store the token in a `user_fcm_tokens` table and use it when triggering notifications from Supabase Edge Functions.

## 7. Sending Test Notifications

From Firebase Console → **Cloud Messaging** → **Send test message**:

```json
{
  "notification": {
    "title": "Bill Generated!",
    "body": "Your March 2025 bill is ready — ₹2,450"
  },
  "data": {
    "type": "bill_generated",
    "bill_id": "uuid-here",
    "route": "/bills/uuid-here"
  }
}
```

## 8. Android Permissions

Already configured in `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

`FcmService.initialize()` calls `FirebaseMessaging.instance.requestPermission()` which shows the system prompt on Android 13+.

## 9. Notification Channel

Created in `FcmService.initialize()`:
- **ID**: `yesbill_notifications`
- **Name**: YesBill Notifications
- **Importance**: High (shows heads-up notification)

## 10. CI/CD

For GitHub Actions APK builds, store `google-services.json` as a **repository secret** (`GOOGLE_SERVICES_JSON`) and write it to disk before building:

```yaml
- name: Write google-services.json
  run: echo "$GOOGLE_SERVICES_JSON" > android/app/google-services.json
  env:
    GOOGLE_SERVICES_JSON: ${{ secrets.GOOGLE_SERVICES_JSON }}
```
