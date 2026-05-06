/// App-wide configuration loaded from dart-define environment variables.
///
/// Pass these at build/run time:
///   flutter run --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=... --dart-define=API_BASE_URL=... --dart-define=GOOGLE_WEB_CLIENT_ID=...
///
/// Important: String.fromEnvironment ignores `defaultValue` when a define IS
/// passed but as an empty string (e.g. `--dart-define=SUPABASE_URL=`).
/// To guard against CI secrets being unset, we read the raw value without a
/// defaultValue and fall back in the public getter.
class AppConfig {
  AppConfig._();

  // ── Raw compile-time values (may be empty if secret was not set in CI) ──────
  static const _rawSupabaseUrl    = String.fromEnvironment('SUPABASE_URL');
  static const _rawSupabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
  static const _rawApiBaseUrl     = String.fromEnvironment('API_BASE_URL');

  // ── Public getters — values come entirely from dart-define (via .env + build script)
  // No hardcoded fallbacks; if a define is missing the app will show the
  // "App configuration missing" screen, making misconfiguration obvious.
  static String get supabaseUrl    => _rawSupabaseUrl;
  static String get supabaseAnonKey => _rawSupabaseAnonKey;
  static String get apiBaseUrl     => _rawApiBaseUrl;

  /// Optional Google OAuth Web client ID used for native Google sign-in.
  /// Required for reliable `idToken` retrieval on Android.
  static const googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
    defaultValue: '',
  );

  static const appName = 'YesBill';
  static const appVersion = '1.0.0';

  static const connectTimeoutSeconds = 60; // Allow for Render.com free-tier cold starts
  static const receiveTimeoutSeconds = 90; // Generous for AI endpoints
  static const sendTimeoutSeconds = 30;

  // Supabase realtime channel names
  static const confirmationsChannel = 'service_confirmations';

  // Feature flags
  static const enableBiometric = true;
  static const enableFcm = true;

  static bool get hasSupabaseConfig =>
      supabaseUrl.trim().isNotEmpty && supabaseAnonKey.trim().isNotEmpty;

  static bool get hasGoogleWebClientId => googleWebClientId.trim().isNotEmpty;
}
