import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/fcm_service.dart';
import 'core_providers.dart';

final fcmServiceProvider = Provider<FcmService>((ref) =>
    FcmService(dio: ref.watch(dioProvider)));

sealed class NotificationState { const NotificationState(); }
final class NotificationIdle extends NotificationState { const NotificationIdle(); }
final class NotificationInitializing extends NotificationState { const NotificationInitializing(); }
final class NotificationInitialized extends NotificationState { const NotificationInitialized(); }
final class NotificationError extends NotificationState {
  const NotificationError(this.message); final String message;
}

class NotificationNotifier extends Notifier<NotificationState> {
  @override
  NotificationState build() => const NotificationIdle();

  Future<void> initialize() async {
    state = const NotificationInitializing();
    try {
      await ref.read(fcmServiceProvider).initialize();
      state = const NotificationInitialized();
    } catch (e) { state = NotificationError(e.toString()); }
  }
}

final notificationProvider = NotifierProvider<NotificationNotifier, NotificationState>(
    NotificationNotifier.new);
