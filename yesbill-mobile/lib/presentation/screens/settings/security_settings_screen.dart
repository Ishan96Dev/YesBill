import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/errors/error_handler.dart';
import '../../../core/extensions/context_extensions.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_surfaces.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/bills_provider.dart';
import '../../../providers/core_providers.dart';
import '../../../providers/services_provider.dart';

class SecuritySettingsScreen extends ConsumerStatefulWidget {
  const SecuritySettingsScreen({super.key});

  @override
  ConsumerState<SecuritySettingsScreen> createState() =>
      _SecuritySettingsScreenState();
}

class _SecuritySettingsScreenState
    extends ConsumerState<SecuritySettingsScreen> {
  // Form keys for inline validation
  final _pwdFormKey = GlobalKey<FormState>();
  final _emailFormKey = GlobalKey<FormState>();

  // Change Password
  final _newPwdCtrl = TextEditingController();
  final _confirmPwdCtrl = TextEditingController();
  bool _showNewPwd = false;
  bool _showConfirmPwd = false;
  bool _savingPwd = false;

  // Change Email
  final _newEmailCtrl = TextEditingController();
  bool _savingEmail = false;
  bool _deletingAccount = false;

  @override
  void dispose() {
    _newPwdCtrl.dispose();
    _confirmPwdCtrl.dispose();
    _newEmailCtrl.dispose();
    super.dispose();
  }

  bool get _hasPasswordIdentity {
    final user = ref.read(authProvider).user;
    return user?.identities?.any((i) => i.provider == 'email') ?? false;
  }

  Future<void> _updatePassword() async {
    if (!_pwdFormKey.currentState!.validate()) return;
    final pwd = _newPwdCtrl.text.trim();
    setState(() => _savingPwd = true);
    try {
      final supabase = ref.read(supabaseClientProvider);
      await supabase.auth.updateUser(UserAttributes(password: pwd));
      _newPwdCtrl.clear();
      _confirmPwdCtrl.clear();
      _showSnack('Password updated successfully.');
    } on AuthException catch (e) {
      _showSnack(e.message);
    } catch (e) {
      _showSnack(ErrorHandler.handle(e).message);
    } finally {
      if (mounted) setState(() => _savingPwd = false);
    }
  }

  Future<void> _updateEmail() async {
    if (!_emailFormKey.currentState!.validate()) return;
    final email = _newEmailCtrl.text.trim();
    setState(() => _savingEmail = true);
    try {
      final supabase = ref.read(supabaseClientProvider);
      await supabase.auth.updateUser(UserAttributes(email: email));
      _newEmailCtrl.clear();
      _showSnack('Confirmation email sent to $email. Check your inbox.');
    } on AuthException catch (e) {
      _showSnack(e.message);
    } catch (e) {
      _showSnack(ErrorHandler.handle(e).message);
    } finally {
      if (mounted) setState(() => _savingEmail = false);
    }
  }

  Future<void> _confirmDeleteAccount() async {
    final servicesCount = ref.read(activeServicesProvider).valueOrNull?.length ?? 0;
    final billsCount = ref.read(generatedBillsProvider).valueOrNull?.length ?? 0;
    final confirmCtrl = TextEditingController();
    var canDelete = false;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Delete account'),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: AppColors.error.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Icon(LucideIcons.alertTriangle, color: AppColors.error),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text(
                          'This permanently deletes your account, services, bills, and AI conversations.',
                          style: AppTextStyles.bodySm.copyWith(
                            color: const Color(0xFF2D3337),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    Expanded(
                      child: _DangerStatCard(
                        icon: LucideIcons.package,
                        label: 'Active Services',
                        value: '$servicesCount',
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _DangerStatCard(
                        icon: LucideIcons.receipt,
                        label: 'Generated Bills',
                        value: '$billsCount',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  'Type DELETE to confirm',
                  style: AppTextStyles.labelSm.copyWith(
                    color: const Color(0xFF596063),
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: confirmCtrl,
                  autofocus: true,
                  onChanged: (value) {
                    setDialogState(() {
                      canDelete = value.trim().toUpperCase() == 'DELETE';
                    });
                  },
                  decoration: InputDecoration(
                    hintText: 'DELETE',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(ctx, false),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: FilledButton(
                    onPressed: canDelete ? () => Navigator.pop(ctx, true) : null,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.error,
                    ),
                    child: const Text('Delete account'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
    confirmCtrl.dispose();

    if (confirmed != true || !mounted || _deletingAccount) return;

    setState(() => _deletingAccount = true);
    try {
      await ref.read(dioProvider).delete(ApiConstants.authDeleteAccount);
      try {
        await ref.read(authProvider.notifier).signOut();
      } catch (_) {
        // Ignore sign-out cleanup errors after a successful deletion.
      }
      _showSnack('Your account has been deleted.');
    } catch (e) {
      _showSnack(ErrorHandler.handle(e).message);
    } finally {
      if (mounted) setState(() => _deletingAccount = false);
    }
  }

  void _showSnack(String msg, {bool isError = false}) {
    if (!mounted) return;
    context.showSnackBar(msg, isError: isError);
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final identities = user?.identities ?? [];
    final hasGoogle =
        identities.any((i) => i.provider == 'google');
    final activeServicesCount =
      ref.watch(activeServicesProvider).valueOrNull?.length ?? 0;
    final generatedBillsCount =
      ref.watch(generatedBillsProvider).valueOrNull?.length ?? 0;
    final lastSignIn = user?.lastSignInAt != null
        ? _formatDate(user!.lastSignInAt!)
        : 'Unknown';

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: const Text('Security'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
            AppSpacing.base, AppSpacing.sm, AppSpacing.base, 120),
        children: [
          // ── CHANGE PASSWORD ────────────────────────────────────────────
          _SectionLabel(label: 'CHANGE PASSWORD'),
          const SizedBox(height: AppSpacing.sm),
          if (!_hasPasswordIdentity)
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              margin: const EdgeInsets.only(bottom: AppSpacing.sm),
              decoration: BoxDecoration(
                color: AppColors.info.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(LucideIcons.info, size: 16, color: AppColors.info),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      'You signed in with Google. Password change is not available.',
                      style: AppTextStyles.bodySm
                          .copyWith(color: AppColors.info),
                    ),
                  ),
                ],
              ),
            ),
          Form(
            key: _pwdFormKey,
            child: _SecurityCard(
              children: [
                _PwdField(
                  controller: _newPwdCtrl,
                  label: 'New Password',
                  obscure: !_showNewPwd,
                  onToggle: () =>
                      setState(() => _showNewPwd = !_showNewPwd),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Required';
                    if (v.trim().length < 8) return 'At least 8 characters';
                    return null;
                  },
                ),
                const SizedBox(height: AppSpacing.sm),
                _PwdField(
                  controller: _confirmPwdCtrl,
                  label: 'Confirm New Password',
                  obscure: !_showConfirmPwd,
                  onToggle: () =>
                      setState(() => _showConfirmPwd = !_showConfirmPwd),
                  validator: (v) {
                    if (v != _newPwdCtrl.text) return 'Passwords do not match';
                    return null;
                  },
                ),
                const SizedBox(height: AppSpacing.md),
                FilledButton(
                  onPressed:
                      (!_hasPasswordIdentity || _savingPwd) ? null : _updatePassword,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  minimumSize: const Size.fromHeight(44),
                  shape: const StadiumBorder(),
                ),
                child: _savingPwd
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Update Password'),
              ),
            ],
          ),
          ).animate().fadeIn(delay: 50.ms),
          const SizedBox(height: AppSpacing.lg),

          // ── CHANGE EMAIL ───────────────────────────────────────────────
          _SectionLabel(label: 'CHANGE EMAIL ADDRESS'),
          const SizedBox(height: AppSpacing.sm),
          Form(
            key: _emailFormKey,
            child: _SecurityCard(
              children: [
                TextField(
                  enabled: false,
                  decoration: _inputDeco(
                    context,
                    label: 'Current Email',
                    hintText: user?.email ?? '',
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                TextFormField(
                  controller: _newEmailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  decoration: _inputDeco(context, label: 'New Email Address'),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Required';
                    if (!v.trim().contains('@') || !v.trim().contains('.')) {
                      return 'Enter a valid email address';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: AppSpacing.md),
                FilledButton(
                  onPressed: _savingEmail ? null : _updateEmail,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    minimumSize: const Size.fromHeight(44),
                    shape: const StadiumBorder(),
                  ),
                  child: _savingEmail
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Send Confirmation Email'),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 100.ms),
          const SizedBox(height: AppSpacing.lg),

          // ── CONNECTED ACCOUNTS ────────────────────────────────────────
          _SectionLabel(label: 'CONNECTED ACCOUNTS'),
          const SizedBox(height: AppSpacing.sm),
          _SecurityCard(
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                        color: AppSurfaces.elevated(context),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.g_mobiledata_rounded,
                        size: 24, color: Color(0xFF4285F4)),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Google',
                            style: AppTextStyles.body.copyWith(
                                fontWeight: FontWeight.w600,
                            color: Theme.of(context).colorScheme.onSurface)),
                        Text(
                          hasGoogle ? 'Connected' : 'Not connected',
                          style: AppTextStyles.bodySm.copyWith(
                              color: hasGoogle
                                  ? AppColors.success
                              : Theme.of(context)
                                .colorScheme
                                .onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                  if (hasGoogle)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.success.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        'Connected',
                        style: AppTextStyles.labelSm.copyWith(
                            color: AppColors.success,
                            fontWeight: FontWeight.w600),
                      ),
                    ),
                ],
              ),
            ],
          ).animate().fadeIn(delay: 150.ms),
          const SizedBox(height: AppSpacing.lg),

          // ── CURRENT SESSION ───────────────────────────────────────────
          _SectionLabel(label: 'CURRENT SESSION'),
          const SizedBox(height: AppSpacing.sm),
          _SecurityCard(
            children: [
              _SessionRow(
                icon: LucideIcons.smartphone,
                label: 'Device',
                value: 'Android',
              ),
              const Divider(height: 20, thickness: 0.5),
              _SessionRow(
                icon: LucideIcons.clock,
                label: 'Last Sign-In',
                value: lastSignIn,
              ),
              const Divider(height: 20, thickness: 0.5),
              _SessionRow(
                icon: LucideIcons.mail,
                label: 'Account',
                value: user?.email ?? 'Not available',
              ),
            ],
          ).animate().fadeIn(delay: 200.ms),
          const SizedBox(height: AppSpacing.xl),

          // ── DANGER ZONE ───────────────────────────────────────────────
          _SectionLabel(label: 'DANGER ZONE'),
          const SizedBox(height: AppSpacing.sm),
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColors.error.withOpacity(0.06),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Delete Account',
                  style: AppTextStyles.body.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.error),
                ),
                const SizedBox(height: 4),
                Text(
                  'Permanently delete your account and all associated data. This action cannot be undone.',
                  style: AppTextStyles.bodySm.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    Expanded(
                      child: _DangerStatCard(
                        icon: LucideIcons.package,
                        label: 'Services',
                        value: '$activeServicesCount',
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _DangerStatCard(
                        icon: LucideIcons.receipt,
                        label: 'Bills',
                        value: '$generatedBillsCount',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                OutlinedButton.icon(
                  onPressed: _deletingAccount ? null : _confirmDeleteAccount,
                  icon: _deletingAccount
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(LucideIcons.trash2, size: 16),
                  label: Text(_deletingAccount ? 'Deleting…' : 'Delete My Account'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.error,
                    side: BorderSide(color: AppColors.error.withOpacity(0.5)),
                    shape: const StadiumBorder(),
                    minimumSize: const Size.fromHeight(44),
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 250.ms),
        ],
      ),
    );
  }

  static InputDecoration _inputDeco(
    BuildContext context, {
    required String label,
    String? hintText,
  }) {
    final outlineColor = Theme.of(context).colorScheme.outlineVariant;

    return InputDecoration(
      labelText: label,
      hintText: hintText,
      filled: true,
      fillColor: AppSurfaces.elevated(context),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: outlineColor.withOpacity(0.5)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: outlineColor.withOpacity(0.5)),
      ),
    );
  }

  static String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      final months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
    } catch (_) {
      return iso;
    }
  }
}

