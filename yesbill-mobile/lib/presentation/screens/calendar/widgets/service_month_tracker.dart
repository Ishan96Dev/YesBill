import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../../core/extensions/date_extensions.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../data/models/service_confirmation.dart';
import '../../../widgets/common/app_dropdown.dart';
import '../../../../data/models/user_service.dart';
import '../../../../providers/calendar_provider.dart';
import '../../../../providers/services_provider.dart';
import '../../../widgets/common/empty_state_view.dart';
import '../../../widgets/common/error_retry_view.dart';
import '../../../widgets/common/loading_shimmer.dart';

class ServiceMonthTracker extends ConsumerStatefulWidget {
  const ServiceMonthTracker({
    super.key,
    this.initialServiceId,
  });

  final String? initialServiceId;

  @override
  ConsumerState<ServiceMonthTracker> createState() =>
      _ServiceMonthTrackerState();
}

class _ServiceMonthTrackerState extends ConsumerState<ServiceMonthTracker> {
  late DateTime _month;
  String? _selectedServiceId;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _month = DateTime(now.year, now.month);
    _selectedServiceId = widget.initialServiceId;
  }

  @override
  Widget build(BuildContext context) {
    final servicesAsync = ref.watch(userServicesProvider);

    return servicesAsync.when(
      loading: () => const Padding(
        padding: EdgeInsets.all(AppSpacing.base),
        child: ShimmerList(count: 6, itemHeight: 72),
      ),
      error: (error, _) => ErrorRetryView(
        error: error,
        onRetry: () => ref.invalidate(userServicesProvider),
      ),
      data: (services) {
        if (services.isEmpty) {
          return const EmptyStateView(
            title: 'No active services',
            description:
                'Add or activate a service to start tracking delivery status.',
            icon: LucideIcons.calendarClock,
          );
        }

        _selectedServiceId ??= services.first.id;
        final selectedService =
            _pickService(services, _selectedServiceId!) ?? services.first;
        final yearMonth = _month.toYearMonth();

        final confirmationsAsync =
            ref.watch(monthConfirmationsProvider(yearMonth));

        return confirmationsAsync.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(AppSpacing.base),
            child: ShimmerList(count: 6, itemHeight: 72),
          ),
          error: (error, _) => ErrorRetryView(
            error: error,
            onRetry: () =>
                ref.invalidate(monthConfirmationsProvider(yearMonth)),
          ),
          data: (confirmations) {
            final statusByDate = _statusMapForService(
              confirmations: confirmations,
              serviceId: selectedService.id,
            );

            return ListView(
              padding: const EdgeInsets.fromLTRB(AppSpacing.base, AppSpacing.base, AppSpacing.base, 120),
              children: [
                RichText(
                  text: TextSpan(
                    children: [
                      TextSpan(
                        text: 'Service ',
                        style: AppTextStyles.h2.copyWith(
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
                      TextSpan(
                        text: 'Calendar',
                        style: AppTextStyles.h2.copyWith(
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 2),
                const Text(
                  'Track delivered, skipped, and pending service confirmations',
                  style: AppTextStyles.bodySm,
                ),
                const Gap(AppSpacing.base),
                _MonthHeader(
                  month: _month,
                  onPrev: () => setState(() => _month = _month.previousMonth),
                  onNext: () => setState(() => _month = _month.nextMonth),
                ),
                const Gap(AppSpacing.sm),
                if (widget.initialServiceId == null)
                  AppDropdown<String>(
                    label: 'Service',
                    value: _selectedServiceId ?? selectedService.id,
                    items: services
                        .map(
                          (service) => AppDropdownItem(
                            value: service.id,
                            label: service.name,
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      if (value == null) return;
                      setState(() => _selectedServiceId = value);
                    },
                  ),
                if (widget.initialServiceId == null) const Gap(AppSpacing.base),
                _Legend(
                    deliveredLabel: selectedService.deliveredLabel,
                    skippedLabel: selectedService.skippedLabel),
                const Gap(AppSpacing.base),
                _CalendarGrid(
                  month: _month,
                  statusByDate: statusByDate,
                  onTapDay: (day) => _cycleStatus(selectedService.id, day,
                      statusByDate[day.toDateString()]),
                  onLongPressDay: (day) => _showStatusPicker(
                    context: context,
                    serviceId: selectedService.id,
                    day: day,
                    currentStatus: statusByDate[day.toDateString()],
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _cycleStatus(
    String serviceId,
    DateTime day,
    String? currentStatus,
  ) async {
    final nextStatus = switch (currentStatus) {
      ConfirmationStatuses.delivered => ConfirmationStatuses.skipped,
      ConfirmationStatuses.skipped => ConfirmationStatuses.pending,
      _ => ConfirmationStatuses.delivered,
    };

    await ref.read(confirmationNotifierProvider.notifier).upsert(
          serviceId: serviceId,
          date: day,
          status: nextStatus,
        );
  }

  Future<void> _showStatusPicker({
    required BuildContext context,
    required String serviceId,
    required DateTime day,
    required String? currentStatus,
  }) async {
    final selected = await showModalBottomSheet<String>(
      context: context,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(LucideIcons.checkCircle2,
                    color: AppColors.delivered),
                title: const Text('Delivered'),
                trailing: currentStatus == ConfirmationStatuses.delivered
                    ? const Icon(LucideIcons.check, size: 18)
                    : null,
                onTap: () =>
                    Navigator.of(context).pop(ConfirmationStatuses.delivered),
              ),
              ListTile(
                leading:
                    const Icon(LucideIcons.xCircle, color: AppColors.skipped),
                title: const Text('Skipped'),
                trailing: currentStatus == ConfirmationStatuses.skipped
                    ? const Icon(LucideIcons.check, size: 18)
                    : null,
                onTap: () =>
                    Navigator.of(context).pop(ConfirmationStatuses.skipped),
              ),
              ListTile(
                leading:
                    const Icon(LucideIcons.circleDot, color: AppColors.pending),
                title: const Text('Pending'),
                trailing: currentStatus == ConfirmationStatuses.pending
                    ? const Icon(LucideIcons.check, size: 18)
                    : null,
                onTap: () =>
                    Navigator.of(context).pop(ConfirmationStatuses.pending),
              ),
            ],
          ),
        );
      },
    );

    if (selected == null) return;
    await ref.read(confirmationNotifierProvider.notifier).upsert(
          serviceId: serviceId,
          date: day,
          status: selected,
        );
  }

  UserService? _pickService(List<UserService> services, String id) {
    for (final service in services) {
      if (service.id == id) return service;
    }
    return null;
  }

  Map<String, String> _statusMapForService({
    required List<ServiceConfirmation> confirmations,
    required String serviceId,
  }) {
    final map = <String, String>{};
    for (final confirmation in confirmations) {
      if (confirmation.serviceId == serviceId) {
        map[confirmation.date] = confirmation.status;
      }
    }
    return map;
  }
}

class _MonthHeader extends StatelessWidget {
  const _MonthHeader({
    required this.month,
    required this.onPrev,
    required this.onNext,
  });

  final DateTime month;
  final VoidCallback onPrev;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        IconButton(
          onPressed: onPrev,
          icon: const Icon(LucideIcons.chevronLeft),
          tooltip: 'Previous month',
        ),
        Expanded(
          child: Text(
            month.toMonthYearDisplay(),
            textAlign: TextAlign.center,
            style: AppTextStyles.h3,
          ),
        ),
        IconButton(
          onPressed: onNext,
          icon: const Icon(LucideIcons.chevronRight),
          tooltip: 'Next month',
        ),
      ],
    );
  }
}

class _Legend extends StatelessWidget {
  const _Legend({
    required this.deliveredLabel,
    required this.skippedLabel,
  });

  final String deliveredLabel;
  final String skippedLabel;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.xs,
      children: [
        _LegendItem(color: AppColors.delivered, label: deliveredLabel),
        _LegendItem(color: AppColors.skipped, label: skippedLabel),
        const _LegendItem(color: AppColors.pending, label: 'Pending'),
      ],
    );
  }
}

class _LegendItem extends StatelessWidget {
  const _LegendItem({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding:
          const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(label, style: AppTextStyles.labelSm),
        ],
      ),
    );
  }
}

class _CalendarGrid extends StatelessWidget {
  const _CalendarGrid({
    required this.month,
    required this.statusByDate,
    required this.onTapDay,
    required this.onLongPressDay,
  });

  final DateTime month;
  final Map<String, String> statusByDate;
  final ValueChanged<DateTime> onTapDay;
  final ValueChanged<DateTime> onLongPressDay;

  static const _weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  @override
  Widget build(BuildContext context) {
    final firstDay = month.firstDayOfMonth;
    final trailingBefore = firstDay.weekday - 1; // Monday = 1
    final totalDays = month.daysInMonth;
    final totalCells = trailingBefore + totalDays;
    final rows = (totalCells / 7).ceil();
    final cells = rows * 7;

    return Column(
      children: [
        Row(
          children: _weekDays
              .map(
                (day) => Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                    child: Text(
                      day,
                      textAlign: TextAlign.center,
                      style: AppTextStyles.labelSm,
                    ),
                  ),
                ),
              )
              .toList(),
        ),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: cells,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 7,
            mainAxisSpacing: 6,
            crossAxisSpacing: 6,
            childAspectRatio: 0.8,
          ),
          itemBuilder: (_, index) {
            final dayNumber = index - trailingBefore + 1;
            if (dayNumber <= 0 || dayNumber > totalDays) {
              return const SizedBox.shrink();
            }
            final day = DateTime(month.year, month.month, dayNumber);
            final status = statusByDate[day.toDateString()] ??
                ConfirmationStatuses.pending;

            final style = switch (status) {
              ConfirmationStatuses.delivered => (
                  color: AppColors.delivered.withOpacity(0.2),
                  textColor: AppColors.delivered,
                ),
              ConfirmationStatuses.skipped => (
                  color: AppColors.skipped.withOpacity(0.2),
                  textColor: AppColors.skipped,
                ),
              _ => (
                  color: AppColors.pending.withOpacity(0.16),
                  textColor: AppColors.pending,
                ),
            };

            return InkWell(
              borderRadius: BorderRadius.circular(10),
              onTap: () => onTapDay(day),
              onLongPress: () => onLongPressDay(day),
              child: Ink(
                decoration: BoxDecoration(
                  color: style.color,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text(
                    '$dayNumber',
                    style: AppTextStyles.bodySm.copyWith(
                      color: style.textColor,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}
