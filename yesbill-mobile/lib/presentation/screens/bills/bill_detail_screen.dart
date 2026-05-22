import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/extensions/context_extensions.dart';
import '../../../core/extensions/date_extensions.dart';
import '../../../core/theme/app_colors.dart';
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
  bool _exporting = false;

  @override
  void dispose() {
    _paymentNoteCtrl.dispose();
    super.dispose();
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

  static String _monthLabel(String yearMonth) {
    try {
      return DateFormat('MMMM yyyy').format(DateTime.parse('$yearMonth-01'));
    } catch (_) {
      return yearMonth;
    }
  }

  @override
  Widget build(BuildContext context) {
    final billAsync = ref.watch(billDetailProvider(widget.billId));
    final paymentState = ref.watch(billPaymentProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bill details'),
        actions: [
          if (billAsync.hasValue)
            _exporting
                ? const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12),
                    child: SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : PopupMenuButton<String>(
                    icon: const Icon(LucideIcons.share2, size: 20),
                    tooltip: 'Export',
                    onSelected: (val) {
                      if (val == 'pdf') {
                        _exportPdf(billAsync.value!);
                      } else {
                        _shareText(billAsync.value!);
                      }
                    },
                    itemBuilder: (_) => const [
                      PopupMenuItem(
                        value: 'pdf',
                        child: Row(
                          children: [
                            Icon(LucideIcons.fileText, size: 16),
                            SizedBox(width: 8),
                            Text('Export as PDF'),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        value: 'text',
                        child: Row(
                          children: [
                            Icon(LucideIcons.messageSquare, size: 16),
                            SizedBox(width: 8),
                            Text('Share as text'),
                          ],
                        ),
                      ),
                    ],
                  ),
        ],
      ),
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
          final items = bill.items;
          final totalDelivered = items.fold<int>(0, (s, item) {
            final row = (item as Map?)?.cast<String, dynamic>() ?? {};
            return s + ((row['daysDelivered'] as num?)?.toInt() ?? 0);
          });
          final totalSkipped = items.fold<int>(0, (s, item) {
            final row = (item as Map?)?.cast<String, dynamic>() ?? {};
            return s + ((row['daysSkipped'] as num?)?.toInt() ?? 0);
          });
          final daysTracked = totalDelivered + totalSkipped;
          final servicesCount =
              items.isNotEmpty ? items.length : bill.serviceIds.length;
          final maxPossible = items.fold<double>(0.0, (s, item) {
            final row = (item as Map?)?.cast<String, dynamic>() ?? {};
            final rate = (row['ratePerDay'] as num?)?.toDouble() ?? 0.0;
            final total = (row['total'] as num?)?.toDouble() ??
                (row['amount'] as num?)?.toDouble() ?? 0.0;
            final del = (row['daysDelivered'] as num?)?.toInt() ?? 0;
            final skip = (row['daysSkipped'] as num?)?.toInt() ?? 0;
            return s + (rate > 0 ? rate * (del + skip) : total);
          });
          final saved =
              maxPossible > bill.totalAmount ? maxPossible - bill.totalAmount : 0.0;

          return ListView(
            padding: const EdgeInsets.fromLTRB(
                AppSpacing.base, AppSpacing.base, AppSpacing.base, 120),
            children: [
              _HeaderCard(bill: bill, month: month),
              const SizedBox(height: AppSpacing.sm),
              if (daysTracked > 0 || servicesCount > 0) ...[
                _StatsRow(
                  deliveryRate: bill.deliveryRate,
                  daysTracked: daysTracked,
                  servicesCount: servicesCount,
                  saved: saved,
                  currency: bill.currency,
                ),
                const SizedBox(height: AppSpacing.sm),
              ],
              if (bill.summary.trim().isNotEmpty) ...[
                _SectionCard(
                  title: 'AI Summary',
                  icon: LucideIcons.sparkles,
                  child: Text(bill.summary, style: AppTextStyles.bodySm),
                ),
                const SizedBox(height: AppSpacing.sm),
              ],
              _LineItemsSection(bill: bill),
              const SizedBox(height: AppSpacing.sm),
              if (bill.recommendations.trim().isNotEmpty) ...[
                _SectionCard(
                  title: 'Recommendations',
                  icon: LucideIcons.lightbulb,
                  child: Text(bill.recommendations, style: AppTextStyles.bodySm),
                ),
                const SizedBox(height: AppSpacing.sm),
              ],
              if ((bill.customNote ?? '').trim().isNotEmpty) ...[
                _SectionCard(
                  title: 'Note',
                  icon: LucideIcons.stickyNote,
                  child: Text(bill.customNote!, style: AppTextStyles.bodySm),
                ),
                const SizedBox(height: AppSpacing.sm),
              ],
              if (bill.isPaid && bill.paidAt != null) ...[
                _SectionCard(
                  title: 'Payment info',
                  icon: LucideIcons.badgeCheck,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _InfoRow(
                        label: 'Paid on',
                        value: DateFormat('d MMM yyyy').format(bill.paidAt!),
                      ),
                      if (bill.paymentMethod != null)
                        _InfoRow(
                          label: 'Method',
                          value: _paymentMethodLabel(bill.paymentMethod!),
                        ),
                      if ((bill.paymentNote ?? '').trim().isNotEmpty)
                        _InfoRow(label: 'Note', value: bill.paymentNote!),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
              ],
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
      isScrollControlled: true,
      showDragHandle: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetCtx) {
        return SafeArea(
          top: false,
          child: StatefulBuilder(
          builder: (ctx, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.viewInsetsOf(ctx).bottom,
              ),
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(
                    AppSpacing.base, 0, AppSpacing.base, AppSpacing.base),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Mark as paid', style: AppTextStyles.h4),
                      const SizedBox(height: 4),
                      Text(
                        CurrencyFormatter.formatCompact(
                          bill.totalAmount,
                          currency: bill.currency,
                        ),
                        style: AppTextStyles.h3
                            .copyWith(color: AppColors.success),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      AppDropdown<String>(
                        label: 'Payment method',
                        value: _paymentMethod,
                        items: const [
                          AppDropdownItem(value: 'cash', label: 'Cash'),
                          AppDropdownItem(value: 'upi', label: 'UPI'),
                          AppDropdownItem(
                              value: 'bank_transfer',
                              label: 'Bank Transfer'),
                          AppDropdownItem(
                              value: 'credit_card', label: 'Credit Card'),
                          AppDropdownItem(
                              value: 'debit_card', label: 'Debit Card'),
                          AppDropdownItem(
                              value: 'net_banking', label: 'Net Banking'),
                        ],
                        onChanged: (value) {
                          if (value != null) {
                            setSheetState(() => _paymentMethod = value);
                          }
                        },
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      TextFormField(
                        controller: _paymentNoteCtrl,
                        maxLines: 2,
                        decoration: const InputDecoration(
                          labelText: 'Note (optional)',
                          hintText: 'e.g. Paid via GPay',
                        ),
                      ),
                      const SizedBox(height: AppSpacing.base),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          icon: const Icon(LucideIcons.badgeCheck),
                          onPressed: () => Navigator.of(ctx).pop(true),
                          label: const Text('Confirm payment'),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          onPressed: () => Navigator.of(ctx).pop(false),
                          child: const Text('Cancel'),
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                  ),
                ),
              );
          },
        ),
        );
      },
    );

    if (confirmed != true) return;
    final ok = await ref.read(billPaymentProvider.notifier).markPaid(
          bill.id,
          paymentMethod: _paymentMethod,
          paymentNote: _paymentNoteCtrl.text.trim().isEmpty
              ? null
              : _paymentNoteCtrl.text.trim(),
        );

    if (!mounted) return;
    if (ok) {
      ref.invalidate(billDetailProvider(widget.billId));
      context.showSnackBar('Bill marked as paid ✓');
    } else {
      context.showErrorSnackBar('Failed to update bill');
    }
  }

  Future<void> _exportPdf(GeneratedBill bill) async {
    setState(() => _exporting = true);
    try {
      final pdfDoc = pw.Document();
      final monthLabel = _monthLabel(bill.yearMonth);
      const primary = PdfColor.fromInt(0xFF4F46E5);
      const primaryLight = PdfColor.fromInt(0x1A4F46E5);
      const success = PdfColor.fromInt(0xFF10B981);
      const successLight = PdfColor.fromInt(0x1A10B981);
      const white = PdfColors.white;

      pdfDoc.addPage(pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(0),
        build: (pw.Context ctx) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // ── Header gradient card ──────────────────────────────
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.fromLTRB(32, 28, 32, 28),
                decoration: const pw.BoxDecoration(
                  color: primary,
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    // Logo row
                    pw.Row(
                      children: [
                        pw.Container(
                          padding: const pw.EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: pw.BoxDecoration(
                            color: white.shade(0.15),
                            borderRadius: pw.BorderRadius.circular(6),
                          ),
                          child: pw.Text(
                            'YesBill',
                            style: pw.TextStyle(
                              fontSize: 14,
                              fontWeight: pw.FontWeight.bold,
                              color: white,
                            ),
                          ),
                        ),
                        pw.SizedBox(width: 8),
                        pw.Text(
                          'AI-Powered Bill',
                          style: pw.TextStyle(
                              fontSize: 11,
                              color: white.shade(0.75)),
                        ),
                      ],
                    ),
                    pw.SizedBox(height: 16),
                    pw.Text(
                      bill.billTitle ?? 'YesBill — $monthLabel',
                      style: pw.TextStyle(
                          fontSize: 22,
                          fontWeight: pw.FontWeight.bold,
                          color: white),
                    ),
                    pw.SizedBox(height: 4),
                    pw.Text(
                      monthLabel,
                      style: pw.TextStyle(
                          fontSize: 13, color: white.shade(0.75)),
                    ),
                    pw.SizedBox(height: 16),
                    // Amount + status row
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Text('Total Amount',
                                style: pw.TextStyle(
                                    fontSize: 10, color: white.shade(0.75))),
                            pw.Text(
                              '₹${bill.totalAmount.toStringAsFixed(2)}',
                              style: pw.TextStyle(
                                  fontSize: 28,
                                  fontWeight: pw.FontWeight.bold,
                                  color: white),
                            ),
                          ],
                        ),
                        pw.Container(
                          padding: const pw.EdgeInsets.symmetric(
                              horizontal: 14, vertical: 6),
                          decoration: pw.BoxDecoration(
                            color: bill.isPaid
                                ? const PdfColor.fromInt(0xFF10B981)
                                : const PdfColor.fromInt(0xFFF59E0B),
                            borderRadius: pw.BorderRadius.circular(20),
                          ),
                          child: pw.Text(
                            bill.isPaid ? '✓ Paid' : '⏳ Pending',
                            style: pw.TextStyle(
                                fontSize: 12,
                                fontWeight: pw.FontWeight.bold,
                                color: white),
                          ),
                        ),
                      ],
                    ),
                    if (bill.isPaid && bill.paidAt != null) ...[
                      pw.SizedBox(height: 8),
                      pw.Text(
                        'Paid on ${DateFormat('d MMMM yyyy').format(bill.paidAt!)}${bill.paymentMethod != null ? ' via ${_paymentMethodLabel(bill.paymentMethod!)}' : ''}',
                        style: pw.TextStyle(
                            fontSize: 10, color: white.shade(0.85)),
                      ),
                    ],
                  ],
                ),
              ),

              // ── Body ─────────────────────────────────────────────
              pw.Padding(
                padding: const pw.EdgeInsets.fromLTRB(32, 24, 32, 32),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    // Stats row
                    if (bill.items.isNotEmpty) ...[
                      pw.Row(
                        children: [
                          _pdfStatBox('Days Tracked',
                              '${bill.items.fold<int>(0, (s, i) { final row = (i as Map?)?.cast<String,dynamic>() ?? {}; return s + ((row['daysDelivered'] as num?)?.toInt() ?? 0) + ((row['daysSkipped'] as num?)?.toInt() ?? 0); })}',
                              const PdfColor.fromInt(0xFF3B82F6)),
                          pw.SizedBox(width: 8),
                          _pdfStatBox('Services',
                              '${bill.items.length}',
                              const PdfColor.fromInt(0xFF8B5CF6)),
                          pw.SizedBox(width: 8),
                          _pdfStatBox('Generated',
                              DateFormat('d MMM yy').format(bill.createdAt ?? DateTime.now()),
                              primary),
                        ],
                      ),
                      pw.SizedBox(height: 20),
                    ],

                    // AI Summary
                    if (bill.summary.trim().isNotEmpty) ...[
                      pw.Container(
                        width: double.infinity,
                        padding: const pw.EdgeInsets.all(14),
                        decoration: pw.BoxDecoration(
                          color: const PdfColor.fromInt(0xFFEEF2FF),
                          borderRadius: pw.BorderRadius.circular(10),
                          border: pw.Border(
                            left: pw.BorderSide(color: primary, width: 3),
                          ),
                        ),
                        child: pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Text('AI Summary',
                                style: pw.TextStyle(
                                    fontSize: 11,
                                    fontWeight: pw.FontWeight.bold,
                                    color: primary)),
                            pw.SizedBox(height: 4),
                            pw.Text(bill.summary,
                                style: const pw.TextStyle(
                                    fontSize: 10, color: PdfColors.grey800)),
                          ],
                        ),
                      ),
                      pw.SizedBox(height: 20),
                    ],

                    // Itemized breakdown
                    pw.Text('Itemized Breakdown',
                        style: pw.TextStyle(
                            fontSize: 14, fontWeight: pw.FontWeight.bold)),
                    pw.SizedBox(height: 10),
                    ...bill.items.asMap().entries.map((entry) {
                      final isEven = entry.key.isEven;
                      final item = entry.value;
                      final row =
                          (item as Map?)?.cast<String, dynamic>() ?? {};
                      final name = row['service_name'] as String? ??
                          row['name'] as String? ??
                          row['service'] as String? ??
                          'Service';
                      final del =
                          (row['daysDelivered'] as num?)?.toInt();
                      final skip =
                          (row['daysSkipped'] as num?)?.toInt();
                      final rate =
                          (row['ratePerDay'] as num?)?.toDouble();
                      final total =
                          (row['total'] as num?)?.toDouble() ??
                              (row['amount'] as num?)?.toDouble() ??
                              0.0;
                      final details = [
                        if (del != null) '$del delivered',
                        if (skip != null && skip > 0) '$skip skipped',
                        if (rate != null)
                          '₹${rate.toStringAsFixed(2)}/day',
                      ].join(' · ');
                      return pw.Container(
                        margin: const pw.EdgeInsets.only(bottom: 6),
                        padding: const pw.EdgeInsets.symmetric(
                            horizontal: 12, vertical: 10),
                        decoration: pw.BoxDecoration(
                          color: isEven
                              ? const PdfColor.fromInt(0xFFF8F9FF)
                              : PdfColors.white,
                          borderRadius: pw.BorderRadius.circular(8),
                          border: pw.Border.all(
                            color: const PdfColor.fromInt(0xFFE5E7EB),
                            width: 0.5,
                          ),
                        ),
                        child: pw.Row(
                          children: [
                            pw.Expanded(
                              child: pw.Column(
                                crossAxisAlignment:
                                    pw.CrossAxisAlignment.start,
                                children: [
                                  pw.Text(name,
                                      style: pw.TextStyle(
                                          fontWeight:
                                              pw.FontWeight.bold,
                                          fontSize: 11)),
                                  if (details.isNotEmpty)
                                    pw.Text(details,
                                        style: const pw.TextStyle(
                                            fontSize: 9,
                                            color: PdfColors.grey600)),
                                ],
                              ),
                            ),
                            pw.Container(
                              padding: const pw.EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 4),
                              decoration: pw.BoxDecoration(
                                color: primaryLight,
                                borderRadius:
                                    pw.BorderRadius.circular(6),
                              ),
                              child: pw.Text(
                                '₹${total.toStringAsFixed(2)}',
                                style: pw.TextStyle(
                                    fontWeight: pw.FontWeight.bold,
                                    fontSize: 11,
                                    color: primary),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),

                    pw.SizedBox(height: 12),
                    // Total row
                    pw.Container(
                      width: double.infinity,
                      padding: const pw.EdgeInsets.symmetric(
                          horizontal: 16, vertical: 14),
                      decoration: pw.BoxDecoration(
                        color: primary,
                        borderRadius: pw.BorderRadius.circular(10),
                      ),
                      child: pw.Row(
                        mainAxisAlignment:
                            pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text('Total Amount',
                              style: pw.TextStyle(
                                  fontSize: 14,
                                  fontWeight: pw.FontWeight.bold,
                                  color: white)),
                          pw.Text(
                            '₹${bill.totalAmount.toStringAsFixed(2)}',
                            style: pw.TextStyle(
                                fontSize: 16,
                                fontWeight: pw.FontWeight.bold,
                                color: white),
                          ),
                        ],
                      ),
                    ),

                    pw.SizedBox(height: 24),
                    // Footer
                    pw.Divider(color: PdfColors.grey300),
                    pw.SizedBox(height: 8),
                    pw.Row(
                      mainAxisAlignment:
                          pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text('Generated by YesBill AI',
                            style: const pw.TextStyle(
                                fontSize: 9, color: PdfColors.grey500)),
                        pw.Text(
                            DateFormat('d MMMM yyyy')
                                .format(DateTime.now()),
                            style: const pw.TextStyle(
                                fontSize: 9, color: PdfColors.grey500)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ));

      final bytes = await pdfDoc.save();
      final filename =
          'yesbill_${bill.yearMonth.replaceAll('-', '_')}.pdf';
      if (mounted) {
        await Printing.sharePdf(bytes: bytes, filename: filename);
      }
    } catch (e) {
      if (mounted) context.showErrorSnackBar('Failed to generate PDF');
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  static pw.Widget _pdfStatBox(String label, String value, PdfColor color) {
    return pw.Expanded(
      child: pw.Container(
        padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: pw.BoxDecoration(
          color: color.shade(0.1),
          borderRadius: pw.BorderRadius.circular(8),
          border: pw.Border.all(color: color.shade(0.3), width: 0.5),
        ),
        child: pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text(value,
                style: pw.TextStyle(
                    fontSize: 16,
                    fontWeight: pw.FontWeight.bold,
                    color: color)),
            pw.SizedBox(height: 2),
            pw.Text(label,
                style: pw.TextStyle(fontSize: 9, color: color.shade(0.7))),
          ],
        ),
      ),
    );
  }

  Future<void> _shareText(GeneratedBill bill) async {
    final monthLabel = _monthLabel(bill.yearMonth);
    final sb = StringBuffer();
    sb.writeln('*${bill.billTitle ?? 'YesBill — $monthLabel'}*');
    sb.writeln('📅 Period: $monthLabel');
    sb.writeln('💰 Amount: ${CurrencyFormatter.formatCompact(bill.totalAmount, currency: bill.currency)}');
    sb.writeln('📌 Status: ${bill.isPaid ? '✅ Paid' : '⏳ Pending'}');
    if (bill.isPaid && bill.paidAt != null) {
      sb.writeln(
          '   Paid on ${DateFormat('d MMMM yyyy').format(bill.paidAt!)}${bill.paymentMethod != null ? ' via ${_paymentMethodLabel(bill.paymentMethod!)}' : ''}');
    }

    if (bill.items.isNotEmpty) {
      // Aggregate stats
      int totalDelivered = 0;
      int totalSkipped = 0;
      for (final item in bill.items) {
        final row = (item as Map?)?.cast<String, dynamic>() ?? {};
        totalDelivered += (row['daysDelivered'] as num?)?.toInt() ?? 0;
        totalSkipped += (row['daysSkipped'] as num?)?.toInt() ?? 0;
      }
      final totalDays = totalDelivered + totalSkipped;
      final rate = totalDays > 0
          ? (totalDelivered / totalDays * 100).toStringAsFixed(0)
          : '—';
      sb.writeln('\n📊 *Overall Stats*');
      sb.writeln('• Delivery rate: $rate%');
      sb.writeln('• Days tracked: $totalDays ($totalDelivered delivered, $totalSkipped skipped)');
      sb.writeln('• Services: ${bill.items.length}');

      sb.writeln('\n📋 *Service Breakdown*');
      for (final item in bill.items) {
        final row = (item as Map?)?.cast<String, dynamic>() ?? {};
        final name = row['service_name'] as String? ??
            row['name'] as String? ??
            row['service'] as String? ??
            'Service';
        final total = (row['total'] as num?)?.toDouble() ??
            (row['amount'] as num?)?.toDouble() ??
            0.0;
        final del = (row['daysDelivered'] as num?)?.toInt();
        final skip = (row['daysSkipped'] as num?)?.toInt();
        final ratePerDay = (row['ratePerDay'] as num?)?.toDouble();
        sb.write('• $name: ${CurrencyFormatter.formatCompact(total, currency: bill.currency)}');
        if (del != null) sb.write(' ($del delivered');
        if (skip != null && skip > 0) sb.write(', $skip skipped');
        if (del != null) sb.write(')');
        if (ratePerDay != null)
          sb.write(' @ ₹${ratePerDay.toStringAsFixed(2)}/day');
        sb.writeln();
      }
    }

    if (bill.summary.trim().isNotEmpty) {
      sb.writeln('\n🤖 *AI Summary*');
      sb.writeln(bill.summary.trim());
    }

    if (bill.recommendations.isNotEmpty) {
      sb.writeln('\n💡 *Recommendations*');
      sb.writeln('• ${bill.recommendations}');
    }

    sb.writeln('\n_Generated by YesBill AI_');
    await Share.share(sb.toString(),
        subject: bill.billTitle ?? 'YesBill — $monthLabel');
  }
}

// ── Header card ──────────────────────────────────────────────────────────────

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.bill, required this.month});

  final GeneratedBill bill;
  final DateTime month;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.base),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? const [Color(0xFF1E1B4B), Color(0xFF2D2A6A)]
              : const [Color(0xFF4F46E5), Color(0xFF7C3AED)],
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.25),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            bill.billTitle ?? '${DateFormat('MMMM yyyy').format(month)} Bill',
            style: AppTextStyles.h3.copyWith(color: Colors.white),
          ),
          const SizedBox(height: 4),
          Text(
            DateFormat('MMMM yyyy').format(month),
            style: AppTextStyles.bodySm
                .copyWith(color: Colors.white.withOpacity(0.75)),
          ),
          const SizedBox(height: AppSpacing.base),
          Text(
            CurrencyFormatter.formatCompact(
              bill.totalAmount,
              currency: bill.currency,
            ),
            style: AppTextStyles.h1.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              _BillChip(
                label: bill.isPaid ? 'Paid' : 'Pending',
                color: bill.isPaid ? AppColors.success : AppColors.warning,
              ),
              if (bill.autoGenerated)
                const _BillChip(
                    label: 'Auto-generated', color: AppColors.primary),
              if (bill.aiModelUsed != null)
                _BillChip(
                  label: bill.aiModelUsed!,
                  color: const Color(0xFF8B5CF6),
                  icon: LucideIcons.sparkles,
                ),
              if (bill.triggerType == 'db' ||
                  bill.triggerType == 'manual_db')
                const _BillChip(
                    label: 'YesBill Generated',
                    color: Color(0xFF0EA5E9)),
            ],
          ),
          if (bill.isPaid && bill.paidAt != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                const Icon(LucideIcons.badgeCheck,
                    size: 14, color: Colors.white70),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    'Paid on ${DateFormat('d MMM yyyy').format(bill.paidAt!)}${bill.paymentMethod != null ? ' · ${_BillDetailScreenState._paymentMethodLabel(bill.paymentMethod!)}' : ''}',
                    style: AppTextStyles.bodySm
                        .copyWith(color: Colors.white.withOpacity(0.85)),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _BillChip extends StatelessWidget {
  const _BillChip({required this.label, required this.color, this.icon});
  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.22),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withOpacity(0.45)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 11, color: Colors.white),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: AppTextStyles.labelSm.copyWith(color: Colors.white),
          ),
        ],
      ),
    );
  }
}

