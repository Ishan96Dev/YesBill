/// Form field validators. Return null if valid, error string if invalid.
class Validators {
  Validators._();

  static const _passwordMessage =
      'Use 8+ characters with uppercase, lowercase, number, and symbol';

  static String? email(String? value) {
    if (value == null || value.isEmpty) return 'Email is required';
    final emailRegex = RegExp(r'^[^@]+@[^@]+\.[^@]+$');
    if (!emailRegex.hasMatch(value.trim())) return 'Enter a valid email';
    return null;
  }

  static bool hasMinPasswordLength(String value) => value.trim().length >= 8;
  static bool hasUppercase(String value) => RegExp(r'[A-Z]').hasMatch(value);
  static bool hasLowercase(String value) => RegExp(r'[a-z]').hasMatch(value);
  static bool hasNumber(String value) => RegExp(r'[0-9]').hasMatch(value);
  static bool hasSpecialCharacter(String value) =>
      RegExp(r'[^A-Za-z0-9]').hasMatch(value);

  static int passwordStrengthScore(String value) {
    var score = 0;
    if (hasMinPasswordLength(value)) score++;
    if (hasUppercase(value)) score++;
    if (hasLowercase(value)) score++;
    if (hasNumber(value)) score++;
    if (hasSpecialCharacter(value)) score++;
    return score;
  }

  static bool isStrongPassword(String value) =>
      passwordStrengthScore(value) >= 5;

  static String? password(String? value) {
    if (value == null || value.isEmpty) return 'Password is required';
    if (!isStrongPassword(value)) return _passwordMessage;
    return null;
  }

  static String? loginPassword(String? value) {
    if (value == null || value.isEmpty) return 'Password is required';
    return null;
  }

  static String? confirmPassword(String? value, String? original) {
    if (value == null || value.isEmpty) return 'Please confirm your password';
    if (value != original) return 'Passwords do not match';
    return null;
  }

  static String? required(String? value, {String fieldName = 'This field'}) {
    if (value == null || value.trim().isEmpty) return '$fieldName is required';
    return null;
  }

  static String? positiveNumber(String? value, {String fieldName = 'Amount'}) {
    if (value == null || value.isEmpty) return '$fieldName is required';
    final num = double.tryParse(value);
    if (num == null) return 'Enter a valid number';
    if (num < 0) return '$fieldName must be positive';
    return null;
  }

  static String? apiKey(String? value, {String? provider}) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return 'API key is required';
    if (trimmed.length < 20) return 'API key seems too short';

    final expectedPrefix = apiKeyExpectedPrefix(provider);
    if (expectedPrefix != null && !trimmed.startsWith(expectedPrefix)) {
      return 'This key should start with $expectedPrefix';
    }

    if (trimmed.contains(' ')) return 'API key should not contain spaces';

    return null;
  }

  static String? apiKeyExpectedPrefix(String? provider) {
    return switch (provider?.toLowerCase()) {
      'openai' => 'sk-',
      'anthropic' => 'sk-ant-',
      'google' => 'AIza',
      _ => null,
    };
  }

  static bool apiKeyHasExpectedPrefix(String value, {String? provider}) {
    final expectedPrefix = apiKeyExpectedPrefix(provider);
    if (expectedPrefix == null) return value.trim().isNotEmpty;
    return value.trim().startsWith(expectedPrefix);
  }

  static bool apiKeyHasHealthyLength(String value) => value.trim().length >= 20;

  static bool apiKeyHasNoWhitespace(String value) =>
      value.trim().isNotEmpty && !value.contains(' ');
}
