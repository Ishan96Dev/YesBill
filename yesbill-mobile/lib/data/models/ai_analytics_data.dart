/// AI usage analytics data returned by /chat/analytics/summary
class AiAnalyticsData {
  final int totalTokensIn;
  final int totalTokensOut;
  final int totalTokensThinking;
  final double totalCostUsd;
  final int messageCount;
  final int avgLatencyMs;
  final List<DailyTokenData> dailyBreakdown;
  final List<ModelUsageData> modelBreakdown;

  const AiAnalyticsData({
    required this.totalTokensIn,
    required this.totalTokensOut,
    required this.totalTokensThinking,
    required this.totalCostUsd,
    required this.messageCount,
    required this.avgLatencyMs,
    required this.dailyBreakdown,
    required this.modelBreakdown,
  });

  int get totalTokens =>
      totalTokensIn + totalTokensOut + totalTokensThinking;

  factory AiAnalyticsData.fromJson(Map<String, dynamic> json) {
    return AiAnalyticsData(
      totalTokensIn: (json['total_tokens_in'] as num?)?.toInt() ?? 0,
      totalTokensOut: (json['total_tokens_out'] as num?)?.toInt() ?? 0,
      totalTokensThinking:
          (json['total_tokens_thinking'] as num?)?.toInt() ?? 0,
      totalCostUsd:
          (json['total_cost_usd'] as num?)?.toDouble() ?? 0.0,
      messageCount: (json['message_count'] as num?)?.toInt() ?? 0,
      avgLatencyMs: (json['avg_latency_ms'] as num?)?.toInt() ?? 0,
      dailyBreakdown: ((json['daily_breakdown'] as List?) ?? [])
          .cast<Map<String, dynamic>>()
          .map(DailyTokenData.fromJson)
          .toList(),
      modelBreakdown: ((json['model_breakdown'] as List?) ?? [])
          .cast<Map<String, dynamic>>()
          .map(ModelUsageData.fromJson)
          .toList(),
    );
  }

  static AiAnalyticsData empty() => const AiAnalyticsData(
        totalTokensIn: 0,
        totalTokensOut: 0,
        totalTokensThinking: 0,
        totalCostUsd: 0,
        messageCount: 0,
        avgLatencyMs: 0,
        dailyBreakdown: [],
        modelBreakdown: [],
      );
}

class DailyTokenData {
  final String date; // 'YYYY-MM-DD'
  final int tokensIn;
  final int tokensOut;
  final int tokensThinking;
  final double costUsd;
  final int count;
  final int avgLatencyMs;

  const DailyTokenData({
    required this.date,
    required this.tokensIn,
    required this.tokensOut,
    required this.tokensThinking,
    required this.costUsd,
    required this.count,
    required this.avgLatencyMs,
  });

  int get totalTokens => tokensIn + tokensOut + tokensThinking;

  factory DailyTokenData.fromJson(Map<String, dynamic> json) {
    return DailyTokenData(
      date: json['date'] as String? ?? '',
      tokensIn: (json['tokens_in'] as num?)?.toInt() ?? 0,
      tokensOut: (json['tokens_out'] as num?)?.toInt() ?? 0,
      tokensThinking: (json['tokens_thinking'] as num?)?.toInt() ?? 0,
      costUsd: (json['cost_usd'] as num?)?.toDouble() ?? 0.0,
      count: (json['count'] as num?)?.toInt() ?? 0,
      avgLatencyMs: (json['avg_latency_ms'] as num?)?.toInt() ?? 0,
    );
  }
}

class ModelUsageData {
  final String model;
  final int tokensIn;
  final int tokensOut;
  final int tokensThinking;
  final double totalCostUsd;
  final int messageCount;

  const ModelUsageData({
    required this.model,
    required this.tokensIn,
    required this.tokensOut,
    required this.tokensThinking,
    required this.totalCostUsd,
    required this.messageCount,
  });

  int get totalTokens => tokensIn + tokensOut + tokensThinking;

  factory ModelUsageData.fromJson(Map<String, dynamic> json) {
    return ModelUsageData(
      model: json['model'] as String? ?? 'unknown',
      tokensIn: (json['tokens_in'] as num?)?.toInt() ?? 0,
      tokensOut: (json['tokens_out'] as num?)?.toInt() ?? 0,
      tokensThinking: (json['tokens_thinking'] as num?)?.toInt() ?? 0,
      totalCostUsd: (json['total_cost_usd'] as num?)?.toDouble() ?? 0.0,
      messageCount: (json['message_count'] as num?)?.toInt() ?? 0,
    );
  }
}
