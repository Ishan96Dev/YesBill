import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/errors/error_handler.dart';
import '../auth_widgets.dart';
import 'app_background_effects.dart';

/// Error view shown when a fetch fails, with a retry button.
/// Uses the YesBill branded background (ambient glows + logo) matching the
/// login/dashboard visual style.
class ErrorRetryView extends StatelessWidget {
  const ErrorRetryView({
    super.key,
    required this.error,
    required this.onRetry,
  });

  final Object error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final details = _resolveError(error);
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Stack(
      fit: StackFit.expand,
      children: [
        ColoredBox(color: cs.surface),
        const AppBackgroundEffects(),
        Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // YesBill logo — same widget used on login screen
                  const AuthBrandLogo(size: 80),
                  const Gap(24),
                  // Error icon badge
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: isDark
                          ? AppColors.error.withValues(alpha: 0.15)
                          : AppColors.errorLight,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.error.withValues(alpha: isDark ? 0.35 : 0.22),
                      ),
                    ),
                    child: Icon(details.icon, size: 28, color: AppColors.error),
                  ),
                  const Gap(16),
                  Text(
                    details.title,
                    style: AppTextStyles.h3.copyWith(color: cs.onSurface),
                    textAlign: TextAlign.center,
                  ),
                  const Gap(8),
                  Text(
                    details.message,
                    style: AppTextStyles.body.copyWith(
                      color: cs.onSurfaceVariant,
                      height: 1.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const Gap(28),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: onRetry,
                      icon: const Icon(LucideIcons.refreshCw, size: 16),
                      label: const Text('Try again'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  _ResolvedError _resolveError(Object rawError) {
    final error = ErrorHandler.handle(rawError);

    if (error is NetworkException) {
      return const _ResolvedError(
        title: 'Connection issue',
        message:
            'We could not reach YesBill right now. Check your internet connection and try again.',
        icon: LucideIcons.alertTriangle,
      );
    }

    if (error is AuthException) {
      return _ResolvedError(
        title: 'Session expired',
        message: error.message,
        icon: LucideIcons.shield,
      );
    }

    if (error is DatabaseException) {
      return _ResolvedError(
        title: 'Data could not load',
        message: error.message,
        icon: LucideIcons.database,
      );
    }

    if (error is ValidationException) {
      return _ResolvedError(
        title: 'Check the details',
        message: error.message,
        icon: LucideIcons.alertTriangle,
      );
    }

    if (error is ApiException) {
      return _ResolvedError(
        title: error.statusCode >= 500
            ? 'Server problem'
            : 'Request failed',
        message: error.message,
        icon: error.statusCode >= 500
            ? LucideIcons.server
            : LucideIcons.alertCircle,
      );
    }

    if (error is UnknownException) {
      final message = error.message.trim().isEmpty ||
              error.message == 'An unexpected error occurred.'
          ? 'We hit an unexpected problem while loading this data. Please try again.'
          : error.message;
      return _ResolvedError(
        title: 'Something needs attention',
        message: message,
        icon: LucideIcons.alertCircle,
      );
    }

    return _ResolvedError(
      title: 'Something needs attention',
      message: error.message,
      icon: LucideIcons.alertCircle,
    );
  }
}

class _ResolvedError {
  const _ResolvedError({
    required this.title,
    required this.message,
    required this.icon,
  });

  final String title;
  final String message;
  final IconData icon;
}
