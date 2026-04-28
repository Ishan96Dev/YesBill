# Contributing to YesBill Mobile

Thank you for contributing! This guide covers the development setup, code conventions, and contribution process.

## Development Setup

### Requirements
- Flutter SDK 3.22.0+ (stable channel)
- Dart 3.3.0+
- Android Studio / VS Code with Flutter extension
- JDK 17 for Android builds
- `flutter doctor` should show no critical issues

### First-Time Setup

```bash
cd yesbill-mobile

# Install dependencies
flutter pub get

# Generate Freezed models and Riverpod providers
dart run build_runner build --delete-conflicting-outputs

# Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase and API credentials
```

### Running the App

```bash
flutter run \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-key \
  --dart-define=API_BASE_URL=http://10.0.2.2:8000  # For emulator + local backend
```

## Branch Naming

| Type | Format | Example |
|------|--------|---------|
| Feature | `feat/description` | `feat/calendar-realtime` |
| Bug fix | `fix/description` | `fix/auth-token-refresh` |
| Chore | `chore/description` | `chore/update-dependencies` |
| Docs | `docs/description` | `docs/api-integration` |
| Refactor | `refactor/description` | `refactor/providers-layer` |

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(calendar): add real-time confirmation updates via Supabase stream
fix(auth): handle expired refresh token gracefully
chore(deps): update flutter_riverpod to 2.5.1
docs(sse): document SSE streaming implementation
```

## Code Standards

### Dart / Flutter
- `flutter analyze` must pass with zero issues before opening a PR
- `flutter test` must pass
- Use `const` wherever possible
- Prefer `final` over `var`
- No `print()` — use `debugPrint()` or a logger in debug builds only
- Format with `dart format lib/`

### Architecture Rules
- Screens only interact with Riverpod providers — never touch repositories directly
- All DB queries go through Repository classes
- Error mapping always uses `ErrorHandler.handle(e)` in repositories/datasources
- Models must be Freezed — no mutable data classes
- Providers must use `AsyncValue` for async data (never `null` as loading state)

### Code Generation
Run whenever you modify a Freezed model (`*.dart` with `@freezed`) or a Riverpod provider with `@riverpod`:

```bash
dart run build_runner build --delete-conflicting-outputs
```

Generated files (`*.freezed.dart`, `*.g.dart`) are committed to the repo.

### Adding a New Screen
1. Create the screen file in `lib/presentation/screens/<feature>/`
2. Add its route to `lib/presentation/router/app_router.dart`
3. Add the screen's import to the router file
4. If the screen has state, create a provider in `lib/providers/`

### Adding a New Model
1. Create the Freezed model in `lib/data/models/`
2. Run `dart run build_runner build`
3. Commit both the source file and generated `*.freezed.dart` + `*.g.dart`

## Testing

```bash
# Unit tests
flutter test test/unit/

# Widget tests
flutter test test/widget/

# All tests with coverage
flutter test --coverage
```

Write tests for:
- All repository methods (unit tests with mock Supabase/Dio)
- All provider business logic (unit tests with ProviderContainer)
- Critical widgets (widget tests for login form, calendar cell, etc.)

## Pull Request Process

1. Create a branch from `main`
2. Make your changes
3. Run `flutter analyze`, `flutter test`, `dart run build_runner build`
4. Fill out the PR template
5. Request a review
6. PRs require at least one approval before merging

## Questions?

Open a GitHub Issue or discussion. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design context.
