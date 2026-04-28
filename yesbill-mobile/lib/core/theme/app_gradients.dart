import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Gradient presets matching the web app's CSS gradient cards.
class AppGradients {
  AppGradients._();

  /// Primary indigo gradient — used for main CTA cards, auth buttons
  static const primary = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [AppColors.primaryDark, AppColors.primary],
  );

  /// Success gradient — used for positive metric cards
  static const success = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF059669), Color(0xFF10B981)],
  );

  /// Warning gradient — used for payment/due alerts
  static const warning = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFD97706), Color(0xFFF59E0B)],
  );

  /// Error gradient — used for skipped/overdue cards
  static const error = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFDC2626), Color(0xFFEF4444)],
  );

  /// Dark surface gradient — used for dark card backgrounds
  static const darkSurface = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [AppColors.cardDark, AppColors.surfaceDark],
  );

  /// Purple-to-indigo for special cards
  static const purpleIndigo = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF7C3AED), Color(0xFF6366F1)],
  );

  /// Teal gradient for analytics/insight cards
  static const teal = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF0891B2), Color(0xFF06B6D4)],
  );

  /// Returns a gradient based on a hex/name key (used for service icons)
  static LinearGradient forService(int index) {
    final gradients = [primary, success, warning, purpleIndigo, teal, error];
    return gradients[index % gradients.length];
  }
}
