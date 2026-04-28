import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../data/models/ai_analytics_data.dart';
import '../../../data/models/user_service.dart';
import '../../../providers/analytics_provider.dart';
import '../../../providers/bills_provider.dart';
import '../../../providers/dashboard_provider.dart';
import '../../../providers/services_provider.dart';
import '../../widgets/common/error_retry_view.dart';
import '../../widgets/common/loading_shimmer.dart';
import '../../widgets/common/yesbill_loading_widget.dart';

// ── USD → INR conversion (approximate) ───────────────────────────────────────
const double _usdToInr = 84.0;

String _fmtTokens(int n) {
  if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
  if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
  return '$n';
}

String _fmtLatency(int ms) {
  if (ms == 0) return '--';
  if (ms >= 1000) return '${(ms / 1000).toStringAsFixed(1)}s';
  return '${ms}ms';
}

String _fmtCost(double usd) {
  final inr = usd * _usdToInr;
  if (inr < 1) return '₹${(inr).toStringAsFixed(2)}';
  return '₹${inr.toStringAsFixed(0)}';
}

String _fmtMessages(int n) {
  if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
  return '$n';
}

String _toYearMonth(DateTime dt) =>
    '${dt.year}-${dt.month.toString().padLeft(2, '0')}';

String _monthLabel(String ym) {
  final parts = ym.split('-');
  if (parts.length != 2) return ym;
  const months = [
    '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  final m = int.tryParse(parts[1]) ?? 0;
  return '${months[m]} ${parts[0]}';
}

// ── Screen ────────────────────────────────────────────────────────────────────

class AnalyticsScreen extends ConsumerStatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  ConsumerState<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends ConsumerState<AnalyticsScreen> {
  late String _selectedMonth;
  int _selectedTab = 0;

  @override
  void initState() {
    super.initState();
    _selectedMonth = _toYearMonth(DateTime.now());
  }

  void _prevMonth() {
    final parts = _selectedMonth.split('-');
    var y = int.parse(parts[0]);
    var m = int.parse(parts[1]) - 1;
    if (m < 1) {
      m = 12;
      y--;
    }
    setState(() {
      _selectedMonth = '$y-${m.toString().padLeft(2, '0')}';
    });
  }

  void _nextMonth() {
    final parts = _selectedMonth.split('-');
    var y = int.parse(parts[0]);
    var m = int.parse(parts[1]) + 1;
    if (m > 12) {
      m = 1;
      y++;
    }
    final next = '$y-${m.toString().padLeft(2, '0')}';
    if (next.compareTo(_toYearMonth(DateTime.now())) <= 0) {
      setState(() => _selectedMonth = next);
    }
  }

  bool get _isCurrentMonth =>
      _selectedMonth == _toYearMonth(DateTime.now());

  @override
  Widget build(BuildContext context) {
    final dataAsync = ref.watch(aiAnalyticsProvider(_selectedMonth));
    final cs = Theme.of(context).colorScheme;

    return Container(
      color: cs.surface,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'AI Analytics',
                      style: AppTextStyles.h1.copyWith(
                        color: cs.onSurface,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      'Overview of your AI assistant usage.',
                      style: AppTextStyles.bodySm.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
              _AnalyticsTabs(
                selectedTab: _selectedTab,
                onSelectedTab: (value) => setState(() => _selectedTab = value),
          ),
              const SizedBox(height: 14),
              if (_selectedTab == 0)
                const _YesBillAnalyticsOverview()
              else ...[
                Row(
                  children: [
                    const Spacer(),
                    _MonthPicker(
                      label: _monthLabel(_selectedMonth),
                      onPrev: _prevMonth,
                      onNext: _isCurrentMonth ? null : _nextMonth,
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                dataAsync.when(
                  loading: () => const ShimmerList(count: 4, itemHeight: 80),
                  error: (error, _) => ErrorRetryView(
                    error: error,
                    onRetry: () => ref.invalidate(aiAnalyticsProvider(_selectedMonth)),
                  ),
                  data: (data) => _AnalyticsBody(data: data),
                ),
              ],
        ],
      ),
    );
  }
}

    class _AnalyticsTabs extends StatelessWidget {
      const _AnalyticsTabs({
        required this.selectedTab,
        required this.onSelectedTab,
      });

      final int selectedTab;
      final ValueChanged<int> onSelectedTab;

      @override
      Widget build(BuildContext context) {
        final cs = Theme.of(context).colorScheme;
        const tabs = [
          (label: 'YesBill Analytics', icon: LucideIcons.barChart3),
          (label: 'AI Usage', icon: LucideIcons.brain),
        ];

        return Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: cs.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: cs.outline),
          ),
          child: Row(
            children: List.generate(tabs.length, (index) {
              final tab = tabs[index];
              final selected = selectedTab == index;

              return Expanded(
                child: GestureDetector(
                  onTap: () => onSelectedTab(index),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: selected ? AppColors.primary : Colors.transparent,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          tab.icon,
                          size: 16,
                          color: selected ? Colors.white : cs.onSurfaceVariant,
                        ),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            tab.label,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTextStyles.bodySm.copyWith(
                              color: selected ? Colors.white : cs.onSurface,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
        );
      }
    }

    class _YesBillAnalyticsOverview extends ConsumerWidget {
      const _YesBillAnalyticsOverview();

      @override
      Widget build(BuildContext context, WidgetRef ref) {
        final cs = Theme.of(context).colorScheme;
        final statsAsync = ref.watch(dashboardStatsProvider);
        final servicesAsync = ref.watch(activeServicesProvider);
        final billsAsync = ref.watch(generatedBillsProvider);

        final stats = statsAsync.valueOrNull;
        final services = servicesAsync.valueOrNull;
        final bills = billsAsync.valueOrNull;

        final isLoading = (statsAsync.isLoading || servicesAsync.isLoading || billsAsync.isLoading) &&
            (stats == null || services == null || bills == null);

        if (isLoading) {
          return const YesBillLoadingWidget(
            label: 'Loading Analytics...',
            sublabel: 'Crunching your numbers',
          );
        }

        if (statsAsync.hasError) {
          return ErrorRetryView(
            error: statsAsync.error!,
            onRetry: () => ref.invalidate(dashboardStatsProvider),
          );
        }

        if (servicesAsync.hasError) {
          return ErrorRetryView(
            error: servicesAsync.error!,
            onRetry: () => ref.invalidate(activeServicesProvider),
          );
        }

        if (billsAsync.hasError) {
          return ErrorRetryView(
            error: billsAsync.error!,
            onRetry: () => ref.invalidate(generatedBillsProvider),
          );
        }

        final safeStats = stats ?? const DashboardStats.empty();
        final safeServices = services ?? const [];
        final safeBills = bills ?? const [];

        final paidBills = safeBills.where((bill) => bill.isPaid).toList();
        final pendingBills = safeBills.where((bill) => !bill.isPaid).toList();
        final paidAmount = paidBills.fold<double>(0, (sum, bill) => sum + bill.totalAmount);
        final pendingAmount = pendingBills.fold<double>(0, (sum, bill) => sum + bill.totalAmount);
        final providerCount = safeServices.where((service) => service.isProvider).length;
        final consumerCount = safeServices.length - providerCount;
        final topServices = [...safeServices]
          ..sort((a, b) => b.price.compareTo(a.price));
        final recentBills = [...safeBills]
          ..sort((a, b) {
            final aDate = a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
            final bDate = b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
            return bDate.compareTo(aDate);
          });

        return Column(
          children: [
            GridView.count(
              crossAxisCount: 2,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 1.25,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _OverviewStatTile(
                  label: 'THIS MONTH SPEND',
                  value: CurrencyFormatter.formatCompact(
                    safeStats.totalMonthSpend,
                    currency: safeStats.currency,
                  ),
                  icon: LucideIcons.wallet,
                  subtitle: '${safeStats.deliveredThisMonth} delivered',
                ),
                _OverviewStatTile(
                  label: 'NET BALANCE',
                  value: CurrencyFormatter.formatCompact(
                    safeStats.netBalance,
                    currency: safeStats.currency,
                  ),
                  icon: LucideIcons.scale,
                  subtitle: safeStats.hasProviderServices
                      ? 'Income minus spend'
                      : 'No provider income yet',
                ),
                _OverviewStatTile(
                  label: 'DELIVERY RATE',
                  value: '${safeStats.deliveryRate.toStringAsFixed(1)}%',
                  icon: LucideIcons.activity,
                  subtitle: '${safeStats.skippedThisMonth} skipped',
                ),
                _OverviewStatTile(
                  label: 'PAID BILLS',
                  value: CurrencyFormatter.formatCompact(
                    paidAmount,
                    currency: safeStats.currency,
                  ),
                  icon: LucideIcons.receipt,
                  subtitle: '${paidBills.length} paid / ${pendingBills.length} pending',
                ),
              ],
            ),
            const SizedBox(height: 14),
            _OverviewCard(
              title: 'Active services',
              icon: LucideIcons.package,
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: _MiniMetric(
                          label: 'Consumer',
                          value: '$consumerCount',
                          color: const Color(0xFF4F46E5),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _MiniMetric(
                          label: 'Provider',
                          value: '$providerCount',
                          color: const Color(0xFF059669),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _MiniMetric(
                          label: 'Pending Bills',
                          value: CurrencyFormatter.formatCompact(
                            pendingAmount,
                            currency: safeStats.currency,
                          ),
                          color: const Color(0xFFDC2626),
                        ),
                      ),
                    ],
                  ),
                  if (topServices.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    ...topServices.take(4).map(
                      (service) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                service.name,
                                style: AppTextStyles.body.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: cs.onSurface,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Text(
                              CurrencyFormatter.formatCompact(
                                service.price,
                                currency: safeStats.currency,
                              ),
                              style: AppTextStyles.bodySm.copyWith(
                                fontWeight: FontWeight.w700,
                                color: cs.onSurface,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 14),
            _OverviewCard(
              title: 'Recent generated bills',
              icon: LucideIcons.fileText,
              child: recentBills.isEmpty
                  ? _EmptyChart(message: 'No bills generated yet')
                  : Column(
                      children: recentBills.take(5).map((bill) {
                        final statusColor =
                            bill.isPaid ? AppColors.success : AppColors.error;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Row(
                            children: [
                              Container(
                                width: 34,
                                height: 34,
                                decoration: BoxDecoration(
                                  color: statusColor.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                alignment: Alignment.center,
                                child: Icon(
                                  bill.isPaid ? LucideIcons.check : LucideIcons.receipt,
                                  size: 16,
                                  color: statusColor,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      bill.yearMonth,
                                      style: AppTextStyles.body.copyWith(
                                        fontWeight: FontWeight.w600,
                                        color: cs.onSurface,
                                      ),
                                    ),
                                    Text(
                                      bill.isPaid ? 'Paid' : 'Pending',
                                      style: AppTextStyles.bodySm.copyWith(
                                        color: statusColor,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                CurrencyFormatter.formatCompact(
                                  bill.totalAmount,
                                  currency: bill.currency,
                                ),
                                style: AppTextStyles.bodySm.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: cs.onSurface,
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
            ),
          ],
        );
      }
    }

    class _OverviewStatTile extends StatelessWidget {
      const _OverviewStatTile({
        required this.label,
        required this.value,
        required this.icon,
        required this.subtitle,
      });

      final String label;
      final String value;
      final IconData icon;
      final String subtitle;

      @override
      Widget build(BuildContext context) {
        final cs = Theme.of(context).colorScheme;
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: _analyticsCardColor(context),
            borderRadius: BorderRadius.circular(14),
            border: _analyticsCardBorder(context),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0A2D3337),
                blurRadius: 16,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.14),
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Icon(icon, size: 13, color: AppColors.primary),
              ),
              const SizedBox(height: 8),
              Text(
                label,
                style: AppTextStyles.labelSm.copyWith(
                  color: cs.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: AppTextStyles.h4.copyWith(
                  color: cs.onSurface,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                subtitle,
                style: AppTextStyles.labelSm.copyWith(
                  color: cs.onSurfaceVariant,
                ),
              ),
            ],
          ),
        );
      }
    }

    class _OverviewCard extends StatelessWidget {
      const _OverviewCard({
        required this.title,
        required this.icon,
        required this.child,
      });

      final String title;
      final IconData icon;
      final Widget child;

      @override
      Widget build(BuildContext context) {
        final cs = Theme.of(context).colorScheme;
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: _analyticsCardColor(context),
            borderRadius: BorderRadius.circular(16),
            border: _analyticsCardBorder(context),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0F2D3337),
                blurRadius: 24,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(icon, size: 18, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Text(
                    title,
                    style: AppTextStyles.h4.copyWith(
                      color: cs.onSurface,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              child,
            ],
          ),
        );
      }
    }

    class _MiniMetric extends StatelessWidget {
      const _MiniMetric({
        required this.label,
        required this.value,
        required this.color,
      });

      final String label;
      final String value;
      final Color color;

      @override
      Widget build(BuildContext context) {
        final cs = Theme.of(context).colorScheme;
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withOpacity(0.08),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: AppTextStyles.labelSm.copyWith(
                  color: cs.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: AppTextStyles.body.copyWith(
                  color: cs.onSurface,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        );
      }
    }

// ── Month Picker ──────────────────────────────────────────────────────────────

class _MonthPicker extends StatelessWidget {
  const _MonthPicker({
    required this.label,
    required this.onPrev,
    this.onNext,
  });

  final String label;
  final VoidCallback onPrev;
  final VoidCallback? onNext;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      height: 30,
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: cs.outline),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A2D3337),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _PickerBtn(icon: LucideIcons.chevronLeft, onTap: onPrev),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              label,
              style: AppTextStyles.labelSm.copyWith(
                color: cs.onSurface,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          _PickerBtn(
            icon: LucideIcons.chevronRight,
            onTap: onNext,
            disabled: onNext == null,
          ),
        ],
      ),
    );
  }
}

class _PickerBtn extends StatelessWidget {
  const _PickerBtn({
    required this.icon,
    this.onTap,
    this.disabled = false,
  });

  final IconData icon;
  final VoidCallback? onTap;
  final bool disabled;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: disabled ? null : onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6),
        child: Icon(
          icon,
          size: 13,
          color: disabled
              ? cs.onSurfaceVariant.withOpacity(0.4)
              : cs.onSurfaceVariant,
        ),
      ),
    );
  }
}

// ── Analytics Body ────────────────────────────────────────────────────────────

class _AnalyticsBody extends StatelessWidget {
  const _AnalyticsBody({required this.data});
  final AiAnalyticsData data;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _StatsGrid(data: data),
        const SizedBox(height: 14),
        _DailyTokenChart(daily: data.dailyBreakdown),
        const SizedBox(height: 14),
        _ModelDistributionCard(models: data.modelBreakdown),
      ],
    );
  }
}

