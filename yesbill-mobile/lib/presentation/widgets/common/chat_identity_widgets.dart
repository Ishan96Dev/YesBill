import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

class YesBillLogoAvatar extends StatelessWidget {
  const YesBillLogoAvatar({super.key, this.size = 32});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.12),
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.primary.withOpacity(0.18)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: EdgeInsets.all(size * 0.16),
        child: Image.asset(
          'assets/images/yesbill_logo_icon_only.png',
          fit: BoxFit.contain,
          errorBuilder: (_, __, ___) => const Icon(
            LucideIcons.sparkles,
            color: AppColors.primary,
            size: 16,
          ),
        ),
      ),
    );
  }
}

class ChatUserAvatar extends StatelessWidget {
  const ChatUserAvatar({
    super.key,
    required this.userLabel,
    this.avatarUrl,
    this.size = 32,
  });

  final String userLabel;
  final String? avatarUrl;
  final double size;

  @override
  Widget build(BuildContext context) {
    final initial =
        userLabel.trim().isEmpty ? 'Y' : userLabel.trim()[0].toUpperCase();
    final hasAvatar = avatarUrl != null && avatarUrl!.trim().isNotEmpty;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.12),
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.primary.withOpacity(0.18)),
      ),
      clipBehavior: Clip.antiAlias,
      child: hasAvatar
          ? CachedNetworkImage(
              imageUrl: avatarUrl!.trim(),
              fit: BoxFit.cover,
              errorWidget: (_, __, ___) => _InitialAvatar(initial: initial),
            )
          : _InitialAvatar(initial: initial),
    );
  }
}

class ChatTitleIdentity extends StatelessWidget {
  const ChatTitleIdentity({
    super.key,
    required this.title,
    required this.userLabel,
    this.userEmail,
  });

  final String title;
  final String userLabel;
  final String? userEmail;

  @override
  Widget build(BuildContext context) {
    final subtitle =
        userEmail?.trim().isNotEmpty == true ? userEmail!.trim() : userLabel;

    return Row(
      children: [
        const YesBillLogoAvatar(size: 32),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTextStyles.body.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                subtitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTextStyles.caption.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _InitialAvatar extends StatelessWidget {
  const _InitialAvatar({required this.initial});

  final String initial;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        initial,
        style: const TextStyle(
          color: AppColors.primary,
          fontWeight: FontWeight.w800,
          fontSize: 12,
        ),
      ),
    );
  }
}
