# Building & Releasing YesBill Android

## Prerequisites

- Flutter SDK 3.22.0+ (stable channel): https://docs.flutter.dev/get-started/install
- Android Studio with Android SDK (API 35)
- JDK 17
- `google-services.json` in `android/app/` (see FCM_SETUP.md)

Optional (recommended on Windows when `flutter` is not in PATH):

- [Puro](https://puro.dev/) Flutter version manager

## Development Build (Debug)

```bash
# Run on connected device or emulator
flutter run \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key \
  --dart-define=API_BASE_URL=https://yesbill.onrender.com

# For Android emulator (localhost backend):
flutter run \
  --dart-define=API_BASE_URL=http://10.0.2.2:8000 \
  ...
```

### Using Puro-managed Flutter

```bash
# One-time setup
puro create stable stable

# Select env for this project
puro use stable

# Run via puro wrapper
puro flutter run \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key \
  --dart-define=API_BASE_URL=https://yesbill.onrender.com
```

## Create a Keystore (One Time)

```bash
keytool -genkey -v \
  -keystore yesbill-release.keystore \
  -alias yesbill \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

Store the keystore file securely — never commit it to git.

## Configure Signing

Create `android/key.properties` (gitignored):

```properties
storePassword=<keystore password>
keyPassword=<key password>
keyAlias=yesbill
storeFile=../../yesbill-release.keystore
```

Then update `android/app/build.gradle` to use this signing config in the `release` build type:

```groovy
def keyProperties = new Properties()
def keyPropertiesFile = rootProject.file('key.properties')
if (keyPropertiesFile.exists()) keyProperties.load(keyPropertiesFile.newDataInputStream())

android {
  signingConfigs {
    release {
      keyAlias keyProperties['keyAlias']
      keyPassword keyProperties['keyPassword']
      storeFile keyProperties['storeFile'] ? file(keyProperties['storeFile']) : null
      storePassword keyProperties['storePassword']
    }
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
    }
  }
}
```

## Build Release APK

```bash
flutter build apk --release \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key \
  --dart-define=API_BASE_URL=https://yesbill.onrender.com

# Output: build/app/outputs/flutter-apk/app-release.apk
```

## Build Debug APK (Latest Local Artifact)

```bash
flutter build apk --debug

# Output: build/app/outputs/flutter-apk/app-debug.apk
```

Latest local artifact generated from this repo:

- `build/app/outputs/flutter-apk/app-debug.apk`

## Build Release AAB (for Play Store)

```bash
flutter build appbundle --release \
  --dart-define=SUPABASE_URL=... \
  --dart-define=SUPABASE_ANON_KEY=... \
  --dart-define=API_BASE_URL=...

# Output: build/app/outputs/bundle/release/app-release.aab
```

## Code Generation (Before Building)

If you modified any Freezed model or @riverpod provider:

```bash
dart run build_runner build --delete-conflicting-outputs
```

## GitHub Actions (Automated)

CI builds trigger on push to `main` via `.github/workflows/build-apk.yml`.
Signing secrets stored as GitHub repository secrets:

- `KEYSTORE_BASE64` — base64-encoded keystore file
- `KEY_ALIAS` — yesbill
- `KEY_PASSWORD` — keystore key password
- `STORE_PASSWORD` — keystore store password
- `SUPABASE_URL` — production Supabase URL
- `SUPABASE_ANON_KEY` — production anon key
- `API_BASE_URL` — production FastAPI URL
- `GOOGLE_SERVICES_JSON` — contents of google-services.json

## Version Bumping

Update `pubspec.yaml`:

```yaml
version: 1.2.0+5  # name: 1.2.0, build: 5
```

Then tag a release:

```bash
git tag v1.2.0
git push origin v1.2.0
```

This triggers `.github/workflows/release.yml` which builds a signed APK and creates a GitHub Release.
