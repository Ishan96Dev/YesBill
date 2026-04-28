import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

/// Pill badge for service confirmation statuses: delivered / skipped / pending.
class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    final (color, bg, label) = switch (status) {
      'delivered' => (AppColors.delivered, AppColors.deliveredLight, 'Delivered'),
      'skipped' => (AppColors.skipped, AppColors.skippedLight, 'Skipped'),
      _ => (AppColors.pending, AppColors.pendingLight, 'Pending'),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(100),
      ),
      child: Text(
        label,
        style: AppTextStyles.labelSm.copyWith(color: color),
      ),
    );
  }
}
