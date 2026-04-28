import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../providers/core_providers.dart';
import '../../../services/biometric_service.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  bool _navigated = false;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    try {
      await Future.any([
        _checkSession(),
        Future<void>.delayed(
          const Duration(seconds: 9),
          () => _go('/login'),
        ),
      ]);
    } catch (_) {
      _go('/login');
    }
  }

  void _go(String route) {
    if (!mounted || _navigated) return;
    _navigated = true;
    context.go(route);
  }

  Future<void> _checkSession() async {
    await Future.delayed(const Duration(milliseconds: 650));
    if (!mounted) return;

    final storage = ref.read(secureStorageProvider);
    final hasToken = await storage
        .hasSession()
        .timeout(const Duration(seconds: 2), onTimeout: () => false);
    final onboardingCompleted = ref.read(preferencesProvider).onboardingCompleted;

    if (!hasToken) {
      if (onboardingCompleted) {
        _go('/login');
      } else {
        _go('/onboarding');
      }
      return;
    }

    // Try to restore the session
    try {
      final supabase = ref.read(supabaseClientProvider);
      final session = supabase.auth.currentSession;

      if (session == null) {
        // Try to refresh
        final refreshToken = await storage
            .readRefreshToken()
            .timeout(const Duration(seconds: 2));
        if (refreshToken != null) {
          final result = await supabase.auth
              .setSession(refreshToken)
              .timeout(const Duration(seconds: 6));
          if (result.session == null) throw Exception('No session after refresh');
        } else {
          throw Exception('No refresh token');
        }
      }

      // Check biometric
      final biometricEnabled = await storage.isBiometricEnabled();
      if (biometricEnabled && mounted) {
        final bio = ref.read(biometricServiceProvider);
        final authenticated = await bio.authenticate(
          reason: 'Unlock YesBill',
        ).timeout(const Duration(seconds: 8), onTimeout: () => false);
        if (!authenticated && mounted) {
          _go('/login');
          return;
        }
      }

      _go('/dashboard');
    } catch (_) {
      await storage.clearAll();
      _go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceLight,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 232,
                  height: 92,
                  child: Image.asset(
                    'assets/images/yesbill_logo_black.png',
                    fit: BoxFit.contain,
                    filterQuality: FilterQuality.high,
                  ),
                ),
              ],
            )
                .animate()
                .fadeIn(duration: 450.ms)
                .scale(begin: const Offset(0.94, 0.94), end: const Offset(1, 1)),
            const Gap(20),
            Text(
              'Smart Billing Tracker',
              style: AppTextStyles.body
                  .copyWith(color: AppColors.textSecondaryLight),
            )
                .animate()
                .fadeIn(duration: 600.ms, delay: 500.ms),
            const Gap(48),
            const SizedBox(
              width: 32,
              height: 32,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                valueColor: AlwaysStoppedAnimation(AppColors.primary),
              ),
            ).animate().fadeIn(delay: 800.ms),
          ],
        ),
      ),
    );
  }
}
