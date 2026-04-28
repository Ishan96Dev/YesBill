/// App-wide configuration loaded from dart-define environment variables.
///
/// Pass these at build/run time:
///   flutter run --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=... --dart-define=API_BASE_URL=... --dart-define=GOOGLE_WEB_CLIENT_ID=...
class AppConfig {
  AppConfig._();

  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://dmabraziqscumpbwhjbf.supabase.co',
  );

  static const supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    // Supabase anon key is public (safe to ship in client builds).
    // Keeping a default avoids blank-screen startup when dart-defines are omitted.
    defaultValue:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYWJyYXppcXNjdW1wYndoamJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTExNzUsImV4cCI6MjA4NTc4NzE3NX0.W_AApu-t2O-RbxO9AN-wTYmdIX7IBRAi08rBOF_dTDY',
  );

  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://yesbill.onrender.com',
  );

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
