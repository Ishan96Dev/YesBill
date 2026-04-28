# Navigation — go_router Route Tree

## Route Map

```
/splash                                 SplashScreen (session check → redirect)
/onboarding                             OnboardingScreen (3-page intro)
/login                                  LoginScreen
/signup                                 SignupScreen
/forgot-password                        ForgotPasswordScreen

ShellRoute → AppScaffold (bottom nav + agent FAB)
├── /dashboard                          DashboardScreen
│
├── /services                           ServicesScreen
│   ├── /services/add                   AddServiceScreen
│   ├── /services/:id                   ServiceDetailScreen
│   └── /services/:id/edit              EditServiceScreen
│
├── /calendar                           CalendarScreen
│   └── /calendar/:serviceId            ServiceCalendarScreen
│
├── /bills                              BillsScreen
│   ├── /bills/generate                 GenerateBillScreen
│   └── /bills/:id                      BillDetailScreen
│
├── /analytics                          AnalyticsScreen
│
├── /chat                               ChatScreen
│   (query param: ?convId=uuid)
│
├── /agent                              AgentScreen
│
└── /settings                           SettingsScreen
    ├── /settings/profile               ProfileSettingsScreen
    ├── /settings/ai                    AiSettingsScreen
    │   └── /settings/ai/:provider      AiProviderSetupScreen
    ├── /settings/notifications         NotificationSettingsScreen
    ├── /settings/security              SecuritySettingsScreen
    └── /settings/appearance            AppearanceSettingsScreen

Bottom navigation includes `Dashboard`, `Calendar`, `Services`, `Bills`, and a `More` sheet trigger.
`More` is a UI action (not a dedicated route path) that reveals overflow destinations.
```

## Bottom Navigation Tabs

|Index|Label|Icon|Path|
|---|---|---|---|
|0|Dashboard|LayoutDashboard|`/dashboard`|
|1|Calendar|CalendarDays|`/calendar`|
|2|Services|Package|`/services`|
|3|Bills|FileText|`/bills`|
|4|More|MoreHorizontal|`sheet trigger`|

### More Sheet Destinations

- AI Chat → `/chat`
- Analytics → `/analytics`
- Settings → `/settings`
- AI Agent → `/agent`

The Agent FAB (Sparkles icon) floats above the bottom nav on all main screens.

## Auth Guard (Router Redirect)

```dart
redirect: (context, state) {
  final isAuthenticated = ref.read(authProvider).isAuthenticated;
  final path = state.uri.path;

  // Always allow splash
  if (path == '/splash') return null;

  // Not authenticated → redirect to login (with return path)
  if (!isAuthenticated && !isAuthRoute) {
    return '/login?redirect=${Uri.encodeComponent(path)}';
  }

  // Authenticated + on auth route → go to dashboard
  if (isAuthenticated && isAuthRoute) return '/dashboard';

  return null;
}
```

## Deep Links (FCM Notification Taps)

|Notification Type|Deep Link|
|---|---|
|`bill_generated`|`/bills/:bill_id`|
|`bill_due_reminder`|`/bills/generate`|
|`delivery_reminder`|`/calendar`|
|`payment_confirmed`|`/bills/:bill_id`|
|`service_expiry`|`/services/:service_id`|

Deep links use the `yesbill://` custom scheme registered in `AndroidManifest.xml`.
`FcmService._onNotificationTap()` routes to the correct screen via the global GoRouter instance.

## Navigation Patterns

- **Push**: `context.push('/bills/generate')` — adds to navigation stack
- **Go**: `context.go('/dashboard')` — replaces entire stack (used for tab switching)
- **Pop**: `context.pop()` — go back (used in modal screens like AddService, BillDetail)
- **Replace**: `context.replace('/login')` — replace current route (used after sign out)

## ShellRoute Behavior

`ShellRoute` wraps all authenticated screens in `AppScaffold`. The bottom navigation bar uses `context.go()` so switching tabs doesn't push onto the stack — each tab maintains its own navigation state.