// ── Stats row ────────────────────────────────────────────────────────────────

class _StatsRow extends StatelessWidget {
  const _StatsRow({
    required this.deliveryRate,
    required this.daysTracked,
    required this.servicesCount,
    required this.saved,
    required this.currency,
  });

  final double deliveryRate;
  final int daysTracked;
  final int servicesCount;
  final double saved;
  final String currency;

  @override
  Widget build(BuildContext context) {
    final rateDisplay =
        deliveryRate > 0 ? '${deliveryRate.toStringAsFixed(0)}%' : '—';
    final savedDisplay = saved > 0
        ? CurrencyFormatter.formatCompact(saved, currency: currency)
        : '₹0';

    return IntrinsicHeight(
      child: Row(
        children: [
          _StatTile(
              label: 'Delivery\nrate',
              value: rateDisplay,
              icon: LucideIcons.trendingUp,
              color: AppColors.success),
          const SizedBox(width: 8),
          _StatTile(
              label: 'Days\ntracked',
              value: '$daysTracked',
              icon: LucideIcons.calendarDays,
              color: AppColors.primary),
          const SizedBox(width: 8),
          _StatTile(
              label: 'Services',
              value: '$servicesCount',
              icon: LucideIcons.package,
              color: const Color(0xFF8B5CF6)),
          const SizedBox(width: 8),
          _StatTile(
              label: 'Saved',
              value: savedDisplay,
              icon: LucideIcons.piggyBank,
              color: AppColors.warning),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Expanded(
      child: Container(
        padding:
            const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDark
                ? AppColors.cardDarkBorder
                : color.withOpacity(0.18),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(height: 4),
            Text(
              value,
              style: AppTextStyles.h4.copyWith(
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
            Text(
              label,
              style: AppTextStyles.labelSm.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              maxLines: 2,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Section card ─────────────────────────────────────────────────────────────

class _SectionCard extends StatelessWidget {
  const _SectionCard(
      {required this.title, required this.child, this.icon});

  final String title;
  final Widget child;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.base),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (icon != null) ...[
                  Icon(icon, size: 16,
                      color:
                          Theme.of(context).colorScheme.onSurfaceVariant),
                  const SizedBox(width: 6),
                ],
                Text(title, style: AppTextStyles.h4),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            child,
          ],
        ),
      ),
    );
  }
}

// ── Info row ─────────────────────────────────────────────────────────────────

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: AppTextStyles.bodySm.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(child: Text(value, style: AppTextStyles.bodySm)),
        ],
      ),
    );
  }
}