// ── Section Label ─────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: AppTextStyles.labelSm.copyWith(
        color: Theme.of(context).colorScheme.onSurfaceVariant,
        letterSpacing: 0.6,
        fontWeight: FontWeight.w700,
      ),
    );
  }
}

// ── Card container ────────────────────────────────────────────────────────────

class _SecurityCard extends StatelessWidget {
  const _SecurityCard({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppSurfaces.panel(context),
        borderRadius: BorderRadius.circular(16),
        border: AppSurfaces.cardBorder(context),
        boxShadow: AppSurfaces.softShadow(context),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: children,
      ),
    );
  }
}

// ── Password text field with visibility toggle ────────────────────────────

class _PwdField extends StatelessWidget {
  const _PwdField({
    required this.controller,
    required this.label,
    required this.obscure,
    required this.onToggle,
    this.validator,
  });

  final TextEditingController controller;
  final String label;
  final bool obscure;
  final VoidCallback onToggle;
  final String? Function(String?)? validator;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      validator: validator,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      decoration: InputDecoration(
        labelText: label,
        filled: true,
        fillColor: AppSurfaces.elevated(context),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: Theme.of(context).colorScheme.outlineVariant.withOpacity(0.5),
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: Theme.of(context).colorScheme.outlineVariant.withOpacity(0.5),
          ),
        ),
        suffixIcon: IconButton(
          style: IconButton.styleFrom(
            backgroundColor: Colors.transparent,
            shape: const CircleBorder(),
            minimumSize: const Size(40, 40),
          ),
          icon: Icon(
            obscure ? LucideIcons.eyeOff : LucideIcons.eye,
            size: 18,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          onPressed: onToggle,
        ),
      ),
    );
  }
}

// ── Session info row ───────────────────────────────────────────────────────────

class _SessionRow extends StatelessWidget {
  const _SessionRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(
          icon,
          size: 16,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
        const SizedBox(width: AppSpacing.sm),
        Text(
          '$label: ',
          style: AppTextStyles.bodySm.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600),
        ),
        Expanded(
          child: Text(
            value,
            style: AppTextStyles.bodySm
                .copyWith(color: Theme.of(context).colorScheme.onSurface),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

class _DangerStatCard extends StatelessWidget {
  const _DangerStatCard({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: AppSurfaces.subtle(context),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppColors.error),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: AppTextStyles.labelSm.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                Text(
                  value,
                  style: AppTextStyles.body.copyWith(
                    fontWeight: FontWeight.w700,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
