import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/ai_analytics_data.dart';
import 'auth_provider.dart';
import 'core_providers.dart';

/// Legacy provider (AI-generated text summary).
final analyticsProvider =
    FutureProvider.family<String, ({String? yearMonth, int? days})>(
  (ref, params) {
    final authState = ref.watch(authProvider);
    if (!authState.isAuthenticated) return Future.value('');
    return ref
        .watch(chatRemoteDsProvider)
        .getAnalyticsSummary(yearMonth: params.yearMonth, days: params.days);
  },
);

/// Structured AI usage analytics data for the analytics screen.
final aiAnalyticsProvider =
    FutureProvider.family<AiAnalyticsData, String?>(
  (ref, yearMonth) {
    final authState = ref.watch(authProvider);
    if (!authState.isAuthenticated) return Future.value(AiAnalyticsData.empty());
    return ref
        .watch(chatRemoteDsProvider)
        .getAnalyticsData(yearMonth: yearMonth);
  },
);
