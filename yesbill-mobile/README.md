# YesBill Mobile — Android App

> Household Service Billing Tracker for Android, built with Flutter.

YesBill helps you track daily service deliveries (milk, newspapers, internet, tiffin, etc.), automatically generate AI-powered monthly bills, and gain insights into your household spending — right from your Android phone.

---

## Features

| Screen | Status | Details |
|--------|--------|---------|
| **Splash / Onboarding** | ✅ | Animated branding + first-run walkthrough |
| **Authentication** | ✅ | Email/password, Google OAuth, magic-link, biometric lock |
| **Dashboard** | ✅ | Monthly spending, delivery rates, quick-stat cards, shimmer loading |
| **Services** | ✅ | Add / edit / archive recurring household services with per-day pricing |
| **Calendar Tracking** | ✅ | Mark each day Delivered / Skipped / Pending; month navigator |
| **AI Bill Generation** | ✅ | One-tap monthly bill via OpenAI · Anthropic · Google AI (BYOK) |
| **Bill Management** | ✅ | View, export PDF, mark paid with custom payment method picker |
| **Analytics** | ✅ | Spending trends, service breakdown charts, year-over-year comparison |
| **AI Chat** | ✅ | Chat with AI about your data; tappable hyperlinks via url_launcher |
| **Agentic AI** | ✅ | Agent mode — AI can mark deliveries, answer contextual queries |
| **AI Settings** | ✅ | Per-provider API key, model selector, reasoning effort — with logo images |
| **Profile Settings** | ✅ | Display name, timezone & currency pickers, avatar upload |
| **Support** | ✅ | FAQ, contact form, changelog |
| **Notifications** | ✅ | Firebase Cloud Messaging — bill reminders & delivery alerts |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | Flutter 3.41.6 · Material 3 · `useMaterial3: true` |
| Design System | Stitch "Soft Minimalism / Ethereal Organizer" |
| Fonts | Plus Jakarta Sans (headings) · Manrope (body) via google_fonts |
| State | flutter_riverpod 2.5.x — `NotifierProvider` / `StreamProvider` / `FutureProvider` |
| Navigation | go_router 14.x with `ShellRoute` + `AppScaffold` |
| HTTP + SSE | Dio + native `dart:io` SSE for streaming AI responses |
| Database | Supabase (direct realtime `.stream()`) |
| Auth | Supabase Auth · Google OAuth (`yesbill://login-callback`) · local_auth biometrics |
| AI Providers | OpenAI · Anthropic · Google AI (bring your own key) |
| Markdown | flutter_markdown 0.7.x |
| URL Launch | url_launcher 6.3.x (tappable chat links) |
| Animations | flutter_animate 4.5.x |
| Icons | lucide_icons 0.257.x |
| Charts | fl_chart |
| PDF | pdf + printing + share_plus |
| Notifications | Firebase Cloud Messaging |

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Flutter SDK | ≥ 3.41.6 (stable channel) |
| Dart SDK | ≥ 3.3.0 |
| Java / JDK | ≥ 17 (tested with Android Studio JBR — JetBrains OpenJDK 21) |
| Android SDK | API 33+ target, API 21+ minimum |

Set the `JAVA_HOME` environment variable to your JDK root, e.g.:
```
JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
```

---

## Setup

### 1. Clone & install dependencies
```powershell
cd e:\Projects-Repository\YesBill\yesbill-mobile
E:\flutter\bin\flutter.bat pub get
```

### 2. Configure environment

Create `lib/core/config/env.dart` (not committed) with your Supabase credentials:
```dart
class Env {
  static const supabaseUrl = 'https://YOUR_PROJECT.supabase.co';
  static const supabaseAnonKey = 'YOUR_ANON_KEY';
}
```

### 3. Firebase (optional — for push notifications)
Place `google-services.json` in `android/app/`.

---

## Running the App

```powershell
# Run on connected device / emulator (debug)
E:\flutter\bin\flutter.bat run

# Run with verbose output
E:\flutter\bin\flutter.bat run -v

# Run on a specific device
E:\flutter\bin\flutter.bat devices                         # list devices
E:\flutter\bin\flutter.bat run -d <device-id>
```

---

## Code Quality

```powershell
# Analyze for errors and warnings
E:\flutter\bin\flutter.bat analyze

# Format all Dart files
E:\flutter\bin\flutter.bat format lib/

# Run tests
E:\flutter\bin\flutter.bat test
```

---

## Building the APK

```powershell
# Clean previous build artifacts
E:\flutter\bin\flutter.bat clean

# Get dependencies (required before build)
E:\flutter\bin\flutter.bat pub get

# Remove any old APKs
Remove-Item "build\app\outputs\flutter-apk\*.apk" -Force -ErrorAction SilentlyContinue

# Build release APK
E:\flutter\bin\flutter.bat build apk --release

# Rename to YesBill.apk
Rename-Item "build\app\outputs\flutter-apk\app-release.apk" "YesBill.apk"
```

The final APK is at:
```
build\app\outputs\flutter-apk\YesBill.apk
```

### Build an App Bundle (for Play Store)
```powershell
E:\flutter\bin\flutter.bat build appbundle --release
# Output: build\app\outputs\bundle\release\app-release.aab
```

---

## Project Structure

