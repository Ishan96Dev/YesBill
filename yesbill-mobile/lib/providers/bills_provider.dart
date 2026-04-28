import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/generated_bill.dart';
import 'auth_provider.dart';
import 'core_providers.dart';

/// Lists all generated bills.
/// Guards against auth race condition — returns empty list until user is authenticated.
final generatedBillsProvider =
    FutureProvider<List<BillListItem>>((ref) async {
  final authState = ref.watch(authProvider);
  if (!authState.isAuthenticated) return [];
  return ref.watch(billsRemoteDsProvider).listGeneratedBills();
});

/// Gets a specific bill by ID.
final billDetailProvider =
    FutureProvider.family<GeneratedBill, String>((ref, billId) async {
  return ref.watch(billsRemoteDsProvider).getBillById(billId);
});

/// State for bill generation flow.
sealed class BillGenerationState {
  const BillGenerationState();
}
final class BillGenerationIdle extends BillGenerationState {
  const BillGenerationIdle();
}
final class BillGenerationLoading extends BillGenerationState {
  const BillGenerationLoading();
}
final class BillGenerationSuccess extends BillGenerationState {
  const BillGenerationSuccess(this.bill);
  final GeneratedBill bill;
}
final class BillGenerationError extends BillGenerationState {
  const BillGenerationError(this.message);
  final String message;
}

class BillGenerationNotifier extends Notifier<BillGenerationState> {
  @override
  BillGenerationState build() => const BillGenerationIdle();

  Future<void> generate({
    required String yearMonth,
    required List<String> serviceIds,
    String? customNote,
    bool sendEmail = false,
  }) async {
    state = const BillGenerationLoading();
    try {
      final bill = await ref.read(billsRemoteDsProvider).generateBill(
            yearMonth: yearMonth,
            serviceIds: serviceIds,
            customNote: customNote,
            sendEmail: sendEmail,
          );
      ref.invalidate(generatedBillsProvider);
      state = BillGenerationSuccess(bill);
    } catch (e) {
      state = BillGenerationError(e.toString());
    }
  }

  void reset() => state = const BillGenerationIdle();
}

final billGenerationProvider =
    NotifierProvider<BillGenerationNotifier, BillGenerationState>(
        BillGenerationNotifier.new);

/// Handles marking a bill as paid.
class BillPaymentNotifier extends Notifier<AsyncValue<void>> {
  @override
  AsyncValue<void> build() => const AsyncValue.data(null);

  Future<bool> markPaid(
    String billId, {
    required String paymentMethod,
    String? paymentNote,
  }) async {
    state = const AsyncValue.loading();
    try {
      await ref.read(billsRemoteDsProvider).markBillPaid(
            billId,
            paymentMethod: paymentMethod,
            paymentNote: paymentNote,
          );
      ref.invalidate(generatedBillsProvider);
      ref.invalidate(billDetailProvider(billId));
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }
}

final billPaymentProvider =
    NotifierProvider<BillPaymentNotifier, AsyncValue<void>>(
        BillPaymentNotifier.new);
