import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class AppBottomNav extends ConsumerWidget {
  const AppBottomNav({super.key});

  static const _destinations = [
    (icon: Icons.home_outlined, label: 'Home', route: '/home'),
    (icon: Icons.receipt_long_outlined, label: 'Bills', route: '/bills'),
    (icon: Icons.smart_toy_outlined, label: 'Agents', route: '/agents'),
    (icon: Icons.business_center_outlined, label: 'Services', route: '/services'),
    (icon: Icons.person_outline, label: 'Profile', route: '/profile'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).uri.toString();
    final currentIndex = _destinations.indexWhere((d) => location.startsWith(d.route));
    final activeIndex = currentIndex == -1 ? 0 : currentIndex;

    return NavigationBar(
      selectedIndex: activeIndex,
      onDestinationSelected: (i) => context.go(_destinations[i].route),
      destinations: _destinations.map((d) =>
          NavigationDestination(icon: Icon(d.icon), label: d.label)).toList(),
    );
  }
}