```
lib/
├── core/
│   ├── config/          # Environment & app configuration
│   ├── extensions/      # Dart extension methods
│   ├── theme/           # AppColors, AppTextStyles, AppSpacing
│   └── utils/           # Validators, formatters, helpers
├── data/
│   ├── datasources/     # Remote (Supabase, FastAPI) & local data sources
│   ├── models/          # Freezed data models
│   └── repositories/    # Repository pattern implementations
├── providers/           # Riverpod providers (state management)
└── presentation/
    ├── screens/
    │   ├── auth/        # Login, signup screens
    │   ├── bills/       # Bill list, bill detail
    │   ├── calendar/    # Calendar tracking + service month tracker
    │   ├── chat/        # AI chat interface
    │   ├── agent/       # Agentic AI interface
    │   ├── dashboard/   # Home dashboard
    │   ├── analytics/   # Spending analytics
    │   ├── services/    # Service management
    │   ├── settings/    # AI settings, profile settings
    │   ├── support/     # Help & support
    │   └── onboarding/  # First-run experience
    └── widgets/
        └── common/      # Shared widgets (AppDropdown, AppScaffold, etc.)
```

---

## Key Design Conventions

- **Theme**: Stitch "Soft Minimalism" — background `Color(0xFFF7F9FB)`, cards `Colors.white` with subtle shadow
- **Primary color**: `Color(0xFF6366F1)` (indigo)
- **No border lines** on non-interactive containers (use shadow depth instead)
- **Custom dropdowns**: Use `AppDropdown<T>` from `widgets/common/app_dropdown.dart` — opens a styled bottom sheet
- **Navigation**: All sub-screens need `120px` bottom padding (behind bottom nav bar)
- **Markdown**: AI responses rendered with `flutter_markdown`; links open in external browser via `url_launcher`

---

## Changelog

See the root [CHANGELOG.md](../CHANGELOG.md) for version history.

| Charts | fl_chart |
| Models | Freezed + json_serializable |

## Getting Started

### Prerequisites

- [Flutter SDK 3.22.0+](https://docs.flutter.dev/get-started/install) (stable channel)
- Optional: [Puro](https://puro.dev/) to manage Flutter versions per project
- Android Studio + Android SDK (API 35)
- JDK 17
- A [Supabase](https://supabase.com) project with the YesBill schema applied
- `google-services.json` from Firebase (see [docs/FCM_SETUP.md](docs/FCM_SETUP.md))

### Setup

```bash
# Clone the YesBill monorepo
git clone https://github.com/your-org/yesbill.git
cd yesbill/yesbill-mobile

# Optional (if Flutter is not in PATH)
puro create stable stable
puro use stable

# Install Flutter dependencies
flutter pub get

# Run code generation (Freezed models + Riverpod providers)
dart run build_runner build --delete-conflicting-outputs

# Place google-services.json
cp /path/to/google-services.json android/app/google-services.json

# Place Inter font files (download from fonts.google.com/specimen/Inter)
# assets/fonts/Inter/Inter-Regular.ttf
# assets/fonts/Inter/Inter-Medium.ttf
# assets/fonts/Inter/Inter-SemiBold.ttf
# assets/fonts/Inter/Inter-Bold.ttf

# Run the app
flutter run \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key \
  --dart-define=API_BASE_URL=https://yesbill.onrender.com
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `API_BASE_URL` | YesBill FastAPI backend URL |

Copy `.env.example` for reference. Pass values via `--dart-define` (not `.env` files).

## Project Structure

```
yesbill-mobile/
├── android/                  Android native project
├── assets/                   Icons, animations, fonts
├── docs/                     Architecture, API, theming docs
├── lib/
│   ├── core/                 Config, theme, constants, errors, utils
│   ├── data/                 Models, datasources, repositories
│   ├── providers/            Riverpod state providers
│   ├── presentation/         Screens, widgets, router
│   └── services/             FCM, biometric, PDF
├── test/                     Unit, widget, integration tests
├── .github/                  CI/CD workflows, issue templates
├── pubspec.yaml
└── analysis_options.yaml
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed layer breakdown.

## Documentation

| Doc | Description |
|-----|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layer diagram, Riverpod graph |
| [API_INTEGRATION.md](docs/API_INTEGRATION.md) | All FastAPI + Supabase endpoints |
| [AUTH_FLOW.md](docs/AUTH_FLOW.md) | Auth sequence diagrams |
| [THEMING.md](docs/THEMING.md) | Color tokens, fonts, gradients |
| [NAVIGATION.md](docs/NAVIGATION.md) | go_router route tree |
| [SSE_STREAMING.md](docs/SSE_STREAMING.md) | AI chat streaming implementation |
| [FCM_SETUP.md](docs/FCM_SETUP.md) | Firebase setup guide |
| [RELEASE.md](docs/RELEASE.md) | Build, sign, and release guide |

## Development

```bash
# Run tests
flutter test

# Analyze code
flutter analyze

# Re-generate Freezed/Riverpod code
dart run build_runner build --delete-conflicting-outputs

# Watch mode (auto-regenerate on file change)
dart run build_runner watch --delete-conflicting-outputs
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Screenshots

> Screenshots will be added as features are implemented.

## Related

- [YesBill Web App](../frontend-next/) — Next.js 14 frontend (same feature set)
- [YesBill Backend](../backend/) — FastAPI Python backend (shared by web + mobile)
- [YesBill Supabase](../supabase/) — Database migrations + Edge Functions

## License

MIT — see [LICENSE](../LICENSE) in the repository root.
