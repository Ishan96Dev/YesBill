import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';

/// Handles one-shot runtime permission requests for core app features.
class PermissionService {
  Future<Map<Permission, PermissionStatus>> requestEssentialPermissions() async {
    final permissions = <Permission>{
      Permission.notification,
      Permission.camera,
      Permission.microphone,
    };

    if (Platform.isAndroid) {
      // Android 13+ (API 33+): READ_EXTERNAL_STORAGE is deprecated; use
      // granular media permissions so the OS actually shows dialogs.
      permissions.add(Permission.photos);   // READ_MEDIA_IMAGES
      permissions.add(Permission.videos);   // READ_MEDIA_VIDEO
      permissions.add(Permission.audio);    // READ_MEDIA_AUDIO
      // Android ≤ 12 (API ≤ 32): legacy storage — no-op on API 33+.
      permissions.add(Permission.storage);
    }

    if (Platform.isIOS) {
      permissions.add(Permission.photos);
    }

    return permissions.toList().request();
  }
}

final permissionServiceProvider = Provider<PermissionService>((ref) {
  return PermissionService();
});
