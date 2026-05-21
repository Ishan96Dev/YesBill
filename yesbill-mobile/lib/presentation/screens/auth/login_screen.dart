import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/validators.dart';
import '../../../providers/auth_provider.dart';
import '../../widgets/auth_widgets.dart';
import '../../widgets/common/app_background_effects.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with WidgetsBindingObserver {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscurePassword = true;

  /// True while the Google OAuth browser is open (or until the deep-link
  /// callback fires). Keeps the loading screen visible so the login form
  /// never flashes during the OAuth window.
  bool _oauthPending = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  /// Called when the app returns to the foreground — which happens as soon as
  /// the in-app OAuth browser is dismissed (completed or cancelled).
  /// If auth still hasn't succeeded after a short grace period, the user
  /// cancelled OAuth — reset to the form so they can try again.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _oauthPending) {
      Future.delayed(const Duration(milliseconds: 600), () {
        if (!mounted || !_oauthPending) return;
        final auth = ref.read(authProvider);
        if (!auth.isAuthenticated && !auth.isLoading) {
          setState(() => _oauthPending = false);
        }
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(authProvider.notifier).signInWithEmail(
          _emailCtrl.text.trim(),
          _passwordCtrl.text,
        );

    if (mounted) {
      final error = ref.read(authProvider).error;
      if (error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _googleSignIn() async {
    setState(() => _oauthPending = true);
    await ref.read(authProvider.notifier).signInWithGoogle();
    if (mounted) {
      final error = ref.read(authProvider).error;
      if (error != null) {
        // Auth failed immediately (e.g. launch error) — reset to form.
        setState(() => _oauthPending = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error), backgroundColor: AppColors.error),
        );
      }
      // On success _oauthPending stays true; the router navigates away and
      // disposes this widget, so no explicit reset is needed.
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isLoading = authState.isLoading;
    final isAuthenticated = authState.isAuthenticated;
    final cs = AppTheme.light.colorScheme;
    final tt = AppTheme.light.textTheme;

    // Hide the form whenever:
    //  • isLoading   — email/password auth request in-flight
    //  • isAuthenticated — auth succeeded but router redirect hasn't fired yet
    //  • _oauthPending — Google OAuth browser is open (isLoading resets to
    //                    false immediately after the browser launches, so we
    //                    need a separate flag to bridge that gap)
    if (isLoading || isAuthenticated || _oauthPending) {
      return Theme(
        data: AppTheme.light,
        child: Scaffold(
          backgroundColor: AppColors.surfaceLight,
          body: Stack(
            fit: StackFit.expand,
            children: [
              // Soft background orbs for visual continuity with the
              // security-loading screen that follows.
              IgnorePointer(
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Positioned(
                      top: -130,
                      left: -110,
                      child: Container(
                        width: 300,
                        height: 300,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primary.withOpacity(0.15),
                        ),
                      ),
                    ),
                    Align(
                      alignment: const Alignment(0.1, -0.5),
                      child: Container(
                        width: 200,
                        height: 200,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFFA78BFA).withOpacity(0.12),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 86,
                      height: 86,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          const SizedBox(
                            width: 86,
                            height: 86,
                            child: CircularProgressIndicator(
                              strokeWidth: 4,
                              valueColor:
                                  AlwaysStoppedAnimation(AppColors.primary),
                              backgroundColor: Color(0xFFD7DCEC),
                            ),
                          ),
                          Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: const Color(0xFFF7F8FB),
                              border: Border.all(
                                  color: const Color(0xFFD9DFEF)),
                            ),
                            padding: const EdgeInsets.all(10),
                            child: Image.asset(
                              'assets/images/yesbill_logo_black.png',
                              fit: BoxFit.contain,
                              filterQuality: FilterQuality.high,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'Signing you in…',
                      style: AppTextStyles.bodySm.copyWith(
                        color: AppColors.textSecondaryLight,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Theme(
      data: AppTheme.light,
      child: Scaffold(
        backgroundColor: cs.surface,
        body: Stack(
        children: [
          const AppBackgroundEffects(),
          SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final compact = constraints.maxHeight < 780;
            final imageHeight = compact ? 118.0 : 148.0;
            final topGap = compact ? 18.0 : 40.0;

            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: AutofillGroup(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Gap(topGap),
                        const Center(
                          child: AuthBrandLogo(),
                        ).animate().fadeIn(delay: 80.ms).slideY(begin: 0.12, end: 0),
                        Gap(compact ? 12 : 16),
                        Text(
                          'Welcome back',
                          style: tt.headlineMedium?.copyWith(
                            color: cs.onSurface,
                            fontWeight: FontWeight.w700,
                            letterSpacing: -0.5,
                          ),
                          textAlign: TextAlign.center,
                        ).animate().fadeIn(delay: 160.ms),
                        const Gap(8),
                        Text(
                          'Sign in to your YesBill account',
                          style: AppTextStyles.body.copyWith(
                            color: cs.onSurfaceVariant,
                          ),
                          textAlign: TextAlign.center,
                        ).animate().fadeIn(delay: 220.ms),
                        Gap(compact ? 18 : 24),
                        AuthHeroImage(
                          assetPath: 'assets/images/auth_side_login.png',
                          height: imageHeight,
                        ).animate().fadeIn(delay: 280.ms),
                        Gap(compact ? 16 : 18),
                        Form(
                          key: _formKey,
                          autovalidateMode: AutovalidateMode.onUserInteraction,
                          child: Column(
                            children: [
                              AuthInputField(
                                controller: _emailCtrl,
                                label: 'Email address',
                                keyboardType: TextInputType.emailAddress,
                                textInputAction: TextInputAction.next,
                                prefixIcon: LucideIcons.mail,
                                autofillHints: const [AutofillHints.email],
                                validator: Validators.email,
                              ),
                              const Gap(14),
                              AuthInputField(
                                controller: _passwordCtrl,
                                label: 'Password',
                                obscureText: _obscurePassword,
                                textInputAction: TextInputAction.done,
                                onFieldSubmitted: (_) => _submit(),
                                prefixIcon: LucideIcons.lock,
                                autofillHints: const [AutofillHints.password],
                                validator: Validators.loginPassword,
                                suffixIcon: IconButton(
                                  style: IconButton.styleFrom(
                                    backgroundColor: Colors.transparent,
                                    shape: const CircleBorder(),
                                    minimumSize: const Size(40, 40),
                                  ),
                                  icon: Icon(
                                    _obscurePassword
                                        ? LucideIcons.eyeOff
                                        : LucideIcons.eye,
                                    size: 18,
                                    color: cs.onSurfaceVariant,
                                  ),
                                  onPressed: () => setState(
                                    () => _obscurePassword = !_obscurePassword,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ).animate().fadeIn(delay: 300.ms),
                        const Gap(10),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () => context.push('/forgot-password'),
                            child: const Text('Forgot password?'),
                          ),
                        ),
                        Gap(compact ? 12 : 16),
                        AuthPrimaryButton(
                          onPressed: isLoading ? null : _submit,
                          label: 'Sign In',
                          isLoading: isLoading,
                        ).animate().fadeIn(delay: 380.ms),
                        Gap(compact ? 18 : 24),
                        Row(
                          children: [
                            Expanded(
                              child: Divider(
                                color: cs.outlineVariant.withOpacity(0.4),
                                thickness: 1,
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              child: Text(
                                'or continue with',
                                style: AppTextStyles.bodySm.copyWith(
                                  color: cs.onSurfaceVariant,
                                ),
                              ),
                            ),
                            Expanded(
                              child: Divider(
                                color: cs.outlineVariant.withOpacity(0.4),
                                thickness: 1,
                              ),
                            ),
                          ],
                        ).animate().fadeIn(delay: 440.ms),
                        Gap(compact ? 16 : 20),
                        AuthGoogleButton(
                          onPressed: isLoading ? null : _googleSignIn,
                          isLoading: isLoading,
                        ).animate().fadeIn(delay: 500.ms),
                        Gap(compact ? 20 : 28),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              "Don't have an account? ",
                              style: AppTextStyles.body.copyWith(
                                color: cs.onSurfaceVariant,
                              ),
                            ),
                            GestureDetector(
                              onTap: () => context.push('/signup'),
                              child: Text(
                                'Create account',
                                style: AppTextStyles.body.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ).animate().fadeIn(delay: 560.ms),
                        const Gap(20),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
          ),
        ],
      ),
      ),
    );
  }
}
