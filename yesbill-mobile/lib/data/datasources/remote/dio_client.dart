import 'package:dio/dio.dart';
import 'package:dio_smart_retry/dio_smart_retry.dart';

import '../../../core/config/app_config.dart';
import 'auth_interceptor.dart';

/// Creates and configures the [Dio] HTTP client used for all FastAPI calls.
/// SSE endpoints use dart:io HttpClient directly (not this Dio instance).
Dio createDioClient({required AuthInterceptor authInterceptor}) {
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout:
          const Duration(seconds: AppConfig.connectTimeoutSeconds),
      receiveTimeout:
          const Duration(seconds: AppConfig.receiveTimeoutSeconds),
      sendTimeout: const Duration(seconds: AppConfig.sendTimeoutSeconds),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  // Auth interceptor: attach Bearer token, handle 401 refresh
  dio.interceptors.add(authInterceptor);

  // Smart retry: retry on network errors and 5xx (not on 4xx)
  dio.interceptors.add(
    RetryInterceptor(
      dio: dio,
      retries: 2,
      retryDelays: const [Duration(seconds: 1), Duration(seconds: 2)],
      retryEvaluator: (error, attempt) async {
        return error.type == DioExceptionType.connectionTimeout ||
            error.type == DioExceptionType.connectionError;
      },
    ),
  );

  return dio;
}
