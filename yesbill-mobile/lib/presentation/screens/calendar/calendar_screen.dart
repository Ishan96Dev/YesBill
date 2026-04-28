import 'package:flutter/material.dart';
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
import '../../../providers/calendar_provider.dart';
import '../../../providers/services_provider.dart';
import '../../widgets/common/error_retry_view.dart';
import '../../widgets/common/yesbill_loading_widget.dart';

class CalendarScreen extends ConsumerStatefulWidget {
  const CalendarScreen({super.key});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  late DateTime _month;
  late DateTime _selectedDate;
  String _roleTab = 'all'; // 'all' | 'consumer' | 'provider'

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _month = DateTime(now.year, now.month);
    _selectedDate = now;
  }

  String _weekdayLabel(int weekday) {
    const names = [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
      'SUNDAY',
    ];
    return names[weekday - 1];
  }

  Future<void> _showDayServicesSheet({
    required DateTime date,
    required List<UserService> services,
    required Map<String, String> statusByServiceId,
  }) async {
    if (!mounted) return;

    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (sheetContext) => _DayServicesSheet(
        date: date,
        services: services,
        initialStatusByServiceId: statusByServiceId,
        onStatusTap: (serviceId, status) async {
          await ref.read(confirmationNotifierProvider.notifier).upsert(
                serviceId: serviceId,
                date: date,
                status: status,
              );
        },
        onOpenCalendar: (service) {
          Navigator.of(sheetContext).pop();
          context.push('/calendar/${service.id}');
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final servicesAsync = ref.watch(activeServicesProvider);
    final yearMonth = _month.toYearMonth();
    final confirmationsAsync = ref.watch(monthConfirmationsProvider(yearMonth));

    if (servicesAsync.isLoading || confirmationsAsync.isLoading) {
      return const _CalendarLoadingView();
    }

    if (servicesAsync.hasError) {
      return ErrorRetryView(
        error: servicesAsync.error!,
        onRetry: () => ref.invalidate(activeServicesProvider),
      );
    }

    // Confirmation errors are non-fatal — show calendar with empty confirmations
    final services = servicesAsync.valueOrNull ?? <UserService>[];
    final confirmations = confirmationsAsync.valueOrNull ?? <ServiceConfirmation>[];

    // Filter services by selected role tab
    final filteredServices = _roleTab == 'all'
        ? services
        : services.where((s) => s.serviceRole == _roleTab).toList();
    final statusByServiceId = <String, String>{};
    final selectedDateKey = _selectedDate.toDateString();
    for (final c in confirmations) {
      if (c.date == selectedDateKey) {
        statusByServiceId[c.serviceId] = c.status;
      }
    }

    final selectedDayServices = filteredServices
        .where((service) => _isServiceScheduledOnDate(service, _selectedDate))
        .toList()
      ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
    final selectedDayStats = _SelectedDayStats.fromServices(
      selectedDayServices,
      statusByServiceId,
    );
    final dayServiceCountMap = _buildDayServiceCountMap(
      services: filteredServices,
      month: _month,
    );
    final monthTotal = _buildMonthTrackedTotal(
      services: filteredServices,
      confirmations: confirmations,
    );

    // Build day → status map for calendar dots (delivered takes priority)
    final dayStatusMap = <int, String>{};
    for (final c in confirmations) {
      if (c.date.startsWith(yearMonth)) {
        final day = int.tryParse(c.date.split('-').last) ?? 0;
        if (day > 0) {
          if (c.status == 'delivered' || !dayStatusMap.containsKey(day)) {
            dayStatusMap[day] = c.status;
          }
        }
      }
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 132),
        children: [
          _CalendarHeroCard(
            selectedDate: _selectedDate,
            monthTotal: monthTotal,
            roleTab: _roleTab,
            scheduledCount: selectedDayServices.length,
          ),
          const SizedBox(height: 12),
          _MonthCard(
            month: _month,
            selectedDate: _selectedDate,
            dayStatusMap: dayStatusMap,
            dayServiceCountMap: dayServiceCountMap,
            onPrev: () => setState(() {
              _month = _month.previousMonth;
              _selectedDate = DateTime(_month.year, _month.month, 1);
            }),
            onNext: () => setState(() {
              _month = _month.nextMonth;
              _selectedDate = DateTime(_month.year, _month.month, 1);
            }),
            onTapDay: (date) {
              final dateKey = date.toDateString();
              final dayStatusByServiceId = <String, String>{};
              for (final confirmation in confirmations) {
                if (confirmation.date == dateKey) {
                  dayStatusByServiceId[confirmation.serviceId] =
                      confirmation.status;
                }
              }

              final dayServices = filteredServices
                  .where((service) => _isServiceScheduledOnDate(service, date))
                  .toList()
                ..sort(
                  (a, b) =>
                      a.name.toLowerCase().compareTo(b.name.toLowerCase()),
                );

              setState(() => _selectedDate = date);
              _showDayServicesSheet(
                date: date,
                services: dayServices,
                statusByServiceId: dayStatusByServiceId,
              );
            },
          ),
          const SizedBox(height: 10),
          // Role filter tabs
          Row(
            children: [
              for (final tab in [
                ('all', 'All'),
                ('consumer', 'Consumer'),
                ('provider', 'Provider'),
              ])
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () => setState(() => _roleTab = tab.$1),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 160),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                      decoration: BoxDecoration(
                        color: _roleTab == tab.$1
                            ? AppColors.primary
                            : _calendarCardColor(context),
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(
                          color: _roleTab == tab.$1
                              ? AppColors.primary
                              : Theme.of(context).colorScheme.outline,
                        ),
                          boxShadow: _roleTab == tab.$1
                              ? const [
                                  BoxShadow(
                                    color: Color(0x144F46E5),
                                    blurRadius: 12,
                                    offset: Offset(0, 4),
                                  ),
                                ]
                              : null,
                      ),
                      child: Text(
                        tab.$2,
                        style: AppTextStyles.labelSm.copyWith(
                          color: _roleTab == tab.$1
                              ? Colors.white
                              : Theme.of(context).colorScheme.onSurfaceVariant,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),
            _CalendarSelectedDaySummary(
              selectedDate: _selectedDate,
              stats: selectedDayStats,
            ),
            const SizedBox(height: 14),
            const _CalendarLegend(),
            const SizedBox(height: 14),
          Row(
            children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _weekdayLabel(_selectedDate.weekday),
                        style: AppTextStyles.labelSm.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.3,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Service Details',
                        style: AppTextStyles.h2.copyWith(
                          color: Theme.of(context).colorScheme.onSurface,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                    _selectedDate.toShortDate().toUpperCase(),
                  style: AppTextStyles.labelSm.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
            if (selectedDayServices.isEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: _calendarCardColor(context),
                borderRadius: BorderRadius.circular(14),
                border: _calendarCardBorder(context),
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
                      LucideIcons.calendarDays,
                      size: 18,
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'No ${_roleTab == 'all' ? '' : '$_roleTab '}services are scheduled for ${_selectedDate.toFullDate()}.',
                      style: AppTextStyles.body.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                ],
              ),
            )
          else
            ...selectedDayServices.map(
              (service) => _DayServiceRow(
                service: service,
                status: statusByServiceId[service.id] ?? ConfirmationStatuses.pending,
                onStatusTap: (status) async {
                  await ref.read(confirmationNotifierProvider.notifier).upsert(
                        serviceId: service.id,
                        date: _selectedDate,
                        status: status,
                      );
                },
                onOpenCalendar: () => context.push('/calendar/${service.id}'),
              ),
            ),
          const SizedBox(height: 12),
          _CalendarActionCard(
            onManageServices: () => context.go('/services'),
            onGenerateBill: () => context.push('/bills/generate'),
          ),
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: () => ref.invalidate(monthConfirmationsProvider(yearMonth)),
            icon: const Icon(LucideIcons.refreshCw, size: 14),
            label: const Text('Refresh calendar data'),
          ),
        ],
    );
  }
}

class _MonthCard extends StatelessWidget {
  const _MonthCard({
    required this.month,
    required this.selectedDate,
    required this.dayStatusMap,
    required this.dayServiceCountMap,
    required this.onPrev,
    required this.onNext,
    required this.onTapDay,
  });

  final DateTime month;
  final DateTime selectedDate;
  final Map<int, String> dayStatusMap;
  final Map<int, int> dayServiceCountMap;
  final VoidCallback onPrev;
  final VoidCallback onNext;
  final ValueChanged<DateTime> onTapDay;

  @override
  Widget build(BuildContext context) {
    const weekdays = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    final firstDay = month.firstDayOfMonth;
    final leading = firstDay.weekday - 1;
    final totalDays = month.daysInMonth;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _calendarCardColor(context),
        borderRadius: BorderRadius.circular(20),
        border: _calendarCardBorder(context),
        boxShadow: AppSurfaces.softShadow(context),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Text(
                month.toMonthYearDisplay(),
                textAlign: TextAlign.center,
                style: AppTextStyles.h4.copyWith(fontWeight: FontWeight.w700),
              ),
              const Spacer(),
              IconButton(
                onPressed: onPrev,
                icon: const Icon(LucideIcons.chevronLeft, size: 16),
                constraints: const BoxConstraints(minWidth: 30, minHeight: 30),
              ),
              IconButton(
                onPressed: onNext,
                icon: const Icon(LucideIcons.chevronRight, size: 16),
                constraints: const BoxConstraints(minWidth: 30, minHeight: 30),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: weekdays
                .map(
                  (day) => Expanded(
                    child: Center(
                      child: Text(
                        day,
                        style: AppTextStyles.labelSm.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 6),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: 42,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              crossAxisSpacing: 4,
              mainAxisSpacing: 4,
              childAspectRatio: 1,
            ),
            itemBuilder: (_, index) {
              final day = index - leading + 1;
              if (day <= 0 || day > totalDays) {
                return const SizedBox.shrink();
              }

              final date = DateTime(month.year, month.month, day);
              final selected = selectedDate.isSameDay(date);
              final isToday = DateTime.now().isSameDay(date);
              final serviceCount = dayServiceCountMap[day] ?? 0;

              return GestureDetector(
                onTap: () => onTapDay(date),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  decoration: BoxDecoration(
                    color: selected
                      ? AppColors.primary
                      : (Theme.of(context).brightness == Brightness.dark
                        ? AppColors.surfaceDarkElevated
                        : const Color(0xFFEFF2FA)),
                    borderRadius: BorderRadius.circular(12),
                    border: isToday && !selected
                        ? Border.all(color: AppColors.primary, width: 1.4)
                        : null,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '$day',
                        style: AppTextStyles.bodySm.copyWith(
                          color: selected ? Colors.white : Theme.of(context).colorScheme.onSurface,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      if (serviceCount > 0)
                        Container(
                          margin: const EdgeInsets.only(top: 2),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 5,
                            vertical: 1,
                          ),
                          decoration: BoxDecoration(
                            color: selected
                                ? Colors.white.withValues(alpha: 0.18)
                                : const Color(0xFFDCE3F3),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            '$serviceCount',
                            style: AppTextStyles.labelSm.copyWith(
                              color: selected
                                  ? Colors.white
                                  : Theme.of(context).colorScheme.onSurface,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      if (dayStatusMap.containsKey(day))
                        Container(
                          margin: const EdgeInsets.only(top: 2),
                          width: 5,
                          height: 5,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: dayStatusMap[day] == 'delivered'
                                ? AppColors.success
                                : AppColors.error,
                          ),
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _DayServiceRow extends StatelessWidget {
  const _DayServiceRow({
    required this.service,
    required this.status,
    required this.onStatusTap,
    required this.onOpenCalendar,
  });

  final UserService service;
  final String status;
  final ValueChanged<String> onStatusTap;
  final VoidCallback onOpenCalendar;

  @override
  Widget build(BuildContext context) {
    final statusColor = switch (status) {
      ConfirmationStatuses.delivered => AppColors.delivered,
      ConfirmationStatuses.skipped => AppColors.skipped,
      _ => AppColors.pending,
    };

    final statusLabel = switch (status) {
      ConfirmationStatuses.delivered => service.deliveredLabel.toUpperCase(),
      ConfirmationStatuses.skipped => service.skippedLabel.toUpperCase(),
      _ => 'NOT TRACKED',
    };

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _calendarCardColor(context),
        borderRadius: BorderRadius.circular(16),
        border: _calendarCardBorder(context),
        boxShadow: AppSurfaces.softShadow(context),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  color: statusColor.withValues(alpha: 0.15),
                ),
                child: Icon(
                  ServiceIcons.fromName(service.iconName),
                  size: 18,
                  color: statusColor,
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
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      '${service.deliveryTypeLabel} • ${service.schedule.replaceAll('-', ' ').toUpperCase()}',
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
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      statusLabel,
                      style: AppTextStyles.labelSm.copyWith(
                        color: statusColor,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    CurrencyFormatter.formatCompact(service.price),
                    style: AppTextStyles.bodySm.copyWith(
                      color: Theme.of(context).colorScheme.onSurface,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: service.isProvider
                      ? const Color(0xFFECFDF5)
                      : const Color(0xFFEEF2FF),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  service.isProvider ? 'PROVIDER' : 'CONSUMER',
                  style: AppTextStyles.labelSm.copyWith(
                    color: service.isProvider
                        ? const Color(0xFF047857)
                        : AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const Spacer(),
              InkWell(
                onTap: onOpenCalendar,
                borderRadius: BorderRadius.circular(999),
                child: Ink(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
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
                        'Service calendar',
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
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _StatusAction(
                  label: service.deliveredLabel.toUpperCase(),
                  color: AppColors.delivered,
                  isActive: status == ConfirmationStatuses.delivered,
                  onTap: () => onStatusTap(ConfirmationStatuses.delivered),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: _StatusAction(
                  label: 'NOT TRACKED',
                  color: AppColors.pending,
                  isActive: status == ConfirmationStatuses.pending,
                  onTap: () => onStatusTap(ConfirmationStatuses.pending),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: _StatusAction(
                  label: service.skippedLabel.toUpperCase(),
                  color: AppColors.skipped,
                  isActive: status == ConfirmationStatuses.skipped,
                  onTap: () => onStatusTap(ConfirmationStatuses.skipped),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatusAction extends StatelessWidget {
  const _StatusAction({
    required this.label,
    required this.color,
    required this.onTap,
    this.isActive = false,
  });

  final String label;
  final Color color;
  final VoidCallback onTap;
  final bool isActive;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? color.withValues(alpha: 0.18) : color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isActive ? color.withValues(alpha: 0.6) : color.withValues(alpha: 0.2),
            width: isActive ? 1.5 : 1,
          ),
        ),
        child: Text(
          label,
          style: AppTextStyles.labelSm.copyWith(
            color: isActive ? color : color.withValues(alpha: 0.7),
            fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
          ),
          textAlign: TextAlign.center,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ),
    );
  }
}

class _CalendarActionCard extends StatelessWidget {
  const _CalendarActionCard({
    required this.onManageServices,
    required this.onGenerateBill,
  });

  final VoidCallback onManageServices;
  final VoidCallback onGenerateBill;

  @override
  Widget build(BuildContext context) {
    return Container(
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
            'Need to change something?',
            style: AppTextStyles.h4.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Open Services to edit schedules or jump straight to bill generation.',
            style: AppTextStyles.bodySm.copyWith(
              color: Colors.white.withValues(alpha: 0.9),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onManageServices,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: BorderSide(
                      color: Colors.white.withValues(alpha: 0.6),
                    ),
                  ),
                  icon: const Icon(LucideIcons.settings2, size: 16),
                  label: const Text('Manage services'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton.icon(
                  onPressed: onGenerateBill,
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.primary,
                  ),
                  icon: const Icon(LucideIcons.fileText, size: 16),
                  label: const Text('Generate bill'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CalendarLoadingView extends StatelessWidget {
  const _CalendarLoadingView();

  @override
  Widget build(BuildContext context) {
    return const YesBillLoadingWidget(
      label: 'Loading Calendar...',
      sublabel: 'Fetching your schedule',
    );
  }
}

class _CalendarHeroCard extends StatelessWidget {
  const _CalendarHeroCard({
    required this.selectedDate,
    required this.monthTotal,
    required this.roleTab,
    required this.scheduledCount,
  });

  final DateTime selectedDate;
  final double monthTotal;
  final String roleTab;
  final int scheduledCount;

  @override
  Widget build(BuildContext context) {
    final label = switch (roleTab) {
      'provider' => 'Month income',
      'consumer' => 'Month spend',
      _ => 'Tracked value',
    };

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
            blurRadius: 28,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Service Calendar',
            style: AppTextStyles.h2.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${selectedDate.toMonthYearDisplay()} • ${selectedDate.toFullDate()}',
            style: AppTextStyles.bodySm.copyWith(
              color: Colors.white.withValues(alpha: 0.84),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _CalendarHeroMetric(
                  label: label.toUpperCase(),
                  value: CurrencyFormatter.formatCompact(monthTotal),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _CalendarHeroMetric(
                  label: 'SCHEDULED TODAY',
                  value: '$scheduledCount',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CalendarHeroMetric extends StatelessWidget {
  const _CalendarHeroMetric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: AppTextStyles.labelSm.copyWith(
              color: Colors.white.withValues(alpha: 0.78),
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: AppTextStyles.h3.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _CalendarSelectedDaySummary extends StatelessWidget {
  const _CalendarSelectedDaySummary({
    required this.selectedDate,
    required this.stats,
  });

  final DateTime selectedDate;
  final _SelectedDayStats stats;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _calendarCardColor(context),
        borderRadius: BorderRadius.circular(18),
        border: _calendarCardBorder(context),
        boxShadow: AppSurfaces.softShadow(context),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Selected day snapshot',
            style: AppTextStyles.body.copyWith(
              fontWeight: FontWeight.w700,
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            selectedDate.toFullDate(),
            style: AppTextStyles.bodySm.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _CalendarStatTile(
                  label: 'Scheduled',
                  value: '${stats.scheduled}',
                  accent: const Color(0xFF4F46E5),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _CalendarStatTile(
                  label: 'Delivered',
                  value: '${stats.delivered}',
                  accent: AppColors.success,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _CalendarStatTile(
                  label: 'Skipped',
                  value: '${stats.skipped}',
                  accent: AppColors.error,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _CalendarStatTile(
                  label: 'Pending',
                  value: '${stats.pending}',
                  accent: AppColors.pending,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CalendarStatTile extends StatelessWidget {
  const _CalendarStatTile({
    required this.label,
    required this.value,
    required this.accent,
  });

  final String label;
  final String value;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: AppTextStyles.h4.copyWith(
              color: accent,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            textAlign: TextAlign.center,
            style: AppTextStyles.labelSm.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _CalendarLegend extends StatelessWidget {
  const _CalendarLegend();

  @override
  Widget build(BuildContext context) {
    return const Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        _CalendarLegendChip(
          label: 'Delivered',
          color: AppColors.delivered,
        ),
        _CalendarLegendChip(
          label: 'Skipped',
          color: AppColors.skipped,
        ),
        _CalendarLegendChip(
          label: 'Pending',
          color: AppColors.pending,
        ),
      ],
    );
  }
}

class _CalendarLegendChip extends StatelessWidget {
  const _CalendarLegendChip({required this.label, required this.color});

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
          Text(
            label,
            style: AppTextStyles.labelSm.copyWith(
              color: Theme.of(context).colorScheme.onSurface,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

  Color _calendarCardColor(BuildContext context) =>
    AppSurfaces.panel(context);

  BoxBorder _calendarCardBorder(BuildContext context) =>
    AppSurfaces.cardBorder(context);

class _DayServicesSheet extends StatefulWidget {
  const _DayServicesSheet({
    required this.date,
    required this.services,
    required this.initialStatusByServiceId,
    required this.onStatusTap,
    required this.onOpenCalendar,
  });

  final DateTime date;
  final List<UserService> services;
  final Map<String, String> initialStatusByServiceId;
  final Future<void> Function(String serviceId, String status) onStatusTap;
  final ValueChanged<UserService> onOpenCalendar;

  @override
  State<_DayServicesSheet> createState() => _DayServicesSheetState();
}

class _DayServicesSheetState extends State<_DayServicesSheet> {
  late final Map<String, String> _statusByServiceId;
  final Set<String> _busyServiceIds = <String>{};

  @override
  void initState() {
    super.initState();
    _statusByServiceId = Map<String, String>.from(widget.initialStatusByServiceId);
  }

  Future<void> _handleStatusTap(UserService service, String status) async {
    final previous =
        _statusByServiceId[service.id] ?? ConfirmationStatuses.pending;

    setState(() {
      _statusByServiceId[service.id] = status;
      _busyServiceIds.add(service.id);
    });

    try {
      await widget.onStatusTap(service.id, status);
    } catch (_) {
      if (!mounted) return;
      setState(() => _statusByServiceId[service.id] = previous);
    } finally {
      if (mounted) {
        setState(() => _busyServiceIds.remove(service.id));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final stats = _SelectedDayStats.fromServices(
      widget.services,
      _statusByServiceId,
    );

    return DraggableScrollableSheet(
      initialChildSize: widget.services.isEmpty ? 0.36 : 0.76,
      minChildSize: 0.3,
      maxChildSize: 0.94,
      expand: false,
      builder: (context, scrollCtrl) {
        return Container(
          decoration: BoxDecoration(
            color: AppSurfaces.panel(
              context,
              lightOpacity: 0.97,
              darkOpacity: 0.97,
            ),
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(28),
            ),
            border: AppSurfaces.cardBorder(context),
          ),
          child: Column(
            children: [
              const SizedBox(height: 12),
              Container(
                width: 42,
                height: 4,
                decoration: BoxDecoration(
                  color: Theme.of(context)
                      .colorScheme
                      .outlineVariant
                      .withOpacity(0.55),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.date.toFullDate(),
                            style: AppTextStyles.h3.copyWith(
                              color: Theme.of(context).colorScheme.onSurface,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            widget.services.isEmpty
                                ? 'No scheduled services for this day.'
                                : '${widget.services.length} scheduled service${widget.services.length == 1 ? '' : 's'} • tap any status pill to update it',
                            style: AppTextStyles.bodySm.copyWith(
                              color:
                                  Theme.of(context).colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(LucideIcons.x, size: 18),
                      style: IconButton.styleFrom(
                        backgroundColor: AppSurfaces.elevated(context),
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _CalendarLegendChip(
                      label: 'Scheduled ${stats.scheduled}',
                      color: AppColors.primary,
                    ),
                    _CalendarLegendChip(
                      label: 'Delivered ${stats.delivered}',
                      color: AppColors.delivered,
                    ),
                    _CalendarLegendChip(
                      label: 'Skipped ${stats.skipped}',
                      color: AppColors.skipped,
                    ),
                    _CalendarLegendChip(
                      label: 'Pending ${stats.pending}',
                      color: AppColors.pending,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: widget.services.isEmpty
                    ? ListView(
                        controller: scrollCtrl,
                        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                        children: [
                          Container(
                            padding: const EdgeInsets.all(18),
                            decoration: BoxDecoration(
                              color: AppSurfaces.elevated(context),
                              borderRadius: BorderRadius.circular(18),
                              border: AppSurfaces.cardBorder(context),
                            ),
                            child: Text(
                              'Try another date or switch between All, Consumer, and Provider tabs to see more services here.',
                              style: AppTextStyles.body.copyWith(
                                color: Theme.of(context)
                                    .colorScheme
                                    .onSurfaceVariant,
                              ),
                            ),
                          ),
                        ],
                      )
                    : ListView.builder(
                        controller: scrollCtrl,
                        padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
                        itemCount: widget.services.length,
                        itemBuilder: (context, index) {
                          final service = widget.services[index];
                          final busy = _busyServiceIds.contains(service.id);

                          return AbsorbPointer(
                            absorbing: busy,
                            child: Opacity(
                              opacity: busy ? 0.62 : 1,
                              child: _DayServiceRow(
                                service: service,
                                status: _statusByServiceId[service.id] ??
                                    ConfirmationStatuses.pending,
                                onStatusTap: (status) =>
                                    _handleStatusTap(service, status),
                                onOpenCalendar: () =>
                                    widget.onOpenCalendar(service),
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _SelectedDayStats {
  const _SelectedDayStats({
    required this.scheduled,
    required this.delivered,
    required this.skipped,
    required this.pending,
  });

  final int scheduled;
  final int delivered;
  final int skipped;
  final int pending;

  factory _SelectedDayStats.fromServices(
    List<UserService> services,
    Map<String, String> statusByServiceId,
  ) {
    var delivered = 0;
    var skipped = 0;
    var pending = 0;

    for (final service in services) {
      final status = statusByServiceId[service.id] ?? ConfirmationStatuses.pending;
      if (status == ConfirmationStatuses.delivered) {
        delivered++;
      } else if (status == ConfirmationStatuses.skipped) {
        skipped++;
      } else {
        pending++;
      }
    }

    return _SelectedDayStats(
      scheduled: services.length,
      delivered: delivered,
      skipped: skipped,
      pending: pending,
    );
  }
}

Map<int, int> _buildDayServiceCountMap({
  required List<UserService> services,
  required DateTime month,
}) {
  final counts = <int, int>{};
  for (var day = 1; day <= month.daysInMonth; day++) {
    final date = DateTime(month.year, month.month, day);
    final count = services.where((service) => _isServiceScheduledOnDate(service, date)).length;
    if (count > 0) counts[day] = count;
  }
  return counts;
}

double _buildMonthTrackedTotal({
  required List<UserService> services,
  required List<ServiceConfirmation> confirmations,
}) {
  final serviceMap = {for (final service in services) service.id: service};
  var total = 0.0;

  for (final confirmation in confirmations) {
    if (confirmation.status != ConfirmationStatuses.delivered) continue;
    final service = serviceMap[confirmation.serviceId];
    if (service == null) continue;
    total += confirmation.customAmount ?? service.price;
  }

  return total;
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
