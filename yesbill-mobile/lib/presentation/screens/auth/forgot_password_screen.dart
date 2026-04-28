import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/validators.dart';
import '../../../providers/auth_provider.dart';
import '../../widgets/auth_widgets.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: cs.surface,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final compact = constraints.maxHeight < 760;

            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Form(
                    key: _formKey,
                    autovalidateMode: AutovalidateMode.onUserInteraction,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Gap(16),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: GestureDetector(
                            onTap: () => context.pop(),
                            child: Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: AppColors.primary.withOpacity(0.1),
                                shape: BoxShape.circle,
                              ),
                              alignment: Alignment.center,
                              child: const Icon(
                                LucideIcons.chevronLeft,
                                size: 20,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                        ).animate().fadeIn(delay: 50.ms),
                        Gap(compact ? 14 : 18),
                        const Center(
                          child: AuthBrandLogo(),
                        ).animate().fadeIn(delay: 80.ms).slideY(begin: 0.12, end: 0),
                        Gap(compact ? 16 : 22),
                        AuthHeroImage(
                          assetPath: 'assets/images/auth_side_login.png',
                          height: compact ? 104 : 128,
                        ).animate().fadeIn(delay: 120.ms),
                        Gap(compact ? 16 : 22),
                        Text(
                          'Reset your password',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            color: cs.onSurface,
                            fontWeight: FontWeight.w700,
                            letterSpacing: -0.5,
                          ),
                          textAlign: TextAlign.center,
                        ).animate().fadeIn(delay: 160.ms),
                        const Gap(8),
                        Text(
                          'Enter your account email and we\'ll send\na password reset link.',
                          style: AppTextStyles.body.copyWith(color: cs.onSurfaceVariant),
                          textAlign: TextAlign.center,
                        ).animate().fadeIn(delay: 220.ms),
                        Gap(compact ? 20 : 28),
                        AuthInputField(
                          controller: _emailCtrl,
                          label: 'Email address',
                          prefixIcon: LucideIcons.mail,
                          keyboardType: TextInputType.emailAddress,
                          textInputAction: TextInputAction.done,
                          autofillHints: const [AutofillHints.email],
                          onFieldSubmitted: (_) => _submit(),
                          validator: Validators.email,
                        ).animate().fadeIn(delay: 300.ms),
                        Gap(compact ? 18 : 24),
                        AuthPrimaryButton(
                          onPressed: _loading ? null : _submit,
                          label: 'Send Reset Link',
                          isLoading: _loading,
                        ).animate().fadeIn(delay: 360.ms),
                        Gap(compact ? 22 : 28),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Remember your password? ',
                              style: AppTextStyles.body.copyWith(color: cs.onSurfaceVariant),
                            ),
                            GestureDetector(
                              onTap: () => context.pop(),
                              child: Text(
                                'Sign in',
                                style: AppTextStyles.body.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ).animate().fadeIn(delay: 420.ms),
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
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await ref
          .read(authProvider.notifier)
          .sendPasswordResetEmail(_emailCtrl.text.trim());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Reset link sent to ${_emailCtrl.text.trim()}')),
      );
      context.pop();
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to send reset email')),
      );
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }
}
