import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/validators.dart';

class AuthBrandLogo extends StatelessWidget {
  const AuthBrandLogo({super.key, this.size = 80});

  final double size;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(isDark ? 0.96 : 1),
        shape: BoxShape.circle,
        border: Border.all(
          color: isDark
              ? Colors.white.withOpacity(0.12)
              : const Color(0xFFE2E8F0),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.18 : 0.08),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
          BoxShadow(
            color: AppColors.primary.withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: EdgeInsets.all(size * 0.18),
      child: Image.asset(
        'assets/images/yesbill_logo_black.png',
        fit: BoxFit.contain,
        filterQuality: FilterQuality.high,
      ),
    );
  }
}

class AuthHeroImage extends StatelessWidget {
  const AuthHeroImage({
    super.key,
    required this.assetPath,
    required this.height,
  });

  final String assetPath;
  final double height;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isDark
              ? Colors.white.withOpacity(0.08)
              : const Color(0xFFE2E8F0).withOpacity(0.85),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.18 : 0.08),
            blurRadius: 22,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: Image.asset(
          assetPath,
          width: double.infinity,
          height: height,
          fit: BoxFit.cover,
        ),
      ),
    );
  }
}

// ── Stitch-style input field ──────────────────────────────────────────────────
class AuthInputField extends StatelessWidget {
  const AuthInputField({
    super.key,
    required this.controller,
    required this.label,
    required this.prefixIcon,
    this.keyboardType,
    this.textInputAction,
    this.obscureText = false,
    this.onFieldSubmitted,
    this.validator,
    this.suffixIcon,
    this.autofillHints,
    this.onChanged,
  });

  final TextEditingController controller;
  final String label;
  final IconData prefixIcon;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final bool obscureText;
  final ValueChanged<String>? onFieldSubmitted;
  final FormFieldValidator<String>? validator;
  final Widget? suffixIcon;
  final Iterable<String>? autofillHints;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = cs.brightness == Brightness.dark;
    final fillColor = isDark ? cs.surfaceContainerHigh : Colors.white;
    final textColor = isDark ? cs.onSurface : const Color(0xFF2D3337);
    final labelColor = isDark ? cs.onSurfaceVariant : const Color(0xFF757C7F);
    final borderColor = isDark
        ? cs.outline.withOpacity(0.35)
        : const Color(0xFFACB3B7).withOpacity(0.25);
    final focusBorder = AppColors.primary;

    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      textInputAction: textInputAction,
      obscureText: obscureText,
      onFieldSubmitted: onFieldSubmitted,
      validator: validator,
      autofillHints: autofillHints,
      onChanged: onChanged,
      style: TextStyle(
        color: textColor,
        fontSize: 15,
        fontWeight: FontWeight.w400,
      ),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(
          color: labelColor,
          fontSize: 14,
        ),
        filled: true,
        fillColor: fillColor,
        prefixIcon: Padding(
          padding: const EdgeInsets.only(left: 16, right: 10),
          child: Icon(prefixIcon, size: 18, color: labelColor),
        ),
        prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
        suffixIcon: suffixIcon,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: focusBorder, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFFEF4444)),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.5),
        ),
      ),
    );
  }
}

// ── Primary pill button ───────────────────────────────────────────────────────
class AuthPrimaryButton extends StatelessWidget {
  const AuthPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          shadowColor: Colors.transparent,
          shape: const StadiumBorder(),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.2,
          ),
        ),
        child: isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            : Text(label),
      ),
    );
  }
}

// ── Google sign-in button ─────────────────────────────────────────────────────
class AuthGoogleButton extends StatelessWidget {
  const AuthGoogleButton({super.key, required this.onPressed, this.isLoading = false});

  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = cs.brightness == Brightness.dark;
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: isDark ? cs.onSurface : const Color(0xFF2D3337),
          backgroundColor: isDark ? cs.surfaceContainerHigh : Colors.white,
          side: BorderSide(
            color: isDark
                ? cs.outline.withOpacity(0.4)
                : const Color(0xFFACB3B7).withOpacity(0.35),
          ),
          shape: const StadiumBorder(),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w500,
          ),
        ),
        child: isLoading
            ? SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: cs.onSurface.withOpacity(0.6),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset('assets/images/google.png', width: 20, height: 20),
                  const SizedBox(width: 10),
                  const Text('Continue with Google'),
                ],
              ),
      ),
    );
  }
}

