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

      // Use upsert so onboarding users whose trigger row hasn't committed yet
      // still get a profile row created rather than a PGRST116 "no rows" error.
      final data = await _supabase
          .from(_table)
          .upsert({
            'id': userId,
            ...updates,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .select()
          .single();
      return UserProfile.fromJson(data);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  /// Returns the MIME type for a given file name based on its extension.
  static String _contentTypeFromFileName(String fileName) {
    final ext = fileName.toLowerCase().split('.').last;
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }

  /// Upload avatar to Supabase Storage and update profile avatar_url.
  Future<String> uploadAvatar(List<int> imageBytes, String fileName) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      final path = '$userId/$fileName';
      await _supabase.storage
          .from('avatars')
          .uploadBinary(path, Uint8List.fromList(imageBytes),
              fileOptions: FileOptions(
                upsert: true,
                contentType: _contentTypeFromFileName(fileName),
              ));
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
              fileOptions: FileOptions(
                upsert: true,
                contentType: _contentTypeFromFileName(fileName),
              ));
      final url = _supabase.storage.from('cover-images').getPublicUrl(path);
      await updateProfile({'cover_image_url': url});
      return url;
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }
}
