import 'dart:async';
import 'dart:ui';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/theme/app_colors.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/core_providers.dart';
import '../../../providers/notifications_provider.dart';
import '../../../providers/shell_chrome_provider.dart';
import '../../../services/permission_service.dart';
import '../../../services/widget_service.dart';
import 'app_background_effects.dart';
import 'notifications_sheet.dart';

/// Main app shell: wraps all authenticated screens with top header,
/// animated bottom navigation, global footer, and floating AI action.
class AppScaffold extends ConsumerStatefulWidget {
  const AppScaffold({super.key, required this.child});
  final Widget child;

  @override
  ConsumerState<AppScaffold> createState() => _AppScaffoldState();
}

class _AppScaffoldState extends ConsumerState<AppScaffold> {
  DateTime? _lastBackPressedAt;
  static const _permissionsPromptKey = 'permissions_prompted_v1';

  static const _rootPaths = <String>{
    '/dashboard',
    '/calendar',
    '/services',
    '/bills',
    '/analytics',
    '/settings',
    '/support',
    '/docs',
  };

  static const _searchDestinations = <_SearchDestination>[
    _SearchDestination(
      label: 'Dashboard',
      path: '/dashboard',
      icon: LucideIcons.layoutDashboard,
    ),
    _SearchDestination(
      label: 'Calendar',
      path: '/calendar',
      icon: LucideIcons.calendarDays,
    ),
    _SearchDestination(
      label: 'Services',
      path: '/services',
      icon: LucideIcons.package,
    ),
    _SearchDestination(
      label: 'Bills',
      path: '/bills',
      icon: LucideIcons.fileText,
    ),
    _SearchDestination(
      label: 'Ask AI',
      path: '/chat',
      icon: LucideIcons.messageSquare,
    ),
    _SearchDestination(
      label: 'Analytics',
      path: '/analytics',
      icon: LucideIcons.barChart3,
    ),
    _SearchDestination(
      label: 'Settings',
      path: '/settings',
      icon: LucideIcons.settings,
    ),
    _SearchDestination(
      label: 'Support',
      path: '/support',
      icon: LucideIcons.lifeBuoy,
    ),
    _SearchDestination(
      label: 'Agentic AI',
      path: '/agent',
      icon: LucideIcons.sparkles,
    ),
    _SearchDestination(
      label: 'Docs',
      path: '/docs',
      icon: LucideIcons.bookOpen,
    ),
  ];

  bool _isRootLocation(String location) => _rootPaths.contains(location);

