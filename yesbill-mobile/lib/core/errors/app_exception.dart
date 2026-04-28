/// Typed exception hierarchy for YesBill Mobile.
/// All repository methods throw these; UI catches [AppException].
sealed class AppException implements Exception {
  const AppException(this.message);
  final String message;

  @override
  String toString() => message;
}

/// Network / connectivity errors (no internet, timeout)
final class NetworkException extends AppException {
  const NetworkException([super.message = 'No internet connection. Please check your network.']);
}

/// HTTP 4xx/5xx errors from FastAPI or Supabase
final class ApiException extends AppException {
  const ApiException(this.statusCode, super.message);
  final int statusCode;
}

/// Auth errors (invalid credentials, session expired, etc.)
final class AuthException extends AppException {
  const AuthException([super.message = 'Authentication failed. Please sign in again.']);
}

/// Supabase RLS / data errors
final class DatabaseException extends AppException {
  const DatabaseException([super.message = 'A database error occurred.']);
}

/// Validation errors (form input, API response parsing)
final class ValidationException extends AppException {
  const ValidationException(super.message);
}

/// Unknown / unexpected errors
final class UnknownException extends AppException {
  const UnknownException([super.message = 'An unexpected error occurred.']);
}
