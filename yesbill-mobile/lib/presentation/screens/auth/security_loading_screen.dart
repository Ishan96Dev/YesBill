import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../widgets/auth_widgets.dart';

class SecurityLoadingScreen extends StatelessWidget {
  const SecurityLoadingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        color: const Color(0xFFEFF1F6),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(22, 16, 22, 24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(
                  width: 126,
                  height: 126,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      const SizedBox(
                        width: 126,
                        height: 126,
                        child: CircularProgressIndicator(
                          strokeWidth: 4,
                          value: 0.62,
                          valueColor: AlwaysStoppedAnimation(AppColors.primary),
                          backgroundColor: Color(0xFFD7DCEC),
                        ),
                      ),
                      Container(
                        width: 74,
                        height: 74,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF7F8FB),
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0xFFD9DFEF)),
                        ),
                        padding: const EdgeInsets.all(14),
                        child: Image.asset(
                          'assets/images/yesbill_logo_black.png',
                          fit: BoxFit.contain,
                          filterQuality: FilterQuality.high,
                        ),
                      ),
                    ],
                  ),
                )
                    .animate()
                    .fadeIn(duration: 320.ms)
                    .scale(begin: const Offset(0.96, 0.96)),
                const SizedBox(height: 22),
                Text(
                  'Verifying...',
                  style: AppTextStyles.h2.copyWith(
                    color: AppColors.textPrimaryLight,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Securing your connection to YesBill.\nThis ensures your financial data remains\nprivate and protected.',
                  textAlign: TextAlign.center,
                  style: AppTextStyles.bodySm.copyWith(
                    color: AppColors.textSecondaryLight,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 22),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: const LinearProgressIndicator(
                    minHeight: 4,
                    value: 0.62,
                    color: AppColors.primary,
                    backgroundColor: Color(0xFFD7DCEC),
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      LucideIcons.shieldCheck,
                      size: 12,
                      color: Color(0xFF0F8A62),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'BANK-GRADE SECURITY',
                      style: AppTextStyles.labelSm.copyWith(
                        color: AppColors.textSecondaryLight,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF7F8FB),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: const Color(0xFFDDE3F2)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 30,
                        height: 30,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primary.withOpacity(0.14),
                        ),
                        alignment: Alignment.center,
                        child: const Icon(
                          LucideIcons.shield,
                          size: 14,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'PROACTIVE SHIELD',
                              style: AppTextStyles.labelSm.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              'We\'re encrypting your credentials using AES-256 protocols.',
                              style: AppTextStyles.labelSm.copyWith(
                                color: AppColors.textSecondaryLight,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 22),
                const AuthBrandLogo(size: 56),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
