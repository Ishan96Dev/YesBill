import 'package:flutter/material.dart';

import 'app_colors.dart';

class AppSurfaces {
  const AppSurfaces._();

  static bool isDark(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark;

  static Color panel(
    BuildContext context, {
    double lightOpacity = 0.84,
    double darkOpacity = 0.84,
  }) {
    return isDark(context)
        ? AppColors.cardDark.withOpacity(darkOpacity)
        : Colors.white.withOpacity(lightOpacity);
  }

  static Color elevated(
    BuildContext context, {
    double lightOpacity = 0.92,
    double darkOpacity = 0.92,
  }) {
    return isDark(context)
        ? AppColors.surfaceDarkElevated.withOpacity(darkOpacity)
        : const Color(0xFFF8FAFC).withOpacity(lightOpacity);
  }

  static Color subtle(
    BuildContext context, {
    double lightOpacity = 0.62,
    double darkOpacity = 0.82,
  }) {
    return isDark(context)
        ? AppColors.surfaceDarkElevated.withOpacity(darkOpacity)
        : Colors.white.withOpacity(lightOpacity);
  }

  static Border cardBorder(
    BuildContext context, {
    double width = 1,
    double lightOpacity = 0.78,
    double darkOpacity = 0.92,
  }) {
    return Border.all(
      color: isDark(context)
          ? AppColors.cardDarkBorder.withOpacity(darkOpacity)
          : const Color(0xFFE2E8F0).withOpacity(lightOpacity),
      width: width,
    );
  }

  static List<BoxShadow> softShadow(BuildContext context) {
    final dark = isDark(context);
    return [
      BoxShadow(
        color: Colors.black.withOpacity(dark ? 0.22 : 0.08),
        blurRadius: dark ? 28 : 24,
        offset: Offset(0, dark ? 12 : 8),
      ),
    ];
  }
}
