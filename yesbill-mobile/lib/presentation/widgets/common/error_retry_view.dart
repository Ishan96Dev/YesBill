import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/errors/error_handler.dart';

/// Error view shown when a fetch fails, with a retry button.
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

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.xl),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppColors.errorLight,
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.error.withOpacity(0.25)),
                    ),
                    child: Icon(
                      details.icon,
                      size: 34,
                      color: AppColors.error,
                    ),
                  ),
                  const Gap(16),
                  Text(
                    details.title,
                    style: AppTextStyles.h3,
                    textAlign: TextAlign.center,
                  ),
                  const Gap(8),
                  Text(
                    details.message,
                    style:
                        AppTextStyles.body.copyWith(color: AppColors.textSecondary),
                    textAlign: TextAlign.center,
                  ),
                  const Gap(20),
                  OutlinedButton.icon(
                    onPressed: onRetry,
                    icon: const Icon(LucideIcons.refreshCw),
                    label: const Text('Try again'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
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
