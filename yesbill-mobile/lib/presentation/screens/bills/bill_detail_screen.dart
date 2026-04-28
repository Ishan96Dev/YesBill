import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/extensions/context_extensions.dart';
import '../../../core/extensions/date_extensions.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../data/models/generated_bill.dart';
import '../../../providers/bills_provider.dart';
import '../../widgets/common/app_dropdown.dart';
import '../../widgets/common/error_retry_view.dart';
import '../../widgets/common/loading_shimmer.dart';

class BillDetailScreen extends ConsumerStatefulWidget {
  const BillDetailScreen({super.key, required this.billId});
  final String billId;

  @override
  ConsumerState<BillDetailScreen> createState() => _BillDetailScreenState();
}

class _BillDetailScreenState extends ConsumerState<BillDetailScreen> {
  String _paymentMethod = 'cash';
  final _paymentNoteCtrl = TextEditingController();

  @override
  void dispose() {
    _paymentNoteCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final billAsync = ref.watch(billDetailProvider(widget.billId));
    final paymentState = ref.watch(billPaymentProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Bill details')),
      body: billAsync.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.base),
          child: ShimmerList(count: 6, itemHeight: 82),
        ),
        error: (error, _) => ErrorRetryView(
          error: error,
          onRetry: () => ref.invalidate(billDetailProvider(widget.billId)),
        ),
        data: (bill) {
          final month = bill.yearMonth.toYearMonthDate();
          return ListView(
            padding: const EdgeInsets.fromLTRB(AppSpacing.base, AppSpacing.base, AppSpacing.base, 120),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.base),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(month.toMonthYearDisplay(), style: AppTextStyles.h3),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        CurrencyFormatter.formatCompact(
                          bill.totalAmount,
                          currency: bill.currency,
                        ),
                        style: AppTextStyles.h2,
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      _StatusPill(isPaid: bill.isPaid),
                      if (bill.aiModelUsed != null) ...[
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          'AI model: ${bill.aiModelUsed}',
                          style: AppTextStyles.bodySm,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              if (bill.summary.trim().isNotEmpty)
                _SectionCard(
                  title: 'Summary',
                  child: Text(bill.summary, style: AppTextStyles.bodySm),
                ),
              if (bill.recommendations.trim().isNotEmpty) ...[
                const SizedBox(height: AppSpacing.sm),
                _SectionCard(
                  title: 'Recommendations',
                  child: Text(bill.recommendations, style: AppTextStyles.bodySm),
                ),
              ],
              const SizedBox(height: AppSpacing.sm),
              _LineItemsSection(bill: bill),
              const SizedBox(height: AppSpacing.base),
              if (!bill.isPaid)
                FilledButton.icon(
                  onPressed: paymentState.isLoading
                      ? null
                      : () => _markPaid(context, bill),
                  icon: paymentState.isLoading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(LucideIcons.badgeCheck),
                  label: const Text('Mark as paid'),
                ),
              if (bill.isPaid)
                OutlinedButton.icon(
                  onPressed: () => context.go('/bills'),
                  icon: const Icon(LucideIcons.arrowLeft),
                  label: const Text('Back to bills'),
                ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _markPaid(BuildContext context, GeneratedBill bill) async {
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(AppSpacing.base),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Payment method', style: AppTextStyles.h4),
              const SizedBox(height: AppSpacing.sm),
              AppDropdown<String>(
                label: 'Payment method',
                value: _paymentMethod,
                items: const [
                  AppDropdownItem(value: 'cash', label: 'Cash'),
                  AppDropdownItem(value: 'upi', label: 'UPI'),
                  AppDropdownItem(value: 'bank_transfer', label: 'Bank Transfer'),
                  AppDropdownItem(value: 'credit_card', label: 'Credit Card'),
                  AppDropdownItem(value: 'debit_card', label: 'Debit Card'),
                  AppDropdownItem(value: 'net_banking', label: 'Net Banking'),
                ],
                onChanged: (value) {
                  if (value != null) setState(() => _paymentMethod = value);
                },
              ),
              const SizedBox(height: AppSpacing.sm),
              TextFormField(
                controller: _paymentNoteCtrl,
                maxLines: 2,
                decoration: const InputDecoration(labelText: 'Note (optional)'),
              ),
              const SizedBox(height: AppSpacing.base),
              FilledButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: const Text('Confirm payment'),
              ),
            ],
          ),
        );
      },
    );

    if (confirmed != true) return;
    final ok = await ref.read(billPaymentProvider.notifier).markPaid(
          bill.id,
          paymentMethod: _paymentMethod,
          paymentNote:
              _paymentNoteCtrl.text.trim().isEmpty ? null : _paymentNoteCtrl.text.trim(),
        );

    if (!mounted) return;
    if (ok) {
      context.showSnackBar('Bill marked as paid');
    } else {
      context.showErrorSnackBar('Failed to update bill');
    }
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.isPaid});

  final bool isPaid;

  @override
  Widget build(BuildContext context) {
    final color = isPaid ? Colors.green : Colors.orange;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        isPaid ? 'Paid' : 'Pending payment',
        style: AppTextStyles.labelSm.copyWith(color: color),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.base),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: AppTextStyles.h4),
            const SizedBox(height: AppSpacing.sm),
            child,
          ],
        ),
      ),
    );
  }
}

class _LineItemsSection extends StatelessWidget {
  const _LineItemsSection({required this.bill});

  final GeneratedBill bill;

  @override
  Widget build(BuildContext context) {
    final items = bill.items;

    return _SectionCard(
      title: 'Items',
      child: items.isEmpty
          ? const Text('No line items available for this bill.')
          : Column(
              children: items.map((item) {
                final row = (item as Map?)?.cast<String, dynamic>() ?? const <String, dynamic>{};
                final title = row['service_name'] as String? ?? row['name'] as String? ?? 'Service';
                final quantity = row['quantity'];
                final unitPrice = (row['unit_price'] as num?)?.toDouble();
                final total = (row['total'] as num?)?.toDouble() ??
                    (row['amount'] as num?)?.toDouble() ??
                    0;

                return Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(LucideIcons.dot, size: 18),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(title, style: AppTextStyles.bodySm.copyWith(fontWeight: FontWeight.w600)),
                            if (quantity != null || unitPrice != null)
                              Text(
                                '${quantity ?? '-'} × ${unitPrice != null ? CurrencyFormatter.formatCompact(unitPrice, currency: bill.currency) : '-'}',
                                style: AppTextStyles.label,
                              ),
                          ],
                        ),
                      ),
                      Text(
                        CurrencyFormatter.formatCompact(total, currency: bill.currency),
                        style: AppTextStyles.bodySm.copyWith(fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
    );
  }
}
