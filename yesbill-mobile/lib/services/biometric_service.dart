import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';

/// Wrapper around [LocalAuthentication] for biometric gate.
/// Biometric is a device-side lock — the Supabase session is already
/// stored securely; biometric just prevents unauthorized app access.
class BiometricService {
  BiometricService(this._auth);
  final LocalAuthentication _auth;

  /// Returns true if the device supports biometric auth.
  Future<bool> isAvailable() async {
    final canCheck = await _auth.canCheckBiometrics;
    final isSupported = await _auth.isDeviceSupported();
    return canCheck && isSupported;
  }

  /// Returns list of enrolled biometric types.
  Future<List<BiometricType>> availableBiometrics() =>
      _auth.getAvailableBiometrics();

  /// Prompts user for biometric or device PIN authentication.
  /// Returns true if successful, false otherwise.
  Future<bool> authenticate({
    String reason = 'Please authenticate to continue',
  }) async {
    try {
      return await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          biometricOnly: false, // Allow PIN fallback
          useErrorDialogs: true,
          stickyAuth: true,
        ),
      );
    } catch (_) {
      return false;
    }
  }
}

final biometricServiceProvider = Provider<BiometricService>((ref) {
  return BiometricService(LocalAuthentication());
});
