import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/extensions/context_extensions.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../data/models/generated_bill.dart';
import '../../../providers/bills_provider.dart';
import '../../widgets/common/error_retry_view.dart';
import '../../widgets/common/loading_shimmer.dart';
import '../../widgets/common/yesbill_loading_widget.dart';

class BillsScreen extends ConsumerStatefulWidget {
  const BillsScreen({super.key});

  @override
  ConsumerState<BillsScreen> createState() => _BillsScreenState();
}

class _BillsScreenState extends ConsumerState<BillsScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final billsAsync = ref.watch(generatedBillsProvider);

    return RefreshIndicator(
        onRefresh: () async => ref.invalidate(generatedBillsProvider),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Previous Bills',
                    style: AppTextStyles.h1.copyWith(
                      color: Theme.of(context).colorScheme.onSurface,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Theme.of(context).colorScheme.surfaceContainerHighest,
                    border: _billsCardBorder(context),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x0A2D3337),
                        blurRadius: 16,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  alignment: Alignment.center,
                  child: const Icon(
                    LucideIcons.slidersHorizontal,
                    size: 13,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(
                  color: Theme.of(context).colorScheme.outline,
                  width: 0.25,
                ),
              ),
              child: TextField(
                onChanged: (value) => setState(() => _query = value),
                style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
                decoration: InputDecoration(
                  hintText: 'Search subscriptions...',
                  hintStyle:
                      TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                  border: InputBorder.none,
                  prefixIcon: Icon(
                    LucideIcons.search,
                    size: 18,
                    color: Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.8),
                  ),
                  suffixIcon: Container(
                    margin: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color:
                          Theme.of(context).colorScheme.surfaceContainerHigh,
                    ),
                    child: Icon(
                      LucideIcons.chevronRight,
                      size: 14,
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            _GenerateBillPromptCard(
              onTap: () => context.push('/bills/generate'),
            ),
            const SizedBox(height: 16),
            billsAsync.when(
              loading: () => const ShimmerList(count: 1, itemHeight: 110),
              error: (error, _) => ErrorRetryView(
                error: error,
                onRetry: () => ref.invalidate(generatedBillsProvider),
              ),
              data: (bills) => _BillsSummaryCard(bills: bills),
            ),
            const SizedBox(height: 12),
            billsAsync.when(
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
              data: (bills) => _StatusDots(bills: bills),
            ),
            const SizedBox(height: 16),
            billsAsync.when(
              loading: () => const YesBillLoadingWidget(
                label: 'Loading Bills...',
                sublabel: 'Fetching your billing history',
              ),
              error: (error, _) => ErrorRetryView(
                error: error,
                onRetry: () => ref.invalidate(generatedBillsProvider),
              ),
              data: (bills) {
                final query = _query.trim().toLowerCase();
                final filtered = bills.where((bill) {
                  if (query.isEmpty) return true;
                  return bill.yearMonth.toLowerCase().contains(query) ||
                      bill.id.toLowerCase().contains(query);
                }).toList();

                if (filtered.isEmpty) {
                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: _billsCardColor(context),
                      borderRadius: BorderRadius.circular(16),
                      border: _billsCardBorder(context),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x0F2D3337),
                          blurRadius: 24,
                          offset: Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Text(
                      'No generated bills found for your query.',
                      style: AppTextStyles.body.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  );
                }

                final grouped = <String, List<BillListItem>>{};
                for (final bill in filtered) {
                  grouped.putIfAbsent(bill.yearMonth, () => <BillListItem>[]).add(bill);
                }

                final groups = grouped.entries.toList()
                  ..sort((a, b) => b.key.compareTo(a.key));

                return Column(
                  children: groups
                      .asMap()
                      .entries
                      .map(
                        (e) => _MonthSection(
                          monthKey: e.value.key,
                          bills: e.value.value,
                          onMarkPaid: (billId) async {
                            await ref.read(billPaymentProvider.notifier).markPaid(
                                  billId,
                                  paymentMethod: 'manual',
                                );
                          },
                        ).animate(delay: Duration(milliseconds: 60 * e.key))
                            .fadeIn(duration: 280.ms)
                            .slideY(begin: 0.05, end: 0),
                      )
                      .toList(),
                );
              },
            ),
          ],
        ),
    );
  }
}

class _BillsSummaryCard extends StatelessWidget {
  const _BillsSummaryCard({required this.bills});

  final List<BillListItem> bills;

