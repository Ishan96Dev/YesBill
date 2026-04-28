import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/constants/service_icons.dart';
import '../../../core/extensions/context_extensions.dart';
import '../../../core/extensions/date_extensions.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../data/models/user_service.dart';
import '../../../providers/bills_provider.dart';
import '../../../providers/services_provider.dart';
import '../../widgets/common/error_retry_view.dart';
import '../../widgets/common/loading_shimmer.dart';

class GenerateBillScreen extends ConsumerStatefulWidget {
  const GenerateBillScreen({super.key});

  @override
  ConsumerState<GenerateBillScreen> createState() => _GenerateBillScreenState();
}

class _GenerateBillScreenState extends ConsumerState<GenerateBillScreen> {
  final _noteCtrl = TextEditingController();
  final _serviceIds = <String>{};
  DateTime _selectedMonth = DateTime(DateTime.now().year, DateTime.now().month);

  @override
  void dispose() {
    _noteCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<BillGenerationState>(billGenerationProvider, (previous, next) {
      if (next is BillGenerationError) {
        context.showErrorSnackBar(next.message);
      }
      if (next is BillGenerationSuccess) {
        context.replace('/bills/${next.bill.id}');
      }
    });

    final servicesAsync = ref.watch(activeServicesProvider);
    final generationState = ref.watch(billGenerationProvider);
    final isLoading = generationState is BillGenerationLoading;

    final monthOptions = [
      DateTime(_selectedMonth.year, _selectedMonth.month - 1),
      _selectedMonth,
      DateTime(_selectedMonth.year, _selectedMonth.month + 1),
    ];

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        title: const Text('Generate Bill'),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 88),
          children: [
            Text(
              'SMART ENGINE',
              style: AppTextStyles.labelSm.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.4,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
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
                    'Generate Bill with AI',
                    style: AppTextStyles.h3.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Transform your monthly service usage into a professional invoice in seconds.',
                    style: AppTextStyles.bodySm.copyWith(
                      color: Colors.white.withOpacity(0.9),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            Text(
              'Billing Period',
              style: AppTextStyles.body.copyWith(
                color: Theme.of(context).colorScheme.onSurface,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: monthOptions
                  .map(
                    (month) => Expanded(
                      child: Padding(
                        padding: EdgeInsets.only(
                          right: month == monthOptions.last ? 0 : 8,
                        ),
                        child: _MonthChip(
                          month: month,
                          selected: month.year == _selectedMonth.year &&
                              month.month == _selectedMonth.month,
                          onTap: () => setState(
                            () => _selectedMonth = DateTime(month.year, month.month),
                          ),
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 14),
            Text(
              'Include Services',
              style: AppTextStyles.body.copyWith(
                color: Theme.of(context).colorScheme.onSurface,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            servicesAsync.when(
              loading: () => const ShimmerList(count: 4, itemHeight: 66),
              error: (error, _) => ErrorRetryView(
                error: error,
                onRetry: () => ref.invalidate(activeServicesProvider),
              ),
              data: (services) {
                if (services.isEmpty) {
                  return const _EmptyServices();
                }

                if (_serviceIds.isEmpty) {
                  _serviceIds.addAll(services.map((s) => s.id));
                }

                return Column(
                  children: services
                      .map(
                        (service) => _ServiceSelectorTile(
                          service: service,
                          selected: _serviceIds.contains(service.id),
                          onChanged: (selected) {
                            setState(() {
                              if (selected) {
                                _serviceIds.add(service.id);
                              } else {
                                _serviceIds.remove(service.id);
                              }
                            });
                          },
                        ),
                      )
                      .toList(),
                );
              },
            ),
            const SizedBox(height: 14),
            Text(
              'Bill Notes',
              style: AppTextStyles.body.copyWith(
                color: Theme.of(context).colorScheme.onSurface,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _noteCtrl,
              maxLines: 4,
              decoration: InputDecoration(
                hintText:
                    'Mention any specific adjustments, late fees, or internal memo details here.',
                filled: true,
                fillColor:
                    Theme.of(context).colorScheme.surfaceContainerHighest,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: isLoading ? null : _generate,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              child: isLoading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation(Colors.white),
                      ),
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.sparkles, size: 16),
                        const SizedBox(width: 8),
                        Text(
                          'Generate Bill Now',
                          style: AppTextStyles.body.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _generate() async {
    if (_serviceIds.isEmpty) {
      context.showErrorSnackBar('Select at least one service');
      return;
    }

    await ref.read(billGenerationProvider.notifier).generate(
          yearMonth: _selectedMonth.toYearMonth(),
          serviceIds: _serviceIds.toList(),
          customNote: _noteCtrl.text.trim().isEmpty ? null : _noteCtrl.text.trim(),
          sendEmail: false,
        );
  }
}

class _MonthChip extends StatelessWidget {
  const _MonthChip({
    required this.month,
    required this.selected,
    required this.onTap,
  });

  final DateTime month;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Ink(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: selected
              ? Border.all(color: AppColors.primary, width: 1.5)
              : null,
          boxShadow: selected
              ? null
              : const [
                  BoxShadow(
                    color: Color(0x0A2D3337),
                    blurRadius: 12,
                    offset: Offset(0, 4),
                  ),
                ],
        ),
        child: Column(
          children: [
            Text(
              month.toMonthYearDisplay().split(' ').first.toUpperCase(),
              style: AppTextStyles.labelSm.copyWith(
                color: selected ? Colors.white : Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            Text(
              '${month.year}',
              style: AppTextStyles.bodySm.copyWith(
                color: selected ? Colors.white : Theme.of(context).colorScheme.onSurface,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ServiceSelectorTile extends StatelessWidget {
  const _ServiceSelectorTile({
    required this.service,
    required this.selected,
    required this.onChanged,
  });

  final UserService service;
  final bool selected;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A2D3337),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: ListTile(
        leading: Container(
          width: 30,
          height: 30,
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceContainerHigh,
            shape: BoxShape.circle,
          ),
          child: Icon(
            ServiceIcons.fromName(service.iconName),
            size: 14,
            color: AppColors.primary,
          ),
        ),
        title: Text(
          service.name,
          style: AppTextStyles.body.copyWith(
            color: Theme.of(context).colorScheme.onSurface,
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: Text(
          '${service.deliveryTypeLabel} • ${CurrencyFormatter.formatCompact(service.price)}',
          style: AppTextStyles.labelSm.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        trailing: Checkbox(
          value: selected,
          activeColor: AppColors.primary,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          onChanged: (value) => onChanged(value ?? false),
        ),
      ),
    );
  }
}

class _EmptyServices extends StatelessWidget {
  const _EmptyServices();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A2D3337),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: const Text('No active services found. Activate at least one service.'),
    );
  }
}
