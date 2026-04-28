import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/extensions/date_extensions.dart';
import '../data/models/service_confirmation.dart';
import 'auth_provider.dart';
import 'core_providers.dart';

/// Currently selected month for the calendar view.
final selectedMonthProvider = StateProvider<DateTime>((ref) {
  final now = DateTime.now();
  return DateTime(now.year, now.month);
});

/// Fetches all confirmations for the selected month.
/// Guards against auth race condition — returns empty stream until user is authenticated.
final monthConfirmationsProvider = StreamProvider.autoDispose
    .family<List<ServiceConfirmation>, String>((ref, yearMonth) {
  final authState = ref.watch(authProvider);
  if (!authState.isAuthenticated) return const Stream.empty();
  return ref
      .watch(calendarRepositoryProvider)
      .streamMonthConfirmations(yearMonth);
});

/// Groups confirmations by date string for fast calendar cell lookup.
/// Returns Map<'YYYY-MM-DD', List<ServiceConfirmation>>
final confirmationsByDateProvider = Provider.autoDispose
    .family<Map<String, List<ServiceConfirmation>>, String>((ref, yearMonth) {
  final confirmations = ref
      .watch(monthConfirmationsProvider(yearMonth))
      .valueOrNull ?? [];
  final map = <String, List<ServiceConfirmation>>{};
  for (final c in confirmations) {
    (map[c.date] ??= []).add(c);
  }
  return map;
});

/// Handles upsert (create/update) of a single confirmation.
class ConfirmationNotifier extends AutoDisposeNotifier<AsyncValue<void>> {
  @override
  AsyncValue<void> build() => const AsyncValue.data(null);

  Future<void> upsert({
    required String serviceId,
    required DateTime date,
    required String status,
    double? customAmount,
  }) async {
    state = const AsyncValue.loading();
    try {
      await ref.read(calendarRepositoryProvider).upsertConfirmation(
            serviceId: serviceId,
            date: date.toDateString(),
            status: status,
            customAmount: customAmount,
          );
      // Invalidate the month confirmations to trigger refresh
      final yearMonth = date.toYearMonth();
      ref.invalidate(monthConfirmationsProvider(yearMonth));
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final confirmationNotifierProvider =
    AutoDisposeNotifierProvider<ConfirmationNotifier, AsyncValue<void>>(
        ConfirmationNotifier.new);
