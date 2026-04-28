import 'package:dio/dio.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../local/secure_storage.dart';

/// Dio interceptor that:
/// 1. Attaches Bearer token to every request
/// 2. On 401: attempts one token refresh via Supabase, then retries
/// 3. On second 401: clears session (caller handles redirect to login)
class AuthInterceptor extends Interceptor {
  AuthInterceptor({
    required SecureStorageService secureStorage,
    required SupabaseClient supabase,
  })  : _secureStorage = secureStorage,
        _supabase = supabase;

  final SecureStorageService _secureStorage;
  final SupabaseClient _supabase;
  bool _isRefreshing = false;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _secureStorage.readAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401 && !_isRefreshing) {
      _isRefreshing = true;
      try {
        final refreshed = await _supabase.auth.refreshSession();
        final newToken = refreshed.session?.accessToken;
        if (newToken != null) {
          await _secureStorage.writeAccessToken(newToken);
          // Retry original request with new token
          final clonedRequest = err.requestOptions;
          clonedRequest.headers['Authorization'] = 'Bearer $newToken';
          final response = await Dio().fetch(clonedRequest);
          handler.resolve(response);
          return;
        }
      } catch (_) {
        // Refresh failed — clear session
        await _secureStorage.clearAll();
      } finally {
        _isRefreshing = false;
      }
    }
    handler.next(err);
  }
}
