import 'package:flutter/material.dart';

/// YesBill color palette — mapped from frontend-next/app/globals.css CSS variables.
///
/// The web uses HSL variables; these are converted to Flutter [Color] hex values.
class AppColors {
  AppColors._();

  // ── Primary (Indigo) ──────────────────────────────────────────────────────
  /// hsl(239 84% 67%) — indigo-500, primary brand color
  static const primary = Color(0xFF6366F1);

  /// indigo-600, used for pressed/active states and gradients
  static const primaryDark = Color(0xFF4F46E5);

  /// indigo-400, used for hover states and light accents
  static const primaryLight = Color(0xFF818CF8);

  /// indigo-300, very light accent
  static const primaryLighter = Color(0xFFA5B4FC);

  // ── Dark Theme Surfaces ───────────────────────────────────────────────────
  /// near-black blue — main background in dark theme
  static const surfaceDark = Color(0xFF0F0F23);

  /// card background in dark theme
  static const cardDark = Color(0xFF1A1A3E);

  /// card border in dark theme
  static const cardDarkBorder = Color(0xFF2D2D5E);

  /// slightly lighter surface for elevated cards
  static const surfaceDarkElevated = Color(0xFF16163A);

  // ── Light Theme Surfaces ──────────────────────────────────────────────────
  static const surfaceLight = Color(0xFFF8F9FF);
  static const cardLight = Colors.white;

  // ── Status Colors (Calendar Confirmations) ────────────────────────────────
  /// Service delivered — emerald-500
  static const delivered = Color(0xFF10B981);
  static const deliveredLight = Color(0xFFD1FAE5);

  /// Service skipped — red-500
  static const skipped = Color(0xFFEF4444);
  static const skippedLight = Color(0xFFFEE2E2);

  /// Pending confirmation — gray-500
  static const pending = Color(0xFF6B7280);
  static const pendingLight = Color(0xFFF3F4F6);

  // ── Semantic Colors ───────────────────────────────────────────────────────
  static const success = Color(0xFF10B981);
  static const successLight = Color(0xFFD1FAE5);

  static const error = Color(0xFFEF4444);
  static const errorLight = Color(0xFFFEE2E2);

  static const warning = Color(0xFFF59E0B);
  static const warningLight = Color(0xFFFEF3C7);

  static const info = Color(0xFF3B82F6);
  static const infoLight = Color(0xFFDBEAFE);

  // ── Text ──────────────────────────────────────────────────────────────────
  static const textPrimary = Color(0xFFF8FAFC);      // Dark mode primary text
  static const textSecondary = Color(0xFF94A3B8);    // Dark mode secondary text
  static const textMuted = Color(0xFF64748B);        // Dark mode muted text
  static const textPrimaryLight = Color(0xFF1E293B); // Light mode primary text
  static const textSecondaryLight = Color(0xFF475569);

  // ── AI Provider Colors ────────────────────────────────────────────────────
  static const openAiGreen = Color(0xFF10A37F);
  static const anthropicOrange = Color(0xFFD97706);
  static const googleBlue = Color(0xFF4285F4);

  // ── Stitch Branding Accents ───────────────────────────────────────────────
  static const teal = Color(0xFF4DD0E1);
  static const lavenderBg = Color(0xFFEEEEFF);
  static const purple = Color(0xFF7C4DFF);
}
