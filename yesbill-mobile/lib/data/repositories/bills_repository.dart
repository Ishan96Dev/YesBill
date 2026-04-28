import 'package:supabase_flutter/supabase_flutter.dart';

import '../datasources/remote/bills_remote_ds.dart';
import '../models/generated_bill.dart';
import '../../core/errors/error_handler.dart';

class BillsRepository {
  BillsRepository({
    required SupabaseClient supabase,
    required BillsRemoteDataSource remoteDs,
  })  : _supabase = supabase,
        _remoteDs = remoteDs;

  final SupabaseClient _supabase;
  final BillsRemoteDataSource _remoteDs;

  /// Fetch all bills for the current user from Supabase directly.
  Future<List<GeneratedBill>> getBills() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      final data = await _supabase
          .from('generated_bills')
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: false);

      return (data as List)
          .map((e) => GeneratedBill.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  /// Fetch a single bill by ID.
  Future<GeneratedBill> getBillById(String billId) async {
    try {
      final data = await _supabase
          .from('generated_bills')
          .select()
          .eq('id', billId)
          .single();
      return GeneratedBill.fromJson(data);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  /// Generate a new bill via FastAPI backend (triggers AI generation).
  Future<GeneratedBill> generateBill({
    required String yearMonth,
    required List<String> serviceIds,
    String? customNote,
    bool sendEmail = false,
  }) async {
    try {
      return await _remoteDs.generateBill(
        yearMonth: yearMonth,
        serviceIds: serviceIds,
        customNote: customNote,
        sendEmail: sendEmail,
      );
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  /// Mark a bill as paid.
  Future<GeneratedBill> markBillPaid(
    String billId, {
    bool isPaid = true,
    String paymentMethod = 'cash',
    String? paymentNote,
  }) async {
    try {
      await _remoteDs.markBillPaid(
        billId,
        isPaid: isPaid,
        paymentMethod: paymentMethod,
        paymentNote: paymentNote,
      );
      return getBillById(billId);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  /// Delete a bill.
  Future<void> deleteBill(String billId) async {
    try {
      await _supabase.from('generated_bills').delete().eq('id', billId);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  /// Get bills for a specific month.
  Future<List<GeneratedBill>> getBillsForMonth(String yearMonth) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      final data = await _supabase
          .from('generated_bills')
          .select()
          .eq('user_id', userId)
          .eq('year_month', yearMonth)
          .order('created_at', ascending: false);

      return (data as List)
          .map((e) => GeneratedBill.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }
}