// ── Password strength bar ────────────────────────────────────────────────────
class PasswordStrengthIndicator extends StatelessWidget {
  const PasswordStrengthIndicator({super.key, required this.password});

  final String password;

  @override
  Widget build(BuildContext context) {
    if (password.isEmpty) return const SizedBox.shrink();
    final s = Validators.passwordStrengthScore(password);
    final Color barColor;
    final String label;
    switch (s) {
      case 1:
      case 2:
        barColor = const Color(0xFFEF4444);
        label = 'Weak';
      case 3:
        barColor = const Color(0xFFF59E0B);
        label = 'Fair';
      case 4:
        barColor = const Color(0xFF10B981);
        label = 'Good';
      default:
        barColor = const Color(0xFF059669);
        label = 'Strong';
    }
    final fraction = s / 5.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: fraction,
            minHeight: 4,
            backgroundColor: Theme.of(context).colorScheme.outlineVariant.withOpacity(0.3),
            valueColor: AlwaysStoppedAnimation(barColor),
          ),
        ),
        const SizedBox(height: 4),
        Wrap(
          spacing: 10,
          runSpacing: 6,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            _RequirementDot(
              met: Validators.hasMinPasswordLength(password),
              label: '8+ chars',
            ),
            _RequirementDot(
              met: Validators.hasUppercase(password),
              label: 'Uppercase',
            ),
            _RequirementDot(
              met: Validators.hasLowercase(password),
              label: 'Lowercase',
            ),
            _RequirementDot(
              met: Validators.hasNumber(password),
              label: 'Number',
            ),
            _RequirementDot(
              met: Validators.hasSpecialCharacter(password),
              label: 'Symbol',
            ),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: barColor,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class ApiKeyStrengthIndicator extends StatelessWidget {
  const ApiKeyStrengthIndicator({
    super.key,
    required this.value,
    this.provider,
    this.hasStoredValidKey = false,
  });

  final String value;
  final String? provider;
  final bool hasStoredValidKey;

  @override
  Widget build(BuildContext context) {
    final trimmed = value.trim();
    final expectedPrefix = Validators.apiKeyExpectedPrefix(provider);

    if (trimmed.isEmpty && !hasStoredValidKey) {
      return Text(
        expectedPrefix == null
            ? 'Paste your API key to validate the format before saving.'
            : 'Expected format starts with $expectedPrefix.',
        style: TextStyle(
          fontSize: 12,
          color: Theme.of(context)
              .colorScheme
              .onSurfaceVariant
              .withOpacity(0.8),
        ),
      );
    }

    final prefixOk = Validators.apiKeyHasExpectedPrefix(
      trimmed,
      provider: provider,
    );
    final lengthOk = Validators.apiKeyHasHealthyLength(trimmed);
    final whitespaceOk = trimmed.isEmpty
        ? hasStoredValidKey
        : Validators.apiKeyHasNoWhitespace(trimmed);

    return Wrap(
      spacing: 10,
      runSpacing: 6,
      children: [
        if (hasStoredValidKey && trimmed.isEmpty)
          const _RequirementDot(met: true, label: 'Saved key active'),
        _RequirementDot(met: lengthOk || hasStoredValidKey, label: '20+ chars'),
        _RequirementDot(
          met: prefixOk || expectedPrefix == null || hasStoredValidKey,
          label: expectedPrefix == null ? 'Provider format' : expectedPrefix,
        ),
        _RequirementDot(
          met: whitespaceOk,
          label: 'No spaces',
        ),
      ],
    );
  }
}

class _RequirementDot extends StatelessWidget {
  const _RequirementDot({required this.met, required this.label});
  final bool met;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          met ? LucideIcons.check : LucideIcons.x,
          size: 10,
          color: met ? const Color(0xFF10B981) : Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.45),
        ),
        const SizedBox(width: 3),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: met
                ? const Color(0xFF10B981)
                : Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.6),
          ),
        ),
      ],
    );
  }
}
