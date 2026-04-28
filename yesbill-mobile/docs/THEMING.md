# Theming — Web to Flutter Color Mapping

## Source of Truth
Web color tokens live in `frontend-next/app/globals.css` as HSL CSS variables.
Flutter equivalents are in `lib/core/theme/app_colors.dart`.

## Color Token Mapping

| CSS Variable | HSL Value | Flutter Constant | Hex |
|-------------|-----------|-----------------|-----|
| `--primary` | hsl(239 84% 67%) | `AppColors.primary` | `#6366F1` |
| `--primary-dark` | indigo-600 | `AppColors.primaryDark` | `#4F46E5` |
| `--primary-light` | indigo-400 | `AppColors.primaryLight` | `#818CF8` |
| `--bg-dark` | near-black blue | `AppColors.surfaceDark` | `#0F0F23` |
| `--card-dark` | dark card | `AppColors.cardDark` | `#1A1A3E` |
| `--border-dark` | dark border | `AppColors.cardDarkBorder` | `#2D2D5E` |
| — | emerald-500 | `AppColors.delivered` | `#10B981` |
| — | red-500 | `AppColors.skipped` | `#EF4444` |
| — | gray-500 | `AppColors.pending` | `#6B7280` |
| — | slate-100 | `AppColors.textPrimary` | `#F8FAFC` |
| — | slate-400 | `AppColors.textSecondary` | `#94A3B8` |

## Gradients

Web uses CSS `linear-gradient(135deg, #4F46E5, #6366F1)` for primary cards.
Flutter equivalent in `AppGradients.primary`:

```dart
static const primary = LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
);
```

## Typography

Web uses Inter font loaded via Google Fonts CDN. Flutter loads Inter from `assets/fonts/Inter/`.
You must download the Inter font files and place them at:
```
assets/fonts/Inter/
├── Inter-Regular.ttf    (weight: 400)
├── Inter-Medium.ttf     (weight: 500)
├── Inter-SemiBold.ttf   (weight: 600)
└── Inter-Bold.ttf       (weight: 700)
```
Download from: https://fonts.google.com/specimen/Inter (Download family → expand zip)

## Material 3 Seed Color

Both light and dark themes use `AppColors.primary` (#6366F1) as the M3 seed color via:
```dart
ColorScheme.fromSeed(seedColor: AppColors.primary, brightness: brightness)
```

This auto-generates the full M3 tonal palette while key colors are overridden manually.

## Theme Switching

- `ThemeMode.system` — follows Android system dark/light preference (default)
- `ThemeMode.light` / `ThemeMode.dark` — user override stored in `SharedPreferences`
- Controlled by `themeProvider` (NotifierProvider)
- `MaterialApp.router` reads `ref.watch(themeProvider)` for `themeMode`

## Status Colors (Calendar)

| Status | Color | Use |
|--------|-------|-----|
| `delivered` | #10B981 (emerald) | Green dot / badge |
| `skipped` | #EF4444 (red) | Red dot / badge |
| `pending` | #6B7280 (gray) | Gray dot / badge |
