import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/service_icons.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_surfaces.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../data/models/user_service.dart';
import '../../../providers/services_provider.dart';
import '../../widgets/common/error_retry_view.dart';
import '../../widgets/common/loading_shimmer.dart';
import '../../widgets/common/yesbill_loading_widget.dart';

class ServicesScreen extends ConsumerWidget {
  const ServicesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final servicesAsync = ref.watch(userServicesProvider);

    return RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(userServicesProvider);
          ref.invalidate(activeServicesProvider);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 132),
          children: [
            Text(
              'YOUR ECOSYSTEM',
              style: AppTextStyles.labelSm.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.4,
              ),
            ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.05, end: 0),
            const SizedBox(height: 4),
            Text(
              'Manage Services',
              style: AppTextStyles.h1.copyWith(
                color: Theme.of(context).colorScheme.onSurface,
                fontWeight: FontWeight.w700,
              ),
            ).animate(delay: 60.ms).fadeIn(duration: 280.ms).slideY(begin: 0.05, end: 0),
            Text(
              'Review and manage your active digital and physical subscriptions.',
              style: AppTextStyles.bodySm.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ).animate(delay: 100.ms).fadeIn(duration: 260.ms),
            const SizedBox(height: 16),
            servicesAsync.when(
              loading: () => const YesBillLoadingWidget(
                label: 'Loading Services...',
                sublabel: 'Fetching your subscriptions',
              ),
              error: (error, _) => ErrorRetryView(
                error: error,
                onRetry: () => ref.invalidate(userServicesProvider),
              ),
              data: (services) {
                if (services.isEmpty) {
                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: _servicesCardColor(context),
                      borderRadius: BorderRadius.circular(16),
                      border: _servicesCardBorder(context),
                      boxShadow: AppSurfaces.softShadow(context),
                    ),
                    child: Text(
                      'No services found yet. Tap + to add your first one.',
                      style: AppTextStyles.body.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  );
                }

                return _ServicesBody(services: services);
              },
            ),
          ],
        ),
    );
  }
}

class _ServicesBody extends StatelessWidget {
  const _ServicesBody({required this.services});

  final List<UserService> services;

  @override
  Widget build(BuildContext context) {
    final primary = services.firstWhere(
      (service) => service.active,
      orElse: () => services.first,
    );

    final remaining = services.where((service) => service.id != primary.id).toList();

    return Column(
      children: [
        _PrimaryServiceCard(service: primary),
        if (remaining.isNotEmpty) ...[
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: _servicesCardColor(context),
              borderRadius: BorderRadius.circular(18),
              border: _servicesCardBorder(context),
              boxShadow: AppSurfaces.softShadow(context),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Other services',
                  style: AppTextStyles.h4.copyWith(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'The rest of your stack, grouped neatly instead of vanishing into the void.',
                  style: AppTextStyles.bodySm.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 12),
                ...remaining.map(
                  (service) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _ServiceRow(service: service),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 6),
        _RecommendationCard(
          potentialSavings: services.fold<double>(
            0,
            (sum, service) => sum + (service.price * 0.1),
          ),
          onTap: () => context.push('/chat'),
        ),
      ],
    );
  }
}

class _RoleBadge extends StatelessWidget {
  const _RoleBadge({required this.isProvider});

  final bool isProvider;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: isProvider
            ? const Color(0xFFD1FAE5)
            : const Color(0xFFDDE9FF),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        isProvider ? 'PROVIDER' : 'CONSUMER',
        style: AppTextStyles.labelSm.copyWith(
          color: isProvider ? const Color(0xFF065F46) : const Color(0xFF3730A3),
          fontWeight: FontWeight.w700,
          fontSize: 9,
        ),
      ),
    );
  }
}

class _PrimaryServiceCard extends StatelessWidget {
  const _PrimaryServiceCard({required this.service});

