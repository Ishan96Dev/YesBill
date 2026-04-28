import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/constants/service_icons.dart';
import '../../../core/extensions/date_extensions.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_surfaces.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../data/models/service_confirmation.dart';
import '../../../data/models/user_service.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/bills_provider.dart';
import '../../../providers/calendar_provider.dart';
import '../../../providers/dashboard_provider.dart';
import '../../../providers/services_provider.dart';
import '../../widgets/common/error_retry_view.dart';
import '../../widgets/common/loading_shimmer.dart';
import '../../widgets/common/yesbill_loading_widget.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final servicesAsync = ref.watch(activeServicesProvider);
    final statsAsync = ref.watch(dashboardStatsProvider);
    final billsAsync = ref.watch(generatedBillsProvider);

    final now = DateTime.now();
    final yearMonth = '${now.year}-${now.month.toString().padLeft(2, '0')}';
    final todayKey = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    final confirmationsAsync = ref.watch(monthConfirmationsProvider(yearMonth));
    final monthConfirmations =
        confirmationsAsync.valueOrNull ?? const <ServiceConfirmation>[];
    final activeServices = servicesAsync.valueOrNull ?? const <UserService>[];

    final serviceMap = {
      for (final service in activeServices) service.id: service,
    };
    final todayServices = activeServices
        .where((service) => _isServiceScheduledOnDate(service, now))
        .toList()
      ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
    final serviceBreakdown = _buildServiceBreakdown(
      services: activeServices,
      confirmations: monthConfirmations,
    );
    final recentActivity = _buildRecentActivity(
      serviceMap: serviceMap,
      confirmations: monthConfirmations,
    );

    // Build today's delivery status map: serviceId → status
    final todayStatusMap = <String, String>{};
    for (final c in monthConfirmations) {
      if (c.date == todayKey) {
        todayStatusMap[c.serviceId] = c.status;
      }
    }

    // Resolve display name from OAuth/profile metadata, fall back to email prefix.
    final meta = user?.userMetadata;
    final displayName = (() {
      for (final key in ['full_name', 'name', 'display_name']) {
        final v = meta?[key] as String?;
        if (v != null && v.trim().isNotEmpty) return v.trim();
      }
      return null;
    })();

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(activeServicesProvider);
        ref.invalidate(generatedBillsProvider);
        ref.invalidate(dashboardStatsProvider);
        ref.invalidate(monthConfirmationsProvider(yearMonth));
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 132),
        children: [
          _DashboardHero(
            displayName: displayName,
            email: user?.email,
            billsDueCount: billsAsync.valueOrNull?.where((bill) => !bill.isPaid).length,
            todayLabel: now.toFullDate(),
            activeTodayCount: todayServices.length,
            onAddService: () => context.push('/services/add'),
            onOpenCalendar: () => context.go('/calendar'),
          ).animate().fadeIn(duration: 350.ms).slideY(begin: 0.06, end: 0),
          const SizedBox(height: 12),
          _TopStatRow(
            statsAsync: statsAsync,
            onRetry: () => ref.invalidate(dashboardStatsProvider),
          ).animate(delay: 80.ms).fadeIn(duration: 300.ms).slideY(begin: 0.06, end: 0),
          const SizedBox(height: 8),
          if (statsAsync.valueOrNull?.hasProviderServices == true) ...[  
            _NetBalanceCard(stats: statsAsync.valueOrNull!),
            const SizedBox(height: 8),
          ],
          _FeaturedBillingCard(
            servicesAsync: servicesAsync,
            onTap: () => context.push('/bills/generate'),
          ).animate(delay: 160.ms).fadeIn(duration: 320.ms),
          const SizedBox(height: 10),
          _DashboardQuickActions(
            onAddService: () => context.push('/services/add'),
            onOpenCalendar: () => context.go('/calendar'),
            onOpenAnalytics: () => context.go('/analytics'),
            onGenerateBill: () => context.push('/bills/generate'),
            onOpenAskAi: () => context.go('/chat'),
          ).animate(delay: 220.ms).fadeIn(duration: 320.ms).slideY(begin: 0.06, end: 0),
          const SizedBox(height: 10),
          Row(
            children: [
              Text(
                'Today\'s Services',
                style: AppTextStyles.h4.copyWith(
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: () => context.go('/calendar'),
                child: Text(
                  'OPEN CALENDAR',
                  style: AppTextStyles.label.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          _ServicePreview(
            servicesAsync: servicesAsync,
            services: todayServices,
            todayStatusMap: todayStatusMap,
            onRetry: () => ref.invalidate(activeServicesProvider),
            onOpenService: (service) => context.push('/calendar/${service.id}'),
          ),
          const SizedBox(height: 16),
          Text(
            'Upcoming Renewals',
            style: AppTextStyles.h4.copyWith(
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          _UpcomingRenewals(
            servicesAsync: servicesAsync,
            onRetry: () => ref.invalidate(activeServicesProvider),
          ),
          const SizedBox(height: 16),
          _DashboardSectionHeader(
            title: 'Service Breakdown',
            actionLabel: 'ANALYTICS',
            onAction: () => context.go('/analytics'),
          ),
          const SizedBox(height: 8),
          _ServiceBreakdownCard(items: serviceBreakdown),
          const SizedBox(height: 16),
          _DashboardSectionHeader(
            title: 'Recent Activity',
            actionLabel: 'VIEW ALL',
            onAction: () => context.go('/calendar'),
          ),
          const SizedBox(height: 8),
          _RecentActivityCard(entries: recentActivity),
        ],
      ),
    );
  }
}

class _DashboardHero extends StatelessWidget {
  const _DashboardHero({
    required this.displayName,
    required this.email,
    required this.billsDueCount,
    required this.todayLabel,
    required this.activeTodayCount,
    required this.onAddService,
    required this.onOpenCalendar,
  });

  final String? displayName;
  final String? email;
  final int? billsDueCount;
  final String todayLabel;
  final int activeTodayCount;
  final VoidCallback onAddService;
  final VoidCallback onOpenCalendar;

  String _resolvedName() {
    if (displayName != null && displayName!.isNotEmpty) return displayName!;
    if (email == null || email!.trim().isEmpty) return 'User';
    final raw = email!.split('@').first.trim();
    if (raw.isEmpty) return 'User';
    return '${raw[0].toUpperCase()}${raw.substring(1)}';
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  }

  @override
  Widget build(BuildContext context) {
    final dueCount = billsDueCount ?? 0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1A4F46E5),
            blurRadius: 16,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${_greeting()}, ${_resolvedName()}',
                      style: AppTextStyles.h2.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      todayLabel,
                      style: AppTextStyles.bodySm.copyWith(
                        color: Colors.white.withValues(alpha: 0.82),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.14),
                  ),
                ),
                child: Text(
                  dueCount == 0 ? 'All caught up' : '$dueCount bills due',
                  style: AppTextStyles.labelSm.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            'You have $activeTodayCount service${activeTodayCount == 1 ? '' : 's'} scheduled today and $dueCount unpaid bill${dueCount == 1 ? '' : 's'} to review.',
            style: AppTextStyles.body.copyWith(
              color: Colors.white.withValues(alpha: 0.92),
              height: 1.45,
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _HeroActionButton(
                label: 'Add Service',
                icon: LucideIcons.plus,
                filled: true,
                onTap: onAddService,
              ),
              _HeroActionButton(
                label: 'Open Calendar',
                icon: LucideIcons.calendar,
                onTap: onOpenCalendar,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroActionButton extends StatelessWidget {
  const _HeroActionButton({
    required this.label,
    required this.icon,
    required this.onTap,
    this.filled = false,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    final foreground = filled ? AppColors.primary : Colors.white;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: onTap,
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: filled
                ? Colors.white
                : Colors.white.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(999),
            border: filled
                ? null
                : Border.all(color: Colors.white.withValues(alpha: 0.16)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: foreground),
              const SizedBox(width: 8),
              Text(
                label,
                style: AppTextStyles.label.copyWith(
                  color: foreground,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TopStatRow extends StatelessWidget {
  const _TopStatRow({required this.statsAsync, required this.onRetry});

  final AsyncValue<DashboardStats> statsAsync;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    if (statsAsync.isLoading) {
      return const ShimmerList(count: 1, itemHeight: 116);
    }
    if (statsAsync.hasError) {
      return ErrorRetryView(error: statsAsync.error!, onRetry: onRetry);
    }

    final stats = statsAsync.valueOrNull ?? const DashboardStats.empty();

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      childAspectRatio: 1.75,
      padding: EdgeInsets.zero,
      children: [
        _StatPill(
          title: 'MONTH SPEND',
          value: CurrencyFormatter.formatCompact(stats.totalMonthSpend),
          subtitle: '${stats.deliveredThisMonth} delivered',
          icon: LucideIcons.wallet,
          accent: const Color(0xFFF97316),
        ),
        _StatPill(
          title: 'DELIVERY RATE',
          value: '${stats.deliveryRate.toStringAsFixed(1)}%',
          subtitle: '${stats.deliveredThisMonth + stats.skippedThisMonth} tracked',
          icon: LucideIcons.trendingUp,
          accent: const Color(0xFF22C55E),
        ),
        _StatPill(
          title: 'ACTIVE SERVICES',
          value: '${stats.activeServicesCount}',
          subtitle: 'tracking now',
          icon: LucideIcons.zap,
          accent: const Color(0xFF6366F1),
        ),
        _StatPill(
          title: 'SKIPPED',
          value: '${stats.skippedThisMonth}',
          subtitle: 'this month',
          icon: LucideIcons.xCircle,
          accent: const Color(0xFFF43F5E),
        ),
      ],
    );
  }
}

class _NetBalanceCard extends StatelessWidget {
  const _NetBalanceCard({required this.stats});

  final DashboardStats stats;

  @override
  Widget build(BuildContext context) {
    final isPositive = stats.netBalance >= 0;
    final bgColor = isPositive ? const Color(0xFFECFDF5) : const Color(0xFFFFF1F2);
    final borderColor = isPositive ? const Color(0xFF6EE7B7) : const Color(0xFFFDA4AF);
    final iconColor = isPositive ? const Color(0xFF059669) : const Color(0xFFE11D48);
    final valueColor = isPositive ? const Color(0xFF047857) : const Color(0xFFBE123C);
    final sign = isPositive ? '+' : '';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor, width: 1),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isPositive ? const Color(0xFFD1FAE5) : const Color(0xFFFFE4E6),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isPositive ? LucideIcons.trendingUp : LucideIcons.trendingDown,
              size: 18,
              color: iconColor,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Net Balance — This Month',
                  style: AppTextStyles.labelSm.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '$sign${CurrencyFormatter.formatCompact(stats.netBalance.abs())}',
                  style: AppTextStyles.h3.copyWith(
                    color: valueColor,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                children: [
                  const Icon(LucideIcons.briefcase,
                      size: 11, color: Color(0xFF059669)),
                  const SizedBox(width: 4),
                  Text(
                    CurrencyFormatter.formatCompact(stats.providerMonthIncome),
                    style: AppTextStyles.labelSm.copyWith(
                      color: const Color(0xFF059669),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(LucideIcons.wallet,
                      size: 11, color: Color(0xFF6366F1)),
                  const SizedBox(width: 4),
                  Text(
                    CurrencyFormatter.formatCompact(stats.totalMonthSpend),
                    style: AppTextStyles.labelSm.copyWith(
                      color: const Color(0xFF6366F1),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatPill extends StatelessWidget {
  const _StatPill({
    required this.title,
    required this.value,
    required this.icon,
    required this.accent,
    this.subtitle,
  });

  final String title;
  final String value;
  final IconData icon;
  final Color accent;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: _dashboardCardColor(context),
        borderRadius: BorderRadius.circular(16),
        border: _dashboardCardBorder(context),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F2D3337),
            blurRadius: 12,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Text(
                  title,
                  style: AppTextStyles.labelSm.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    letterSpacing: 0.3,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 13, color: accent),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: AppTextStyles.h4.copyWith(
              color: Theme.of(context).colorScheme.onSurface,
              fontWeight: FontWeight.w700,
            ),
          ),
          if (subtitle != null)
            Text(
              subtitle!,
              style: AppTextStyles.labelSm.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
        ],
      ),
    );
  }
}

class _FeaturedBillingCard extends StatelessWidget {
  const _FeaturedBillingCard({
    required this.servicesAsync,
    required this.onTap,
  });

  final AsyncValue<List<UserService>> servicesAsync;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final service = servicesAsync.valueOrNull?.isNotEmpty == true
        ? servicesAsync.valueOrNull!.first
        : null;

    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [AppColors.primary, AppColors.purple],
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 14, 18, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    service == null
                        ? 'SERVICE'
                        : service.name.toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.3,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  CurrencyFormatter.formatCompact(service?.price ?? 142),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 29,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  service == null
                      ? 'Due in 4 hours • Metro Grid Corp'
                      : 'Due on billing day ${service.billingDay} • ${service.deliveryTypeLabel}',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.92),
                    fontSize: 12.5,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          'Generate Bill',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ServicePreview extends StatelessWidget {
  const _ServicePreview({
    required this.servicesAsync,
    required this.services,
    required this.todayStatusMap,
    required this.onRetry,
    required this.onOpenService,
  });

  final AsyncValue<List<UserService>> servicesAsync;
  final List<UserService> services;
  final Map<String, String> todayStatusMap;
  final VoidCallback onRetry;
  final ValueChanged<UserService> onOpenService;

  @override
  Widget build(BuildContext context) {
    return servicesAsync.when(
      loading: () => const ShimmerList(count: 2, itemHeight: 72),
      error: (error, _) => ErrorRetryView(error: error, onRetry: onRetry),
      data: (_) {
        if (services.isEmpty) {
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _dashboardCardColor(context),
              borderRadius: BorderRadius.circular(16),
              border: _dashboardCardBorder(context),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x0A2D3337),
                  blurRadius: 16,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    LucideIcons.calendarX2,
                    size: 18,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'No services are scheduled for today. Enjoy the rare silence.',
                    style: AppTextStyles.bodySm.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ),
          );
        }

        return Column(
          children: services.take(4).map((service) {
            final status = todayStatusMap[service.id] ?? 'pending';
            final isDelivered = status == 'delivered';
            final isSkipped = status == 'skipped';

            final bgColor = isDelivered
                ? const Color(0xFFF0FDF4)
                : isSkipped
                    ? const Color(0xFFFFF1F2)
                : _dashboardCardColor(context);
            final borderColor = isDelivered
                ? const Color(0xFF86EFAC)
                : isSkipped
                    ? const Color(0xFFFCA5A5)
                : (Theme.of(context).brightness == Brightness.dark
                  ? AppColors.cardDarkBorder
                  : const Color(0xFFE5E7EB));
            final statusColor = isDelivered
                ? AppColors.success
                : isSkipped
                    ? AppColors.error
                    : Theme.of(context).colorScheme.onSurfaceVariant;
            final statusLabel = isDelivered
                ? service.deliveredLabel.toUpperCase()
                : isSkipped
                    ? service.skippedLabel.toUpperCase()
                    : 'PENDING';

            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: borderColor, width: 1),
              ),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.8),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      ServiceIcons.fromName(service.iconName),
                      size: 18,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          service.name,
                          style: AppTextStyles.bodyLg.copyWith(
                            color: Theme.of(context).colorScheme.onSurface,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          '${service.deliveryTypeLabel} • $statusLabel',
                          style: AppTextStyles.labelSm.copyWith(
                            color: statusColor,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
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
                      const SizedBox(height: 6),
                      InkWell(
                        onTap: () => onOpenService(service),
                        borderRadius: BorderRadius.circular(999),
                        child: Ink(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                LucideIcons.arrowUpRight,
                                size: 12,
                                color: AppColors.primary,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'Open',
                                style: AppTextStyles.labelSm.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }).toList(),
        );
      },
    );
  }
}

class _UpcomingRenewals extends StatelessWidget {
  const _UpcomingRenewals({required this.servicesAsync, required this.onRetry});

  final AsyncValue<List<UserService>> servicesAsync;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return servicesAsync.when(
      loading: () => const ShimmerList(count: 3, itemHeight: 58),
      error: (error, _) => ErrorRetryView(error: error, onRetry: onRetry),
      data: (services) {
        final billableServices = services
            .where((s) => s.isMonthly || s.isYearly)
            .toList()
          ..sort(
            (a, b) => _nextBillingDateForService(a)
                .compareTo(_nextBillingDateForService(b)),
          );

        if (billableServices.isEmpty) {
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _dashboardCardColor(context),
              borderRadius: BorderRadius.circular(16),
              border: _dashboardCardBorder(context),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x0A2D3337),
                  blurRadius: 16,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Text(
              'No monthly or yearly services are ready for billing yet.',
              style: AppTextStyles.bodySm.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          );
        }

        return Column(
          children: billableServices.take(3).map((service) {
            final nextBilling = _nextBillingDateForService(service);
            final daysUntil = nextBilling
                .difference(DateTime.now())
                .inDays;

            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: _dashboardCardColor(context),
                borderRadius: BorderRadius.circular(16),
                border: _dashboardCardBorder(context),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x0A2D3337),
                    blurRadius: 16,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Color(0xFFF1F4FF),
                    ),
                    child: Icon(
                      ServiceIcons.fromName(service.iconName),
                      size: 13,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          service.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTextStyles.bodySm.copyWith(
                            color: Theme.of(context).colorScheme.onSurface,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          '${service.isYearly ? 'YEARLY' : 'MONTHLY'} • ${nextBilling.toShortDate()}',
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
                        style: AppTextStyles.bodySm.copyWith(
                          color: Theme.of(context).colorScheme.onSurface,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        daysUntil <= 0
                            ? 'Due today'
                            : 'In $daysUntil day${daysUntil == 1 ? '' : 's'}',
                        style: AppTextStyles.labelSm.copyWith(
                          color: daysUntil <= 3
                              ? const Color(0xFFD97706)
                              : Theme.of(context)
                                  .colorScheme
                                  .onSurfaceVariant,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }).toList(),
        );
      },
    );
  }
}

class _DashboardSectionHeader extends StatelessWidget {
  const _DashboardSectionHeader({
    required this.title,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          title,
          style: AppTextStyles.h4.copyWith(
            color: Theme.of(context).colorScheme.onSurface,
          ),
        ),
        const Spacer(),
        if (actionLabel != null && onAction != null)
          TextButton(
            onPressed: onAction,
            child: Text(
              actionLabel!,
              style: AppTextStyles.label.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
      ],
    );
  }
}

class _DashboardQuickActions extends StatelessWidget {
  const _DashboardQuickActions({
    required this.onAddService,
    required this.onOpenCalendar,
    required this.onOpenAnalytics,
    required this.onGenerateBill,
    required this.onOpenAskAi,
  });

  final VoidCallback onAddService;
  final VoidCallback onOpenCalendar;
  final VoidCallback onOpenAnalytics;
  final VoidCallback onGenerateBill;
  final VoidCallback onOpenAskAi;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _QuickActionChip(
                icon: LucideIcons.plus,
                label: 'Add Service',
                accent: const Color(0xFF4F46E5),
                onTap: onAddService,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _QuickActionChip(
                icon: LucideIcons.calendarDays,
                label: 'Calendar',
                accent: const Color(0xFF0284C7),
                onTap: onOpenCalendar,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _QuickActionChip(
                icon: LucideIcons.pieChart,
                label: 'Analytics',
                accent: const Color(0xFF9333EA),
                onTap: onOpenAnalytics,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _QuickActionChip(
                icon: LucideIcons.messageSquare,
                label: 'Ask AI',
                accent: const Color(0xFFF97316),
                onTap: onOpenAskAi,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: _QuickActionChip(
            icon: LucideIcons.fileText,
            label: 'Generate Bill',
            accent: const Color(0xFF059669),
            onTap: onGenerateBill,
            fullWidth: true,
          ),
        ),
      ],
    );
  }
}

class _QuickActionChip extends StatelessWidget {
  const _QuickActionChip({
    required this.icon,
    required this.label,
    required this.accent,
    required this.onTap,
    this.fullWidth = false,
  });

  final IconData icon;
  final String label;
  final Color accent;
  final VoidCallback onTap;
  final bool fullWidth;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: _dashboardCardColor(context),
            borderRadius: BorderRadius.circular(18),
            border: _dashboardCardBorder(context),
            boxShadow: const [
              BoxShadow(
                color: Color(0x082D3337),
                blurRadius: 18,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child: Icon(icon, size: 16, color: accent),
              ),
              const SizedBox(width: 10),
              Text(
                label,
                style: AppTextStyles.label.copyWith(
                  color: Theme.of(context).colorScheme.onSurface,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ServiceBreakdownCard extends StatelessWidget {
  const _ServiceBreakdownCard({required this.items});

  final List<_ServiceBreakdownItem> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: _dashboardCardColor(context),
          borderRadius: BorderRadius.circular(18),
          border: _dashboardCardBorder(context),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0A2D3337),
              blurRadius: 18,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Text(
          'No delivered activity yet this month. Once services are tracked, the breakdown will show up here.',
          style: AppTextStyles.bodySm.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      );
    }

    final totalAmount = items.fold<double>(
      0,
      (sum, item) => sum + item.amount,
    );

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _dashboardCardColor(context),
        borderRadius: BorderRadius.circular(18),
        border: _dashboardCardBorder(context),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A2D3337),
            blurRadius: 18,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: items.take(5).map((item) {
          final pct = totalAmount == 0 ? 0.0 : item.amount / totalAmount;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F4FF),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      alignment: Alignment.center,
                      child: Icon(
                        ServiceIcons.fromName(item.service.iconName),
                        size: 16,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.service.name,
                            style: AppTextStyles.body.copyWith(
                              fontWeight: FontWeight.w700,
                              color: Theme.of(context).colorScheme.onSurface,
                            ),
                          ),
                          Text(
                            '${(pct * 100).toStringAsFixed(0)}% of tracked activity',
                            style: AppTextStyles.labelSm.copyWith(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      CurrencyFormatter.formatCompact(item.amount),
                      style: AppTextStyles.body.copyWith(
                        fontWeight: FontWeight.w700,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: pct,
                    minHeight: 7,
                    backgroundColor: const Color(0xFFE5E7EB),
                    color: item.service.isProvider
                        ? const Color(0xFF059669)
                        : AppColors.primary,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _RecentActivityCard extends StatelessWidget {
  const _RecentActivityCard({required this.entries});

  final List<_RecentActivityEntry> entries;

  @override
  Widget build(BuildContext context) {
    if (entries.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: _dashboardCardColor(context),
          borderRadius: BorderRadius.circular(18),
          border: _dashboardCardBorder(context),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0A2D3337),
              blurRadius: 18,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Text(
          'No recent activity in the last 7 days yet.',
          style: AppTextStyles.bodySm.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      );
    }

    return SizedBox(
      height: 154,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: entries.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final entry = entries[index];
          return Container(
            width: 168,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: _dashboardCardColor(context),
              borderRadius: BorderRadius.circular(18),
              border: _dashboardCardBorder(context),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x0A2D3337),
                  blurRadius: 18,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.date.toShortDate(),
                  style: AppTextStyles.label.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  CurrencyFormatter.formatCompact(entry.totalAmount),
                  style: AppTextStyles.h4.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 10),
                _ActivityBadge(
                  label: '${entry.deliveredNames.length} delivered',
                  color: AppColors.success,
                ),
                const SizedBox(height: 6),
                _ActivityBadge(
                  label: '${entry.skippedNames.length} skipped',
                  color: AppColors.error,
                ),
                const Spacer(),
                Text(
                  entry.primaryLabel,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.labelSm.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _ActivityBadge extends StatelessWidget {
  const _ActivityBadge({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: AppTextStyles.labelSm.copyWith(
          color: color,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _ServiceBreakdownItem {
  const _ServiceBreakdownItem({required this.service, required this.amount});

  final UserService service;
  final double amount;
}

class _RecentActivityEntry {
  const _RecentActivityEntry({
    required this.date,
    required this.totalAmount,
    required this.deliveredNames,
    required this.skippedNames,
  });

  final DateTime date;
  final double totalAmount;
  final List<String> deliveredNames;
  final List<String> skippedNames;

  String get primaryLabel {
    if (deliveredNames.isNotEmpty) return deliveredNames.first;
    if (skippedNames.isNotEmpty) return skippedNames.first;
    return 'No activity';
  }
}

bool _isServiceScheduledOnDate(UserService service, DateTime date) {
  final dayNum = date.day;
  final monthIdx = date.month - 1;
  final billingDay = service.billingDay;
  final isDeliveryBased = [
    'home_delivery',
    'visit_based',
  ].contains(service.deliveryType);

  if (!isDeliveryBased) {
    if (service.isYearly) {
      return monthIdx == (service.billingMonth ?? 1) - 1 &&
          dayNum == billingDay;
    }
    return dayNum == billingDay;
  }

  if (service.isDaily) return true;
  if (service.isWeekly) {
    return dayNum >= billingDay && (dayNum - billingDay) % 7 == 0;
  }
  if (service.isMonthly) return dayNum == billingDay;
  if (service.isYearly) {
    return monthIdx == (service.billingMonth ?? 1) - 1 &&
        dayNum == billingDay;
  }
  return false;
}

DateTime _nextBillingDateForService(UserService service) {
  final now = DateTime.now();
  if (service.isYearly) {
    final year = now.year;
    final month = service.billingMonth ?? now.month;
    var next = DateTime(year, month, service.billingDay);
    if (next.isBefore(DateTime(now.year, now.month, now.day))) {
      next = DateTime(year + 1, month, service.billingDay);
    }
    return next;
  }

  var next = DateTime(now.year, now.month, service.billingDay);
  if (next.isBefore(DateTime(now.year, now.month, now.day))) {
    next = DateTime(now.year, now.month + 1, service.billingDay);
  }
  return next;
}

List<_ServiceBreakdownItem> _buildServiceBreakdown({
  required List<UserService> services,
  required List<ServiceConfirmation> confirmations,
}) {
  final serviceMap = {for (final service in services) service.id: service};
  final totals = <String, double>{};

  for (final confirmation in confirmations) {
    if (!confirmation.isDelivered) continue;
    final service = serviceMap[confirmation.serviceId];
    if (service == null) continue;
    totals[service.id] = (totals[service.id] ?? 0) +
        (confirmation.customAmount ?? service.price);
  }

  return totals.entries
      .map((entry) => _ServiceBreakdownItem(
            service: serviceMap[entry.key]!,
            amount: entry.value,
          ))
      .toList()
    ..sort((a, b) => b.amount.compareTo(a.amount));
}

List<_RecentActivityEntry> _buildRecentActivity({
  required Map<String, UserService> serviceMap,
  required List<ServiceConfirmation> confirmations,
}) {
  final cutoff = DateTime.now().subtract(const Duration(days: 6));
  final grouped = <String, _RecentActivityAccumulator>{};

  for (final confirmation in confirmations) {
    final date = DateTime.tryParse(confirmation.date);
    if (date == null || date.isBefore(DateTime(cutoff.year, cutoff.month, cutoff.day))) {
      continue;
    }

    final service = serviceMap[confirmation.serviceId];
    final bucket = grouped.putIfAbsent(
      confirmation.date,
      () => _RecentActivityAccumulator(date: date),
    );

    if (confirmation.isDelivered) {
      bucket.totalAmount += confirmation.customAmount ?? service?.price ?? 0;
      if (service != null) bucket.deliveredNames.add(service.name);
    } else if (confirmation.isSkipped && service != null) {
      bucket.skippedNames.add(service.name);
    }
  }

  final entries = grouped.values
      .map(
        (bucket) => _RecentActivityEntry(
          date: bucket.date,
          totalAmount: bucket.totalAmount,
          deliveredNames: bucket.deliveredNames,
          skippedNames: bucket.skippedNames,
        ),
      )
      .toList()
    ..sort((a, b) => b.date.compareTo(a.date));

  return entries;
}

class _RecentActivityAccumulator {
  _RecentActivityAccumulator({required this.date});

  final DateTime date;
  double totalAmount = 0;
  final List<String> deliveredNames = [];
  final List<String> skippedNames = [];
}

  Color _dashboardCardColor(BuildContext context) =>
    AppSurfaces.panel(context);

  BoxBorder _dashboardCardBorder(BuildContext context) =>
    AppSurfaces.cardBorder(context);
