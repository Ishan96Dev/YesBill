import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../../../core/extensions/context_extensions.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../data/models/generated_bill.dart';
import '../../../providers/bills_provider.dart';
import '../../widgets/common/error_retry_view.dart';
import '../../widgets/common/loading_shimmer.dart';
import '../../widgets/common/yesbill_loading_widget.dart';

enum _BillRoleFilter { all, consumer, provider }

class BillsScreen extends ConsumerStatefulWidget {
  const BillsScreen({super.key});

  @override
  ConsumerState<BillsScreen> createState() => _BillsScreenState();
}

class _BillsScreenState extends ConsumerState<BillsScreen> {
  String _query = '';
  _BillRoleFilter _roleFilter = _BillRoleFilter.all;

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
                    'Bills',
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
            const SizedBox(height: 10),
            _BillFilterTabs(
              selected: _roleFilter,
              onChanged: (v) => setState(() => _roleFilter = v),
            ),
            const SizedBox(height: 16),
            _GenerateBillPromptCard(
              onTap: () => context.push('/bills/generate'),
            ),
            const SizedBox(height: 16),
            billsAsync.when(
              loading: () => const ShimmerList(count: 1, itemHeight: 110),
              error: (_, __) => const SizedBox.shrink(),
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
                final roleFiltered = _roleFilter == _BillRoleFilter.all
                    ? bills
                    : bills.where((bill) {
                        final role =
                            bill.payload['service_role'] as String? ??
                                'consumer';
                        return role == _roleFilter.name;
                      }).toList();

                final query = _query.trim().toLowerCase();
                final filtered = roleFiltered.where((bill) {
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
                      _roleFilter != _BillRoleFilter.all && query.isEmpty
                          ? _roleFilter == _BillRoleFilter.consumer
                              ? 'No consumer bills found.'
                              : 'No invoices found.'
                          : 'No generated bills found for your query.',
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

class _MonthSection extends ConsumerWidget {
  const _MonthSection({
    required this.monthKey,
    required this.bills,
  });

  final String monthKey;
  final List<BillListItem> bills;

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
  Widget build(BuildContext context, WidgetRef ref) {
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
                      await ref
                          .read(billPaymentProvider.notifier)
                          .markPaid(bill.id, paymentMethod: 'cash');
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
        ...bills.map((bill) => _BillTile(bill: bill)),
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

class _BillTile extends ConsumerStatefulWidget {
  const _BillTile({
    required this.bill,
    this.onMarkPaid,
  });

  final BillListItem bill;
  final Future<void> Function(String billId)? onMarkPaid;

  @override
  ConsumerState<_BillTile> createState() => _BillTileState();
}

class _BillTileState extends ConsumerState<_BillTile> {
  bool _exporting = false;
  bool _deleting = false;
  String _paymentMethod = 'cash';
  final _paymentNoteCtrl = TextEditingController();

  @override
  void dispose() {
    _paymentNoteCtrl.dispose();
    super.dispose();
  }

  String get _shortName {
    try {
      return DateFormat('MMMM yyyy').format(
              DateTime.parse('${widget.bill.yearMonth}-01')) +
          ' Bill';
    } catch (_) {
      return 'Bill ${widget.bill.id.substring(0, 6).toUpperCase()}';
    }
  }

  static String _paymentMethodLabel(String method) {
    const labels = {
      'cash': 'Cash',
      'upi': 'UPI',
      'bank_transfer': 'Bank Transfer',
      'credit_card': 'Credit Card',
      'debit_card': 'Debit Card',
      'net_banking': 'Net Banking',
    };
    return labels[method] ?? method;
  }

  Future<void> _markPaidWithDialog(BuildContext context) async {
    _paymentNoteCtrl.clear();
    _paymentMethod = 'cash';
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetCtx) => SafeArea(
        top: false,
        child: StatefulBuilder(
          builder: (ctx, setSheetState) => Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.viewInsetsOf(ctx).bottom,
            ),
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Mark as paid',
                      style: AppTextStyles.h4),
                  const SizedBox(height: 4),
                  Text(
                    CurrencyFormatter.formatCompact(
                      widget.bill.totalAmount,
                      currency: widget.bill.currency,
                    ),
                    style: AppTextStyles.h3.copyWith(
                        color: AppColors.success),
                  ),
                  const SizedBox(height: 14),
                  DropdownButtonFormField<String>(
                    value: _paymentMethod,
                    decoration: const InputDecoration(
                      labelText: 'Payment method',
                    ),
                    items: const [
                      DropdownMenuItem(value: 'cash', child: Text('Cash')),
                      DropdownMenuItem(value: 'upi', child: Text('UPI')),
                      DropdownMenuItem(
                          value: 'bank_transfer',
                          child: Text('Bank Transfer')),
                      DropdownMenuItem(
                          value: 'credit_card',
                          child: Text('Credit Card')),
                      DropdownMenuItem(
                          value: 'debit_card',
                          child: Text('Debit Card')),
                      DropdownMenuItem(
                          value: 'net_banking',
                          child: Text('Net Banking')),
                    ],
                    onChanged: (v) {
                      if (v != null) {
                        setSheetState(() => _paymentMethod = v);
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _paymentNoteCtrl,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Note (optional)',
                      hintText: 'e.g. Paid via GPay',
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      icon: const Icon(LucideIcons.badgeCheck),
                      onPressed: () => Navigator.of(ctx).pop(true),
                      label: const Text('Confirm payment'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(ctx).pop(false),
                      child: const Text('Cancel'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
    if (confirmed != true || !mounted) return;
    final ok = await ref.read(billPaymentProvider.notifier).markPaid(
          widget.bill.id,
          paymentMethod: _paymentMethod,
          paymentNote: _paymentNoteCtrl.text.trim().isEmpty
              ? null
              : _paymentNoteCtrl.text.trim(),
        );
    if (!mounted) return;
    if (ok) {
      context.showSnackBar('Bill marked as paid');
    } else {
      context.showErrorSnackBar('Failed to update bill');
    }
  }

  Future<void> _confirmDelete(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete bill?'),
        content: const Text(
            'This will permanently delete the bill. This action cannot be undone.'),
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
                  style: FilledButton.styleFrom(
                      backgroundColor: AppColors.error),
                  onPressed: () => Navigator.pop(ctx, true),
                  child: const Text('Delete'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _deleting = true);
    final ok =
        await ref.read(billDeleteProvider.notifier).deleteBill(widget.bill.id);
    if (!mounted) return;
    setState(() => _deleting = false);
    if (ok) {
      context.showSnackBar('Bill deleted');
    } else {
      context.showErrorSnackBar('Failed to delete bill');
    }
  }

  Future<void> _exportPdf(BuildContext context) async {
    setState(() => _exporting = true);
    try {
      final bill = widget.bill;
      final monthLabel = () {
        try {
          return DateFormat('MMMM yyyy')
              .format(DateTime.parse('${bill.yearMonth}-01'));
        } catch (_) {
          return bill.yearMonth;
        }
      }();
      final pdfDoc = pw.Document();
      pdfDoc.addPage(pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(40),
        build: (pw.Context ctx) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text(
                bill.billTitle ?? 'YesBill — $monthLabel',
                style: pw.TextStyle(
                    fontSize: 22, fontWeight: pw.FontWeight.bold),
              ),
              pw.SizedBox(height: 4),
              pw.Text(monthLabel,
                  style: const pw.TextStyle(
                      fontSize: 13, color: PdfColors.grey700)),
              pw.SizedBox(height: 16),
              pw.Divider(),
              pw.SizedBox(height: 12),
              ...bill.items.map((item) {
                final row =
                    (item as Map?)?.cast<String, dynamic>() ?? {};
                final name = row['service_name'] as String? ??
                    row['name'] as String? ??
                    row['service'] as String? ??
                    'Service';
                final del = (row['daysDelivered'] as num?)?.toInt();
                final skip = (row['daysSkipped'] as num?)?.toInt();
                final rate = (row['ratePerDay'] as num?)?.toDouble();
                final total = (row['total'] as num?)?.toDouble() ??
                    (row['amount'] as num?)?.toDouble() ??
                    0.0;
                final details = [
                  if (del != null) '$del days delivered',
                  if (skip != null && skip > 0) '$skip skipped',
                  if (rate != null) '₹${rate.toStringAsFixed(2)}/day',
                ].join(' · ');
                return pw.Padding(
                  padding: const pw.EdgeInsets.only(bottom: 8),
                  child: pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Expanded(
                        child: pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Text(name,
                                style: pw.TextStyle(
                                    fontWeight: pw.FontWeight.bold)),
                            if (details.isNotEmpty)
                              pw.Text(details,
                                  style: const pw.TextStyle(
                                      fontSize: 11,
                                      color: PdfColors.grey600)),
                          ],
                        ),
                      ),
                      pw.Text('₹${total.toStringAsFixed(2)}',
                          style: pw.TextStyle(
                              fontWeight: pw.FontWeight.bold)),
                    ],
                  ),
                );
              }),
              pw.Divider(),
              pw.SizedBox(height: 8),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('Total',
                      style: pw.TextStyle(
                          fontSize: 16, fontWeight: pw.FontWeight.bold)),
                  pw.Text(
                      '₹${bill.totalAmount.toStringAsFixed(2)}',
                      style: pw.TextStyle(
                          fontSize: 16,
                          fontWeight: pw.FontWeight.bold)),
                ],
              ),
              if (bill.isPaid && bill.paidAt != null) ...[
                pw.SizedBox(height: 8),
                pw.Text(
                  'Paid on ${DateFormat('d MMMM yyyy').format(bill.paidAt!)}',
                  style: const pw.TextStyle(color: PdfColors.green700),
                ),
              ],
              pw.SizedBox(height: 24),
              pw.Text(
                bill.aiModelUsed != null
                    ? 'Generated by YesBill AI'
                    : 'Generated by YesBill',
                style: const pw.TextStyle(
                    fontSize: 10, color: PdfColors.grey500)),
            ],
          );
        },
      ));
      final bytes = await pdfDoc.save();
      final filename = 'yesbill_${bill.yearMonth.replaceAll('-', '_')}.pdf';
      if (mounted) {
        await Printing.sharePdf(bytes: bytes, filename: filename);
      }
    } catch (e) {
      if (mounted) context.showErrorSnackBar('Failed to generate PDF');
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bill = widget.bill;
    final statusColor = bill.isPaid ? AppColors.success : AppColors.error;
    final title = bill.billTitle ?? _shortName;
    final hasAiModel = bill.aiModelUsed != null && bill.aiModelUsed!.isNotEmpty;
    final isDbGenerated =
        bill.triggerType == 'manual_db' || bill.triggerType == 'db';
    final paidDateStr = bill.paidAt != null
        ? DateFormat('d MMM yyyy').format(bill.paidAt!)
        : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
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
      child: InkWell(
        onTap: () => context.push('/bills/${bill.id}'),
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Top row: icon + title + amount ──
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: statusColor.withOpacity(0.16),
                    child: Icon(
                      bill.isPaid ? LucideIcons.check : LucideIcons.receipt,
                      color: statusColor,
                      size: 16,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: AppTextStyles.bodyLg.copyWith(
                            color: Theme.of(context).colorScheme.onSurface,
                            fontWeight: FontWeight.w700,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          bill.isPaid
                              ? 'Paid${paidDateStr != null ? ' · $paidDateStr' : ''}'
                              : 'Pending · ${bill.yearMonth}',
                          style: AppTextStyles.bodySm.copyWith(
                            color: statusColor,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    CurrencyFormatter.formatCompact(
                      bill.totalAmount,
                      currency: bill.currency,
                    ),
                    style: AppTextStyles.bodyLg.copyWith(
                      color: Theme.of(context).colorScheme.onSurface,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              // ── Tags row ──
              if (hasAiModel || bill.autoGenerated || isDbGenerated) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    if (hasAiModel)
                      _SmallChip(
                        label: bill.aiModelUsed!.split('/').last,
                        color: const Color(0xFF8B5CF6),
                        icon: LucideIcons.sparkles,
                      ),
                    if (isDbGenerated)
                      const _SmallChip(
                        label: 'YesBill Generated',
                        color: Color(0xFF0EA5E9),
                        icon: LucideIcons.database,
                      ),
                    if (bill.autoGenerated)
                      const _SmallChip(
                        label: 'Auto',
                        color: AppColors.primary,
                        icon: LucideIcons.zap,
                      ),
                  ],
                ),
              ],
              // ── Actions row ──
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (!bill.isPaid) ...[
                    SizedBox(
                      height: 28,
                      child: FilledButton.icon(
                        onPressed: () => _markPaidWithDialog(context),
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.success,
                          padding:
                              const EdgeInsets.symmetric(horizontal: 10),
                          minimumSize: const Size(0, 28),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          textStyle: const TextStyle(
                              fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                        icon: const Icon(LucideIcons.badgeCheck, size: 14),
                        label: const Text('Mark Paid'),
                      ),
                    ),
                    const SizedBox(width: 6),
                  ],
                  // Export PDF
                  SizedBox(
                    width: 28,
                    height: 28,
                    child: _exporting
                        ? const Padding(
                            padding: EdgeInsets.all(6),
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : IconButton.outlined(
                            padding: EdgeInsets.zero,
                            iconSize: 14,
                            style: IconButton.styleFrom(
                              minimumSize: const Size(28, 28),
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            onPressed: () => _exportPdf(context),
                            icon: const Icon(LucideIcons.fileText),
                            tooltip: 'Export PDF',
                          ),
                  ),
                  const SizedBox(width: 4),
                  // Delete
                  SizedBox(
                    width: 28,
                    height: 28,
                    child: _deleting
                        ? const Padding(
                            padding: EdgeInsets.all(6),
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.error,
                            ),
                          )
                        : IconButton.outlined(
                            padding: EdgeInsets.zero,
                            iconSize: 14,
                            style: IconButton.styleFrom(
                              minimumSize: const Size(28, 28),
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              foregroundColor: AppColors.error,
                            ),
                            onPressed: () => _confirmDelete(context),
                            icon: const Icon(LucideIcons.trash2),
                            tooltip: 'Delete',
                          ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SmallChip extends StatelessWidget {
  const _SmallChip(
      {required this.label, required this.color, required this.icon});
  final String label;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.14),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: color.withOpacity(0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: AppTextStyles.labelSm.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
              fontSize: 10,
            ),
          ),
        ],
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

// ─── Filter Tabs ────────────────────────────────────────────────────────────

class _BillFilterTabs extends StatelessWidget {
  const _BillFilterTabs({
    required this.selected,
    required this.onChanged,
  });

  final _BillRoleFilter selected;
  final ValueChanged<_BillRoleFilter> onChanged;

  static const _labels = {
    _BillRoleFilter.all: 'All',
    _BillRoleFilter.consumer: 'My Bills',
    _BillRoleFilter.provider: 'Invoices',
  };

  static const _icons = {
    _BillRoleFilter.all: LucideIcons.layoutList,
    _BillRoleFilter.consumer: LucideIcons.wallet,
    _BillRoleFilter.provider: LucideIcons.briefcase,
  };

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 38,
      child: ListView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        children: _BillRoleFilter.values.map((filter) {
          final isSelected = selected == filter;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => onChanged(filter),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppColors.primary
                      : Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(
                    color: isSelected
                        ? AppColors.primary
                        : Theme.of(context).colorScheme.outline.withValues(alpha: 0.4),
                    width: isSelected ? 1.5 : 0.5,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _icons[filter]!,
                      size: 13,
                      color: isSelected
                          ? Colors.white
                          : Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      _labels[filter]!,
                      style: AppTextStyles.labelSm.copyWith(
                        color: isSelected
                            ? Colors.white
                            : Theme.of(context).colorScheme.onSurfaceVariant,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
