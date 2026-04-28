import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_surfaces.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../providers/core_providers.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder(
        future: ref.read(profileRepositoryProvider).getProfile(),
        builder: (context, snapshot) {
          final profile = snapshot.data;
          final displayName =
              profile?.displayName ?? profile?.fullName ?? 'YesBill User';
          final email = ref.read(supabaseClientProvider).auth.currentUser?.email ?? '';

          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 132),
            children: [
              // ── Header ──────────────────────────────────────
              Text(
                'Settings',
                style: AppTextStyles.h1.copyWith(
                  color: Theme.of(context).colorScheme.onSurface,
                  fontWeight: FontWeight.w700,
                ),
              ).animate().fadeIn(delay: 50.ms),
              const SizedBox(height: 4),
              Text(
                'Manage your account & preferences',
                style: AppTextStyles.body.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ).animate().fadeIn(delay: 100.ms),
              const SizedBox(height: 16),

              // ── Profile Card ─────────────────────────────────
              _ProfileCard(
                displayName: displayName,
                email: email,
                avatarUrl: profile?.avatarUrl,
                onEditTap: () => context.push('/settings/profile'),
              ).animate().fadeIn(delay: 150.ms).slideY(begin: 0.1, end: 0),
              const SizedBox(height: 20),

              // ── Account Section ──────────────────────────────
              _SectionLabel(label: 'ACCOUNT'),
              const SizedBox(height: 8),
              _SettingsGroup(
                tiles: [
                  _SettingsTileData(
                    icon: LucideIcons.user,
                    label: 'User Profile',
                    subtitle: 'Edit your personal information',
                    route: '/settings/profile',
                    iconBg: AppColors.primary.withOpacity(0.12),
                    iconColor: AppColors.primary,
                  ),
                  _SettingsTileData(
                    icon: LucideIcons.shield,
                    label: 'Security',
                    subtitle: 'Password, biometrics & 2FA',
                    route: '/settings/security',
                    iconBg: AppColors.teal.withOpacity(0.12),
                    iconColor: AppColors.teal,
                  ),
                  _SettingsTileData(
                    icon: LucideIcons.bell,
                    label: 'Notifications',
                    subtitle: 'Alerts & reminder preferences',
                    route: '/settings/notifications',
                    iconBg: AppColors.warning.withOpacity(0.12),
                    iconColor: AppColors.warning,
                  ),
                ],
              ).animate().fadeIn(delay: 200.ms),
              const SizedBox(height: 20),

              // ── AI & Billing Section ─────────────────────────
              _SectionLabel(label: 'AI & BILLING'),
              const SizedBox(height: 8),
              _SettingsGroup(
                tiles: [
                  _SettingsTileData(
                    icon: LucideIcons.brain,
                    label: 'AI Configuration',
                    subtitle: 'Model, provider & usage limits',
                    route: '/settings/ai',
                    iconBg: AppColors.purple.withOpacity(0.12),
                    iconColor: AppColors.purple,
                  ),
                  _SettingsTileData(
                    icon: LucideIcons.palette,
                    label: 'Appearance',
                    subtitle: 'Theme, language & display',
                    route: '/settings/appearance',
                    iconBg: AppColors.primaryLight.withOpacity(0.18),
                    iconColor: AppColors.primaryLight,
                  ),
                ],
              ).animate().fadeIn(delay: 250.ms),
              const SizedBox(height: 20),

              // ── Support Section ──────────────────────────────
              _SectionLabel(label: 'SUPPORT'),
              const SizedBox(height: 8),
              _SettingsGroup(
                tiles: [
                  _SettingsTileData(
                    icon: LucideIcons.helpCircle,
                    label: 'Help & Support',
                    subtitle: 'FAQs, contact & feedback',
                    route: '/support',
                    iconBg: AppColors.info.withOpacity(0.12),
                    iconColor: AppColors.info,
                  ),
                ],
              ).animate().fadeIn(delay: 300.ms),
              const SizedBox(height: 24),

              // ── Logout Button ────────────────────────────────
              FilledButton(
                onPressed: () async {
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Text('Sign out?'),
                      content: const Text(
                          'You will need to sign in again to continue.'),
                      actions: [
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () =>
                                    Navigator.of(ctx).pop(false),
                                child: const Text('Cancel'),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: FilledButton(
                                onPressed: () =>
                                    Navigator.of(ctx).pop(true),
                                style: FilledButton.styleFrom(
                                  backgroundColor: AppColors.error,
                                  foregroundColor: Colors.white,
                                ),
                                child: const Text('Sign out'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ) ??
                      false;
                  if (confirm && context.mounted) {
                    context.push('/logout');
                  }
                },
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.error.withOpacity(0.1),
                  foregroundColor: AppColors.error,
                  minimumSize: const Size.fromHeight(52),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(LucideIcons.logOut, size: 17),
                    const SizedBox(width: 8),
                    Text(
                      'Log Out',
                      style: AppTextStyles.body.copyWith(
                        color: AppColors.error,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: 350.ms),
              const SizedBox(height: 12),
              Center(
                child: Text(
                  'YESBILL v2.4.0 • SMART BILLING',
                  style: AppTextStyles.labelSm.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.6),
                    letterSpacing: 0.5,
                  ),
                ),
              ).animate().fadeIn(delay: 400.ms),
            ],
          );
        },
    );
  }
}

