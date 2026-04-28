import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/core_providers.dart';
import '../../../providers/notifications_provider.dart';
import 'notifications_sheet.dart';

// ── Search destinations shared with app_scaffold ─────────────────────────────

const shellSearchDestinations = <_ShellSearchDest>[
  _ShellSearchDest(label: 'Dashboard', path: '/dashboard', icon: LucideIcons.layoutDashboard),
  _ShellSearchDest(label: 'Calendar', path: '/calendar', icon: LucideIcons.calendarDays),
  _ShellSearchDest(label: 'Services', path: '/services', icon: LucideIcons.package),
  _ShellSearchDest(label: 'Bills', path: '/bills', icon: LucideIcons.fileText),
  _ShellSearchDest(label: 'Ask AI', path: '/chat', icon: LucideIcons.messageSquare),
  _ShellSearchDest(label: 'Agentic AI', path: '/agent', icon: LucideIcons.sparkles),
  _ShellSearchDest(label: 'Analytics', path: '/analytics', icon: LucideIcons.barChart3),
  _ShellSearchDest(label: 'Docs', path: '/docs', icon: LucideIcons.bookOpen),
  _ShellSearchDest(label: 'Settings', path: '/settings', icon: LucideIcons.settings),
  _ShellSearchDest(label: 'Support', path: '/support', icon: LucideIcons.lifeBuoy),
];

class _ShellSearchDest {
  const _ShellSearchDest({required this.label, required this.path, required this.icon});
  final String label;
  final String path;
  final IconData icon;
}

// ── Search sheet helper ───────────────────────────────────────────────────────

