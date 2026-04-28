import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

/// Skeleton loading shimmer placeholder — used while data is fetching.
class LoadingShimmer extends StatelessWidget {
  const LoadingShimmer({
    super.key,
    this.width,
    this.height = 60,
    this.borderRadius,
  });

  final double? width;
  final double height;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Shimmer.fromColors(
      baseColor: isDark ? AppColors.cardDark : const Color(0xFFE2E8F0),
      highlightColor:
          isDark ? AppColors.cardDarkBorder : const Color(0xFFF8FAFC),
      child: Container(
        width: width ?? double.infinity,
        height: height,
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : const Color(0xFFE2E8F0),
          borderRadius: borderRadius ?? AppSpacing.cardBorderRadius,
        ),
      ),
    );
  }
}

/// A column of shimmer placeholders simulating a list of cards.
class ShimmerList extends StatelessWidget {
  const ShimmerList({super.key, this.count = 4, this.itemHeight = 80});
  final int count;
  final double itemHeight;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(
        count,
        (i) => Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.md),
          child: LoadingShimmer(height: itemHeight),
        ),
      ),
    );
  }
}
