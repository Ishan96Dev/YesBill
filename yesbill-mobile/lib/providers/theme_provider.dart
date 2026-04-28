import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core_providers.dart';

class ThemeNotifier extends Notifier<ThemeMode> {
  @override
  ThemeMode build() {
    return ref.read(preferencesProvider).themeMode;
  }

  Future<void> setTheme(ThemeMode mode) async {
    state = mode;
    await ref.read(preferencesProvider).setThemeMode(mode);
  }
}

final themeProvider = NotifierProvider<ThemeNotifier, ThemeMode>(ThemeNotifier.new);
