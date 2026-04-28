import 'dart:async';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/errors/error_handler.dart';
import '../models/user_service.dart';

/// CRUD operations for `user_services` table via Supabase direct queries.
/// RLS ensures users can only access their own services.
class ServicesRepository {
  ServicesRepository(this._supabase);
  final SupabaseClient _supabase;

  static const _table = 'user_services';

  String _requireUserId() {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) {
      throw Exception('Not authenticated');
    }
    return userId;
  }

  Future<List<UserService>> getAll() async {
    try {
      final userId = _requireUserId();
      final data = await _supabase
          .from(_table)
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: true);
      return (data as List<dynamic>)
          .map((e) => UserService.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<List<UserService>> getActive() async {
    try {
      final userId = _requireUserId();
      final data = await _supabase
          .from(_table)
          .select()
          .eq('user_id', userId)
          .eq('active', true)
          .order('created_at', ascending: true);
      return (data as List<dynamic>)
          .map((e) => UserService.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<UserService> getById(String id) async {
    try {
      final userId = _requireUserId();
      final data = await _supabase
          .from(_table)
          .select()
          .eq('id', id)
          .eq('user_id', userId)
          .single();
      return UserService.fromJson(data);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Stream<List<UserService>> streamAll() {
    try {
      final userId = _requireUserId();
      return _supabase
          .from(_table)
          .stream(primaryKey: ['id'])
          .eq('user_id', userId)
          .order('created_at')
          .map(
            (rows) => rows
                .map((e) => UserService.fromJson(e))
                .toList(growable: false),
          )
          .transform(
            StreamTransformer.fromHandlers(
              handleError: (error, stackTrace, sink) {
                // Realtime subscription timed out — fall back to HTTP fetch
                getAll()
                    .then(sink.add)
                    .catchError((e, st) => sink.addError(e, st));
              },
            ),
          );
    } catch (e) {
      return Stream.fromFuture(getAll());
    }
  }

  Stream<List<UserService>> streamActive() {
    try {
      final userId = _requireUserId();
      return _supabase
          .from(_table)
          .stream(primaryKey: ['id'])
          .eq('user_id', userId)
          .order('created_at')
          .map(
            (rows) => rows
                .map((e) => UserService.fromJson(e))
                .where((service) => service.active)
                .toList(growable: false),
          )
          .transform(
            StreamTransformer.fromHandlers(
              handleError: (error, stackTrace, sink) {
                // Realtime subscription timed out — fall back to HTTP fetch
                getActive()
                    .then(sink.add)
                    .catchError((e, st) => sink.addError(e, st));
              },
            ),
          );
    } catch (e) {
      return Stream.fromFuture(getActive());
    }
  }

  Future<UserService> create(Map<String, dynamic> fields) async {
    try {
      final data = await _supabase.from(_table).insert(fields).select().single();
      return UserService.fromJson(data);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<UserService> update(String id, Map<String, dynamic> fields) async {
    try {
      final data = await _supabase
          .from(_table)
          .update({...fields, 'updated_at': DateTime.now().toIso8601String()})
          .eq('id', id)
          .select()
          .single();
      return UserService.fromJson(data);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<void> delete(String id) async {
    try {
      await _supabase.from(_table).delete().eq('id', id);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<UserService> toggleActive(String id, bool active) =>
      update(id, {'active': active});
}