  @override
  Widget build(BuildContext context) {
    final paid = bills.where((bill) => bill.isPaid).toList();
    final totalPaid = paid.fold<double>(0, (sum, bill) => sum + bill.totalAmount);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        border: _billsCardBorder(context),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF312E81),
            Color(0xFF4F46E5),
          ],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'TOTAL PAID THIS YEAR',
            style: AppTextStyles.label.copyWith(
              color: Colors.white.withOpacity(0.82),
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            CurrencyFormatter.formatCompact(totalPaid),
            style: AppTextStyles.h1.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'vs. last year +8.2%',
            style: AppTextStyles.bodySm.copyWith(
              color: Colors.white.withOpacity(0.78),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusDots extends StatelessWidget {
  const _StatusDots({required this.bills});

  final List<BillListItem> bills;

  @override
  Widget build(BuildContext context) {
    final paidCount = bills.where((bill) => bill.isPaid).length;
    final pendingCount = bills.length - paidCount;

    return Row(
      children: [
        Expanded(
          child: _CircleStat(
            color: AppColors.success,
            label: 'Paid',
            value: '$paidCount',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _CircleStat(
            color: AppColors.error,
            label: 'Pending',
            value: '$pendingCount',
          ),
        ),
      ],
    );
  }
}

class _CircleStat extends StatelessWidget {
  const _CircleStat({
    required this.color,
    required this.label,
    required this.value,
  });

  final Color color;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
      decoration: BoxDecoration(
        color: _billsCardColor(context),
        borderRadius: BorderRadius.circular(999),
        border: _billsCardBorder(context),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A2D3337),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 9,
            height: 9,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '$value $label',
              style: AppTextStyles.bodySm.copyWith(
                color: Theme.of(context).colorScheme.onSurface,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MonthSection extends StatelessWidget {
  const _MonthSection({
    required this.monthKey,
    required this.bills,
    required this.onMarkPaid,
  });

  final String monthKey;
  final List<BillListItem> bills;
  final Future<void> Function(String billId) onMarkPaid;

  String _monthHeading(String key) {
    try {
      if (RegExp(r'^\d{4}-\d{2}$').hasMatch(key)) {
        return DateFormat('MMMM yyyy').format(DateTime.parse('$key-01'));
      }
      return DateFormat('MMMM yyyy').format(DateTime.parse(key));
    } catch (_) {
      // Fall back to backend value.
    }
    return key;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 8, top: 8),
          child: Row(
            children: [
              Text(
                _monthHeading(monthKey),
                style: AppTextStyles.h4.copyWith(
                  color: Theme.of(context).colorScheme.onSurface,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () async {
                  final unpaidBills = bills.where((b) => !b.isPaid).toList();
                  if (unpaidBills.isEmpty) {
                    if (!context.mounted) return;
                    context.showSnackBar(
                      'All bills for ${_monthHeading(monthKey)} are already paid.',
                    );
                    return;
                  }
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Text('Mark all as paid?'),
                      content: Text(
                        'Mark ${unpaidBills.length} bill(s) as paid for ${_monthHeading(monthKey)}?',
                      ),
                      actions: [
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () => Navigator.pop(ctx, false),
                                child: const Text('Cancel'),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: FilledButton(
                                onPressed: () => Navigator.pop(ctx, true),
                                child: const Text('Mark Paid'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                  if (confirmed == true && context.mounted) {
                    for (final bill in unpaidBills) {
                      await onMarkPaid(bill.id);
                    }
                  }
                },
                child: Text(
                  'Manage All',
                  style: AppTextStyles.labelSm.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
        ...bills.map((bill) => _BillTile(bill: bill, onMarkPaid: onMarkPaid)),
      ],
    );
  }
}

class _GenerateBillPromptCard extends StatelessWidget {
  const _GenerateBillPromptCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF1E1B4B),
              Color(0xFF4338CA),
            ],
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x1A4338CA),
              blurRadius: 20,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.14),
                borderRadius: BorderRadius.circular(14),
              ),
              alignment: Alignment.center,
              child: const Icon(
                LucideIcons.sparkles,
                color: Colors.white,
                size: 20,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Generate a new bill',
                    style: AppTextStyles.bodyLg.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Create, review, and send bills for your active services.',
                    style: AppTextStyles.bodySm.copyWith(
                      color: Colors.white.withOpacity(0.82),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(
              LucideIcons.chevronRight,
              color: Colors.white,
              size: 18,
            ),
          ],
        ),
      ),
    );
  }
}

class _BillTile extends StatelessWidget {
  const _BillTile({
    required this.bill,
    required this.onMarkPaid,
  });

  final BillListItem bill;
  final Future<void> Function(String billId) onMarkPaid;

  @override
  Widget build(BuildContext context) {
    final statusColor = bill.isPaid ? AppColors.success : AppColors.error;
    final shortName = () {
      try {
        return DateFormat('MMMM yyyy').format(DateTime.parse('${bill.yearMonth}-01')) + ' Bill';
      } catch (_) {
        return 'Bill ${bill.id.substring(0, 6).toUpperCase()}';
      }
    }();

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: _billsCardColor(context),
        borderRadius: BorderRadius.circular(14),
        border: _billsCardBorder(context),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A2D3337),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: ListTile(
        onTap: () => context.push('/bills/${bill.id}'),
        leading: CircleAvatar(
          radius: 18,
          backgroundColor: statusColor.withOpacity(0.16),
          child: Icon(
            bill.isPaid ? LucideIcons.check : LucideIcons.receipt,
            color: statusColor,
            size: 16,
          ),
        ),
        title: Text(
          shortName,
          style: AppTextStyles.bodyLg.copyWith(
            color: Theme.of(context).colorScheme.onSurface,
            fontWeight: FontWeight.w700,
          ),
        ),
        subtitle: Text(
          bill.isPaid ? 'Paid • ${bill.yearMonth}' : 'Pending • ${bill.yearMonth}',
          style: AppTextStyles.bodySm.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        trailing: SizedBox(
          width: 84,
          child: bill.isPaid
              ? Align(
                  alignment: Alignment.centerRight,
                  child: Text(
                    CurrencyFormatter.formatCompact(
                      bill.totalAmount,
                      currency: bill.currency,
                    ),
                    style: AppTextStyles.bodySm.copyWith(
                      color: Theme.of(context).colorScheme.onSurface,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                )
              : OutlinedButton(
                  onPressed: () => onMarkPaid(bill.id),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary, width: 1.5),
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    minimumSize: const Size(72, 32),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    textStyle: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                    backgroundColor: Colors.transparent,
                  ),
                  child: const Text('Mark\nPaid', textAlign: TextAlign.center),
                ),
        ),
      ),
    );
  }
}

  Color _billsCardColor(BuildContext context) =>
    Theme.of(context).brightness == Brightness.dark
      ? AppColors.cardDark
      : Colors.white;

  BoxBorder? _billsCardBorder(BuildContext context) =>
    Theme.of(context).brightness == Brightness.dark
      ? Border.all(color: AppColors.cardDarkBorder)
      : null;
