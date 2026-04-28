import 'package:flutter/material.dart';

class DeleteDialog {
  static Future<bool?> show(BuildContext context, {required String itemName}) {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete'),
        content: Text('Are you sure you want to delete "$itemName"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(foregroundColor: Theme.of(ctx).colorScheme.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}
