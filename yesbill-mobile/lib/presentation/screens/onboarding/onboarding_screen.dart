import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_gradients.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../providers/core_providers.dart';

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
      icon: LucideIcons.package,
      title: 'Track Your Services',
      description:
          'Add all your recurring household services — milk, newspapers, internet, tiffin, and more.',
    ),
    _OnboardingPage(
      icon: LucideIcons.calendarCheck,
      title: 'Mark Daily Deliveries',
      description:
          'Tap on any day to record which services were delivered, skipped, or pending.',
    ),
    _OnboardingPage(
      icon: LucideIcons.sparkles,
      title: 'AI-Powered Bills',
      description:
          'Generate accurate monthly bills instantly with AI. Get insights and recommendations on your spending.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
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
    required this.icon,
    required this.title,
    required this.description,
  });
  final IconData icon;
  final String title;
  final String description;
}

class _OnboardingPageView extends StatelessWidget {
  const _OnboardingPageView({required this.page});
  final _OnboardingPage page;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              gradient: AppGradients.primary,
              borderRadius: BorderRadius.circular(28),
            ),
            child: Icon(page.icon, color: Colors.white, size: 48),
          ).animate().fadeIn().scale(begin: const Offset(0.8, 0.8)),
          const Gap(40),
          Text(
            page.title,
            style: AppTextStyles.h1,
            textAlign: TextAlign.center,
          ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),
          const Gap(16),
          Text(
            page.description,
            style: AppTextStyles.bodyLg
                .copyWith(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ).animate().fadeIn(delay: 350.ms),
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