// ── Profile Card ─────────────────────────────────────────────────────────────

class _ProfileCard extends StatelessWidget {
  const _ProfileCard({
    required this.displayName,
    required this.email,
    required this.avatarUrl,
    required this.onEditTap,
  });

  final String displayName;
  final String email;
  final String? avatarUrl;
  final VoidCallback onEditTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppSurfaces.panel(context),
        borderRadius: BorderRadius.circular(20),
        border: AppSurfaces.cardBorder(context),
        boxShadow: AppSurfaces.softShadow(context),
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.lavenderBg,
            ),
            child: ClipOval(
              child: avatarUrl != null && avatarUrl!.isNotEmpty
                  ? Image.network(avatarUrl!, fit: BoxFit.cover)
                  : const Icon(LucideIcons.user, color: AppColors.primary, size: 26),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  displayName,
                  style: AppTextStyles.h4.copyWith(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  email,
                  style: AppTextStyles.bodySm.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),

              ],
            ),
          ),
          IconButton(
            onPressed: onEditTap,
            icon: const Icon(LucideIcons.pencil, size: 16),
            style: IconButton.styleFrom(
              backgroundColor: AppColors.lavenderBg,
              foregroundColor: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Section Label ─────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        label,
        style: AppTextStyles.labelSm.copyWith(
          color: Theme.of(context).colorScheme.onSurfaceVariant,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.6,
        ),
      ),
    );
  }
}

// ── Settings Group ────────────────────────────────────────────────────────────

class _SettingsGroup extends StatelessWidget {
  const _SettingsGroup({required this.tiles});
  final List<_SettingsTileData> tiles;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppSurfaces.panel(context),
        borderRadius: BorderRadius.circular(16),
        border: AppSurfaces.cardBorder(context),
        boxShadow: AppSurfaces.softShadow(context),
      ),
      child: Column(
        children: tiles.asMap().entries.map((entry) {
          final idx = entry.key;
          final tile = entry.value;
          return Column(
            children: [
              ListTile(
                onTap: () => context.push(tile.route),
                leading: Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: tile.iconBg,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(tile.icon, size: 16, color: tile.iconColor),
                ),
                title: Text(
                  tile.label,
                  style: AppTextStyles.body.copyWith(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                subtitle: Text(
                  tile.subtitle,
                  style: AppTextStyles.bodySm.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                trailing: Icon(
                  LucideIcons.chevronRight,
                  size: 16,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              if (idx < tiles.length - 1)
                const Divider(height: 1, indent: 60, endIndent: 16),
            ],
          );
        }).toList(),
      ),
    );
  }
}

// ── Tile Data Model ───────────────────────────────────────────────────────────

class _SettingsTileData {
  const _SettingsTileData({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.route,
    required this.iconBg,
    required this.iconColor,
  });

  final IconData icon;
  final String label;
  final String subtitle;
  final String route;
  final Color iconBg;
  final Color iconColor;
}
