import 'package:home_widget/home_widget.dart';
import 'package:intl/intl.dart';

/// Pushes data from Flutter into the 3 Android home screen widgets.
///
/// ## How it works
/// Each method saves key/value pairs via [HomeWidget.saveWidgetData] into
/// the app's SharedPreferences, then triggers the matching Android
/// AppWidgetProvider to redraw with the new data.
///
/// ## Where to call
/// - [pushCalendarData] — call from CalendarScreen after calendar data loads
///   and after every delivery mark/unmark.
/// - [pushServicesData] — call from ServicesScreen after services load or
///   after add/edit/delete a service.
/// - [pushChatData] — call once when the user profile loads (e.g. AppScaffold
///   or DashboardScreen after userProfileProvider resolves).
class WidgetService {
  WidgetService._();

  static const _calendarProvider =
      'com.yesbill.yesbill_mobile.CalendarWidgetProvider';
  static const _servicesProvider =
      'com.yesbill.yesbill_mobile.ServicesWidgetProvider';
  static const _chatProvider =
      'com.yesbill.yesbill_mobile.ChatWidgetProvider';

  /// Push today's calendar delivery data to the Calendar widget.
  ///
  /// [date] — the day to display (usually DateTime.now()).
  /// [deliveredCount] — number of services delivered so far today.
  /// [totalCount] — total active services for today.
  /// [services] — up to 4 entries shown in the right column.
  static Future<void> pushCalendarData({
    required DateTime date,
    required int deliveredCount,
    required int totalCount,
    List<WidgetEntry> services = const [],
  }) async {
    final formatted = DateFormat('EEE, d MMM').format(date);

    final saves = <Future<bool?>>[
      HomeWidget.saveWidgetData<String>('cal_date', formatted),
      HomeWidget.saveWidgetData<String>('cal_delivered', '$deliveredCount'),
      HomeWidget.saveWidgetData<String>('cal_total', '$totalCount'),
    ];

    for (var i = 1; i <= 4; i++) {
      final entry = i <= services.length ? services[i - 1] : null;
      saves
        ..add(HomeWidget.saveWidgetData<String>(
            'cal_s${i}_name', entry?.name))
        ..add(HomeWidget.saveWidgetData<String>(
            'cal_s${i}_status', entry?.status));
    }

    await Future.wait(saves);
    await HomeWidget.updateWidget(qualifiedAndroidName: _calendarProvider);
  }

  /// Push services list data to the Services widget.
  ///
  /// [activeCount] — number of currently active services.
  /// [services] — up to 4 entries with name + detail (rate string).
  static Future<void> pushServicesData({
    required int activeCount,
    List<WidgetEntry> services = const [],
  }) async {
    final saves = <Future<bool?>>[
      HomeWidget.saveWidgetData<String>('svc_count', '$activeCount'),
    ];

    for (var i = 1; i <= 4; i++) {
      final entry = i <= services.length ? services[i - 1] : null;
      saves
        ..add(HomeWidget.saveWidgetData<String>(
            'svc_s${i}_name', entry?.name))
        ..add(HomeWidget.saveWidgetData<String>(
            'svc_s${i}_detail', entry?.detail));
    }

    await Future.wait(saves);
    await HomeWidget.updateWidget(qualifiedAndroidName: _servicesProvider);
  }

  /// Push user display name to personalize the Chat widget greeting.
  ///
  /// Call once after the user profile loads.
  static Future<void> pushChatData({required String displayName}) async {
    final greeting =
        displayName.trim().isEmpty ? 'Hello!' : 'Hello, ${displayName.trim()}!';
    await HomeWidget.saveWidgetData<String>('chat_greeting', greeting);
    await HomeWidget.updateWidget(qualifiedAndroidName: _chatProvider);
  }
}

/// A single data entry for a widget row.
class WidgetEntry {
  const WidgetEntry({
    required this.name,
    this.status = 'pending',
    this.detail = '',
  });

  /// Service name displayed in the widget (truncated if too long).
  final String name;

  /// Delivery status for Calendar widget: 'delivered' | 'absent' | 'pending'
  /// (shown as ✓ / – / · respectively).
  final String status;

  /// Rate/detail string for Services widget, e.g. '₹45/day'.
  final String detail;
}
