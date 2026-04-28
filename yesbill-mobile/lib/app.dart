import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/config/app_config.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'presentation/router/app_router.dart';
import 'providers/theme_provider.dart';
import 'services/fcm_service.dart';

/// Root application widget.
///
/// Startup is split in two phases:
/// 1) Render first Flutter frame immediately (no native splash stall)
/// 2) Initialize Supabase/Firebase with bounded timeouts
class YesBillApp extends ConsumerStatefulWidget {
  const YesBillApp({super.key});

  @override
  ConsumerState<YesBillApp> createState() => _YesBillAppState();
}

class _YesBillAppState extends ConsumerState<YesBillApp> {
  late final Future<bool> _bootstrapFuture;

  @override
  void initState() {
    super.initState();
    _bootstrapFuture = _bootstrap();
  }

  Future<bool> _bootstrap() async {
    final supabaseReady = await _initializeSupabase();
    final firebaseReady = await _initializeFirebase();

    if (AppConfig.enableFcm && supabaseReady && firebaseReady) {
      unawaited(
        ref.read(fcmServiceProvider).initialize().catchError((_) {
          // Non-fatal: app remains usable without FCM.
        }),
      );
    }

    return supabaseReady;
  }

  Future<bool> _initializeSupabase() async {
    if (!AppConfig.hasSupabaseConfig) return false;

    try {
      await Supabase.initialize(
        url: AppConfig.supabaseUrl,
        anonKey: AppConfig.supabaseAnonKey,
        authOptions: const FlutterAuthClientOptions(
          authFlowType: AuthFlowType.pkce,
        ),
      ).timeout(const Duration(seconds: 6));
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> _initializeFirebase() async {
    try {
      await Firebase.initializeApp().timeout(const Duration(seconds: 6));
      return true;
    } catch (_) {
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeProvider);

    return FutureBuilder<bool>(
      future: _bootstrapFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return MaterialApp(
            title: 'YesBill',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light,
            darkTheme: AppTheme.dark,
            themeMode: themeMode,
            home: const _StartupLoadingScreen(),
          );
        }

        if (snapshot.data != true) {
          return MaterialApp(
            title: 'YesBill',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light,
            darkTheme: AppTheme.dark,
            themeMode: themeMode,
            home: const _StartupErrorScreen(),
          );
        }

        final router = ref.watch(routerProvider);
        return MaterialApp.router(
          title: 'YesBill',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.light,
          darkTheme: AppTheme.dark,
          themeMode: themeMode,
          routerConfig: router,
        );
      },
    );
  }
}

class _StartupLoadingScreen extends StatelessWidget {
  const _StartupLoadingScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceLight,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 220,
                    height: 64,
                    child: Image.asset(
                      'assets/images/yesbill_logo_black.png',
                      fit: BoxFit.contain,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              const SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(strokeWidth: 2.4),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StartupErrorScreen extends StatelessWidget {
  const _StartupErrorScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceLight,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: const Card(
              child: Padding(
                padding: EdgeInsets.all(20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.error_outline_rounded,
                      size: 44,
                      color: AppColors.error,
                    ),
                    SizedBox(height: 12),
                    Text(
                      'App configuration missing',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: 8),
                    Text(
                      'YesBill could not initialize securely. Please reinstall with a properly configured APK build.',
                      style: TextStyle(fontSize: 14),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
