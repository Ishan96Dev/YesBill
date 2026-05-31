import 'package:dio/dio.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/constants/api_constants.dart';
import '../providers/core_providers.dart';

// ── Global navigator key ──────────────────────────────────────────────────────
// Shared between FcmService and MaterialApp so that notification tap callbacks
// can navigate without a BuildContext (they run outside the widget tree).
final navigatorKey = GlobalKey<NavigatorState>();

/// Initializes Firebase Cloud Messaging and handles:
/// - Permission request (Android 13+)
/// - Token registration with backend
/// - Foreground notification display via flutter_local_notifications
/// - Notification tap → deep link routing via navigatorKey
class FcmService {
  FcmService({required Dio dio}) : _dio = dio;
  final Dio _dio;

  final _localNotifications = FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    // Request permission
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      announcement: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      return; // User denied — skip setup
    }

    // Initialize local notifications for foreground display
    await _localNotifications.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@drawable/ic_notification'),
      ),
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    // Create notification channel
    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(const AndroidNotificationChannel(
          'yesbill_notifications',
          'YesBill Notifications',
          description: 'Bill reminders, delivery alerts, and payment updates',
          importance: Importance.high,
        ));

    // Get token and register with backend
    final token = await FirebaseMessaging.instance.getToken();
    if (token != null) await _registerToken(token);

    // Refresh token listener
    FirebaseMessaging.instance.onTokenRefresh.listen(_registerToken);

    // Foreground messages: show via local notifications
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // App opened by tapping a background FCM notification
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      final route = message.data['route'] as String?;
      _navigateTo(route);
    });

    // App launched from a terminated state by tapping a notification
    final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
    if (initialMessage != null) {
      final route = initialMessage.data['route'] as String?;
      // Slight delay to allow the widget tree to mount before navigating
      Future.delayed(const Duration(milliseconds: 500), () => _navigateTo(route));
    }
  }

  Future<void> _registerToken(String token) async {
    try {
      await _dio.post(
        ApiConstants.notificationsRegisterToken,
        data: {'token': token, 'platform': 'android'},
      );
    } catch (_) {
      // Non-fatal — app works without push notifications
    }
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    await _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'yesbill_notifications',
          'YesBill Notifications',
          channelDescription: 'Bill reminders, delivery alerts',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@drawable/ic_notification',
          color: Color(0xFF6366F1),
        ),
      ),
      payload: message.data['route'] as String?,
    );
  }

  void _onNotificationTap(NotificationResponse response) {
    _navigateTo(response.payload);
  }

  /// Navigate to [route] using the global navigator key.
  /// Falls back to /dashboard if [route] is null or empty.
  void _navigateTo(String? route) {
    final target = (route?.isNotEmpty == true) ? route! : '/dashboard';
    navigatorKey.currentState?.pushNamed(target);
  }
}

final fcmServiceProvider = Provider<FcmService>((ref) {
  return FcmService(dio: ref.read(dioProvider));
});

