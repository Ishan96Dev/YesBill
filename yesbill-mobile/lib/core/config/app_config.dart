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

  // ── Public getters with hardcoded fallbacks ─────────────────────────────────
  // Supabase project ref is public — safe to hard-code as fallback.
  static String get supabaseUrl =>
      _rawSupabaseUrl.isEmpty
          ? 'https://dmabraziqscumpbwhjbf.supabase.co'
          : _rawSupabaseUrl;

  // Supabase anon key is public (JWT, not a secret).
  static String get supabaseAnonKey =>
      _rawSupabaseAnonKey.isEmpty
          ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYWJyYXppcXNjdW1wYndoamJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTExNzUsImV4cCI6MjA4NTc4NzE3NX0.W_AApu-t2O-RbxO9AN-wTYmdIX7IBRAi08rBOF_dTDY'
          : _rawSupabaseAnonKey;

  static String get apiBaseUrl =>
      _rawApiBaseUrl.isEmpty
          ? 'https://yesbill.onrender.com'
          : _rawApiBaseUrl;

  /// Optional Google OAuth Web client ID used for native Google sign-in.
  /// Required for reliable `idToken` retrieval on Android.
  static const googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
    defaultValue: '',
  );

  static const appName = 'YesBill';
  static const appVersion = '1.0.0';

  static const connectTimeoutSeconds = 30;
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