// ── Line items section ───────────────────────────────────────────────────────

class _LineItemsSection extends StatelessWidget {
  const _LineItemsSection({required this.bill});

  final GeneratedBill bill;

  @override
  Widget build(BuildContext context) {
    final items = bill.items;

    return _SectionCard(
      title: 'Itemized Breakdown',
      icon: LucideIcons.list,
      child: items.isEmpty
          ? const Text('No line items available for this bill.')
          : Column(
              children: items.map((item) {
                final row =
                    (item as Map?)?.cast<String, dynamic>() ??
                        const <String, dynamic>{};
                final title = row['service_name'] as String? ??
                    row['name'] as String? ??
                    row['service'] as String? ??
                    'Service';
                final daysDelivered =
                    (row['daysDelivered'] as num?)?.toInt();
                final daysSkipped =
                    (row['daysSkipped'] as num?)?.toInt();
                final ratePerDay =
                    (row['ratePerDay'] as num?)?.toDouble();
                final quantity = row['quantity'];
                final unitPrice =
                    (row['unit_price'] as num?)?.toDouble();
                final total = (row['total'] as num?)?.toDouble() ??
                    (row['amount'] as num?)?.toDouble() ??
                    0.0;

                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Theme.of(context)
                        .colorScheme
                        .surfaceContainerHighest
                        .withOpacity(0.5),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              title,
                              style: AppTextStyles.bodySm.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          Text(
                            CurrencyFormatter.formatCompact(
                              total,
                              currency: bill.currency,
                            ),
                            style: AppTextStyles.bodyLg.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          if (daysDelivered != null)
                            _MiniTag(
                              label: '$daysDelivered delivered',
                              color: AppColors.success,
                              icon: LucideIcons.check,
                            ),
                          if (daysSkipped != null && daysSkipped > 0)
                            _MiniTag(
                              label: '$daysSkipped skipped',
                              color: AppColors.error,
                              icon: LucideIcons.x,
                            ),
                          if (ratePerDay != null)
                            _MiniTag(
                              label:
                                  '${CurrencyFormatter.formatCompact(ratePerDay, currency: bill.currency)}/day',
                              color: AppColors.primary,
                              icon: LucideIcons.coins,
                            ),
                          if (daysDelivered == null &&
                              ratePerDay == null &&
                              quantity != null)
                            _MiniTag(
                              label:
                                  '$quantity × ${unitPrice != null ? CurrencyFormatter.formatCompact(unitPrice, currency: bill.currency) : '-'}',
                              color: AppColors.primary,
                              icon: LucideIcons.hash,
                            ),
                        ],
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
    );
  }
}

class _MiniTag extends StatelessWidget {
  const _MiniTag(
      {required this.label, required this.color, required this.icon});
  final String label;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: color),
          const SizedBox(width: 3),
          Text(
            label,
            style: AppTextStyles.labelSm.copyWith(color: color),
          ),
        ],
      ),
    );
  }
}
