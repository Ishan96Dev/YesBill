import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/auth_provider.dart';
import '../screens/agent/agent_screen.dart';
import '../screens/analytics/analytics_screen.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/security_loading_screen.dart';
import '../screens/auth/signup_screen.dart';
import '../screens/bills/bill_detail_screen.dart';
import '../screens/bills/bills_screen.dart';
import '../screens/bills/generate_bill_screen.dart';
import '../screens/calendar/calendar_screen.dart';
import '../screens/calendar/service_calendar_screen.dart';
import '../screens/chat/chat_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/onboarding/onboarding_screen.dart';
import '../screens/services/add_service_screen.dart';
import '../screens/services/edit_service_screen.dart';
import '../screens/services/service_detail_screen.dart';
import '../screens/services/services_screen.dart';
import '../screens/settings/ai_provider_setup_screen.dart';
import '../screens/settings/ai_settings_screen.dart';
import '../screens/settings/appearance_settings_screen.dart';
import '../screens/settings/notification_settings_screen.dart';
import '../screens/settings/profile_settings_screen.dart';
import '../screens/settings/logout_screen.dart';
import '../screens/settings/security_settings_screen.dart';
import '../screens/settings/settings_screen.dart';
import '../screens/splash/splash_screen.dart';
import '../screens/docs/docs_screen.dart';
import '../screens/support/support_screen.dart';
import '../widgets/common/app_scaffold.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final path = state.uri.path;

      final authRoutes = [
        '/login',
        '/signup',
        '/forgot-password',
        '/onboarding'
      ];
      final isAuthRoute = authRoutes.any((r) => path.startsWith(r));

      // Always allow splash through (it handles its own redirect logic)
      if (path == '/splash') return null;

      // Not authenticated and trying to access protected route
      if (!isAuthenticated && !isAuthRoute) {
        return '/login?redirect=${Uri.encodeComponent(path)}';
      }

      // Authenticated and on auth route — go home
      if (isAuthenticated && isAuthRoute) return '/dashboard';

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (_, __) => const SplashScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (_, __) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (_, __) => const SignupScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (_, __) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/security-loading',
        builder: (_, __) => const SecurityLoadingScreen(),
      ),
      GoRoute(
        path: '/logout',
        builder: (_, __) => const LogoutScreen(),
      ),

      // ── Main shell with bottom navigation ────────────────────────────────
      ShellRoute(
        builder: (_, __, child) => AppScaffold(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (_, __) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/services',
            builder: (_, __) => const ServicesScreen(),
            routes: [
              GoRoute(
                path: 'add',
                builder: (_, __) => const AddServiceScreen(),
              ),
              GoRoute(
                path: ':id',
                builder: (_, state) =>
                    ServiceDetailScreen(serviceId: state.pathParameters['id']!),
                routes: [
                  GoRoute(
                    path: 'edit',
                    builder: (_, state) => EditServiceScreen(
                        serviceId: state.pathParameters['id']!),
                  ),
                ],
              ),
            ],
          ),
          GoRoute(
            path: '/calendar',
            builder: (_, __) => const CalendarScreen(),
            routes: [
              GoRoute(
                path: ':serviceId',
                builder: (_, state) => ServiceCalendarScreen(
                    serviceId: state.pathParameters['serviceId']!),
              ),
            ],
          ),
          GoRoute(
            path: '/bills',
            builder: (_, __) => const BillsScreen(),
            routes: [
              GoRoute(
                path: 'generate',
                builder: (_, __) => const GenerateBillScreen(),
              ),
              GoRoute(
                path: ':id',
                builder: (_, state) =>
                    BillDetailScreen(billId: state.pathParameters['id']!),
              ),
            ],
          ),
          GoRoute(
            path: '/analytics',
            builder: (_, __) => const AnalyticsScreen(),
          ),
          GoRoute(
            path: '/chat',
            builder: (_, state) => ChatScreen(
              convId: state.uri.queryParameters['convId'],
            ),
          ),
          GoRoute(
            path: '/agent',
            builder: (_, __) => const AgentScreen(),
          ),
          GoRoute(
            path: '/settings',
            builder: (_, __) => const SettingsScreen(),
            routes: [
              GoRoute(
                path: 'profile',
                builder: (_, __) => const ProfileSettingsScreen(),
              ),
              GoRoute(
                path: 'ai',
                builder: (_, __) => const AiSettingsScreen(),
                routes: [
                  GoRoute(
                    path: ':provider',
                    builder: (_, state) => AiProviderSetupScreen(
                        provider: state.pathParameters['provider']!),
                  ),
                ],
              ),
              GoRoute(
                path: 'notifications',
                builder: (_, __) => const NotificationSettingsScreen(),
              ),
              GoRoute(
                path: 'security',
                builder: (_, __) => const SecuritySettingsScreen(),
              ),
              GoRoute(
                path: 'appearance',
                builder: (_, __) => const AppearanceSettingsScreen(),
              ),
            ],
          ),
          GoRoute(
            path: '/support',
            builder: (_, __) => const SupportScreen(),
          ),
          GoRoute(
            path: '/docs',
            builder: (_, __) => const DocsScreen(),
          ),
        ],
      ),
    ],
    errorBuilder: (_, state) => Scaffold(
      body: Center(child: Text('Page not found: ${state.uri}')),
    ),
  );
});
