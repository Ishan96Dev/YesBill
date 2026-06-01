import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/user_service.dart';
import 'auth_provider.dart';
import 'core_providers.dart';
import 'notifications_provider.dart';

/// Fetches all user services from Supabase.
/// Guards against auth race condition — returns empty stream until user is authenticated.
final userServicesProvider =
    StreamProvider.autoDispose<List<UserService>>((ref) {
  final authState = ref.watch(authProvider);
  if (!authState.isAuthenticated) return const Stream.empty();
  return ref.watch(servicesRepositoryProvider).streamAll();
});

/// Fetches only active services.
/// Guards against auth race condition — returns empty stream until user is authenticated.
final activeServicesProvider =
    StreamProvider.autoDispose<List<UserService>>((ref) {
  final authState = ref.watch(authProvider);
  if (!authState.isAuthenticated) return const Stream.empty();
  return ref.watch(servicesRepositoryProvider).streamActive();
});

/// Manages service mutations (create/update/delete/toggle).
class ServiceMutationNotifier extends Notifier<AsyncValue<void>> {
  @override
  AsyncValue<void> build() => const AsyncValue.data(null);

  Future<bool> createService(Map<String, dynamic> fields) async {
    state = const AsyncValue.loading();
    try {
      final service = await ref.read(servicesRepositoryProvider).create(fields);
      final userId = ref.read(authProvider).user?.id;
      if (userId != null) {
        await ref.read(notificationsProvider.notifier).create(
          userId: userId,
          type: 'service_created',
          title: 'New Service Added',
          message: '"${service.name}" has been set up in your account',
          data: const {'route': '/services', 'path': '/services'},
        );
      }
      ref.invalidate(userServicesProvider);
      ref.invalidate(activeServicesProvider);
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> updateService(String id, Map<String, dynamic> fields) async {
    state = const AsyncValue.loading();
    try {
      final service = await ref.read(servicesRepositoryProvider).update(id, fields);
      final userId = ref.read(authProvider).user?.id;
      if (userId != null) {
        await ref.read(notificationsProvider.notifier).create(
          userId: userId,
          type: 'service_updated',
          title: 'Service Updated',
          message: '"${service.name}" details have been updated',
          data: const {'route': '/services', 'path': '/services'},
        );
      }
      ref.invalidate(userServicesProvider);
      ref.invalidate(activeServicesProvider);
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> deleteService(String id) async {
    state = const AsyncValue.loading();
    try {
      // Get service name before deleting for notification
      final services = await ref.read(userServicesProvider.future);
      final service = services.firstWhere((s) => s.id == id, orElse: () => UserService(
        id: id,
        userId: '',
        name: 'Service',
        price: 0,
        createdAt: DateTime.now(),
      ));
      
      await ref.read(servicesRepositoryProvider).delete(id);
      
      // Notify user that service was deleted
      final userId = ref.read(authProvider).user?.id;
      if (userId != null) {
        await ref.read(notificationsProvider.notifier).create(
          userId: userId,
          type: 'service_deleted',
          title: 'Service Deleted',
          message: '"${service.name}" has been removed from your services',
          data: const {'route': '/services', 'path': '/services'},
        );
      }
      
      ref.invalidate(userServicesProvider);
      ref.invalidate(activeServicesProvider);
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<void> toggleActive(String id, bool active) async {
    try {
      await ref.read(servicesRepositoryProvider).toggleActive(id, active);
      ref.invalidate(userServicesProvider);
      ref.invalidate(activeServicesProvider);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final serviceMutationProvider =
    NotifierProvider<ServiceMutationNotifier, AsyncValue<void>>(
        ServiceMutationNotifier.new);
