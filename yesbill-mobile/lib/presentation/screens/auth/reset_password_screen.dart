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

class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({super.key});
  @override
  ConsumerState<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;
  bool _emailSent = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _isLoading = true; _errorMessage = null; });
    try {
      await ref.read(authProvider.notifier).sendPasswordResetEmail(_emailController.text.trim());
      if (mounted) setState(() { _emailSent = true; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _errorMessage = e.toString(); _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (_emailSent) {
      return Scaffold(
        backgroundColor: cs.surface,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.success.withOpacity(0.12),
                  ),
                  alignment: Alignment.center,
                  child: const Icon(
                    LucideIcons.mailCheck,
                    size: 36,
                    color: AppColors.success,
                  ),
                ).animate().scale(begin: const Offset(0.7, 0.7)),
                const Gap(24),
                Text(
                  'Check your email',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: cs.onSurface,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.5,
                  ),
                  textAlign: TextAlign.center,
                ),
                const Gap(10),
                Text(
                  'A password reset link has been sent to\n${_emailController.text.trim()}',
                  style: AppTextStyles.body.copyWith(color: cs.onSurfaceVariant),
                  textAlign: TextAlign.center,
                ),
                const Gap(36),
                AuthPrimaryButton(
                  label: 'Back to Sign In',
                  onPressed: () => context.go('/login'),
                ),
              ],
            ),
          ),
        ),
      );
    }

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
                        ).animate().fadeIn(delay: 140.ms),
                        const Gap(8),
                        Text(
                          'Enter your account email and we\'ll send\na password reset link.',
                          style: AppTextStyles.body.copyWith(color: cs.onSurfaceVariant),
                          textAlign: TextAlign.center,
                        ).animate().fadeIn(delay: 200.ms),
                        Gap(compact ? 20 : 28),
                        AuthInputField(
                          controller: _emailController,
                          label: 'Email address',
                          prefixIcon: LucideIcons.mail,
                          keyboardType: TextInputType.emailAddress,
                          textInputAction: TextInputAction.done,
                          autofillHints: const [AutofillHints.email],
                          onFieldSubmitted: (_) => _submit(),
                          validator: Validators.email,
                        ).animate().fadeIn(delay: 280.ms),
                        if (_errorMessage != null) ...[
                          const Gap(10),
                          Row(
                            children: [
                              const Icon(LucideIcons.alertCircle, size: 14, color: AppColors.error),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  _errorMessage!,
                                  style: AppTextStyles.bodySm.copyWith(color: AppColors.error),
                                ),
                              ),
                            ],
                          ),
                        ],
                        Gap(compact ? 18 : 24),
                        AuthPrimaryButton(
                          onPressed: _isLoading ? null : _submit,
                          label: 'Send Reset Link',
                          isLoading: _isLoading,
                        ).animate().fadeIn(delay: 340.ms),
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
                        ).animate().fadeIn(delay: 400.ms),
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
}