  String? _fallbackPathForBack(String location) {
    if (location == '/dashboard') return null;

    if (location.startsWith('/services/')) return '/services';
    if (location.startsWith('/calendar/')) return '/calendar';
    if (location.startsWith('/bills/')) return '/bills';
    if (location.startsWith('/settings/')) return '/settings';

    return '/dashboard';
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _requestPermissionsIfNeeded();
      _checkSetupStatus();
    });
  }

  /// Redirect to /setup if the user hasn't completed the account setup wizard.
  /// Runs once when the authenticated shell first mounts (covers login redirect).
  Future<void> _checkSetupStatus() async {
    if (!mounted) return;
    try {
      final profile = await ref.read(userProfileProvider.future);
      if (!mounted) return;
      if (profile != null && !profile.onboardingCompleted) {
        context.go('/setup');
      }
      // Seed the Chat widget greeting once profile is available
      if (profile != null) {
        unawaited(WidgetService.pushChatData(
          displayName: profile.displayName ?? '',
        ));
      }
    } catch (_) {
      // Profile fetch failed — allow user through to dashboard
    }
  }

  Future<void> _signOutFromUi() async {
    if (!mounted) return;

    final shouldSignOut = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Sign out?'),
            content: const Text('You will need to sign in again to continue.'),
            actions: [
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(false),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.error,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: () => Navigator.of(context).pop(true),
                      child: const Text('Sign out'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ) ??
        false;

    if (!shouldSignOut || !mounted) return;

    context.go('/logout');
  }

  String _userDisplayLabel(User? user) {
    final meta = user?.userMetadata;
    for (final key in ['full_name', 'name', 'display_name']) {
      final v = meta?[key] as String?;
      if (v != null && v.trim().isNotEmpty) return v.trim();
    }
    final email = user?.email;
    if (email == null || email.trim().isEmpty) return 'You';
    return email.split('@').first;
  }

  Future<void> _requestPermissionsIfNeeded() async {
    final prefs = ref.read(sharedPreferencesProvider);
    final alreadyPrompted = prefs.getBool(_permissionsPromptKey) ?? false;
    if (alreadyPrompted) return;

    await Future<void>.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;

    final statuses =
        await ref.read(permissionServiceProvider).requestEssentialPermissions();
    await prefs.setBool(_permissionsPromptKey, true);

    if (!mounted) return;
    final deniedCount = statuses.values
        .where(
          (status) =>
              status == PermissionStatus.denied ||
              status == PermissionStatus.permanentlyDenied,
        )
        .length;

    if (deniedCount > 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          content: Text(
            'Some permissions are disabled ($deniedCount). You can enable them anytime from system settings.',
          ),
        ),
      );
    }
  }

  Future<void> _openSearchSheet(String currentLocation) async {
    if (!mounted) return;
    final searchCtrl = TextEditingController();
    var query = '';

    // Capture router before sheet opens. router.go() does not use BuildContext
    // so it is safe to call after the modal future resolves (while the sheet's
    // reverse-animation may still be running) without triggering the
    // '_dependents.isEmpty' InheritedElement assertion.
    final router = GoRouter.of(context);

    // Navigate-first pattern — see showShellSearchSheet for full explanation.
    await showModalBottomSheet<void>(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        final isDark = Theme.of(sheetContext).brightness == Brightness.dark;

        return StatefulBuilder(
          builder: (context, setModalState) {
            final filtered = _searchDestinations
                .where(
                  (item) => item.label.toLowerCase().contains(
                        query.trim().toLowerCase(),
                      ),
                )
                .toList(growable: false);

            return SafeArea(
              top: false,
              child: Padding(
                padding: EdgeInsets.only(
                  left: 10,
                  right: 10,
                  bottom: MediaQuery.of(context).viewInsets.bottom + 8,
                ),
                child: Container(
                  constraints: BoxConstraints(
                    minHeight: MediaQuery.of(context).size.height * 0.72,
                    maxHeight: MediaQuery.of(context).size.height * 0.9,
                  ),
                  decoration: BoxDecoration(
                    color:
                        isDark ? AppColors.cardDark : const Color(0xFFF2F5FB),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isDark
                          ? AppColors.cardDarkBorder
                          : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(14, 14, 14, 8),
                        child: Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: searchCtrl,
                                autofocus: true,
                                onChanged: (value) => setModalState(() {
                                  query = value;
                                }),
                                decoration: InputDecoration(
                                  hintText: 'Search',
                                  prefixIcon:
                                      const Icon(LucideIcons.search, size: 18),
                                  suffixIcon: IconButton(
                                    style: IconButton.styleFrom(
                                      backgroundColor: Colors.transparent,
                                      shape: const CircleBorder(),
                                      minimumSize: const Size(36, 36),
                                    ),
                                    icon: const Icon(
                                      LucideIcons.chevronRight,
                                      size: 17,
                                    ),
                                    onPressed: () {},
                                  ),
                                  isDense: true,
                                  filled: true,
                                  fillColor: isDark
                                      ? AppColors.surfaceDarkElevated
                                      : Colors.white,
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(999),
                                    borderSide: BorderSide(
                                      color: isDark
                                          ? AppColors.cardDarkBorder
                                          : const Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(999),
                                    borderSide: BorderSide(
                                      color: isDark
                                          ? AppColors.cardDarkBorder
                                          : const Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(999),
                                    borderSide: const BorderSide(
                                      color: AppColors.primary,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
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
                                padding:
                                    const EdgeInsets.fromLTRB(10, 4, 10, 12),
                                itemBuilder: (_, index) {
                                  final destination = filtered[index];
                                  final isCurrent = currentLocation
                                      .startsWith(destination.path);
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
                                            ? AppColors.primary
                                                .withOpacity(0.38)
                                            : (isDark
                                                ? AppColors.cardDarkBorder
                                                : const Color(0xFFE2E8F0)),
                                      ),
                                    ),
                                    child: ListTile(
                                      leading: Icon(destination.icon, size: 18),
                                      title: Text(destination.label),
                                      trailing: const Icon(
                                        LucideIcons.chevronRight,
                                        size: 16,
                                      ),
                                      onTap: () {
                                        if (!isCurrent) router.go(destination.path);
                                        Navigator.of(sheetContext).pop();
                                      },
                                    ),
                                  );
                                },
                                separatorBuilder: (_, __) =>
                                    const SizedBox(height: 6),
                                itemCount: filtered.length,
                              ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            gradient: const LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                AppColors.primary,
                                AppColors.purple,
                              ],
                            ),
                          ),
                          child: Material(
                            color: Colors.transparent,
                            child: InkWell(
                              borderRadius: BorderRadius.circular(16),
                              onTap: () {
                                router.go('/chat');
                                Navigator.of(sheetContext).pop();
                              },
                              child: const Padding(
                                padding: EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 12,
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      LucideIcons.sparkles,
                                      size: 16,
                                      color: Colors.white,
                                    ),
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
                                    Icon(
                                      LucideIcons.zap,
                                      size: 16,
                                      color: Colors.white,
                                    ),
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
    // Navigation was already triggered inside onTap — nothing more to do here.
  }

  Future<void> _handleRootBack() async {
    final now = DateTime.now();
    final recentlyPressed = _lastBackPressedAt != null &&
        now.difference(_lastBackPressedAt!) < const Duration(seconds: 2);

    if (!recentlyPressed) {
      _lastBackPressedAt = now;
      if (!mounted) return;

      ScaffoldMessenger.of(context)
        ..clearSnackBars()
        ..showSnackBar(
          const SnackBar(
            behavior: SnackBarBehavior.floating,
            margin: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            content: Text('Press back again to exit YesBill'),
            duration: Duration(seconds: 2),
          ),
        );
      return;
    }

    if (!mounted) return;
    final shouldExit = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Exit app?'),
            content: const Text('Do you want to close YesBill now?'),
            actions: [
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(false),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: FilledButton(
                      onPressed: () => Navigator.of(context).pop(true),
                      child: const Text('Exit'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ) ??
        false;

    if (shouldExit && mounted) {
      SystemNavigator.pop();
    }
  }

  Widget? _buildFloatingActionButton(String location) {
    if (location == '/dashboard' || location == '/services') {
      return _ContextActionFab(
        heroTag: 'fab_add_service',
        onPressed: () => context.push('/services/add'),
      );
    }

    if (location == '/bills') {
      return _ContextActionFab(
        heroTag: 'fab_generate_bill',
        onPressed: () => context.push('/bills/generate'),
      );
    }

    return null;
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    final isRoot = _isRootLocation(location);
    final user = ref.watch(authProvider).user;
    final profile = ref.watch(userProfileProvider).valueOrNull;
    final showBottomNav = ref.watch(shellBottomNavVisibleProvider);
    final avatarUrl = profile?.avatarUrl;
    final displayName = (profile?.displayName?.isNotEmpty == true
            ? profile!.displayName!
            : profile?.fullName?.isNotEmpty == true
                ? profile!.fullName!
                : null) ??
        _userDisplayLabel(user);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        final router = GoRouter.of(context);
        if (router.canPop()) {
          router.pop();
          return;
        }
        final fallbackPath = _fallbackPathForBack(location);
        if (fallbackPath != null) {
          context.go(fallbackPath);
          return;
        }
        _handleRootBack();
      },
      child: Scaffold(
        extendBody: true,
        body: Container(
          color: Theme.of(context).colorScheme.surface,
          child: Stack(
            fit: StackFit.expand,
            children: [
              const AppBackgroundEffects(),
              SafeArea(
                top: false,
                bottom: false,
                child: Column(
                  children: [
                    if (isRoot)
                      _ShellHeader(
                        userLabel: _userDisplayLabel(user),
                        displayName: displayName,
                        avatarUrl: avatarUrl,
                        userEmail: user?.email,
                        onSearchTap: () => _openSearchSheet(location),
                        onSignOut: _signOutFromUi,
                      ),
                    Expanded(
                      // AnimatedSwitcher intentionally removed: it kept the
                      // previous screen alive for 360 ms as an exit-animation
                      // "zombie".  During those 360 ms the old screen's widgets
                      // remained registered as dependents of GoRouter's
                      // InheritedGoRouter.  When GoRouter fired its second
                      // state update to finalise navigation it tried to notify
                      // those dependents while they were being deactivated
                      // → '_dependents.isEmpty: is not true' (framework.dart).
                      // GoRouter provides its own page transitions inside its
                      // Navigator, so no cross-fade is needed here.
                      child: widget.child,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        bottomNavigationBar: showBottomNav
            ? _ShellBottomArea(
                location: location,
                showFooter: false,
                onLogout: _signOutFromUi,
              )
            : null,
        floatingActionButton:
            isRoot ? _buildFloatingActionButton(location) : null,
        floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      ),
    );
  }
}

class _ShellHeader extends ConsumerWidget {
  const _ShellHeader({
    required this.userLabel,
    required this.displayName,
    required this.userEmail,
    required this.onSearchTap,
    required this.onSignOut,
    this.avatarUrl,
  });

  final String userLabel;
  final String displayName;
  final String? avatarUrl;
  final String? userEmail;
  final VoidCallback onSignOut;
  final VoidCallback onSearchTap;

  void _openNotificationSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const AppNotificationsSheet(),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final notifAsync = ref.watch(notificationsProvider);
    final unreadCount =
        notifAsync.valueOrNull?.where((n) => !n.read).length ?? 0;
    return SafeArea(
      bottom: false,
      child: Container(
        margin: const EdgeInsets.fromLTRB(12, 12, 12, 8),
        padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 2),
        child: Row(
          children: [
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isDark
                    ? AppColors.surfaceDarkElevated
                    : const Color(0xFFEAF0FF),
              ),
              clipBehavior: Clip.antiAlias,
              child: avatarUrl != null && avatarUrl!.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: avatarUrl!,
                      fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => Center(
                        child: Text(
                          userLabel.isEmpty ? 'Y' : userLabel[0].toUpperCase(),
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    )
                  : Center(
                      child: Text(
                        userLabel.isEmpty ? 'Y' : userLabel[0].toUpperCase(),
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                displayName,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: isDark ? AppColors.primaryLighter : AppColors.primary,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            _HeaderIconButton(
              icon: LucideIcons.search,
              onTap: onSearchTap,
            ),
            const SizedBox(width: 6),
            _BadgeBellButton(
              unreadCount: unreadCount,
              isDark: isDark,
              onTap: () => _openNotificationSheet(context, ref),
            ),
            const SizedBox(width: 6),
            PopupMenuButton<_HeaderMenuAction>(
              tooltip: 'Account menu',
              offset: const Offset(0, 40),
              color: isDark ? AppColors.cardDark : Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: BorderSide(
                  color: isDark
                      ? AppColors.cardDarkBorder
                      : const Color(0xFFE2E8F0),
                ),
              ),
              onSelected: (value) {
                switch (value) {
                  case _HeaderMenuAction.settings:
                    context.go('/settings');
                    break;
                  case _HeaderMenuAction.support:
                    context.go('/support');
                    break;
                  case _HeaderMenuAction.signOut:
                    onSignOut();
                    break;
                }
              },
              itemBuilder: (context) => [
                PopupMenuItem<_HeaderMenuAction>(
                  enabled: false,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        userLabel,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: isDark
                              ? AppColors.textPrimary
                              : AppColors.textPrimaryLight,
                        ),
                      ),
                      if (userEmail != null && userEmail!.trim().isNotEmpty)
                        Text(
                          userEmail!,
                          style: TextStyle(
                            fontSize: 11.5,
                            color: isDark
                                ? AppColors.textSecondary
                                : AppColors.textSecondaryLight,
                          ),
                        ),
                    ],
                  ),
                ),
                const PopupMenuDivider(),
                const PopupMenuItem<_HeaderMenuAction>(
                  value: _HeaderMenuAction.settings,
                  child: _HeaderMenuRow(
                    icon: LucideIcons.settings,
                    label: 'Settings',
                  ),
                ),
                const PopupMenuItem<_HeaderMenuAction>(
                  value: _HeaderMenuAction.support,
                  child: _HeaderMenuRow(
                    icon: LucideIcons.lifeBuoy,
                    label: 'Support',
                  ),
                ),
                const PopupMenuDivider(),
                const PopupMenuItem<_HeaderMenuAction>(
                  value: _HeaderMenuAction.signOut,
                  child: _HeaderMenuRow(
                    icon: LucideIcons.logOut,
                    label: 'Log out',
                    isDestructive: true,
                  ),
                ),
              ],
              child: Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: isDark
                      ? AppColors.surfaceDarkElevated
                      : const Color(0xFFEAF0FF),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(
                    color: isDark
                        ? AppColors.cardDarkBorder
                        : const Color(0xFFE2E8F0),
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
                          color: isDark
                              ? AppColors.textSecondary
                              : AppColors.textSecondaryLight,
                        ),
                      )
                    : Icon(
                        LucideIcons.user,
                        size: 15,
                        color: isDark
                            ? AppColors.textSecondary
                            : AppColors.textSecondaryLight,
                      ),
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 280.ms).slideY(begin: -0.08, end: 0);
  }
}

class _HeaderIconButton extends StatelessWidget {
  const _HeaderIconButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
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
              color:
                  isDark ? AppColors.cardDarkBorder : const Color(0xFFE2E8F0),
            ),
          ),
          alignment: Alignment.center,
          child: Icon(
            icon,
            size: 14,
            color:
                isDark ? AppColors.textSecondary : AppColors.textSecondaryLight,
          ),
        ),
      ),
    );
  }
}

class _BadgeBellButton extends StatelessWidget {
  const _BadgeBellButton({
    required this.unreadCount,
    required this.isDark,
    required this.onTap,
  });

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
          Material(
            color: isDark
                ? AppColors.surfaceDarkElevated
                : const Color(0xFFF2F5FB),
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
                    color: isDark
                        ? AppColors.cardDarkBorder
                        : const Color(0xFFE2E8F0),
                  ),
                ),
                alignment: Alignment.center,
                child: Icon(
                  LucideIcons.bell,
                  size: 14,
                  color: isDark
                      ? AppColors.textSecondary
                      : AppColors.textSecondaryLight,
                ),
              ),
            ),
          ),
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



class _ShellBottomArea extends StatelessWidget {
  const _ShellBottomArea({
    required this.location,
    required this.showFooter,
    required this.onLogout,
  });

  final String location;
  final bool showFooter;
  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showFooter) const _ShellFooter(),
          _AppBottomNav(location: location, onLogout: onLogout),
        ],
      ),
    );
  }
}

