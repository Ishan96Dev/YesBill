import 'dart:typed_data';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/errors/error_handler.dart';
import '../models/user_profile.dart';

class ProfileRepository {
  ProfileRepository(this._supabase);
  final SupabaseClient _supabase;

  static const _table = 'user_profiles';

  Future<UserProfile?> getProfile() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return null;

      final data = await _supabase
          .from(_table)
          .select()
          .eq('id', userId)
          .maybeSingle();

      if (data == null) return null;
      return UserProfile.fromJson(data);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<UserProfile> updateProfile(Map<String, dynamic> updates) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      final data = await _supabase
          .from(_table)
          .update({
            ...updates,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', userId)
          .select()
          .single();
      return UserProfile.fromJson(data);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  /// Upload avatar to Supabase Storage and update profile avatar_url.
  Future<String> uploadAvatar(List<int> imageBytes, String fileName) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      final path = 'avatars/$userId/$fileName';
      await _supabase.storage
          .from('avatars')
          .uploadBinary(path, Uint8List.fromList(imageBytes),
              fileOptions: const FileOptions(upsert: true));
      final url = _supabase.storage.from('avatars').getPublicUrl(path);
      await updateProfile({'avatar_url': url});
      return url;
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  /// Upload cover image to Supabase Storage and update profile cover_image_url.
  Future<String> uploadCoverImage(List<int> imageBytes, String fileName) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      final path = '$userId/$fileName';
      await _supabase.storage
          .from('cover-images')
          .uploadBinary(path, Uint8List.fromList(imageBytes),
              fileOptions: const FileOptions(upsert: true));
      final url = _supabase.storage.from('cover-images').getPublicUrl(path);
      await updateProfile({'cover_image_url': url});
      return url;
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }
}
