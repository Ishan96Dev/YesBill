import 'dart:math';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/core_providers.dart';
import '../../widgets/auth_widgets.dart';

class SecurityLoadingScreen extends ConsumerStatefulWidget {
  const SecurityLoadingScreen({super.key});

  @override
  ConsumerState<SecurityLoadingScreen> createState() =>
      _SecurityLoadingScreenState();
}

class _SecurityLoadingScreenState
    extends ConsumerState<SecurityLoadingScreen> {
  static const List<String> _quotes = [
    'Smart billing, smarter business.',
    'Your invoices, always on time.',
    'Turning services into seamless payments.',
    'YesBill — where every bill tells your story.',
    'Streamline your billing, grow your business.',
    'Professional invoicing at your fingertips.',
    'From service to payment, effortlessly.',
    'Your financial command center awaits.',
    'Billing made beautiful, business made easy.',
    'Every invoice, perfectly managed.',
  ];

  late final String _quote;

  @override
  void initState() {
    super.initState();
    _quote = _quotes[Random().nextInt(_quotes.length)];
    // Navigate to dashboard after a brief welcome pause.
    Future.delayed(const Duration(milliseconds: 1500), () {
      if (mounted) context.go('/dashboard');
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final profileAsync = ref.watch(userProfileProvider);
    final profileAvatarUrl = profileAsync.valueOrNull?.avatarUrl;

    // Resolve display name — OAuth metadata first, then email prefix.
    final meta = user?.userMetadata;
    final displayName = (() {
      for (final key in ['full_name', 'name', 'display_name']) {
        final v = meta?[key] as String?;
        if (v != null && v.trim().isNotEmpty) {
          return v.trim().split(' ').first;
        }
      }
      final email = user?.email ?? '';
      if (email.isNotEmpty) {
        final raw = email.split('@').first.trim();
        if (raw.isNotEmpty) {
          return '${raw[0].toUpperCase()}${raw.substring(1)}';
        }
      }
      return 'there';
    })();

    // Prefer OAuth avatar from metadata, fallback to profile table.
    final metaAvatar = meta?['avatar_url'] as String?;
    final avatarUrl = (metaAvatar != null && metaAvatar.isNotEmpty)
        ? metaAvatar
        : profileAvatarUrl;
    final initials =
        displayName.isNotEmpty ? displayName[0].toUpperCase() : 'Y';

    return Theme(
      data: AppTheme.light,
      child: Scaffold(
        backgroundColor: AppColors.surfaceLight,
        body: Stack(
          fit: StackFit.expand,
          children: [
            // Background orbs (same style as logout screen).
            IgnorePointer(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Positioned(
                    top: -130,
                    left: -110,
                    child: Container(
                      width: 300,
                      height: 300,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.primary.withOpacity(0.15),
                      ),
                    ),
                  ),
                  Align(
                    alignment: const Alignment(0.1, -0.5),
                    child: Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFFA78BFA).withOpacity(0.12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                child: Column(
                  children: [
                    // Brand logo at top.
                    const Center(child: AuthBrandLogo()),
                    const SizedBox(height: 28),
                    // Profile avatar.
                    Container(
                      width: 86,
                      height: 86,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFFEAF0FF),
                        border: Border.all(
                          color: AppColors.primary.withOpacity(0.25),
                          width: 3,
                        ),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: avatarUrl != null && avatarUrl.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: avatarUrl,
                              fit: BoxFit.cover,
                              errorWidget: (_, __, ___) => Center(
                                child: Text(
                                  initials,
                                  style: const TextStyle(
                                    color: AppColors.primary,
                                    fontSize: 32,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            )
                          : Center(
                              child: Text(
                                initials,
                                style: const TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 32,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                    )
                        .animate()
                        .fadeIn(duration: 320.ms)
                        .scale(begin: const Offset(0.92, 0.92)),
                    const SizedBox(height: 16),
                    // Personalised welcome heading.
                    Text(
                      'Welcome back, $displayName!',
                      style: AppTextStyles.h1.copyWith(
                        color: AppColors.textPrimaryLight,
                        fontWeight: FontWeight.w700,
                      ),
                      textAlign: TextAlign.center,
                    ).animate().fadeIn(delay: 100.ms),
                    const SizedBox(height: 6),
                    // Subtitle.
                    Text(
                      'Your account is protected securely.',
                      textAlign: TextAlign.center,
                      style: AppTextStyles.body.copyWith(
                        color: AppColors.textSecondaryLight,
                      ),
                    ).animate().fadeIn(delay: 160.ms),
                    const SizedBox(height: 12),
                    // Dynamic quote — changes each session.
                    Text(
                      _quote,
                      textAlign: TextAlign.center,
                      style: AppTextStyles.bodySm.copyWith(
                        color: AppColors.primary.withOpacity(0.75),
                        fontStyle: FontStyle.italic,
                        height: 1.45,
                      ),
                    ).animate().fadeIn(delay: 220.ms),
                    const SizedBox(height: 32),
                    // Circular progress with YesBill logo.
                    SizedBox(
                      width: 86,
                      height: 86,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          const SizedBox(
                            width: 86,
                            height: 86,
                            child: CircularProgressIndicator(
                              strokeWidth: 4,
                              value: 0.72,
                              valueColor:
                                  AlwaysStoppedAnimation(AppColors.primary),
                              backgroundColor: Color(0xFFD7DCEC),
                            ),
                          ),
                          Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: const Color(0xFFF7F8FB),
                              border:
                                  Border.all(color: const Color(0xFFD9DFEF)),
                            ),
                            padding: const EdgeInsets.all(10),
                            child: Image.asset(
                              'assets/images/yesbill_logo_black.png',
                              fit: BoxFit.contain,
                              filterQuality: FilterQuality.high,
                            ),
                          ),
                        ],
                      ),
                    ).animate().fadeIn(duration: 320.ms),
                    const SizedBox(height: 14),
                    Text(
                      'SIGNING YOU IN',
                      style: AppTextStyles.labelSm.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: const LinearProgressIndicator(
                        minHeight: 4,
                        value: 0.72,
                        color: AppColors.primary,
                        backgroundColor: Color(0xFFD7DCEC),
                      ),
                    ),
                    const Spacer(),
                    const AuthBrandLogo(size: 48),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