Future<void> showShellSearchSheet(BuildContext context, {String currentLocation = ''}) async {
  final searchCtrl = TextEditingController();
  var query = '';

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (sheetContext) {
      final isDark = Theme.of(sheetContext).brightness == Brightness.dark;
      return StatefulBuilder(
        builder: (ctx, setModalState) {
          final filtered = shellSearchDestinations
              .where((d) => d.label.toLowerCase().contains(query.trim().toLowerCase()))
              .toList(growable: false);

          return SafeArea(
            top: false,
            child: Padding(
              padding: EdgeInsets.only(
                left: 10,
                right: 10,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 8,
              ),
              child: Container(
                constraints: BoxConstraints(
                  minHeight: MediaQuery.of(ctx).size.height * 0.72,
                  maxHeight: MediaQuery.of(ctx).size.height * 0.9,
                ),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.cardDark : const Color(0xFFF2F5FB),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: isDark ? AppColors.cardDarkBorder : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(14, 14, 14, 8),
                      child: TextField(
                        controller: searchCtrl,
                        autofocus: true,
                        onChanged: (v) => setModalState(() => query = v),
                        decoration: InputDecoration(
                          hintText: 'Search',
                          prefixIcon: const Icon(LucideIcons.search, size: 18),
                          isDense: true,
                          filled: true,
                          fillColor: isDark ? AppColors.surfaceDarkElevated : Colors.white,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(999),
                            borderSide: BorderSide(
                              color: isDark ? AppColors.cardDarkBorder : const Color(0xFFE2E8F0),
                            ),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(999),
                            borderSide: BorderSide(
                              color: isDark ? AppColors.cardDarkBorder : const Color(0xFFE2E8F0),
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(999),
                            borderSide: const BorderSide(color: AppColors.primary),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: filtered.isEmpty
                          ? Center(
                              child: Text(
                                'No pages found',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: isDark
                                      ? AppColors.textSecondary
                                      : AppColors.textSecondaryLight,
                                ),
                              ),
                            )
                          : ListView.separated(
                              padding: const EdgeInsets.fromLTRB(10, 4, 10, 12),
                              itemCount: filtered.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 6),
                              itemBuilder: (_, index) {
                                final dest = filtered[index];
                                final isCurrent = currentLocation.startsWith(dest.path);
                                return Container(
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(14),
                                    color: isCurrent
                                        ? AppColors.primary.withOpacity(0.14)
                                        : (isDark
                                            ? AppColors.surfaceDarkElevated
                                            : Colors.white),
                                    border: Border.all(
                                      color: isCurrent
                                          ? AppColors.primary.withOpacity(0.38)
                                          : (isDark
                                              ? AppColors.cardDarkBorder
                                              : const Color(0xFFE2E8F0)),
                                    ),
                                  ),
                                  child: ListTile(
                                    leading: Icon(dest.icon, size: 18),
                                    title: Text(dest.label),
                                    trailing: const Icon(LucideIcons.chevronRight, size: 16),
                                    onTap: () {
                                      Navigator.of(ctx).pop();
                                      if (!isCurrent) context.go(dest.path);
                                    },
                                  ),
                                );
                              },
                            ),
                    ),
                    // Ask AI gradient button
                    Padding(
                      padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          gradient: const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [AppColors.primary, AppColors.purple],
                          ),
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () {
                              Navigator.of(ctx).pop();
                              context.go('/chat');
                            },
                            child: const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              child: Row(
                                children: [
                                  Icon(LucideIcons.sparkles, size: 16, color: Colors.white),
                                  SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Ask AI',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                  Icon(LucideIcons.zap, size: 16, color: Colors.white),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      );
    },
  );

  searchCtrl.dispose();
}

// ── Notification sheet helper ─────────────────────────────────────────────────

void showShellNotificationSheet(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => ProviderScope(
      parent: ProviderScope.containerOf(context),
      child: const AppNotificationsSheet(),
    ),
  );
}

// ── ShellHeaderActions ────────────────────────────────────────────────────────

/// A row of [search | bell | avatar/profile-menu] for use in AppBar.actions.
/// Mirrors the header action buttons shown on root screens via _ShellHeader.
class ShellHeaderActions extends ConsumerWidget {
  const ShellHeaderActions({
    super.key,
    this.currentLocation = '',
  });

  /// Pass the current route path so the search sheet can highlight it.
  final String currentLocation;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final notifAsync = ref.watch(notificationsProvider);
    final unreadCount = notifAsync.valueOrNull?.where((n) => !n.read).length ?? 0;

    final user = ref.watch(authProvider).user;
    final profile = ref.watch(userProfileProvider).valueOrNull;
    final avatarUrl = profile?.avatarUrl;
    final userLabel = _resolveLabel(profile, user?.email);
    final userEmail = user?.email;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Search
        _HeaderBtn(
          icon: LucideIcons.search,
          isDark: isDark,
          onTap: () => showShellSearchSheet(context, currentLocation: currentLocation),
        ),
        const SizedBox(width: 6),
        // Notification bell with badge
        _BellBtn(unreadCount: unreadCount, isDark: isDark, onTap: () => showShellNotificationSheet(context)),
        const SizedBox(width: 6),
        // Profile popup
        _ProfileMenu(
          avatarUrl: avatarUrl,
          userLabel: userLabel,
          userEmail: userEmail,
          isDark: isDark,
          onSettings: () => context.go('/settings'),
          onSignOut: () async {
            try {
              await ref.read(authProvider.notifier).signOut();
            } catch (_) {}
          },
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  static String _resolveLabel(dynamic profile, String? email) {
    if (profile?.displayName?.isNotEmpty == true) return profile!.displayName!;
    if (profile?.fullName?.isNotEmpty == true) return profile!.fullName!;
    if (email != null) return email.split('@').first;
    return 'You';
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _HeaderBtn extends StatelessWidget {
  const _HeaderBtn({required this.icon, required this.isDark, required this.onTap});
  final IconData icon;
  final bool isDark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isDark ? AppColors.surfaceDarkElevated : const Color(0xFFF2F5FB),
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: onTap,
        child: Container(
          width: 30,
          height: 30,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: isDark ? AppColors.cardDarkBorder : const Color(0xFFE2E8F0),
            ),
          ),
          alignment: Alignment.center,
          child: Icon(
            icon,
            size: 14,
            color: isDark ? AppColors.textSecondary : AppColors.textSecondaryLight,
          ),
        ),
      ),
    );
  }
}

class _BellBtn extends StatelessWidget {
  const _BellBtn({required this.unreadCount, required this.isDark, required this.onTap});
  final int unreadCount;
  final bool isDark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 30,
      height: 30,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          _HeaderBtn(icon: LucideIcons.bell, isDark: isDark, onTap: onTap),
          if (unreadCount > 0)
            Positioned(
              top: -2,
              right: -2,
              child: Container(
                width: 14,
                height: 14,
                decoration: const BoxDecoration(
                  color: AppColors.error,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text(
                  unreadCount > 9 ? '9+' : '$unreadCount',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 8,
                    fontWeight: FontWeight.w700,
                    height: 1,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

enum _ProfileAction { settings, signOut }

class _ProfileMenu extends StatelessWidget {
  const _ProfileMenu({
    required this.avatarUrl,
    required this.userLabel,
    required this.userEmail,
    required this.isDark,
    required this.onSettings,
    required this.onSignOut,
  });

  final String? avatarUrl;
  final String userLabel;
  final String? userEmail;
  final bool isDark;
  final VoidCallback onSettings;
  final VoidCallback onSignOut;

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<_ProfileAction>(
      tooltip: 'Account menu',
      offset: const Offset(0, 40),
      color: isDark ? AppColors.cardDark : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(
          color: isDark ? AppColors.cardDarkBorder : const Color(0xFFE2E8F0),
        ),
      ),
      onSelected: (value) {
        if (value == _ProfileAction.settings) onSettings();
        if (value == _ProfileAction.signOut) onSignOut();
      },
      itemBuilder: (context) => [
        PopupMenuItem<_ProfileAction>(
          enabled: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                userLabel,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: isDark ? AppColors.textPrimary : AppColors.textPrimaryLight,
                ),
              ),
              if (userEmail != null && userEmail!.trim().isNotEmpty)
                Text(
                  userEmail!,
                  style: TextStyle(
                    fontSize: 11.5,
                    color: isDark ? AppColors.textSecondary : AppColors.textSecondaryLight,
                  ),
                ),
            ],
          ),
        ),
        const PopupMenuDivider(),
        PopupMenuItem<_ProfileAction>(
          value: _ProfileAction.settings,
          child: _MenuRow(icon: LucideIcons.settings, label: 'Settings'),
        ),
        PopupMenuItem<_ProfileAction>(
          value: _ProfileAction.signOut,
          child: _MenuRow(icon: LucideIcons.logOut, label: 'Log out', destructive: true),
        ),
      ],
      child: Container(
        width: 30,
        height: 30,
        decoration: BoxDecoration(
          color: isDark ? AppColors.surfaceDarkElevated : const Color(0xFFEAF0FF),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: isDark ? AppColors.cardDarkBorder : const Color(0xFFE2E8F0),
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: avatarUrl != null && avatarUrl!.isNotEmpty
            ? CachedNetworkImage(
                imageUrl: avatarUrl!,
                fit: BoxFit.cover,
                errorWidget: (_, __, ___) => Icon(
                  LucideIcons.user,
                  size: 15,
                  color: isDark ? AppColors.textSecondary : AppColors.textSecondaryLight,
                ),
              )
            : Icon(
                LucideIcons.user,
                size: 15,
                color: isDark ? AppColors.textSecondary : AppColors.textSecondaryLight,
              ),
      ),
    );
  }
}

class _MenuRow extends StatelessWidget {
  const _MenuRow({required this.icon, required this.label, this.destructive = false});
  final IconData icon;
  final String label;
  final bool destructive;

  @override
  Widget build(BuildContext context) {
    final color = destructive ? AppColors.error : null;
    return Row(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            color: color,
            fontWeight: destructive ? FontWeight.w700 : FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
