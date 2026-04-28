import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

class ShareService {
  Future<void> shareText(String text) async => Share.share(text);
  Future<void> shareUrl(String url) async => Share.share(url);
  Future<void> sharePdf(File file) async =>
      Share.shareXFiles([XFile(file.path, mimeType: 'application/pdf')]);
}

final shareServiceProvider = Provider<ShareService>((_) => ShareService());