// ── Stats Grid ────────────────────────────────────────────────────────────────

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({required this.data});
  final AiAnalyticsData data;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      childAspectRatio: 1.5,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: [
        _StatTile(
          label: 'TOTAL TOKENS',
          value: _fmtTokens(data.totalTokens),
          icon: LucideIcons.activity,
        ),
        _StatTile(
          label: 'TOTAL COST',
          value: _fmtCost(data.totalCostUsd),
          subtitle: r'$' + data.totalCostUsd.toStringAsFixed(4),
          icon: LucideIcons.wallet,
        ),
        _StatTile(
          label: 'AI MESSAGES',
          value: _fmtMessages(data.messageCount),
          icon: LucideIcons.messageSquare,
        ),
        _StatTile(
          label: 'AVG LATENCY',
          value: _fmtLatency(data.avgLatencyMs),
          icon: LucideIcons.gauge,
        ),
      ],
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.label,
    required this.value,
    required this.icon,
    this.subtitle,
  });

  final String label;
  final String value;
  final IconData icon;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _analyticsCardColor(context),
        borderRadius: BorderRadius.circular(14),
        border: _analyticsCardBorder(context),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A2D3337),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.primary.withOpacity(0.14),
            ),
            alignment: Alignment.center,
            child: Icon(icon, size: 13, color: AppColors.primary),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: AppTextStyles.labelSm.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: AppTextStyles.h4.copyWith(
              color: cs.onSurface,
              fontWeight: FontWeight.w700,
            ),
          ),
          if (subtitle != null)
            Text(
              subtitle!,
              style: AppTextStyles.labelSm.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),
        ],
      ),
    );
  }
}

