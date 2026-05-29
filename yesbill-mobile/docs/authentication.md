# Authentication Flow

## First Launch

```
App Launch → SplashScreen (1.5s)
    │
    ├── SecureStorage.hasSession() == false
    │       └── preferences.onboardingCompleted?
    │               ├── true → /login
    │               └── false → /onboarding → /login
    │
    └── SecureStorage.hasSession() == true
            └── supabase.auth.getSession()
                    ├── Valid session
                    │       └── biometric_enabled? → BiometricGate → /dashboard
                    └── No/expired session
                            └── supabase.auth.setSession(refreshToken)
                                    ├── OK → BiometricGate → /dashboard
                                    └── Fail → SecureStorage.clearAll() → /login
```

## Email/Password Login

```
User fills email + password → FilledButton("Sign In")
    │
    └── authNotifier.signInWithEmail(email, password)
            │
            └── supabase.auth.signInWithPassword(email, password)
                    ├── Success → Session returned
                    │       ├── writeAccessToken(session.accessToken)
                    │       ├── writeRefreshToken(session.refreshToken)
                    │       ├── writeUserId(user.id)
                    │       ├── writeUserEmail(user.email)
                    │       └── router redirects to /dashboard
                    └── AuthException → authState.error shown in SnackBar
```

## Google OAuth Login

```
User taps "Continue with Google"
    │
    └── supabase.auth.signInWithOAuth(OAuthProvider.google)
            │
            └── Opens system browser for Google consent
                    │
                    └── Supabase handles OAuth callback
                            └── onAuthStateChange fires AuthChangeEvent.signedIn
                                    └── Session persisted → /dashboard
```

## Biometric Gate (Subsequent Opens)

```
App opens → SplashScreen → session found
    │
    └── SecureStorage.isBiometricEnabled() == true
            │
            └── local_auth.authenticate("Unlock YesBill")
                    ├── Success → resume session → /dashboard
                    │       (no new JWT needed — existing token is still valid)
                    └── Failure (cancelled/too many attempts)
                            └── Show retry or "Use Password" → /login
```

## Token Refresh (AuthInterceptor in Dio)

```
Any API request → AuthInterceptor.onRequest
    └── Attaches "Authorization: Bearer <token>" header
            │
            └── Response 401 → AuthInterceptor.onError
                    └── _isRefreshing = true
                            └── supabase.auth.refreshSession()
                                    ├── OK → updateStoredTokens() → retry original request
                                    └── Fail → clearAll() → router pushes /login
```

## Sign Out

```
User taps "Sign Out" in SecuritySettings
    └── authNotifier.signOut()
            ├── supabase.auth.signOut()
            ├── SecureStorage.clearAll()
            └── authState = AuthState() (user = null)
                    └── router redirect fires → /login
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/providers/auth_provider.dart` | AuthNotifier, AuthState, all auth methods |
| `lib/data/datasources/local/secure_storage.dart` | Token persistence |
| `lib/data/datasources/remote/auth_interceptor.dart` | JWT attach + 401 retry |
| `lib/services/biometric_service.dart` | local_auth wrapper |
| `lib/presentation/screens/splash/splash_screen.dart` | Session check + routing |
| `lib/presentation/router/app_router.dart` | Auth guard redirect logic |
