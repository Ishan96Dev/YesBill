import 'package:flutter/material.dart';

/// Consistent spacing constants matching the web app's Tailwind spacing scale.
class AppSpacing {
  AppSpacing._();

  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double base = 16;
  static const double lg = 20;
  static const double xl = 24;
  static const double xl2 = 32;
  static const double xl3 = 40;
  static const double xl4 = 48;

  static const EdgeInsets screenPadding =
      EdgeInsets.symmetric(horizontal: base, vertical: base);
  static const EdgeInsets cardPadding = EdgeInsets.all(base);
  static const EdgeInsets cardPaddingLg = EdgeInsets.all(xl);

  static const double cardRadius = 16;
  static const double cardRadiusSm = 12;
  static const double cardRadiusLg = 20;
  static const double buttonRadius = 12;
  static const double chipRadius = 8;
  static const double inputRadius = 12;

  static BorderRadius get cardBorderRadius =>
      BorderRadius.circular(cardRadius);
  static BorderRadius get buttonBorderRadius =>
      BorderRadius.circular(buttonRadius);
  static BorderRadius get inputBorderRadius =>
      BorderRadius.circular(inputRadius);
}
