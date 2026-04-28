import 'dart:async';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/errors/error_handler.dart';
import '../models/service_confirmation.dart';

/// Manages `service_confirmations` table — daily delivery tracking.
/// Uses Supabase direct queries with upsert for idempotent confirmation recording.
class CalendarRepository {
  CalendarRepository(this._supabase);
  final SupabaseClient _supabase;

  static const _table = 'service_confirmations';

  String _requireUserId() {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) {
      throw Exception('Not authenticated');
    }
    return userId;
  }

  ({String startDate, String endDate}) _monthRange(String yearMonth) {
    final parts = yearMonth.split('-');
    final year = int.parse(parts[0]);
    final month = int.parse(parts[1]);
    final startDate = '$yearMonth-01';
    final endDay = DateTime(year, month + 1, 0).day;
    final endDate = '$yearMonth-${endDay.toString().padLeft(2, '0')}';
    return (startDate: startDate, endDate: endDate);
  }

  /// Returns all confirmations for a given month (YYYY-MM format).
  Future<List<ServiceConfirmation>> getMonthConfirmations(
      String yearMonth) async {
    try {
      final userId = _requireUserId();
      final range = _monthRange(yearMonth);

      final data = await _supabase
          .from(_table)
          .select()
          .eq('user_id', userId)
          .gte('date', range.startDate)
          .lte('date', range.endDate)
          .order('date', ascending: true);

      return (data as List<dynamic>)
          .map((e) => ServiceConfirmation.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  /// Upsert a single confirmation (create or update by service_id + date).
  Future<ServiceConfirmation> upsertConfirmation({
    required String serviceId,
    required String date,
    required String status,
    double? customAmount,
  }) async {
    try {
      final userId = _requireUserId();

      final data = await _supabase
          .from(_table)
          .upsert(
            {
              'user_id': userId,
              'service_id': serviceId,
              'date': date,
              'status': status,
              if (customAmount != null) 'custom_amount': customAmount,
              'updated_at': DateTime.now().toIso8601String(),
            },
            onConflict: 'user_id,service_id,date',
          )
          .select()
          .single();
      return ServiceConfirmation.fromJson(data);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  /// Get all confirmations for a specific service in a month.
  Future<List<ServiceConfirmation>> getServiceMonthConfirmations({
    required String serviceId,
    required String yearMonth,
  }) async {
    try {
      final userId = _requireUserId();
      final range = _monthRange(yearMonth);
      final data = await _supabase
          .from(_table)
          .select()
          .eq('user_id', userId)
          .eq('service_id', serviceId)
          .gte('date', range.startDate)
          .lte('date', range.endDate)
          .order('date', ascending: true);
      return (data as List<dynamic>)
          .map((e) => ServiceConfirmation.fromJson(e as Map<String, dynamic>))
          .toList(growable: false);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  /// Stream real-time updates to confirmations for the given month.
  Stream<List<ServiceConfirmation>> streamMonthConfirmations(
      String yearMonth) {
    try {
      final userId = _requireUserId();
      final range = _monthRange(yearMonth);
      return _supabase
          .from(_table)
          .stream(primaryKey: ['id'])
          .eq('user_id', userId)
          .order('date')
          .map(
            (rows) => rows
                .map((e) => ServiceConfirmation.fromJson(e))
                .where(
                  (confirmation) =>
                      confirmation.date.compareTo(range.startDate) >= 0 &&
                      confirmation.date.compareTo(range.endDate) <= 0,
                )
                .toList(growable: false),
          )
          .transform(
            StreamTransformer.fromHandlers(
              handleError: (error, stackTrace, sink) {
                // Realtime subscription timed out — fall back to HTTP fetch
                getMonthConfirmations(yearMonth)
                    .then(sink.add)
                    .catchError((e, st) => sink.addError(e, st));
              },
            ),
          );
    } catch (e) {
      return Stream.fromFuture(getMonthConfirmations(yearMonth));
    }
  }
}
