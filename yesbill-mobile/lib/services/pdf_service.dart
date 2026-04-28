import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:share_plus/share_plus.dart';

import '../core/utils/currency_formatter.dart';
import '../data/models/generated_bill.dart';

/// Generates a PDF from a [GeneratedBill] and shares it via the share sheet.
class PdfService {
  PdfService._();

  static Future<void> exportBill(GeneratedBill bill) async {
    final pdf = pw.Document();
    final currency = bill.currency;

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (context) => [
          // Header
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'YesBill',
                    style: pw.TextStyle(
                      fontSize: 24,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.Text('Monthly Service Bill',
                      style: const pw.TextStyle(fontSize: 12)),
                ],
              ),
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.Text('Period: ${bill.yearMonth}',
                      style: const pw.TextStyle(fontSize: 12)),
                  pw.Text(
                    'Total: ${CurrencyFormatter.format(bill.totalAmount, currency: currency)}',
                    style: pw.TextStyle(
                      fontSize: 14,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.Text(
                    bill.isPaid ? 'PAID' : 'UNPAID',
                    style: pw.TextStyle(
                      color: bill.isPaid ? PdfColors.green : PdfColors.red,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
          pw.SizedBox(height: 24),
          pw.Divider(),
          pw.SizedBox(height: 16),

          // AI Summary
          if (bill.summary.isNotEmpty) ...[
            pw.Text('Summary',
                style:
                    pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 8),
            pw.Text(bill.summary, style: const pw.TextStyle(fontSize: 11)),
            pw.SizedBox(height: 16),
          ],

          // Service Items Table
          pw.Text('Service Breakdown',
              style:
                  pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
          pw.SizedBox(height: 8),
          pw.Table(
            border: pw.TableBorder.all(color: PdfColors.grey300),
            columnWidths: {
              0: const pw.FlexColumnWidth(3),
              1: const pw.FlexColumnWidth(1),
              2: const pw.FlexColumnWidth(1),
              3: const pw.FlexColumnWidth(1),
            },
            children: [
              pw.TableRow(
                decoration: const pw.BoxDecoration(color: PdfColors.grey100),
                children: [
                  _cell('Service', bold: true),
                  _cell('Days', bold: true),
                  _cell('Rate', bold: true),
                  _cell('Amount', bold: true),
                ],
              ),
              ...bill.items.map((item) {
                final m = item as Map<String, dynamic>;
                return pw.TableRow(children: [
                  _cell(m['name']?.toString() ?? '-'),
                  _cell(m['days_delivered']?.toString() ?? '-'),
                  _cell(CurrencyFormatter.format(
                    (m['rate'] as num?)?.toDouble() ?? 0,
                    currency: currency,
                  )),
                  _cell(CurrencyFormatter.format(
                    (m['amount'] as num?)?.toDouble() ?? 0,
                    currency: currency,
                  )),
                ]);
              }),
            ],
          ),
          pw.SizedBox(height: 16),

          // Total
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.end,
            children: [
              pw.Text(
                'Total: ${CurrencyFormatter.format(bill.totalAmount, currency: currency)}',
                style: pw.TextStyle(
                  fontSize: 14,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
            ],
          ),

          // Recommendations
          if (bill.recommendations.isNotEmpty) ...[
            pw.SizedBox(height: 16),
            pw.Divider(),
            pw.SizedBox(height: 8),
            pw.Text('Recommendations',
                style:
                    pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 8),
            pw.Text(bill.recommendations,
                style: const pw.TextStyle(fontSize: 11)),
          ],

          pw.SizedBox(height: 32),
          pw.Text(
            'Generated by YesBill • ${DateTime.now().toLocal()}',
            style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey600),
          ),
        ],
      ),
    );

    // Save to temp file and share
    final bytes = await pdf.save();
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/yesbill_${bill.yearMonth}.pdf');
    await file.writeAsBytes(bytes);

    await Share.shareXFiles(
      [XFile(file.path, mimeType: 'application/pdf')],
      subject: 'YesBill — ${bill.yearMonth}',
    );
  }

  static pw.Widget _cell(String text, {bool bold = false}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(6),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: 10,
          fontWeight: bold ? pw.FontWeight.bold : pw.FontWeight.normal,
        ),
      ),
    );
  }
}
