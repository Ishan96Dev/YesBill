import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../providers/core_providers.dart';
import '../../widgets/auth_widgets.dart';
import '../../widgets/common/app_background_effects.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;

  static const _pages = [
    _OnboardingPage(
      imagePath: 'assets/onboarding/onboarding_1_welcome.png',
      title: 'Welcome to YesBill',
      description:
          'Your personal daily billing tracker for every household service. Smart, simple, and always in sync.',
    ),
    _OnboardingPage(
      imagePath: 'assets/onboarding/onboarding_2_services.png',
      title: 'Add Your Services',
      description:
          'Set up milk, newspapers, internet, cleaning, tiffin, and any recurring service in seconds.',
    ),
    _OnboardingPage(
      imagePath: 'assets/onboarding/onboarding_3_calendar.png',
      title: 'Mark What Arrived',
      description:
          'Tap once each day to log what was delivered. Your billing calendar fills automatically.',
    ),
    _OnboardingPage(
      imagePath: 'assets/onboarding/onboarding_4_bills.png',
      title: 'Instant Monthly Bills',
      description:
          'Generate your complete bill in one tap at the end of the month. Share it as a PDF.',
    ),
    _OnboardingPage(
      imagePath: 'assets/onboarding/onboarding_5_ai.png',
      title: 'AI That Gets Your Bills',
      description:
          'Chat with YesBill AI for spending summaries, smart tips, and insights about your services.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceDark,
      body: Stack(
        children: [
          const AppBackgroundEffects(),
          SafeArea(
            child: Column(
          children: [
            // YesBill brand logo — mirrors the login screen
            Padding(
              padding: const EdgeInsets.only(top: 20, bottom: 8),
              child: const AuthBrandLogo(size: 56)
                  .animate()
                  .fadeIn(duration: 400.ms)
                  .scale(
                    begin: const Offset(0.88, 0.88),
                    end: const Offset(1, 1),
                    duration: 400.ms,
                    curve: Curves.easeOut,
                  ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                onPageChanged: (i) => setState(() => _page = i),
                itemCount: _pages.length,
                itemBuilder: (_, i) => _OnboardingPageView(page: _pages[i]),
              ),
            ),
            _BottomControls(
              currentPage: _page,
              total: _pages.length,
              onNext: _next,
              onSkip: _finish,
            ),
            const Gap(24),
          ],
        ),
          ),
        ],
      ),
    );
  }

  void _next() {
    if (_page < _pages.length - 1) {
      _controller.nextPage(
          duration: 400.ms, curve: Curves.easeInOut);
    } else {
      _finish();
    }
  }

  Future<void> _finish() async {
    await ref.read(preferencesProvider).setOnboardingCompleted(true);
    if (mounted) context.go('/login');
  }
}

class _OnboardingPage {
  const _OnboardingPage({
    required this.imagePath,
    required this.title,
    required this.description,
  });
  final String imagePath;
  final String title;
  final String description;
}

class _OnboardingPageView extends StatelessWidget {
  const _OnboardingPageView({required this.page});
  final _OnboardingPage page;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Expanded(
            flex: 5,
            child: Image.asset(
              page.imagePath,
              fit: BoxFit.contain,
            ).animate().fadeIn(duration: 400.ms).scale(
                  begin: const Offset(0.92, 0.92),
                  end: const Offset(1, 1),
                  duration: 400.ms,
                  curve: Curves.easeOut,
                ),
          ),
          const Spacer(),
          Text(
            page.title,
            style: AppTextStyles.h1,
            textAlign: TextAlign.center,
          ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),
          const Gap(12),
          Text(
            page.description,
            style: AppTextStyles.bodyLg
                .copyWith(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ).animate().fadeIn(delay: 350.ms),
          const Spacer(),
        ],
      ),
    );
  }
}

class _BottomControls extends StatelessWidget {
  const _BottomControls({
    required this.currentPage,
    required this.total,
    required this.onNext,
    required this.onSkip,
  });
  final int currentPage;
  final int total;
  final VoidCallback onNext;
  final VoidCallback onSkip;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.base),
      child: Column(
        children: [
          // Page indicators
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(total, (i) {
              return AnimatedContainer(
                duration: 300.ms,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: i == currentPage ? 24 : 8,
                height: 8,
                decoration: BoxDecoration(
                  color: i == currentPage
                      ? AppColors.primary
                      : AppColors.pending,
                  borderRadius: BorderRadius.circular(4),
                ),
              );
            }),
          ),
          const Gap(24),
          FilledButton(
            onPressed: onNext,
            child: Text(
              currentPage == total - 1 ? 'Get Started' : 'Next',
            ),
          ),
          const Gap(12),
          if (currentPage < total - 1)
            TextButton(onPressed: onSkip, child: const Text('Skip')),
        ],
      ),
    );
  }
}