class _ShellFooter extends StatelessWidget {
  const _ShellFooter();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      decoration: BoxDecoration(
        color: isDark
            ? AppColors.cardDark.withOpacity(0.68)
            : Colors.white.withOpacity(0.78),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? AppColors.cardDarkBorder : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Â© ${DateTime.now().year} YesBill. All rights reserved.',
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
              color: isDark
                  ? AppColors.textSecondary
                  : AppColors.textSecondaryLight,
            ),
          ),
          const SizedBox(height: 5),
          const Wrap(
            spacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              _FooterMetaLabel(label: 'Privacy'),
              _FooterMetaDot(),
              _FooterMetaLabel(label: 'Terms'),
              _FooterMetaDot(),
              _FooterMetaLabel(label: 'Support'),
            ],
          ),
        ],
      ),
    );
  }
}

class _FooterMetaLabel extends StatelessWidget {
  const _FooterMetaLabel({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Text(
      label,
      style: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        color: isDark ? AppColors.textSecondary : AppColors.textSecondaryLight,
      ),
    );
  }
}

class _FooterMetaDot extends StatelessWidget {
  const _FooterMetaDot();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Text(
      'â€¢',
      style: TextStyle(
        fontSize: 11,
        color: isDark ? AppColors.textSecondary : AppColors.textSecondaryLight,
      ),
    );
  }
}

