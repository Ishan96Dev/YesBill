# YesBill Mobile — Architecture

## Overview

YesBill Mobile follows a **layered architecture** with clear separation of concerns:

```
Presentation Layer (screens, widgets)
        ↓ watches
Providers Layer (Riverpod state)
        ↓ reads
Data Layer (repositories + datasources)
        ↓ calls
Network (FastAPI) / Database (Supabase) / Local Storage
```

## Layer Breakdown

### 1. Presentation Layer (`lib/presentation/`)
- **Screens**: Full-screen views organized by feature
- **Widgets**: Reusable UI components (shared `common/`, `dialogs/`)
- **Router**: `go_router` with `ShellRoute` for bottom navigation + auth guards
- Screens only interact with Riverpod providers — never touch repositories directly

### 2. Providers Layer (`lib/providers/`)
- All state managed via **Riverpod 2.x** with `@riverpod` code generation
- Provider types used:
  - `Provider` — pure dependency injection (repositories, Dio, Supabase)
  - `FutureProvider` — async data fetching with `AsyncValue`
  - `StateProvider` — simple value state (selected month, active conv ID)
  - `NotifierProvider` — complex mutable state with methods
  - `AutoDisposeNotifierProvider` — screen-scoped state (cleaned up on pop)

### 3. Data Layer (`lib/data/`)

#### Models (`data/models/`)
- All models are **Freezed** classes with `copyWith`, `toJson`, `fromJson`
- Generated via `dart run build_runner build`
- Do not modify `*.freezed.dart` or `*.g.dart` files manually

#### Data Sources (`data/datasources/`)
- **Remote** (FastAPI): `Dio` for REST, `dart:io HttpClient` for SSE streaming
- **Local** (Supabase): `supabase_flutter` package, direct table queries
- **Secure**: `flutter_secure_storage` for JWT tokens, biometric flag
- **Preferences**: `shared_preferences` for theme mode, non-sensitive settings

#### Repositories (`data/repositories/`)
- Thin layer combining datasources; handle error mapping via `ErrorHandler`
- Supabase direct queries for: `user_services`, `service_confirmations`, `user_profiles`
- FastAPI calls for: bill generation, AI chat/agent, AI settings, analytics

## Riverpod Provider Graph (Core)

```
sharedPreferencesProvider (override in main.dart)
    └── preferencesProvider
            └── themeProvider

supabaseClientProvider (Supabase.instance.client)
    ├── servicesRepositoryProvider
    ├── calendarRepositoryProvider
    └── profileRepositoryProvider

secureStorageProvider
    ├── authInterceptorProvider
    └── chatRemoteDsProvider (SSE needs token)

dioProvider
    ├── billsRemoteDsProvider
    ├── chatRemoteDsProvider
    ├── aiSettingsRemoteDsProvider
    └── fcmServiceProvider

authProvider (NotifierProvider<AuthNotifier, AuthState>)
    └── Drives router redirect logic
```

## Feature Providers

```
userServicesProvider (FutureProvider)
activeServicesProvider (FutureProvider)
serviceMutationProvider (NotifierProvider)

selectedMonthProvider (StateProvider<DateTime>)
monthConfirmationsProvider (FutureProvider.family<String yearMonth>)
confirmationsByDateProvider (Provider.family)
confirmationNotifierProvider (AutoDisposeNotifierProvider)

generatedBillsProvider (FutureProvider)
billDetailProvider (FutureProvider.family<String id>)
billGenerationProvider (NotifierProvider<BillGenerationNotifier>)
billPaymentProvider (NotifierProvider)

conversationsProvider (FutureProvider)
activeConversationIdProvider (StateProvider)
chatMessagesProvider (AutoDisposeNotifierProviderFamily<String convId>)
```

## Navigation Structure

```
ShellRoute (AppScaffold — bottom nav + agent FAB)
├── /dashboard
├── /services → /services/add, /services/:id, /services/:id/edit
├── /calendar → /calendar/:serviceId
├── /bills → /bills/generate, /bills/:id
├── /analytics
├── /chat → /chat?convId=...
├── /agent
└── /settings → /settings/profile, /settings/ai/:provider, ...
```

Auth routes (`/login`, `/signup`, `/forgot-password`, `/onboarding`) are outside ShellRoute.

## Code Generation

Run after modifying any Freezed model or `@riverpod` provider:

```bash
dart run build_runner build --delete-conflicting-outputs
```

Generated files (`*.freezed.dart`, `*.g.dart`) are committed to the repo.
