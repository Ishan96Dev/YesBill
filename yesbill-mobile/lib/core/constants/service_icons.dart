import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter/material.dart';

/// Maps web Lucide icon names (stored in user_services.icon) to Flutter IconData.
/// Matches the icon set used in the Next.js frontend exactly.
class ServiceIcons {
  ServiceIcons._();

  static IconData fromName(String? name) {
    return _iconMap[name?.toLowerCase()] ?? LucideIcons.package;
  }

  static const _iconMap = <String, IconData>{
    // Common services
    'milk': LucideIcons.milk,
    'newspaper': LucideIcons.newspaper,
    'wifi': LucideIcons.wifi,
    'internet': LucideIcons.wifi,
    'coffee': LucideIcons.coffee,
    'car': LucideIcons.car,
    'bike': LucideIcons.bike,
    'truck': LucideIcons.truck,
    'home': LucideIcons.home,
    'building': LucideIcons.building2,
    'building-2': LucideIcons.building2,
    'zap': LucideIcons.zap,
    'droplets': LucideIcons.droplets,
    'flame': LucideIcons.flame,
    'tv': LucideIcons.tv,
    'phone': LucideIcons.phone,
    'smartphone': LucideIcons.smartphone,
    'utensils': LucideIcons.utensils,
    'shopping-cart': LucideIcons.shoppingCart,
    'shopping-bag': LucideIcons.shoppingBag,
    'package': LucideIcons.package,
    'box': LucideIcons.box,
    'dollar-sign': LucideIcons.dollarSign,
    'credit-card': LucideIcons.creditCard,
    'banknote': LucideIcons.banknote,
    'receipt': LucideIcons.receipt,
    'book': LucideIcons.book,
    'book-open': LucideIcons.bookOpen,
    'graduation-cap': LucideIcons.graduationCap,
    'heart': LucideIcons.heart,
    'heart-pulse': LucideIcons.heartPulse,
    'activity': LucideIcons.activity,
    'dumbbell': LucideIcons.dumbbell,
    'bicycle': LucideIcons.bike,
    'bus': LucideIcons.bus,
    'train': LucideIcons.train,
    'plane': LucideIcons.plane,
    'music': LucideIcons.music,
    'headphones': LucideIcons.headphones,
    'gamepad': LucideIcons.gamepad2,
    'gift': LucideIcons.gift,
    'shield': LucideIcons.shield,
    'key': LucideIcons.key,
    'lock': LucideIcons.lock,
    'tool': LucideIcons.wrench,
    'wrench': LucideIcons.wrench,
    'settings': LucideIcons.settings,
    'server': LucideIcons.server,
    'database': LucideIcons.database,
    'cloud': LucideIcons.cloud,
    'trash': LucideIcons.trash2,
    'recycle': LucideIcons.recycle,
    'leaf': LucideIcons.leaf,
    'flower': LucideIcons.flower,
    'sun': LucideIcons.sun,
    'moon': LucideIcons.moon,
    'star': LucideIcons.star,
  };

  /// All available icons for the icon picker sheet.
  static final List<MapEntry<String, IconData>> allIcons =
      _iconMap.entries.toList();
}