class _AppBottomNav extends StatelessWidget {
  const _AppBottomNav({required this.location, required this.onLogout});

  final String location;
  final VoidCallback onLogout;

  static const _primaryTabs = [
    _NavTab(
      label: 'Home',
      icon: LucideIcons.layoutDashboard,
      selectedIcon: LucideIcons.layoutDashboard,
      path: '/dashboard',
    ),
    _NavTab(
      label: 'Calendar',
      icon: LucideIcons.calendarDays,
      selectedIcon: LucideIcons.calendarCheck,
      path: '/calendar',
    ),
    _NavTab(
      label: 'Services',
      icon: LucideIcons.package,
      selectedIcon: LucideIcons.layers,
      path: '/services',
    ),
    _NavTab(
      label: 'Bills',
      icon: LucideIcons.fileText,
      selectedIcon: LucideIcons.receipt,
      path: '/bills',
    ),
    _NavTab(
      label: 'Ask AI',
      icon: LucideIcons.messageSquare,
      selectedIcon: LucideIcons.messageCircle,
      path: '/chat',
    ),
    _NavTab(
      label: 'Analytics',
      icon: LucideIcons.barChart3,
      selectedIcon: LucideIcons.pieChart,
      path: '/analytics',
    ),
  ];

  static const _moreTab = _NavTab(
    label: 'More',
    icon: LucideIcons.moreHorizontal,
    selectedIcon: LucideIcons.moreHorizontal,
    path: '/more',
  );

