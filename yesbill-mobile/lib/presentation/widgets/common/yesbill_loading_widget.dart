import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

/// A branded full-screen loading view that shows the YesBill logo,
/// a pulsing animation, a label, and an indeterminate progress bar.
class YesBillLoadingWidget extends StatelessWidget {
  const YesBillLoadingWidget({
    super.key,
    this.label = 'Loading...',
    this.sublabel,
  });

  final String label;
  final String? sublabel;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Logo circle with pulsing ring
          SizedBox(
            width: 108,
            height: 108,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Outer animated ring
                SizedBox(
                  width: 108,
                  height: 108,
                  child: CircularProgressIndicator(
                    strokeWidth: 3.5,
                    valueColor: const AlwaysStoppedAnimation(AppColors.primary),
                    backgroundColor: AppColors.primary.withOpacity(0.12),
                  ),
                ),
                // Inner logo container
                Container(
                  width: 76,
                  height: 76,
                  decoration: BoxDecoration(
                    color: isDark
                        ? Colors.white.withOpacity(0.95)
                        : Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isDark
                          ? Colors.white.withOpacity(0.12)
                          : const Color(0xFFE2E8F0),
                      width: 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.14),
                        blurRadius: 18,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.all(14),
                  child: Image.asset(
                    'assets/images/yesbill_logo_black.png',
                    fit: BoxFit.contain,
                    filterQuality: FilterQuality.high,
                  ),
                ),
              ],
            ),
          )
              .animate(onPlay: (c) => c.repeat(reverse: true))
              .scaleXY(begin: 0.97, end: 1.03, duration: 1200.ms, curve: Curves.easeInOut)
              .animate()
              .fadeIn(duration: 320.ms)
              .scale(begin: const Offset(0.94, 0.94)),
          const SizedBox(height: 20),
          Text(
            label,
            style: AppTextStyles.h3.copyWith(
              color: Theme.of(context).colorScheme.onSurface,
              fontWeight: FontWeight.w700,
            ),
          ).animate().fadeIn(delay: 120.ms),
          if (sublabel != null) ...[
            const SizedBox(height: 4),
            Text(
              sublabel!,
              style: AppTextStyles.body.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ).animate().fadeIn(delay: 200.ms),
          ],
          const SizedBox(height: 20),
          SizedBox(
            width: 140,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: const LinearProgressIndicator(
                minHeight: 4,
                color: AppColors.primary,
                backgroundColor: Color(0xFFDCE3F3),
              ),
            ),
          ).animate().fadeIn(delay: 260.ms),
        ],
      ),
    );
  }
}
