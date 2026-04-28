import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/validators.dart';
import '../../../providers/auth_provider.dart';
import '../../widgets/auth_widgets.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  String _passwordValue = '';

  @override
  void initState() {
    super.initState();
    _passwordCtrl.addListener(() {
      setState(() => _passwordValue = _passwordCtrl.text);
    });
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(authProvider.notifier).signUpWithEmail(
          email: _emailCtrl.text.trim(),
          password: _passwordCtrl.text,
          displayName: _nameCtrl.text.trim(),
        );
    if (mounted) {
      final error = ref.read(authProvider).error;
      if (error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error), backgroundColor: AppColors.error),
        );
      } else {
        context.go('/dashboard');
      }
    }
  }

  Future<void> _googleSignIn() async {
    await ref.read(authProvider.notifier).signInWithGoogle();
    if (mounted) {
      final error = ref.read(authProvider).error;
      if (error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error), backgroundColor: AppColors.error),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(authProvider).isLoading;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: cs.surface,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final compact = constraints.maxHeight < 780;
                  final imageHeight = compact ? 118.0 : 148.0;
                  return SingleChildScrollView(
                    child: AutofillGroup(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                    const SizedBox(height: 24),
                    const Center(
                      child: AuthBrandLogo(),
                    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.14, end: 0),
                    const SizedBox(height: 12),
                    AuthHeroImage(
                      assetPath: 'assets/images/auth_side_signup.png',
                      height: imageHeight,
                    ).animate().fadeIn(delay: 180.ms),
                    const SizedBox(height: 12),
                    Text(
                      'Create your YesBill account',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: cs.onSurface,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.4,
                      ),
                      textAlign: TextAlign.center,
                    ).animate().fadeIn(delay: 200.ms),
                    const SizedBox(height: 4),
                    Text(
                      'Start your journey to financial calm today.',
                      style: AppTextStyles.bodySm.copyWith(color: cs.onSurfaceVariant),
                      textAlign: TextAlign.center,
                    ).animate().fadeIn(delay: 280.ms),
                    const SizedBox(height: 16),
                    Form(
                      key: _formKey,
                      autovalidateMode: AutovalidateMode.onUserInteraction,
                      child: Column(
                          children: [
                            AuthInputField(
                              controller: _nameCtrl,
                              label: 'Full Name',
                              prefixIcon: LucideIcons.user,
                              textInputAction: TextInputAction.next,
                              validator: (v) => Validators.required(v, fieldName: 'Name'),
                            ),
                            const SizedBox(height: 10),
                            AuthInputField(
                              controller: _emailCtrl,
                              label: 'Email address',
                              prefixIcon: LucideIcons.mail,
                              keyboardType: TextInputType.emailAddress,
                              textInputAction: TextInputAction.next,
                              autofillHints: const [AutofillHints.email],
                              validator: Validators.email,
                            ),
                            const SizedBox(height: 10),
                            AuthInputField(
                              controller: _passwordCtrl,
                              label: 'Password',
                              prefixIcon: LucideIcons.lock,
                              obscureText: _obscurePassword,
                              textInputAction: TextInputAction.next,
                              validator: Validators.password,
                              suffixIcon: IconButton(
                                style: IconButton.styleFrom(
                                  backgroundColor: Colors.transparent,
                                  shape: const CircleBorder(),
                                  minimumSize: const Size(40, 40),
                                ),
                                icon: Icon(
                                  _obscurePassword ? LucideIcons.eyeOff : LucideIcons.eye,
                                  size: 18,
                                  color: cs.onSurfaceVariant,
                                ),
                                onPressed: () =>
                                    setState(() => _obscurePassword = !_obscurePassword),
                              ),
                            ),
                            PasswordStrengthIndicator(password: _passwordValue),
                            const SizedBox(height: 10),
                            AuthInputField(
                              controller: _confirmPasswordCtrl,
                              label: 'Confirm Password',
                              prefixIcon: LucideIcons.shieldCheck,
                              obscureText: _obscureConfirm,
                              textInputAction: TextInputAction.done,
                              onFieldSubmitted: (_) => _submit(),
                              validator: (v) => Validators.confirmPassword(v, _passwordCtrl.text),
                              suffixIcon: IconButton(
                                style: IconButton.styleFrom(
                                  backgroundColor: Colors.transparent,
                                  shape: const CircleBorder(),
                                  minimumSize: const Size(40, 40),
                                ),
                                icon: Icon(
                                  _obscureConfirm ? LucideIcons.eyeOff : LucideIcons.eye,
                                  size: 18,
                                  color: cs.onSurfaceVariant,
                                ),
                                onPressed: () =>
                                    setState(() => _obscureConfirm = !_obscureConfirm),
                              ),
                            ),
                          ],
                        ),
                      ).animate().fadeIn(delay: 340.ms),
                    const SizedBox(height: 14),
                    AuthPrimaryButton(
                      onPressed: isLoading ? null : _submit,
                      label: 'Create Account',
                      isLoading: isLoading,
                    ).animate().fadeIn(delay: 420.ms),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: Divider(
                            color: cs.outlineVariant.withOpacity(0.4),
                            thickness: 1,
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          child: Text(
                            'or continue with',
                            style: AppTextStyles.bodySm.copyWith(color: cs.onSurfaceVariant),
                          ),
                        ),
                        Expanded(
                          child: Divider(
                            color: cs.outlineVariant.withOpacity(0.4),
                            thickness: 1,
                          ),
                        ),
                      ],
                    ).animate().fadeIn(delay: 460.ms),
                    const SizedBox(height: 12),
                    AuthGoogleButton(
                      onPressed: isLoading ? null : _googleSignIn,
                      isLoading: isLoading,
                    ).animate().fadeIn(delay: 500.ms),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Already have an account? ',
                          style: AppTextStyles.body.copyWith(color: cs.onSurfaceVariant),
                        ),
                        GestureDetector(
                          onTap: () => context.go('/login'),
                          child: Text(
                            'Sign In',
                            style: AppTextStyles.body.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ).animate().fadeIn(delay: 540.ms),
                    const SizedBox(height: 16),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }
}
