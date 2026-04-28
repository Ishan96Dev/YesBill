import 'package:intl/intl.dart';

class CurrencyFormatter {
  CurrencyFormatter._();

  /// Format a number as currency (e.g., '₹1,234.50')
  static String format(double amount, {String currency = 'INR'}) {
    final symbol = _currencySymbols[currency] ?? currency;
    final formatted = NumberFormat('#,##0.00').format(amount);
    return '$symbol$formatted';
  }

  /// Format without decimal if it's a whole number (e.g., '₹1,234')
  static String formatCompact(double amount, {String currency = 'INR'}) {
    final symbol = _currencySymbols[currency] ?? currency;
    if (amount == amount.truncateToDouble()) {
      return '$symbol${NumberFormat('#,##0').format(amount)}';
    }
    return '$symbol${NumberFormat('#,##0.00').format(amount)}';
  }

  static const _currencySymbols = <String, String>{
    'INR': '₹',
    'USD': '\$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'AUD': 'A\$',
    'CAD': 'C\$',
    'SGD': 'S\$',
    'AED': 'د.إ ',
  };

  static String symbolFor(String currency) =>
      _currencySymbols[currency] ?? currency;
}
