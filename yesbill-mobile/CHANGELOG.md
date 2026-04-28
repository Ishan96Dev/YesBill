# Changelog

All notable changes to YesBill Mobile will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial project scaffold with Flutter/Dart
- Complete layered architecture: core, data, providers, presentation
- Material 3 theming with YesBill brand colors (indigo primary, Inter font)
- Riverpod 2.x state management with code generation
- go_router navigation with auth guard and ShellRoute bottom navigation
- Supabase authentication: email/password + Google OAuth + biometric unlock
- SSE streaming implementation for AI chat (dart:io HttpClient)
- Freezed data models for all Supabase tables
- Firebase Cloud Messaging integration
- PDF bill export with share_plus
- Complete route tree: splash → onboarding → auth → main app
- CI/CD GitHub Actions workflows (analyze + test + build APK + release)
- Comprehensive documentation in `/docs`

### Changed

- Bottom navigation now uses a 5th **More** tab (sheet) for overflow routes: AI Chat, Analytics, Settings, and AI Agent.
- Calendar tracker service lookup now resolves from all user services (not just active), so direct service-calendar routes still render correctly.
- Local Android build flow now supports Puro-managed Flutter environments (useful when `flutter` is not in PATH).

### Fixed

- Resolved Android debug build blockers caused by icon name mismatches in `lucide_icons` (`bicycle` → `bike`, `ellipsis` → `moreHorizontal`).
- Aligned repository/provider method signatures with current data-source APIs to remove compile-time inconsistencies.
- Generated latest debug artifact successfully at `build/app/outputs/flutter-apk/app-debug.apk`.

## [1.0.0] — TBD

### Planned

- Phase 1: Foundation (pubspec, core, theme, router, Supabase/Dio init)
- Phase 2: Authentication (login, signup, Google OAuth, biometric, onboarding)
- Phase 3: Services CRUD
- Phase 4: Calendar tracking with real-time Supabase updates
- Phase 5: Dashboard + AppScaffold bottom navigation
- Phase 6: Bills (list, generate, detail, PDF export, mark paid)
- Phase 7: Analytics (spending charts, delivery rates, YoY)
- Phase 8: AI Chat + Agent (SSE streaming, conversation management)
- Phase 9: Settings (profile, AI providers, notifications, security, appearance)
- Phase 10: FCM, polish, tests, CI setup
