import 'package:flutter/material.dart';

class ConfirmDialog {
  static Future<bool?> show(BuildContext context, {
    required String title, required String message,
    String confirmText = 'Confirm', String cancelText = 'Cancel',
  }) {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: Text(cancelText)),
          FilledButton(onPressed: () => Navigator.of(ctx).pop(true), child: Text(confirmText)),
        ],
      ),
    );
  }
}