  final UserService service;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _servicesCardColor(context),
        borderRadius: BorderRadius.circular(20),
        border: _servicesCardBorder(context),
          boxShadow: AppSurfaces.softShadow(context),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: const BoxDecoration(
                  color: Color(0xFFF1F4FF),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  ServiceIcons.fromName(service.iconName),
                  size: 17,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
              const Spacer(),
              _RoleBadge(isProvider: service.isProvider),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.success.withOpacity(0.14),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  service.active ? '● ACTIVE' : 'PAUSED',
                  style: AppTextStyles.labelSm.copyWith(
                    color: service.active ? AppColors.success : AppColors.warning,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            service.name,
            style: AppTextStyles.h4.copyWith(
              color: Theme.of(context).colorScheme.onSurface,
              fontWeight: FontWeight.w700,
            ),
          ),
          Text(
            service.deliveryTypeLabel,
            style: AppTextStyles.bodySm.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            CurrencyFormatter.formatCompact(service.price),
            style: AppTextStyles.h2.copyWith(
              color: AppColors.primary,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Text(
                'Next billing: day ${service.billingDay}',
                style: AppTextStyles.labelSm.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: () => context.push('/services/${service.id}'),
                child: Text(
                  'MANAGE',
                  style: AppTextStyles.label.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MiniServiceCard extends StatelessWidget {
  const _MiniServiceCard({required this.service});

  final UserService service;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.push('/services/${service.id}'),
      borderRadius: BorderRadius.circular(18),
      child: Ink(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: _servicesCardColor(context),
          borderRadius: BorderRadius.circular(18),
          border: _servicesCardBorder(context),
          boxShadow: AppSurfaces.softShadow(context),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                shape: BoxShape.circle,
              ),
              child: Icon(
                ServiceIcons.fromName(service.iconName),
                size: 14,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              service.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.body.copyWith(
                color: Theme.of(context).colorScheme.onSurface,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              service.deliveryTypeLabel,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.labelSm.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              CurrencyFormatter.formatCompact(service.price),
              style: AppTextStyles.h4.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            _RoleBadge(isProvider: service.isProvider),
          ],
        ),
      ),
    );
  }
}

class _ServiceRow extends StatelessWidget {
  const _ServiceRow({required this.service});

  final UserService service;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.push('/services/${service.id}'),
      borderRadius: BorderRadius.circular(16),
      child: Ink(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: _servicesCardColor(context),
          borderRadius: BorderRadius.circular(16),
          border: _servicesCardBorder(context),
          boxShadow: AppSurfaces.softShadow(context),
        ),
        child: Row(
          children: [
            Container(
              width: 30,
              height: 30,
              decoration: const BoxDecoration(
                color: Color(0xFFF1F4FF),
                shape: BoxShape.circle,
              ),
              child: Icon(
                ServiceIcons.fromName(service.iconName),
                size: 14,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    service.name,
                    style: AppTextStyles.body.copyWith(
                      color: Theme.of(context).colorScheme.onSurface,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    'Billing day ${service.billingDay}',
                    style: AppTextStyles.labelSm.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  CurrencyFormatter.formatCompact(service.price),
                  style: AppTextStyles.body.copyWith(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  service.active ? 'ACTIVE' : 'PAUSED',
                  style: AppTextStyles.labelSm.copyWith(
                    color: service.active ? AppColors.success : AppColors.warning,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                _RoleBadge(isProvider: service.isProvider),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _RecommendationCard extends StatelessWidget {
  const _RecommendationCard({
    required this.potentialSavings,
    required this.onTap,
  });

  final double potentialSavings;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.primary, AppColors.purple],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'MONTHLY INSIGHT',
            style: AppTextStyles.labelSm.copyWith(
              color: Colors.white.withOpacity(0.9),
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'You could save ${CurrencyFormatter.formatCompact(potentialSavings)} by canceling unused trials.',
            style: AppTextStyles.body.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: onTap,
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: Colors.white.withOpacity(0.55)),
              foregroundColor: Colors.white,
            ),
            child: const Text('VIEW RECOMMENDATIONS'),
          ),
        ],
      ),
    );
  }
}

  Color _servicesCardColor(BuildContext context) =>
    AppSurfaces.panel(context);

  BoxBorder _servicesCardBorder(BuildContext context) =>
    AppSurfaces.cardBorder(context);
