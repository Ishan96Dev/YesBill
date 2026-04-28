import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/user_service.dart';
import 'auth_provider.dart';
import 'core_providers.dart';

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
      await ref.read(servicesRepositoryProvider).create(fields);
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
      await ref.read(servicesRepositoryProvider).update(id, fields);
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
      await ref.read(servicesRepositoryProvider).delete(id);
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
