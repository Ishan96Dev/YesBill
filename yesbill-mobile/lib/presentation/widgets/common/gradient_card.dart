import 'package:flutter/material.dart';

import '../../../core/theme/app_spacing.dart';

/// Reusable card with a LinearGradient background — matches the web's
/// gradient card design used for KPI cards, stat cards, and service icons.
class GradientCard extends StatelessWidget {
  const GradientCard({
    super.key,
    required this.gradient,
    required this.child,
    this.padding,
    this.borderRadius,
    this.onTap,
  });

  final LinearGradient gradient;
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final BorderRadius? borderRadius;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? AppSpacing.cardBorderRadius;
    return InkWell(
      onTap: onTap,
      borderRadius: radius,
      child: Ink(
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: radius,
        ),
        child: Padding(
          padding: padding ?? AppSpacing.cardPadding,
          child: child,
        ),
      ),
    );
  }
}
