import 'dart:io';
import 'package:dio/dio.dart';
import 'package:gotrue/gotrue.dart' as gotrue show AuthException;
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthException;

import 'app_exception.dart';

/// Converts raw exceptions from Dio, Supabase, and dart:io into typed [AppException]s.
class ErrorHandler {
  ErrorHandler._();

  static AppException handle(Object error) {
    if (error is AppException) return error;

    if (error is DioException) {
      return _handleDioError(error);
    }

    if (error is gotrue.AuthException) {
      return AuthException(error.message);
    }

    if (error is PostgrestException) {
      return DatabaseException(error.message);
    }

    if (error is SocketException || error is HandshakeException) {
      return const NetworkException();
    }

    if (error is FormatException) {
      return ValidationException('Unexpected response format: ${error.message}');
    }

    return UnknownException(error.toString());
  }

  static AppException _handleDioError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return const NetworkException('Request timed out. Please try again.');
      case DioExceptionType.connectionError:
        return const NetworkException();
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode ?? 0;
        final message = _extractMessage(e.response?.data) ??
            e.message ??
            'Server error ($statusCode)';
        if (statusCode == 401) {
          return AuthException(message);
        }
        return ApiException(statusCode, message);
      case DioExceptionType.cancel:
        return const UnknownException('Request was cancelled.');
      default:
        return UnknownException(e.message ?? 'Unknown network error.');
    }
  }

  static String? _extractMessage(dynamic data) {
    if (data == null) return null;
    if (data is Map) {
      return data['detail']?.toString() ??
          data['message']?.toString() ??
          data['error']?.toString();
    }
    if (data is String) return data;
    return null;
  }

  /// Human-readable message for display in snackbars / error views.
  static String userMessage(AppException e) => e.message;
}
