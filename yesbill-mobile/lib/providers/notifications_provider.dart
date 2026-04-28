import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'auth_provider.dart';
import 'core_providers.dart';

// ── Model ─────────────────────────────────────────────────────────────────────

class AppNotification {
  final String id;
  final String? type;
  final String title;
  final String? message;
  final bool read;
  final DateTime createdAt;

  const AppNotification({
    required this.id,
    required this.title,
    required this.read,
    required this.createdAt,
    this.type,
    this.message,
  });

  factory AppNotification.fromMap(Map<String, dynamic> map) {
    return AppNotification(
      id: (map['id'] ?? '').toString(),
      type: map['type']?.toString(),
      title: (map['title']?.toString().trim().isNotEmpty == true)
          ? map['title'].toString().trim()
          : 'Notification',
      message: map['message']?.toString(),
      read: (map['read'] as bool?) == true,
      createdAt: DateTime.tryParse(map['created_at'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  AppNotification copyWith({bool? read}) {
    return AppNotification(
      id: id,
      type: type,
      title: title,
      message: message,
      read: read ?? this.read,
      createdAt: createdAt,
    );
  }
}

// ── Notifier ──────────────────────────────────────────────────────────────────

class NotificationsNotifier
    extends AutoDisposeAsyncNotifier<List<AppNotification>> {
  // Persists read IDs across provider rebuilds so they don't revert
  // even if the server data hasn't caught up yet.
  static final _localReadIds = <String>{};

  @override
  Future<List<AppNotification>> build() async {
    final user = ref.watch(authProvider).user;
    if (user == null) return [];

    final client = ref.watch(supabaseClientProvider);
    final data = await client
        .from('notifications')
        .select()
        .eq('user_id', user.id)
        .order('created_at', ascending: false)
        .limit(50);

    final notifications = (data as List)
        .map((e) => AppNotification.fromMap(e as Map<String, dynamic>))
        .toList();

    // Apply any locally-known read state so optimistic updates survive
    // provider disposal / rebuild cycles.
    if (_localReadIds.isEmpty) return notifications;
    return notifications
        .map((n) => _localReadIds.contains(n.id) ? n.copyWith(read: true) : n)
        .toList();
  }

  Future<void> markAsRead(String id) async {
    _localReadIds.add(id);
    final previous = state.valueOrNull ?? const <AppNotification>[];
    state = AsyncData(
      previous
          .map((n) => n.id == id ? n.copyWith(read: true) : n)
          .toList(),
    );

    final client = ref.read(supabaseClientProvider);
    try {
      await _applyReadUpdate(
        client: client,
        filters: (query) => query.eq('id', id),
      );
    } catch (_) {
      // Keep optimistic read state for the session.
    }
  }

  Future<void> markAllAsRead() async {
    final user = ref.read(authProvider).user;
    if (user == null) return;
    final previous = state.valueOrNull ?? const <AppNotification>[];
    if (previous.isEmpty) return;

    // Only target unread rows — avoids firing unnecessary UPDATE events.
    final unreadIds = previous.where((n) => !n.read).map((n) => n.id).toSet();
    if (unreadIds.isEmpty) return;

    _localReadIds.addAll(unreadIds);
    state = AsyncData(previous.map((n) => n.copyWith(read: true)).toList());

    final client = ref.read(supabaseClientProvider);
    try {
      await _applyReadUpdate(
        client: client,
        // Filter to only the unread rows so RLS-matching is precise
        // and no spurious realtime UPDATE events are emitted.
        filters: (query) =>
            query.eq('user_id', user.id).eq('read', false),
      );
    } catch (e) {
      // DB update failed — log so it's visible during debugging.
      // The _localReadIds set keeps the UI correct for this session.
      // On next cold start the unread state will be re-fetched from DB;
      // retrying here would require persistent storage which is overkill.
      debugPrint('NotificationsNotifier.markAllAsRead DB error: $e');
    }
  }

  Future<void> _applyReadUpdate({
    required dynamic client,
    required dynamic Function(dynamic query) filters,
  }) async {
    await filters(
      client.from('notifications').update({'read': true}),
    );
  }
}

final notificationsProvider =
    AsyncNotifierProvider.autoDispose<NotificationsNotifier,
        List<AppNotification>>(
  NotificationsNotifier.new,
);
