import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/ai_analytics_data.dart';
import 'core_providers.dart';

/// Legacy provider (AI-generated text summary).
final analyticsProvider =
    FutureProvider.family<String, ({String? yearMonth, int? days})>(
  (ref, params) => ref
      .watch(chatRemoteDsProvider)
      .getAnalyticsSummary(yearMonth: params.yearMonth, days: params.days),
);

/// Structured AI usage analytics data for the analytics screen.
final aiAnalyticsProvider =
    FutureProvider.family<AiAnalyticsData, String?>(
  (ref, yearMonth) => ref
      .watch(chatRemoteDsProvider)
      .getAnalyticsData(yearMonth: yearMonth),
);
