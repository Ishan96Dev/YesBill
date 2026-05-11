import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_surfaces.dart';
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
  bool _hasAutoSwitched = false;

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

    // Auto-backtrack: when the AI Usage tab is open and the current month
    // has no data, switch to the previous month automatically.
    // ref.listen fires OUTSIDE the build phase, so calling setState here is
    // safe and avoids mutating state during build (which can trigger
    // downstream render-object assertions in flutter_animate widgets).
    ref.listen<AsyncValue<AiAnalyticsData>>(
      aiAnalyticsProvider(_selectedMonth),
      (_, next) {
        next.whenData((data) {
          if (data.messageCount == 0 && _isCurrentMonth && !_hasAutoSwitched) {
            _hasAutoSwitched = true;
            _prevMonth();
          }
        });
      },
    );

    return ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
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
            color: AppSurfaces.subtle(context),
            borderRadius: BorderRadius.circular(18),
            border: AppSurfaces.cardBorder(context),
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

        // Compute monthly totals from bills for trend chart
        final monthlyTotals = <String, double>{};
        for (final bill in safeBills) {
          monthlyTotals[bill.yearMonth] =
              (monthlyTotals[bill.yearMonth] ?? 0) + bill.totalAmount;
        }
        final sortedMonths = monthlyTotals.keys.toList()..sort();

        return Column(
          children: [
            GridView.count(
              crossAxisCount: 2,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 1.55,
              shrinkWrap: true,
              padding: EdgeInsets.zero,
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
            if (sortedMonths.length >= 2) ...[
              const SizedBox(height: 10),
              _BillTrendChart(
                months: sortedMonths,
                totals: monthlyTotals,
                currency: safeStats.currency,
              ),
            ],
            const SizedBox(height: 10),
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

// ── Bill Monthly Trend Chart ──────────────────────────────────────────────────

class _BillTrendChart extends StatelessWidget {
  const _BillTrendChart({
    required this.months,
    required this.totals,
    required this.currency,
  });

  final List<String> months;
  final Map<String, double> totals;
  final String currency;

  @override
  Widget build(BuildContext context) {
    final display = months.length > 12
        ? months.sublist(months.length - 12)
        : months;

    final maxAmount =
        display.map((m) => totals[m] ?? 0).fold(0.0, (a, b) => a > b ? a : b);
    final maxY = maxAmount == 0 ? 100.0 : maxAmount * 1.25;

    final groups = display.asMap().entries.map((e) {
      final amount = totals[e.value] ?? 0.0;
      return BarChartGroupData(
        x: e.key,
        barRods: [
          BarChartRodData(
            toY: amount,
            width: 14,
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(5)),
            gradient: const LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [AppColors.primaryLight, AppColors.primary],
            ),
          ),
        ],
      );
    }).toList();

    final cs = Theme.of(context).colorScheme;
    final gridColor = cs.outlineVariant.withOpacity(0.35);

    // Short month labels e.g. "Jan" from "2026-01"
    String _shortMonth(String ym) {
      final parts = ym.split('-');
      if (parts.length != 2) return ym;
      const months = [
        '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      final m = int.tryParse(parts[1]) ?? 0;
      return months[m];
    }

    return _ChartCard(
      title: 'Monthly Bill Trend',
      subtitle: 'Total billed amount per month',
      child: SizedBox(
        height: 180,
        child: BarChart(
          BarChartData(
            maxY: maxY,
            alignment: BarChartAlignment.spaceAround,
            barGroups: groups,
            gridData: FlGridData(
              show: true,
              drawVerticalLine: false,
              getDrawingHorizontalLine: (_) => FlLine(
                color: gridColor,
                strokeWidth: 1,
                dashArray: [4, 4],
              ),
            ),
            borderData: FlBorderData(show: false),
            titlesData: FlTitlesData(
              leftTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 46,
                  interval: maxY / 4,
                  getTitlesWidget: (value, meta) {
                    if (value == 0) return const SizedBox.shrink();
                    return Padding(
                      padding: const EdgeInsets.only(right: 4),
                      child: Text(
                        CurrencyFormatter.formatCompact(
                            value, currency: currency),
                        style: TextStyle(
                            fontSize: 9, color: cs.onSurfaceVariant),
                      ),
                    );
                  },
                ),
              ),
              bottomTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 20,
                  getTitlesWidget: (value, meta) {
                    final idx = value.toInt();
                    if (idx < 0 || idx >= display.length) {
                      return const SizedBox.shrink();
                    }
                    return Text(
                      _shortMonth(display[idx]),
                      style: TextStyle(
                          fontSize: 9, color: cs.onSurfaceVariant),
                    );
                  },
                ),
              ),
              rightTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false)),
              topTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false)),
            ),
            barTouchData: BarTouchData(
              touchTooltipData: BarTouchTooltipData(
                getTooltipColor: (_) => AppColors.primaryDark,
                tooltipRoundedRadius: 10,
                getTooltipItem: (group, _, rod, __) {
                  final ym = display[group.x.toInt()];
                  final amount = totals[ym] ?? 0;
                  return BarTooltipItem(
                    '${_monthLabel(ym)}\n',
                    const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 11),
                    children: [
                      TextSpan(
                        text: CurrencyFormatter.formatCompact(
                            amount, currency: currency),
                        style: const TextStyle(
                            fontSize: 12, fontWeight: FontWeight.w700),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
        ),
      ),
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
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: _analyticsCardColor(context),
            borderRadius: BorderRadius.circular(16),
            border: _analyticsCardBorder(context),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0F2D3337),
                blurRadius: 12,
                offset: Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
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
              const SizedBox(height: 6),
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
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _analyticsCardColor(context),
            borderRadius: BorderRadius.circular(16),
            border: _analyticsCardBorder(context),
            boxShadow: AppSurfaces.softShadow(context),
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
        color: AppSurfaces.subtle(context),
        borderRadius: BorderRadius.circular(999),
        border: AppSurfaces.cardBorder(context),
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
        const SizedBox(height: 10),
        _TokenBreakdownRow(data: data),
        const SizedBox(height: 10),
        _DailyTokenChart(daily: data.dailyBreakdown),
        const SizedBox(height: 10),
        _LatencyTrendChart(daily: data.dailyBreakdown),
        const SizedBox(height: 10),
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
      childAspectRatio: 1.55,
      shrinkWrap: true,
      padding: EdgeInsets.zero,
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: _analyticsCardColor(context),
        borderRadius: BorderRadius.circular(16),
        border: _analyticsCardBorder(context),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F2D3337),
            blurRadius: 12,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
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
          const SizedBox(height: 6),
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
        subtitle: 'Input · Output · Thinking tokens per day',
        child: _EmptyChart(message: 'No data for this period'),
      );
    }

    final display =
        daily.length > 14 ? daily.sublist(daily.length - 14) : daily;
    final maxTokens = display
        .map((d) => d.totalTokens)
        .fold(0, (a, b) => a > b ? a : b);
    final maxY = maxTokens == 0 ? 100.0 : (maxTokens * 1.25).toDouble();

    final groups = display.asMap().entries.map((e) {
      final i = e.key;
      final d = e.value;
      final inT = d.tokensIn.toDouble();
      final outT = d.tokensOut.toDouble();
      final thinkT = d.tokensThinking.toDouble();
      return BarChartGroupData(
        x: i,
        barRods: [
          BarChartRodData(
            toY: d.totalTokens.toDouble(),
            width: 10,
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(4)),
            rodStackItems: [
              BarChartRodStackItem(0, inT, AppColors.primaryLight),
              BarChartRodStackItem(inT, inT + outT, AppColors.primary),
              BarChartRodStackItem(
                  inT + outT, inT + outT + thinkT, const Color(0xFF7C3AED)),
            ],
          ),
        ],
      );
    }).toList();

    final cs = Theme.of(context).colorScheme;
    final gridColor = cs.outlineVariant.withOpacity(0.35);

    return _ChartCard(
      title: 'Daily Token Usage',
      subtitle: 'Input · Output · Thinking tokens per day',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _ChartLegendDot(color: AppColors.primaryLight, label: 'Input'),
              const SizedBox(width: 14),
              _ChartLegendDot(color: AppColors.primary, label: 'Output'),
              const SizedBox(width: 14),
              _ChartLegendDot(
                  color: const Color(0xFF7C3AED), label: 'Thinking'),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 170,
            child: BarChart(
              BarChartData(
                maxY: maxY,
                alignment: BarChartAlignment.spaceAround,
                barGroups: groups,
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (_) => FlLine(
                    color: gridColor,
                    strokeWidth: 1,
                    dashArray: [4, 4],
                  ),
                ),
                borderData: FlBorderData(show: false),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 40,
                      interval: maxY / 4,
                      getTitlesWidget: (value, meta) {
                        if (value == 0) return const SizedBox.shrink();
                        return Padding(
                          padding: const EdgeInsets.only(right: 4),
                          child: Text(
                            _fmtTokens(value.toInt()),
                            style: TextStyle(
                                fontSize: 9, color: cs.onSurfaceVariant),
                          ),
                        );
                      },
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 20,
                      getTitlesWidget: (value, meta) {
                        final idx = value.toInt();
                        if (idx < 0 || idx >= display.length) {
                          return const SizedBox.shrink();
                        }
                        if (display.length > 7 && idx % 2 != 0) {
                          return const SizedBox.shrink();
                        }
                        final date = display[idx].date;
                        final day = date.length >= 10
                            ? date.substring(8)
                            : date;
                        return Text(
                          day,
                          style: TextStyle(
                              fontSize: 9, color: cs.onSurfaceVariant),
                        );
                      },
                    ),
                  ),
                  rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false)),
                ),
                barTouchData: BarTouchData(
                  touchTooltipData: BarTouchTooltipData(
                    getTooltipColor: (_) => AppColors.primaryDark,
                    tooltipRoundedRadius: 10,
                    getTooltipItem: (group, _, rod, __) {
                      final d = display[group.x.toInt()];
                      return BarTooltipItem(
                        '${d.date.substring(5)}\n',
                        const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 11),
                        children: [
                          TextSpan(
                              text: 'In: ${_fmtTokens(d.tokensIn)}\n',
                              style: const TextStyle(
                                  fontSize: 10, fontWeight: FontWeight.w400)),
                          TextSpan(
                              text: 'Out: ${_fmtTokens(d.tokensOut)}\n',
                              style: const TextStyle(
                                  fontSize: 10, fontWeight: FontWeight.w400)),
                          if (d.tokensThinking > 0)
                            TextSpan(
                                text:
                                    'Think: ${_fmtTokens(d.tokensThinking)}\n',
                                style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w400)),
                          TextSpan(
                              text: 'Total: ${_fmtTokens(d.totalTokens)}',
                              style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700)),
                        ],
                      );
                    },
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Latency Trend Chart ───────────────────────────────────────────────────────

