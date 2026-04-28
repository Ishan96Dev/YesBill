import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../providers/notifications_provider.dart';

/// Draggable bottom sheet that shows the user's notifications.
/// Extracted so it can be opened from any screen (chat, agent, etc.).
class AppNotificationsSheet extends ConsumerWidget {
  const AppNotificationsSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifAsync = ref.watch(notificationsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AppColors.surfaceDark : Colors.white;

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.92,
      expand: false,
      builder: (context, controller) {
        return Container(
          decoration: BoxDecoration(
            color: bg,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Handle
              Container(
                margin: const EdgeInsets.only(top: 10),
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark
                      ? AppColors.cardDarkBorder
                      : const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              // Header row
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
                child: Row(
                  children: [
                    const Icon(LucideIcons.bell,
                        size: 18, color: AppColors.primary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Notifications',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: isDark
                              ? AppColors.textPrimary
                              : AppColors.textPrimaryLight,
                        ),
                      ),
                    ),
                    notifAsync.valueOrNull?.any((n) => !n.read) == true
                        ? TextButton(
                            onPressed: () => ref
                                .read(notificationsProvider.notifier)
                                .markAllAsRead(),
                            child: const Text(
                              'Mark all read',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.primary,
                              ),
                            ),
                          )
                        : const SizedBox.shrink(),
                  ],
                ),
              ),
              const Divider(height: 1),
              // Content
              Expanded(
                child: notifAsync.when(
                  loading: () => const Center(
                      child: CircularProgressIndicator(strokeWidth: 2)),
                  error: (e, _) => Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        'Could not load notifications.',
                        style: TextStyle(
                          color: isDark
                              ? AppColors.textSecondary
                              : AppColors.textSecondaryLight,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                  data: (notifications) {
                    if (notifications.isEmpty) {
                      return Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(LucideIcons.bellOff,
                                size: 40,
                                color: isDark
                                    ? AppColors.textSecondary
                                    : const Color(0xFFCBD5E1)),
                            const SizedBox(height: 12),
                            Text(
                              'No notifications yet',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: isDark
                                    ? AppColors.textSecondary
                                    : AppColors.textSecondaryLight,
                              ),
                            ),
                          ],
                        ),
                      );
                    }
                    return ListView.separated(
                      controller: controller,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      itemCount: notifications.length,
                      separatorBuilder: (_, __) =>
                          const Divider(height: 1, indent: 56),
                      itemBuilder: (context, i) {
                        final n = notifications[i];
                        return _NotifTile(
                          notification: n,
                          isDark: isDark,
                          onTap: () {
                            if (!n.read) {
                              ref
                                  .read(notificationsProvider.notifier)
                                  .markAsRead(n.id);
                            }
                          },
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _NotifTile extends StatelessWidget {
  const _NotifTile({
    required this.notification,
    required this.isDark,
    required this.onTap,
  });

  final AppNotification notification;
  final bool isDark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final unread = !notification.read;
    final timeAgo = _formatAge(notification.createdAt);

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: unread
                    ? AppColors.primary.withOpacity(0.12)
                    : (isDark
                        ? AppColors.surfaceDarkElevated
                        : const Color(0xFFF1F5F9)),
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Icon(
                _iconForType(notification.type),
                size: 16,
                color: unread
                    ? AppColors.primary
                    : (isDark
                        ? AppColors.textSecondary
                        : AppColors.textSecondaryLight),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: TextStyle(
                            fontSize: 13.5,
                            fontWeight:
                                unread ? FontWeight.w700 : FontWeight.w500,
                            color: isDark
                                ? AppColors.textPrimary
                                : AppColors.textPrimaryLight,
                          ),
                        ),
                      ),
                      if (unread)
                        Container(
                          width: 7,
                          height: 7,
                          margin: const EdgeInsets.only(left: 6, top: 4),
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  if (notification.message != null &&
                      notification.message!.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      notification.message!,
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark
                            ? AppColors.textSecondary
                            : AppColors.textSecondaryLight,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 4),
                  Text(
                    timeAgo,
                    style: TextStyle(
                      fontSize: 11,
                      color: isDark
                          ? AppColors.textSecondary.withOpacity(0.7)
                          : const Color(0xFF94A3B8),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  static IconData _iconForType(String? type) {
    switch (type) {
      case 'bill_due':
      case 'bill_overdue':
        return LucideIcons.receipt;
      case 'service_expiry':
        return LucideIcons.alertTriangle;
      case 'ai_config_incomplete':
        return LucideIcons.brain;
      case 'payment_reminder':
        return LucideIcons.creditCard;
      default:
        return LucideIcons.bell;
    }
  }

  static String _formatAge(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}
