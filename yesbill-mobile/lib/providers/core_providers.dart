import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../data/datasources/local/preferences.dart';
import '../data/datasources/local/secure_storage.dart';
import '../data/datasources/remote/ai_settings_remote_ds.dart';
import '../data/datasources/remote/auth_interceptor.dart';
import '../data/datasources/remote/bills_remote_ds.dart';
import '../data/datasources/remote/chat_remote_ds.dart';
import '../data/datasources/remote/dio_client.dart';
import '../data/models/user_profile.dart';
import '../data/repositories/calendar_repository.dart';
import '../data/repositories/profile_repository.dart';
import '../data/repositories/services_repository.dart';
import 'auth_provider.dart';

// ── Supabase ────────────────────────────────────────────────────────────────

final supabaseClientProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});

// ── Secure Storage ───────────────────────────────────────────────────────────

final flutterSecureStorageProvider = Provider<FlutterSecureStorage>((_) {
  return const FlutterSecureStorage();
});

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService(ref.watch(flutterSecureStorageProvider));
});

// ── Shared Preferences ───────────────────────────────────────────────────────

final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError('Initialize via ProviderContainer.overrides');
});

final preferencesProvider = Provider<PreferencesService>((ref) {
  return PreferencesService(ref.watch(sharedPreferencesProvider));
});

// ── HTTP Client ──────────────────────────────────────────────────────────────

final authInterceptorProvider = Provider<AuthInterceptor>((ref) {
  return AuthInterceptor(
    secureStorage: ref.watch(secureStorageProvider),
    supabase: ref.watch(supabaseClientProvider),
  );
});

final dioProvider = Provider<Dio>((ref) {
  return createDioClient(
    authInterceptor: ref.watch(authInterceptorProvider),
  );
});

// ── Remote Data Sources ──────────────────────────────────────────────────────

final billsRemoteDsProvider = Provider<BillsRemoteDataSource>((ref) {
  return BillsRemoteDataSource(ref.watch(dioProvider));
});

final chatRemoteDsProvider = Provider<ChatRemoteDataSource>((ref) {
  return ChatRemoteDataSource(
    dio: ref.watch(dioProvider),
    storage: ref.watch(secureStorageProvider),
  );
});

final aiSettingsRemoteDsProvider = Provider<AiSettingsRemoteDataSource>((ref) {
  return AiSettingsRemoteDataSource(ref.watch(dioProvider));
});

// ── Repositories ─────────────────────────────────────────────────────────────

final servicesRepositoryProvider = Provider<ServicesRepository>((ref) {
  return ServicesRepository(ref.watch(supabaseClientProvider));
});

final calendarRepositoryProvider = Provider<CalendarRepository>((ref) {
  return CalendarRepository(ref.watch(supabaseClientProvider));
});

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepository(ref.watch(supabaseClientProvider));
});

// ── User Profile ─────────────────────────────────────────────────────────────

/// Fetches the current user's profile from Supabase.
/// Guards against auth race condition — returns null until user is authenticated.
final userProfileProvider = FutureProvider.autoDispose<UserProfile?>((ref) async {
  final authState = ref.watch(authProvider);
  if (!authState.isAuthenticated) return null;
  return ref.read(profileRepositoryProvider).getProfile();
});
