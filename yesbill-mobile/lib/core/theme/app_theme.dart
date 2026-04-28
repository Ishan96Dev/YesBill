import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';
import 'app_spacing.dart';

/// Material 3 ThemeData for YesBill — both light and dark variants.
/// Design matches the Stitch design system (Plus Jakarta Sans & Manrope font).
class AppTheme {
  AppTheme._();

  static ThemeData get dark => _buildTheme(brightness: Brightness.dark);
  static ThemeData get light => _buildTheme(brightness: Brightness.light);

  static ThemeData _buildTheme({required Brightness brightness}) {
    final isDark = brightness == Brightness.dark;

    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      brightness: brightness,
    ).copyWith(
      primary: AppColors.primary,
      onPrimary: Colors.white,
      secondary: AppColors.primaryDark,
      surface: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
      surfaceContainerHighest:
          isDark ? AppColors.cardDark : AppColors.cardLight,
      onSurface: isDark ? AppColors.textPrimary : AppColors.textPrimaryLight,
      onSurfaceVariant:
          isDark ? AppColors.textSecondary : AppColors.textSecondaryLight,
      error: AppColors.error,
      outline: isDark ? AppColors.cardDarkBorder : const Color(0xFFE2E8F0),
    );

    // Build the text themes based on fonts
    // Headings use Plus Jakarta Sans, Body uses Manrope
    final baseTextTheme =
        isDark ? ThemeData.dark().textTheme : ThemeData.light().textTheme;

    final plusJakartaSansTheme = GoogleFonts.plusJakartaSansTextTheme(baseTextTheme);
    final manropeTheme = GoogleFonts.manropeTextTheme(baseTextTheme);

    final mergedTextTheme = plusJakartaSansTheme.copyWith(
      bodyLarge: manropeTheme.bodyLarge,
      bodyMedium: manropeTheme.bodyMedium,
      bodySmall: manropeTheme.bodySmall,
      labelLarge: manropeTheme.labelLarge,
      labelMedium: manropeTheme.labelMedium,
      labelSmall: manropeTheme.labelSmall,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      brightness: brightness,
      textTheme: mergedTextTheme,

      // ── Scaffold ─────────────────────────────────────────────────────────
      // Transparent so nested Scaffolds (sub-screens) never flash a white
      // Material background — AppScaffold provides its own Container background.
      scaffoldBackgroundColor: Colors.transparent,

      // ── AppBar ────────────────────────────────────────────────────────────
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor:
            isDark ? AppColors.textPrimary : AppColors.textPrimaryLight,
        elevation: 0,
        scrolledUnderElevation: 0,
        systemOverlayStyle: isDark
            ? SystemUiOverlayStyle.light
            : SystemUiOverlayStyle.dark,
        titleTextStyle: mergedTextTheme.titleLarge?.copyWith(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: isDark ? AppColors.textPrimary : AppColors.textPrimaryLight,
        ),
        centerTitle: false,
      ),

      // ── Card ─────────────────────────────────────────────────────────────
      cardTheme: CardThemeData(
        elevation: isDark ? 0 : 1.2,
        shadowColor: Colors.black.withOpacity(isDark ? 0.0 : 0.08),
        surfaceTintColor: Colors.transparent,
        color: isDark ? AppColors.cardDark : AppColors.cardLight,
        shape: RoundedRectangleBorder(
          borderRadius: AppSpacing.cardBorderRadius,
          side: BorderSide(
            color: isDark ? AppColors.cardDarkBorder : const Color(0xFFE2E8F0),
            width: 1,
          ),
        ),
        clipBehavior: Clip.antiAlias,
      ),