class _LatencyTrendChart extends StatelessWidget {
  const _LatencyTrendChart({required this.daily});
  final List<DailyTokenData> daily;

  @override
  Widget build(BuildContext context) {
    final withLatency = daily.where((d) => d.avgLatencyMs > 0).toList();
    if (withLatency.isEmpty) {
      return _ChartCard(
        title: 'Latency Trend',
        subtitle: 'Avg response time per day',
        child: _EmptyChart(message: 'No latency data yet'),
      );
    }

    final display = withLatency.length > 14
        ? withLatency.sublist(withLatency.length - 14)
        : withLatency;
    final maxMs = display
        .map((d) => d.avgLatencyMs)
        .fold(0, (a, b) => a > b ? a : b);
    final maxY = maxMs == 0 ? 10.0 : ((maxMs / 1000) * 1.3);

    final spots = display.asMap().entries
        .map((e) =>
            FlSpot(e.key.toDouble(), e.value.avgLatencyMs / 1000))
        .toList();

    final cs = Theme.of(context).colorScheme;
    final gridColor = cs.outlineVariant.withOpacity(0.35);

    return _ChartCard(
      title: 'Latency Trend',
      subtitle: 'Avg response time per day (seconds)',
      child: SizedBox(
        height: 140,
        child: LineChart(
          LineChartData(
            minY: 0,
            maxY: maxY,
            gridData: FlGridData(
              show: true,
              drawVerticalLine: false,
              getDrawingHorizontalLine: (_) => FlLine(
                color: gridColor,
                strokeWidth: 1,
                dashArray: [4, 4],
              ),
            ),
            borderData: FlBorderData(show: false),
            titlesData: FlTitlesData(
              leftTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 36,
                  interval: maxY / 4,
                  getTitlesWidget: (value, meta) {
                    if (value == 0) return const SizedBox.shrink();
                    return Padding(
                      padding: const EdgeInsets.only(right: 4),
                      child: Text(
                        '${value.toStringAsFixed(1)}s',
                        style: TextStyle(
                            fontSize: 9, color: cs.onSurfaceVariant),
                      ),
                    );
                  },
                ),
              ),
              bottomTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 20,
                  getTitlesWidget: (value, meta) {
                    final idx = value.toInt();
                    if (idx < 0 || idx >= display.length) {
                      return const SizedBox.shrink();
                    }
                    if (display.length > 7 && idx % 2 != 0) {
                      return const SizedBox.shrink();
                    }
                    final date = display[idx].date;
                    final day =
                        date.length >= 10 ? date.substring(8) : date;
                    return Text(
                      day,
                      style: TextStyle(
                          fontSize: 9, color: cs.onSurfaceVariant),
                    );
                  },
                ),
              ),
              rightTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false)),
              topTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false)),
            ),
            lineBarsData: [
              LineChartBarData(
                spots: spots,
                isCurved: true,
                color: AppColors.warning,
                barWidth: 2.5,
                dotData: FlDotData(
                  show: true,
                  getDotPainter: (_, __, ___, ____) => FlDotCirclePainter(
                    radius: 3,
                    color: AppColors.warning,
                    strokeColor: Colors.white,
                    strokeWidth: 1.5,
                  ),
                ),
                belowBarData: BarAreaData(
                  show: true,
                  color: AppColors.warning.withOpacity(0.10),
                ),
              ),
            ],
            lineTouchData: LineTouchData(
              touchTooltipData: LineTouchTooltipData(
                getTooltipColor: (_) => AppColors.primaryDark,
                tooltipRoundedRadius: 10,
                getTooltipItems: (touchedSpots) =>
                    touchedSpots.map((s) {
                  final d = display[s.x.toInt()];
                  return LineTooltipItem(
                    '${d.date.substring(5)}\n${(d.avgLatencyMs / 1000).toStringAsFixed(2)}s',
                    const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w600),
                  );
                }).toList(),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Token Breakdown Row ───────────────────────────────────────────────────────

class _TokenBreakdownRow extends StatelessWidget {
  const _TokenBreakdownRow({required this.data});
  final AiAnalyticsData data;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final total = data.totalTokens;
    if (total == 0) return const SizedBox.shrink();

    final inPct =
        total > 0 ? (data.totalTokensIn / total * 100).round() : 0;
    final outPct =
        total > 0 ? (data.totalTokensOut / total * 100).round() : 0;
    final thinkPct =
        total > 0 ? (data.totalTokensThinking / total * 100).round() : 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _analyticsCardColor(context),
        borderRadius: BorderRadius.circular(16),
        border: _analyticsCardBorder(context),
        boxShadow: AppSurfaces.softShadow(context),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(LucideIcons.cpu, size: 16, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(
                'Token Breakdown',
                style: AppTextStyles.h4.copyWith(color: cs.onSurface),
              ),
              const Spacer(),
              Text(
                '${_fmtTokens(total)} total',
                style: AppTextStyles.bodySm.copyWith(
                  color: cs.onSurfaceVariant,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Segmented progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: Row(
              children: [
                if (data.totalTokensIn > 0)
                  Flexible(
                    flex: data.totalTokensIn,
                    child: Container(
                        height: 8, color: AppColors.primaryLight),
                  ),
                if (data.totalTokensOut > 0)
                  Flexible(
                    flex: data.totalTokensOut,
                    child:
                        Container(height: 8, color: AppColors.primary),
                  ),
                if (data.totalTokensThinking > 0)
                  Flexible(
                    flex: data.totalTokensThinking,
                    child: Container(
                        height: 8, color: const Color(0xFF7C3AED)),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _TokenBreakdownChip(
                  color: AppColors.primaryLight,
                  label: 'Input',
                  value: _fmtTokens(data.totalTokensIn),
                  pct: '$inPct%',
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _TokenBreakdownChip(
                  color: AppColors.primary,
                  label: 'Output',
                  value: _fmtTokens(data.totalTokensOut),
                  pct: '$outPct%',
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _TokenBreakdownChip(
                  color: const Color(0xFF7C3AED),
                  label: 'Thinking',
                  value: _fmtTokens(data.totalTokensThinking),
                  pct: '$thinkPct%',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TokenBreakdownChip extends StatelessWidget {
  const _TokenBreakdownChip({
    required this.color,
    required this.label,
    required this.value,
    required this.pct,
  });

  final Color color;
  final String label;
  final String value;
  final String pct;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                  width: 7,
                  height: 7,
                  decoration: BoxDecoration(
                      color: color, shape: BoxShape.circle)),
              const SizedBox(width: 5),
              Text(
                label,
                style: AppTextStyles.labelSm.copyWith(
                    color: cs.onSurfaceVariant, fontSize: 9),
              ),
            ],
          ),
          const SizedBox(height: 3),
          Text(
            value,
            style: AppTextStyles.body.copyWith(
                color: cs.onSurface,
                fontWeight: FontWeight.w700,
                fontSize: 12),
          ),
          Text(
            pct,
            style: AppTextStyles.labelSm.copyWith(
                color: color, fontWeight: FontWeight.w600, fontSize: 9),
          ),
        ],
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
        subtitle: 'Cost · tokens · messages per model',
        child: _EmptyChart(message: 'No model usage data yet'),
      );
    }

    final totalMsgs =
        models.fold(0, (sum, m) => sum + m.messageCount);
    final maxCost = models
        .map((m) => m.totalCostUsd)
        .fold(0.0, (a, b) => a > b ? a : b);
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
      subtitle: 'Cost · tokens · messages per model',
      child: Column(
        children: models.take(5).toList().asMap().entries.map((entry) {
          final i = entry.key;
          final m = entry.value;
          final pct = totalMsgs > 0
              ? ((m.messageCount / totalMsgs) * 100).round()
              : 0;
          final barFraction = m.totalCostUsd / maxVal;
          final color = colors[i % colors.length];
          final shortName = m.model.contains('/')
              ? m.model.split('/').last
              : m.model;

          return Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child:
                          Icon(LucideIcons.zap, size: 12, color: color),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        shortName,
                        style: AppTextStyles.body.copyWith(
                          color: cs.onSurface,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '$pct%  ${_fmtCost(m.totalCostUsd)}',
                          style: AppTextStyles.labelSm.copyWith(
                            color: cs.onSurface,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          '${_fmtTokens(m.totalTokens)} tokens · ${m.messageCount} msgs',
                          style: AppTextStyles.labelSm.copyWith(
                            color: cs.onSurfaceVariant,
                            fontSize: 9,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                LayoutBuilder(
                  builder: (context, constraints) {
                    return Stack(
                      children: [
                        Container(
                          height: 6,
                          width: constraints.maxWidth,
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.12),
                            borderRadius:
                                BorderRadius.circular(999),
                          ),
                        ),
                        Container(
                          height: 6,
                          width:
                              constraints.maxWidth * barFraction,
                          decoration: BoxDecoration(
                            color: color,
                            borderRadius:
                                BorderRadius.circular(999),
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
  const _ChartCard({
    required this.title,
    required this.child,
    this.subtitle,
  });

  final String title;
  final String? subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _analyticsCardColor(context),
        borderRadius: BorderRadius.circular(16),
        border: _analyticsCardBorder(context),
        boxShadow: AppSurfaces.softShadow(context),
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
          if (subtitle != null) ...[
            const SizedBox(height: 2),
            Text(
              subtitle!,
              style: AppTextStyles.labelSm.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),
          ],
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

// ── Chart legend dot ──────────────────────────────────────────────────────────

class _ChartLegendDot extends StatelessWidget {
  const _ChartLegendDot({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration:
              BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: AppTextStyles.labelSm.copyWith(
            color: cs.onSurfaceVariant,
            fontSize: 10,
          ),
        ),
      ],
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
    AppSurfaces.panel(context);

BoxBorder _analyticsCardBorder(BuildContext context) =>
    AppSurfaces.cardBorder(context);