// ── Daily Token Chart ─────────────────────────────────────────────────────────

class _DailyTokenChart extends StatelessWidget {
  const _DailyTokenChart({required this.daily});
  final List<DailyTokenData> daily;

  @override
  Widget build(BuildContext context) {
    if (daily.isEmpty) {
      return _ChartCard(
        title: 'Daily Token Usage',
        child: _EmptyChart(message: 'No data for this period'),
      );
    }

    final maxTokens =
        daily.map((d) => d.totalTokens).fold(0, (a, b) => a > b ? a : b);
    final maxVal = maxTokens == 0 ? 1 : maxTokens;
    final display =
        daily.length > 14 ? daily.sublist(daily.length - 14) : daily;

    return _ChartCard(
      title: 'Daily Token Usage',
      child: SizedBox(
        height: 130,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: display.map((d) {
            final ratio = d.totalTokens / maxVal;
            final barH = (96 * ratio).clamp(2.0, 96.0);
            final day = d.date.length >= 10 ? d.date.substring(8) : d.date;
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Container(
                      height: barH,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            AppColors.primaryLight,
                            AppColors.primary,
                          ],
                        ),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      day,
                      style: AppTextStyles.labelSm.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                        fontSize: 9,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

// ── Model Distribution Card ───────────────────────────────────────────────────

class _ModelDistributionCard extends StatelessWidget {
  const _ModelDistributionCard({required this.models});
  final List<ModelUsageData> models;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    if (models.isEmpty) {
      return _ChartCard(
        title: 'Model Distribution',
        child: _EmptyChart(message: 'No model usage data yet'),
      );
    }

    final totalMsgs =
        models.fold(0, (sum, m) => sum + m.messageCount);
    final maxCost =
        models.map((m) => m.totalCostUsd).fold(0.0, (a, b) => a > b ? a : b);
    final maxVal = maxCost == 0 ? 1.0 : maxCost;

    const colors = [
      AppColors.primary,
      AppColors.primaryLight,
      AppColors.success,
      Color(0xFFF59E0B),
      Color(0xFFEC4899),
    ];

    return _ChartCard(
      title: 'Model Distribution',
      child: Column(
        children: models.take(5).toList().asMap().entries.map((entry) {
          final i = entry.key;
          final m = entry.value;
          final pct = totalMsgs > 0
              ? ((m.messageCount / totalMsgs) * 100).round()
              : 0;
          final barFraction = m.totalCostUsd / maxVal;
          final color = colors[i % colors.length];

          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Icon(LucideIcons.zap, size: 11, color: color),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        m.model,
                        style: AppTextStyles.body.copyWith(
                          color: cs.onSurface,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(
                      '$pct%  ${_fmtCost(m.totalCostUsd)}',
                      style: AppTextStyles.labelSm.copyWith(
                        color: cs.onSurfaceVariant,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 5),
                LayoutBuilder(
                  builder: (context, constraints) {
                    return Stack(
                      children: [
                        Container(
                          height: 5,
                          width: constraints.maxWidth,
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                        Container(
                          height: 5,
                          width: constraints.maxWidth * barFraction,
                          decoration: BoxDecoration(
                            color: color,
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ── Shared chart card wrapper ─────────────────────────────────────────────────

class _ChartCard extends StatelessWidget {
  const _ChartCard({required this.title, required this.child});
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _analyticsCardColor(context),
        borderRadius: BorderRadius.circular(16),
        border: _analyticsCardBorder(context),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F2D3337),
            blurRadius: 24,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: AppTextStyles.h4.copyWith(
              color: cs.onSurface,
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _EmptyChart extends StatelessWidget {
  const _EmptyChart({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 80,
      child: Center(
        child: Text(
          message,
          style: AppTextStyles.bodySm.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}

Color _analyticsCardColor(BuildContext context) =>
    Theme.of(context).brightness == Brightness.dark
        ? AppColors.cardDark
        : Colors.white;

BoxBorder? _analyticsCardBorder(BuildContext context) =>
    Theme.of(context).brightness == Brightness.dark
        ? Border.all(color: AppColors.cardDarkBorder)
        : null;
