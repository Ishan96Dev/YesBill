import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/user_service.dart';
import 'auth_provider.dart';
import 'calendar_provider.dart';
import 'core_providers.dart';
import 'services_provider.dart';

/// Aggregated stats for the dashboard — mirrors the web's analyticsService.getDashboardStats().
class DashboardStats {
  const DashboardStats({
    required this.totalMonthSpend,
    required this.providerMonthIncome,
    required this.netBalance,
    required this.deliveryRate,
    required this.activeServicesCount,
    required this.deliveredThisMonth,
    required this.skippedThisMonth,
    required this.hasProviderServices,
    required this.currency,
    required this.currencySymbol,
  });

  const DashboardStats.empty()
      : totalMonthSpend = 0,
        providerMonthIncome = 0,
        netBalance = 0,
        deliveryRate = 0,
        activeServicesCount = 0,
        deliveredThisMonth = 0,
        skippedThisMonth = 0,
        hasProviderServices = false,
        currency = 'INR',
        currencySymbol = '₹';

  final double totalMonthSpend;
  final double providerMonthIncome;
  final double netBalance;
  final double deliveryRate;
  final int activeServicesCount;
  final int deliveredThisMonth;
  final int skippedThisMonth;
  final bool hasProviderServices;
  final String currency;
  final String currencySymbol;
}

/// Computes current-month dashboard statistics from service_confirmations + user_services.
///
/// All three source providers are realtime streams, so stats update automatically
/// when the user taps delivered/skipped on the calendar.
final dashboardStatsProvider =
    Provider.autoDispose<AsyncValue<DashboardStats>>((ref) {
  final authState = ref.watch(authProvider);
  if (!authState.isAuthenticated) {
    return const AsyncValue.data(DashboardStats.empty());
  }

  final now = DateTime.now();
  final yearMonth =
      '${now.year}-${now.month.toString().padLeft(2, '0')}';

  final servicesAsync = ref.watch(activeServicesProvider);
  final confirmationsAsync = ref.watch(monthConfirmationsProvider(yearMonth));
  final profileAsync = ref.watch(userProfileProvider);

  if (servicesAsync.isLoading || confirmationsAsync.isLoading) {
    return const AsyncValue.loading();
  }
  if (servicesAsync.hasError) {
    return AsyncValue.error(
        servicesAsync.error!, servicesAsync.stackTrace!);
  }
  if (confirmationsAsync.hasError) {
    return AsyncValue.error(
        confirmationsAsync.error!, confirmationsAsync.stackTrace!);
  }

  final services = servicesAsync.valueOrNull ?? [];
  final confirmations = confirmationsAsync.valueOrNull ?? [];
  final profile = profileAsync.valueOrNull;

  // Build service lookup map for O(1) access.
  final serviceMap = {for (final s in services) s.id: s};

  double consumerSpend = 0;
  double providerIncome = 0;
  int delivered = 0;
  int skipped = 0;

  for (final c in confirmations) {
    final service = serviceMap[c.serviceId];
    if (service == null) continue;

    final amount = c.customAmount ?? service.price;

    if (c.status == 'delivered') {
      delivered++;
      if (service.isConsumer) {
        consumerSpend += amount;
      } else {
        providerIncome += amount;
      }
    } else if (c.status == 'skipped') {
      skipped++;
    }
  }

  final total = delivered + skipped;
  final rate = total == 0 ? 0.0 : (delivered / total * 100);

  return AsyncValue.data(DashboardStats(
    totalMonthSpend: consumerSpend,
    providerMonthIncome: providerIncome,
    netBalance: providerIncome - consumerSpend,
    deliveryRate: rate,
    activeServicesCount: services.length,
    deliveredThisMonth: delivered,
    skippedThisMonth: skipped,
    hasProviderServices: services.any((s) => s.isProvider),
    currency: profile?.currency ?? 'INR',
    currencySymbol: profile?.currencyCode ?? '₹',
  ));
});
