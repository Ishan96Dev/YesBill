import 'package:intl/intl.dart';

extension DateTimeExtensions on DateTime {
  /// Returns 'YYYY-MM' string (e.g., '2025-03')
  String toYearMonth() => DateFormat('yyyy-MM').format(this);

  /// Returns 'YYYY-MM-DD' string (e.g., '2025-03-15')
  String toDateString() => DateFormat('yyyy-MM-dd').format(this);

  /// Returns formatted display date (e.g., 'March 2025')
  String toMonthYearDisplay() => DateFormat('MMMM yyyy').format(this);

  /// Returns short formatted date (e.g., 'Mar 15')
  String toShortDate() => DateFormat('MMM d').format(this);

  /// Returns full formatted date (e.g., 'March 15, 2025')
  String toFullDate() => DateFormat('MMMM d, yyyy').format(this);

  /// Returns day number display (e.g., '15')
  String toDayDisplay() => day.toString();

  bool isSameDay(DateTime other) =>
      year == other.year && month == other.month && day == other.day;

  bool isSameMonth(DateTime other) =>
      year == other.year && month == other.month;

  /// First day of the month
  DateTime get firstDayOfMonth => DateTime(year, month, 1);

  /// Last day of the month
  DateTime get lastDayOfMonth => DateTime(year, month + 1, 0);

  /// Total days in this month
  int get daysInMonth => lastDayOfMonth.day;

  /// Previous month
  DateTime get previousMonth =>
      month == 1 ? DateTime(year - 1, 12) : DateTime(year, month - 1);

  /// Next month
  DateTime get nextMonth =>
      month == 12 ? DateTime(year + 1, 1) : DateTime(year, month + 1);
}

extension StringDateExtensions on String {
  /// Parses 'YYYY-MM-DD' string to DateTime
  DateTime toDate() => DateTime.parse(this);

  /// Parses 'YYYY-MM' string to DateTime (first of month)
  DateTime toYearMonthDate() {
    final parts = split('-');
    return DateTime(int.parse(parts[0]), int.parse(parts[1]));
  }
}
