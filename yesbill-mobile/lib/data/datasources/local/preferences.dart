import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/constants/storage_keys.dart';

/// Wrapper around [SharedPreferences] for non-sensitive preferences.
class PreferencesService {
  PreferencesService(this._prefs);

  final SharedPreferences _prefs;

  ThemeMode get themeMode {
    final val = _prefs.getString(StorageKeys.themeMode);
    return switch (val) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
            _ => ThemeMode.light,
    };
  }

  Future<void> setThemeMode(ThemeMode mode) =>
      _prefs.setString(StorageKeys.themeMode, mode.name);

  bool get onboardingCompleted =>
      _prefs.getBool(StorageKeys.onboardingCompleted) ?? false;

  Future<void> setOnboardingCompleted(bool v) =>
      _prefs.setBool(StorageKeys.onboardingCompleted, v);

  String get selectedCurrency =>
      _prefs.getString(StorageKeys.selectedCurrency) ?? 'INR';

  Future<void> setSelectedCurrency(String currency) =>
      _prefs.setString(StorageKeys.selectedCurrency, currency);

  String? get fcmToken => _prefs.getString(StorageKeys.fcmToken);

  Future<void> setFcmToken(String token) =>
      _prefs.setString(StorageKeys.fcmToken, token);
}
