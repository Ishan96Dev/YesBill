import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/core_providers.dart';
import '../../widgets/auth_widgets.dart';

class LogoutScreen extends ConsumerStatefulWidget {
  const LogoutScreen({super.key});

  @override
  ConsumerState<LogoutScreen> createState() => _LogoutScreenState();
}

class _LogoutScreenState extends ConsumerState<LogoutScreen> {
  Timer? _timer;
  bool _loggingOut = true;

  @override
  void initState() {
    super.initState();
    _timer = Timer(const Duration(seconds: 3), _performLogout);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _performLogout() async {
    if (!mounted) return;
    await ref.read(authProvider.notifier).signOut();
    if (!mounted) return;
    context.go('/login');
  }

  void _stayLoggedIn() {
    _timer?.cancel();
    setState(() => _loggingOut = false);
    context.go('/settings');
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final email = user?.email ?? '';
    final profileAsync = ref.watch(userProfileProvider);
    final avatarUrl = profileAsync.valueOrNull?.avatarUrl;

    // Resolve display name from metadata, fall back to first part of email.
    final meta = user?.userMetadata;
    final displayName = (() {
      for (final key in ['full_name', 'name', 'display_name']) {
        final v = meta?[key] as String?;
        if (v != null && v.trim().isNotEmpty) return v.trim();
      }
      if (email.isNotEmpty) {
        final raw = email.split('@').first.trim();
        if (raw.isNotEmpty) {
          return '${raw[0].toUpperCase()}${raw.substring(1)}';
        }
      }
      return 'User';
    })();

    final initials = displayName.isNotEmpty ? displayName[0].toUpperCase() : 'Y';

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Gradient background orbs (same style as AppScaffold)
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
                  // Brand logo
                  const Center(
                    child: AuthBrandLogo(),
                  ),
                  const SizedBox(height: 24),
                  // Profile avatar
                  Container(
                    width: 86,
                    height: 86,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(0xFFEAF0FF),
                      border: Border.all(
                          color: AppColors.primary.withOpacity(0.25), width: 3),
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
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'See you soon, $displayName!',
                    style: AppTextStyles.h1.copyWith(
                      color: Theme.of(context).colorScheme.onSurface,
                      fontWeight: FontWeight.w700,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'We\'re securing your financial data and\nsigning you out of your session.',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.body.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 28),
                  // Progress indicator
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
                            color: AppColors.primary.withOpacity(0.1),
                          ),
                          alignment: Alignment.center,
                          child: const Icon(
                            LucideIcons.lock,
                            color: AppColors.primary,
                            size: 22,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'SECURE SESSION CLOSURE',
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
                  const SizedBox(height: 22),
                  // User info card
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x0A2D3337),
                          blurRadius: 16,
                          offset: Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.primary.withOpacity(0.12),
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
                                        fontSize: 13,
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
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                email,
                                style: AppTextStyles.bodySm.copyWith(
                                  color:
                                      Theme.of(context).colorScheme.onSurface,
                                  fontWeight: FontWeight.w600,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                'Signing out securely...',
                                style: AppTextStyles.labelSm.copyWith(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(
                          LucideIcons.checkCircle,
                          size: 16,
                          color: AppColors.success,
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: _stayLoggedIn,
                    child: Text(
                      _loggingOut
                          ? 'WAIT, STAY LOGGED IN'
                          : 'YOU ARE STILL LOGGED IN',
                      style: AppTextStyles.body.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
