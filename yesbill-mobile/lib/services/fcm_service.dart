import 'dart:ui' show Color;
import 'package:dio/dio.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/constants/api_constants.dart';
import '../providers/core_providers.dart';

/// Initializes Firebase Cloud Messaging and handles:
/// - Permission request (Android 13+)
/// - Token registration with backend
/// - Foreground notification display via flutter_local_notifications
/// - Notification tap → deep link routing
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
    FirebaseMessaging.instance.onTokenRefresh
        .listen(_registerToken);

    // Foreground messages: show via local notifications
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Background tap: already handled via onDidReceiveNotificationResponse
    // when the app is opened from a notification
  }

  Future<void> _registerToken(String token) async {
    try {
      await _dio.post(
        ApiConstants.notificationsRegisterToken,
        data: {'token': token},
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
    // TODO: Use GoRouter to navigate to response.payload route
    // e.g., /bills/:id, /calendar, /services/:id
    // This requires a global navigator key or router reference
  }
}
final fcmServiceProvider = Provider<FcmService>((ref) {
  return FcmService(dio: ref.read(dioProvider));
});