      // ── Input Fields ──────────────────────────────────────────────────────
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark
            ? AppColors.surfaceDarkElevated
            : const Color(0xFFF8FAFC),
        border: OutlineInputBorder(
          borderRadius: AppSpacing.inputBorderRadius,
          borderSide: BorderSide(
            color: isDark ? AppColors.cardDarkBorder : const Color(0xFFE2E8F0),
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppSpacing.inputBorderRadius,
          borderSide: BorderSide(
            color: isDark ? AppColors.cardDarkBorder : const Color(0xFFE2E8F0),
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppSpacing.inputBorderRadius,
          borderSide:
              const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: AppSpacing.inputBorderRadius,
          borderSide: const BorderSide(color: AppColors.error),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: mergedTextTheme.bodyMedium?.copyWith(
          color: isDark ? AppColors.textMuted : const Color(0xFF94A3B8),
        ),
      ),

      // ── Filled Button ─────────────────────────────────────────────────────
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          shadowColor: Colors.transparent,
          minimumSize: const Size(double.infinity, 48),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: AppSpacing.buttonBorderRadius,
          ),
          textStyle: mergedTextTheme.labelLarge?.copyWith(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // ── Outlined Button ───────────────────────────────────────────────────
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: AppColors.primary, width: 1.2),
          foregroundColor: AppColors.primary,
          backgroundColor: AppColors.primary.withOpacity(0.05),
          minimumSize: const Size(double.infinity, 48),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: AppSpacing.buttonBorderRadius,
          ),
          textStyle: mergedTextTheme.labelLarge?.copyWith(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // ── Text Button ───────────────────────────────────────────────────────
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          textStyle: mergedTextTheme.labelLarge?.copyWith(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),

      // ── Bottom Navigation Bar ─────────────────────────────────────────────
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor:
            isDark ? AppColors.cardDark : AppColors.cardLight,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textMuted,
        showSelectedLabels: true,
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
        selectedLabelStyle: mergedTextTheme.labelSmall?.copyWith(
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: mergedTextTheme.labelSmall?.copyWith(
          fontSize: 11,
        ),
      ),

      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.transparent,
        indicatorColor: AppColors.primary.withOpacity(0.18),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: AppColors.primary);
          }
          return IconThemeData(
            color: isDark ? AppColors.textSecondary : AppColors.textSecondaryLight,
          );
        }),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          return mergedTextTheme.labelSmall?.copyWith(
            fontSize: 11,
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.w700
                : FontWeight.w500,
            color: states.contains(WidgetState.selected)
                ? AppColors.primary
                : (isDark ? AppColors.textSecondary : AppColors.textSecondaryLight),
          );
        }),
      ),

      // ── Chip ──────────────────────────────────────────────────────────────
      chipTheme: ChipThemeData(
        backgroundColor: isDark ? AppColors.cardDark : const Color(0xFFF1F5F9),
        selectedColor: AppColors.primaryLighter.withOpacity(0.2),
        labelStyle: mergedTextTheme.labelMedium?.copyWith(
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.chipRadius),
        ),
      ),

      // ── Dialog ────────────────────────────────────────────────────────────
      dialogTheme: DialogThemeData(
        backgroundColor: isDark ? AppColors.cardDark : AppColors.surfaceLight,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.cardRadiusLg),
        ),
        elevation: 8,
      ),

      // ── Bottom Sheet ──────────────────────────────────────────────────────
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: isDark ? AppColors.cardDark : AppColors.surfaceLight,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(AppSpacing.cardRadiusLg),
          ),
        ),
        showDragHandle: true,
      ),

      // ── List Tile ─────────────────────────────────────────────────────────
      listTileTheme: ListTileThemeData(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        shape: RoundedRectangleBorder(
          borderRadius: AppSpacing.cardBorderRadius,
        ),
      ),

      // ── Floating Action Button ────────────────────────────────────────────
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 4,
        shape: StadiumBorder(),
      ),

      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(
          foregroundColor:
              isDark ? AppColors.textPrimary : AppColors.textPrimaryLight,
          backgroundColor: isDark
              ? AppColors.surfaceDarkElevated.withOpacity(0.5)
              : AppColors.surfaceLight.withOpacity(0.92),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(
              color:
                  isDark ? AppColors.cardDarkBorder : const Color(0xFFE2E8F0),
            ),
          ),
          minimumSize: const Size(40, 40),
          padding: EdgeInsets.zero,
        ),
      ),

      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: isDark ? AppColors.cardDark : const Color(0xFF0F172A),
        contentTextStyle: mergedTextTheme.bodyMedium?.copyWith(
          color: Colors.white,
          fontWeight: FontWeight.w500,
        ),
      ),

      // ── Divider ───────────────────────────────────────────────────────────
      dividerTheme: DividerThemeData(
        color: isDark ? AppColors.cardDarkBorder : const Color(0xFFE2E8F0),
        thickness: 1,
        space: 1,
      ),

      // ── Switch ────────────────────────────────────────────────────────────
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return Colors.white;
          return null;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return AppColors.primary;
          return null;
        }),
      ),
    );
  }
}
