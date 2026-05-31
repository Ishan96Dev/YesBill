import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';
import 'providers/core_providers.dart';

/// Top-level background message handler for Firebase Messaging.
///
/// MUST be a top-level function annotated with `@pragma('vm:entry-point')` so
/// that the Dart tree-shaker does not remove it and the native Firebase SDK can
/// call it when the app is in the background or terminated state.
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Note: Firebase.initializeApp() is NOT called here because the Flutter
  // firebase_messaging plugin guarantees it runs before this callback.
  // Calling it again would cause "duplicate app" errors on some devices.
  //
  // The system notification is shown automatically by the FCM SDK for data +
  // notification messages.  For data-only messages (no notification key) you
  // would call flutter_local_notifications here — but YesBill always sends
  // combined messages so no extra work is needed.
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Register the background message handler BEFORE Firebase.initializeApp().
  // This is required by the firebase_messaging plugin — registering it later
  // has no effect for background/terminated state.
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  // Lock to portrait orientation
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarDividerColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  // Load SharedPreferences
  final prefs = await SharedPreferences.getInstance();

  // Build the Riverpod container with overrides
  final container = ProviderContainer(
    overrides: [
      sharedPreferencesProvider.overrideWithValue(prefs),
    ],
  );

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const YesBillApp(),
    ),
  );
}
