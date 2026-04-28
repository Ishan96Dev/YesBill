import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:async';

// app_config.dart import removed — no longer needed after OAuth migration
import '../data/datasources/local/secure_storage.dart';
import 'core_providers.dart';

/// Auth state exposed to the UI.
class AuthState {
  const AuthState({
    this.user,
    this.isLoading = false,
    this.error,
  });

  final User? user;
  final bool isLoading;
  final String? error;

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? error,
    bool clearUser = false,
  }) {
    return AuthState(
      user: clearUser ? null : user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  StreamSubscription<dynamic>? _authSub;

  @override
  AuthState build() {
    // Listen to Supabase auth state changes
    final supabase = ref.watch(supabaseClientProvider);
    _authSub?.cancel();
    _authSub = supabase.auth.onAuthStateChange.listen((data) {
      if (data.event == AuthChangeEvent.signedIn && data.session != null) {
        _persistSession(data.session!);
        state = state.copyWith(user: data.session!.user, isLoading: false);
      } else if (data.event == AuthChangeEvent.signedOut) {
        _clearSession();
        state = const AuthState();
      } else if (data.event == AuthChangeEvent.tokenRefreshed &&
          data.session != null) {
        _persistSession(data.session!);
      }
    });

    ref.onDispose(() {
      _authSub?.cancel();
      _authSub = null;
    });

    return AuthState(user: supabase.auth.currentUser);
  }

  SecureStorageService get _storage => ref.read(secureStorageProvider);
  SupabaseClient get _supabase => ref.read(supabaseClientProvider);

  Future<void> signInWithEmail(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res =
          await _supabase.auth.signInWithPassword(email: email, password: password);
      if (res.user != null) {
        await _persistSession(res.session!);
        state = state.copyWith(user: res.user, isLoading: false);
      }
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Sign in failed. Please try again.');
    }
  }

  Future<void> signUpWithEmail({
    required String email,
    required String password,
    String? displayName,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _supabase.auth.signUp(
        email: email,
        password: password,
        data: displayName != null ? {'display_name': displayName} : {},
      );
      state = state.copyWith(isLoading: false);
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Sign up failed. Please try again.');
    }
  }

  Future<void> signInWithGoogle() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      // Use browser-based OAuth — works without SHA-1 fingerprint or serverClientId.
      // Supabase auth state listener handles the session after the deep-link redirect.
      await _supabase.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: 'yesbill://login-callback',
        authScreenLaunchMode: LaunchMode.inAppBrowserView,
      );
      // signInWithOAuth launches the browser and returns immediately.
      // Reset loading here; the auth state change will update the user.
      state = state.copyWith(isLoading: false);
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Google sign-in failed. Please try again.',
      );
    }
  }

  Future<void> signOut() async {
    await _supabase.auth.signOut();
    await _clearSession();
    state = const AuthState();
  }

  Future<void> sendPasswordResetEmail(String email) async {
    await _supabase.auth.resetPasswordForEmail(email);
  }

  Future<void> _persistSession(Session session) async {
    await _storage.writeAccessToken(session.accessToken);
    final refreshToken = session.refreshToken;
    if (refreshToken != null) {
      await _storage.writeRefreshToken(refreshToken);
    }
    await _storage.writeUserId(session.user.id);
    await _storage.writeUserEmail(session.user.email ?? '');
  }

  Future<void> _clearSession() async {
    await _storage.clearAll();
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
