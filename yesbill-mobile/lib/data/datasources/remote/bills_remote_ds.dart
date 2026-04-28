import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/errors/error_handler.dart';
import '../../models/generated_bill.dart';

/// Remote data source for all bill-related FastAPI endpoints.
class BillsRemoteDataSource {
  BillsRemoteDataSource(this._dio);
  final Dio _dio;

  Future<GeneratedBill> generateBill({
    required String yearMonth,
    required List<String> serviceIds,
    String? customNote,
    bool sendEmail = false,
  }) async {
    try {
      final resp = await _dio.post(
        '${ApiConstants.billsGenerate}${sendEmail ? '?send_email=true' : ''}',
        data: {
          'year_month': yearMonth,
          'service_ids': serviceIds,
          if (customNote != null) 'custom_note': customNote,
        },
      );
      return GeneratedBill.fromJson(resp.data as Map<String, dynamic>);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<List<BillListItem>> listGeneratedBills() async {
    try {
      final resp = await _dio.get(ApiConstants.billsGenerated);
      final list = resp.data as List<dynamic>;
      return list
          .map((e) => BillListItem.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<List<BillListItem>> listBillsForMonth(String yearMonth) async {
    try {
      final resp = await _dio.get(ApiConstants.billsGeneratedByMonth(yearMonth));
      final list = resp.data as List<dynamic>;
      return list
          .map((e) => BillListItem.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<GeneratedBill> getBillById(String id) async {
    try {
      final resp = await _dio.get(ApiConstants.billsGeneratedById(id));
      return GeneratedBill.fromJson(resp.data as Map<String, dynamic>);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<void> deleteBill(String id) async {
    try {
      await _dio.delete(ApiConstants.billsGeneratedById(id));
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<void> markBillPaid(
    String id, {
    bool isPaid = true,
    required String paymentMethod,
    String? paymentNote,
  }) async {
    try {
      await _dio.patch(
        ApiConstants.billMarkPaid(id),
        data: {
          'is_paid': isPaid,
          if (isPaid) 'payment_method': paymentMethod,
          if (isPaid && paymentNote != null) 'payment_note': paymentNote,
        },
      );
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }
}
