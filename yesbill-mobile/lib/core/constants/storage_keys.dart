/// Keys used with [FlutterSecureStorage] and [SharedPreferences].
class StorageKeys {
  StorageKeys._();

  // Secure storage (encrypted) — Supabase session
  static const accessToken = 'supabase_access_token';
  static const refreshToken = 'supabase_refresh_token';
  static const userId = 'user_id';
  static const userEmail = 'user_email';

  // Secure storage — biometric
  static const biometricEnabled = 'biometric_enabled';

  // SharedPreferences (non-sensitive)
  static const themeMode = 'theme_mode';
  static const onboardingCompleted = 'onboarding_completed';
  static const selectedCurrency = 'selected_currency';
  static const fcmToken = 'fcm_token';
  static const lastSyncedAt = 'last_synced_at';
}
