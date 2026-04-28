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