  static const _moreDestinations = [
    _NavTab(
      label: 'Agentic AI',
      icon: LucideIcons.sparkles,
      selectedIcon: LucideIcons.sparkles,
      path: '/agent',
    ),
    _NavTab(
      label: 'Docs',
      icon: LucideIcons.bookOpen,
      selectedIcon: LucideIcons.bookOpen,
      path: '/docs',
    ),
    _NavTab(
      label: 'Settings',
      icon: LucideIcons.settings,
      selectedIcon: LucideIcons.settings,
      path: '/settings',
    ),
    _NavTab(
      label: 'Support',
      icon: LucideIcons.lifeBuoy,
      selectedIcon: LucideIcons.lifeBuoy,
      path: '/support',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final tabs = [..._primaryTabs, _moreTab];
    final currentPath = _resolveCurrentPath(location);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark.withOpacity(0.94) : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isDark ? AppColors.cardDarkBorder : const Color(0xFFE2E8F0),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isDark ? 0.2 : 0.05),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: List.generate(tabs.length, (index) {
              final tab = tabs[index];
              final selected = tab.path == currentPath;
              return SizedBox(
                width: 74,
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () {
                    if (tab.path == _moreTab.path) {
                      _showMoreSheet(context, isDark);
                      return;
                    }
                    context.go(tab.path);
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: selected
                                ? AppColors.primary.withOpacity(0.2)
                                : Colors.transparent,
                          ),
                          child: Icon(
                            selected
                                ? (tab.selectedIcon ?? tab.icon)
                                : tab.icon,
                            size: 16,
                            color: selected
                                ? AppColors.primary
                                : (isDark
                                    ? AppColors.textSecondary
                                    : AppColors.textSecondaryLight),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          tab.label.toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 8.8,
                            fontWeight:
                                selected ? FontWeight.w700 : FontWeight.w500,
                            letterSpacing: 0.2,
                            color: selected
                                ? AppColors.primary
                                : (isDark
                                    ? AppColors.textSecondary
                                    : AppColors.textSecondaryLight),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }

  String _resolveCurrentPath(String currentPath) {
    for (final tab in _primaryTabs) {
      if (currentPath.startsWith(tab.path)) return tab.path;
    }
    for (final tab in _moreDestinations) {
      if (currentPath.startsWith(tab.path)) return _moreTab.path;
    }
    return _primaryTabs.first.path;
  }

  void _showMoreSheet(BuildContext context, bool isDark) {
    // Capture router before the sheet opens so navigation after the sheet
    // closes does not need BuildContext (avoids any context lifecycle issues).
    final router = GoRouter.of(context);
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
            child: Container(
              decoration: BoxDecoration(
                color: isDark ? AppColors.cardDark : Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: isDark
                      ? AppColors.cardDarkBorder
                      : const Color(0xFFE2E8F0),
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: isDark
                              ? AppColors.cardDarkBorder
                              : const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(999),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'More navigation',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: isDark
                            ? AppColors.textPrimary
                            : AppColors.textPrimaryLight,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ..._moreDestinations.map(
                      (tab) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () {
                              Navigator.of(sheetContext).pop();
                              // Delay navigation until after the sheet's
                              // 200 ms close animation finishes.
                              Future.delayed(
                                const Duration(milliseconds: 300),
                                () => router.go(tab.path),
                              );
                            },
                            child: Ink(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 14,
                              ),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                color: isDark
                                    ? AppColors.surfaceDarkElevated
                                    : const Color(0xFFF8FAFC),
                                border: Border.all(
                                  color: isDark
                                      ? AppColors.cardDarkBorder
                                      : const Color(0xFFE2E8F0),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(tab.icon,
                                      size: 18, color: AppColors.primary),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      tab.label,
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: isDark
                                            ? AppColors.textPrimary
                                            : AppColors.textPrimaryLight,
                                      ),
                                    ),
                                  ),
                                  Icon(
                                    LucideIcons.chevronRight,
                                    size: 16,
                                    color: isDark
                                        ? AppColors.textSecondary
                                        : AppColors.textSecondaryLight,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.of(sheetContext).pop();
                          onLogout();
                        },
                        icon: const Icon(LucideIcons.logOut, size: 16),
                        label: const Text('Log out'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.error,
                          side: BorderSide(
                            color: AppColors.error.withOpacity(0.35),
                          ),
                          minimumSize: const Size.fromHeight(46),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _NavTab {
  const _NavTab({
    required this.label,
    required this.icon,
    this.selectedIcon,
    required this.path,
  });
  final String label;
  final IconData icon;
  final IconData? selectedIcon;
  final String path;
}

class _SearchDestination {
  const _SearchDestination({
    required this.label,
    required this.path,
    required this.icon,
  });

  final String label;
  final String path;
  final IconData icon;
}

enum _HeaderMenuAction {
  settings,
  support,
  signOut,
}

class _HeaderMenuRow extends StatelessWidget {
  const _HeaderMenuRow({
    required this.icon,
    required this.label,
    this.isDestructive = false,
  });

  final IconData icon;
  final String label;
  final bool isDestructive;

  @override
  Widget build(BuildContext context) {
    final color = isDestructive ? AppColors.error : null;
    return Row(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            color: color,
            fontWeight: isDestructive ? FontWeight.w700 : FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _ContextActionFab extends StatelessWidget {
  const _ContextActionFab({
    required this.heroTag,
    required this.onPressed,
  });

  final String heroTag;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton(
      onPressed: onPressed,
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      child: const Icon(LucideIcons.plus, size: 18),
      heroTag: heroTag,
    );
  }
}
