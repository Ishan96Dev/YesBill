import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_surfaces.dart';

/// Returns the local asset path for a given AI provider ID.
String? providerLocalAsset(String? providerId) {
  return switch (providerId) {
    'openai'    => 'assets/images/openai.png',
    'anthropic' => 'assets/images/anthropic.png',
    'google'    => 'assets/images/google-ai.png',
    'ollama'    => 'assets/images/ollama.png',
    _           => null,
  };
}

/// A compact circular/rounded badge that shows the provider's logo image.
/// Falls back to a colored letter avatar if the asset isn't available.
class ProviderBadge extends StatelessWidget {
  const ProviderBadge({
    super.key,
    required this.providerId,
    this.size = 36,
    this.borderRadius,
    this.padding = 6.0,
  });

  final String? providerId;
  final double size;
  final double? borderRadius;
  final double padding;

  @override
  Widget build(BuildContext context) {
    final assetPath = providerLocalAsset(providerId);
    final radius = borderRadius ?? size * 0.25;

    if (assetPath != null) {
      return Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: AppSurfaces.elevated(context),
          borderRadius: BorderRadius.circular(radius),
          boxShadow: AppSurfaces.softShadow(context),
        ),
        padding: EdgeInsets.all(padding),
        child: Image.asset(
          assetPath,
          fit: BoxFit.contain,
          filterQuality: FilterQuality.high,
        ),
      );
    }

    // Fallback: colored letter avatar
    final color = switch (providerId) {
      'openai'    => AppColors.openAiGreen,
      'anthropic' => AppColors.anthropicOrange,
      'google'    => AppColors.googleBlue,
      _           => AppColors.primary,
    };
    final label = switch (providerId) {
      'openai'    => 'O',
      'anthropic' => 'A',
      'google'    => 'G',
      _           => '?',
    };
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color.withOpacity(0.14),
        borderRadius: BorderRadius.circular(radius),
      ),
      child: Center(
        child: Text(
          label,
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.w800,
            fontSize: size * 0.4,
          ),
        ),
      ),
    );
  }
}
