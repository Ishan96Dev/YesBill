import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Text style constants using Inter font family — matching the web typography.
class AppTextStyles {
  AppTextStyles._();

  static const _inter = 'Inter';

  // ── Display ───────────────────────────────────────────────────────────────
  static const displayLg = TextStyle(
    fontFamily: _inter,
    fontSize: 36,
    fontWeight: FontWeight.w700,
    height: 1.1,
    letterSpacing: -0.5,
  );

  static const displayMd = TextStyle(
    fontFamily: _inter,
    fontSize: 28,
    fontWeight: FontWeight.w700,
    height: 1.2,
    letterSpacing: -0.3,
  );

  // ── Headings ──────────────────────────────────────────────────────────────
  static const h1 = TextStyle(
    fontFamily: _inter,
    fontSize: 24,
    fontWeight: FontWeight.w700,
    height: 1.3,
  );

  static const h2 = TextStyle(
    fontFamily: _inter,
    fontSize: 20,
    fontWeight: FontWeight.w600,
    height: 1.3,
  );

  static const h3 = TextStyle(
    fontFamily: _inter,
    fontSize: 18,
    fontWeight: FontWeight.w600,
    height: 1.4,
  );

  static const h4 = TextStyle(
    fontFamily: _inter,
    fontSize: 16,
    fontWeight: FontWeight.w600,
    height: 1.4,
  );

  // ── Body ──────────────────────────────────────────────────────────────────
  static const bodyLg = TextStyle(
    fontFamily: _inter,
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 1.6,
  );

  static const body = TextStyle(
    fontFamily: _inter,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.5,
  );

  static const bodySm = TextStyle(
    fontFamily: _inter,
    fontSize: 13,
    fontWeight: FontWeight.w400,
    height: 1.5,
  );

  // ── Labels / Captions ─────────────────────────────────────────────────────
  static const label = TextStyle(
    fontFamily: _inter,
    fontSize: 12,
    fontWeight: FontWeight.w500,
    height: 1.4,
    letterSpacing: 0.1,
  );

  static const labelSm = TextStyle(
    fontFamily: _inter,
    fontSize: 11,
    fontWeight: FontWeight.w500,
    height: 1.4,
    letterSpacing: 0.2,
  );

  static const caption = TextStyle(
    fontFamily: _inter,
    fontSize: 11,
    fontWeight: FontWeight.w400,
    height: 1.4,
    color: AppColors.textSecondary,
  );

  // ── Numeric / Stats ───────────────────────────────────────────────────────
  static const statValue = TextStyle(
    fontFamily: _inter,
    fontSize: 28,
    fontWeight: FontWeight.w700,
    height: 1.0,
    letterSpacing: -0.5,
  );

  static const statValueSm = TextStyle(
    fontFamily: _inter,
    fontSize: 20,
    fontWeight: FontWeight.w700,
    height: 1.0,
  );

  // ── Monospace (for AI chat code blocks) ───────────────────────────────────
  static const code = TextStyle(
    fontFamily: 'monospace',
    fontSize: 13,
    height: 1.5,
  );
}
