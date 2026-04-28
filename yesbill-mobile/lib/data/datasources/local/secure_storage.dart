import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../../core/constants/storage_keys.dart';

/// Wrapper around [FlutterSecureStorage] with typed read/write helpers.
class SecureStorageService {
  SecureStorageService(this._storage);

  final FlutterSecureStorage _storage;

  static const _androidOptions = AndroidOptions(
    encryptedSharedPreferences: true,
  );

  Future<void> writeAccessToken(String token) =>
      _storage.write(key: StorageKeys.accessToken, value: token, aOptions: _androidOptions);

  Future<String?> readAccessToken() =>
      _storage.read(key: StorageKeys.accessToken, aOptions: _androidOptions);

  Future<void> writeRefreshToken(String token) =>
      _storage.write(key: StorageKeys.refreshToken, value: token, aOptions: _androidOptions);

  Future<String?> readRefreshToken() =>
      _storage.read(key: StorageKeys.refreshToken, aOptions: _androidOptions);

  Future<void> writeUserId(String id) =>
      _storage.write(key: StorageKeys.userId, value: id, aOptions: _androidOptions);

  Future<String?> readUserId() =>
      _storage.read(key: StorageKeys.userId, aOptions: _androidOptions);

  Future<void> writeUserEmail(String email) =>
      _storage.write(key: StorageKeys.userEmail, value: email, aOptions: _androidOptions);

  Future<String?> readUserEmail() =>
      _storage.read(key: StorageKeys.userEmail, aOptions: _androidOptions);

  Future<void> setBiometricEnabled(bool enabled) =>
      _storage.write(
          key: StorageKeys.biometricEnabled,
          value: enabled.toString(),
          aOptions: _androidOptions);

  Future<bool> isBiometricEnabled() async {
    final val = await _storage.read(key: StorageKeys.biometricEnabled, aOptions: _androidOptions);
    return val == 'true';
  }

  Future<void> clearAll() => _storage.deleteAll(aOptions: _androidOptions);

  Future<bool> hasSession() async {
    final token = await readAccessToken();
    return token != null && token.isNotEmpty;
  }
}
