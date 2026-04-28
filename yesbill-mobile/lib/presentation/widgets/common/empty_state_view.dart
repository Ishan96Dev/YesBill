import 'package:flutter/material.dart';
import 'package:gap/gap.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';

/// Empty state placeholder shown when a list or data set is empty.
class EmptyStateView extends StatelessWidget {
  const EmptyStateView({
    super.key,
    required this.title,
    this.description,
    this.icon,
    this.action,
    this.actionLabel,
  });

  final String title;
  final String? description;
  final IconData? icon;
  final VoidCallback? action;
  final String? actionLabel;

  @override
  Widget build(BuildContext context) {
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
                  if (icon != null) ...[
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: AppColors.primaryLighter.withOpacity(0.15),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppColors.primary.withOpacity(0.18),
                        ),
                      ),
                      child:
                          Icon(icon, size: 34, color: AppColors.primaryLight),
                    ),
                    const Gap(18),
                  ],
                  Text(
                    title,
                    style: AppTextStyles.h3,
                    textAlign: TextAlign.center,
                  ),
                  if (description != null) ...[
                    const Gap(8),
                    Text(
                      description!,
                      style:
                          AppTextStyles.body.copyWith(color: AppColors.textSecondary),
                      textAlign: TextAlign.center,
                    ),
                  ],
                  if (action != null && actionLabel != null) ...[
                    const Gap(20),
                    FilledButton(
                      onPressed: action,
                      child: Text(actionLabel!),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
