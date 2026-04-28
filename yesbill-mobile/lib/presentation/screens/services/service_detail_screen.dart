import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/constants/service_icons.dart';
import '../../../core/extensions/context_extensions.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../data/models/user_service.dart';
import '../../../providers/services_provider.dart';
import '../../widgets/common/error_retry_view.dart';
import '../../widgets/common/loading_shimmer.dart';

class ServiceDetailScreen extends ConsumerWidget {
  const ServiceDetailScreen({super.key, required this.serviceId});
  final String serviceId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final servicesAsync = ref.watch(userServicesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Service details'),
        actions: [
          IconButton(
            tooltip: 'Edit',
            onPressed: () => context.push('/services/$serviceId/edit'),
            icon: const Icon(LucideIcons.pencil),
          ),
        ],
      ),
      body: servicesAsync.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.base),
          child: ShimmerList(count: 4, itemHeight: 96),
        ),
        error: (error, _) => ErrorRetryView(
          error: error,
          onRetry: () => ref.invalidate(userServicesProvider),
        ),
        data: (services) {
          UserService? service;
          for (final item in services) {
            if (item.id == serviceId) {
              service = item;
              break;
            }
          }
          if (service == null) {
            return const Center(child: Text('Service not found'));
          }

          final selectedService = service;

          return ListView(
            padding: const EdgeInsets.fromLTRB(AppSpacing.base, AppSpacing.base, AppSpacing.base, 120),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.base),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 26,
                        child: Icon(ServiceIcons.fromName(selectedService.iconName), size: 22),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(selectedService.name, style: AppTextStyles.h3),
                            const SizedBox(height: 2),
                            Text(
                              '${selectedService.isProvider ? 'Provider' : 'Consumer'} • ${selectedService.deliveryTypeLabel}',
                              style: AppTextStyles.bodySm,
                            ),
                          ],
                        ),
                      ),
                      _ActivePill(active: selectedService.active),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              _DetailCard(
                title: 'Billing',
                children: [
                  _KeyValueRow(label: 'Price', value: CurrencyFormatter.formatCompact(selectedService.price)),
                  _KeyValueRow(label: 'Type', value: selectedService.type),
                  _KeyValueRow(label: 'Schedule', value: selectedService.schedule),
                  _KeyValueRow(label: 'Billing day', value: '${selectedService.billingDay}'),
                  _KeyValueRow(
                    label: 'Auto generate bill',
                    value: selectedService.autoGenerateBill ? 'Enabled' : 'Disabled',
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.sm),
              _DetailCard(
                title: 'Client details',
                children: [
                  _KeyValueRow(label: 'Name', value: selectedService.clientName ?? '—'),
                  _KeyValueRow(label: 'Phone', value: selectedService.clientPhone ?? '—'),
                  _KeyValueRow(label: 'Email', value: selectedService.clientEmail ?? '—'),
                  _KeyValueRow(label: 'Address', value: selectedService.clientAddress ?? '—'),
                ],
              ),
              if ((selectedService.notes ?? '').trim().isNotEmpty) ...[
                const SizedBox(height: AppSpacing.sm),
                _DetailCard(
                  title: 'Notes',
                  children: [Text(selectedService.notes!, style: AppTextStyles.bodySm)],
                ),
              ],
              const SizedBox(height: AppSpacing.base),
              FilledButton.icon(
                onPressed: () => context.push('/calendar/${selectedService.id}'),
                icon: const Icon(LucideIcons.calendar),
                label: const Text('Open service calendar'),
              ),
              const SizedBox(height: AppSpacing.sm),
              OutlinedButton.icon(
                onPressed: () => context.push('/services/${selectedService.id}/edit'),
                icon: const Icon(LucideIcons.pencil),
                label: const Text('Edit service'),
              ),
              const SizedBox(height: AppSpacing.sm),
              TextButton.icon(
                onPressed: () => _deleteService(context, ref),
                icon: const Icon(LucideIcons.trash2),
                label: const Text('Delete service'),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _deleteService(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete service?'),
        content: const Text('This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;
    final ok = await ref.read(serviceMutationProvider.notifier).deleteService(serviceId);
    if (!context.mounted) return;
    if (ok) {
      context.go('/services');
    } else {
      context.showErrorSnackBar('Unable to delete service');
    }
  }
}

class _ActivePill extends StatelessWidget {
  const _ActivePill({required this.active});

  final bool active;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 6),
      decoration: BoxDecoration(
        color: active
            ? Colors.green.withOpacity(0.15)
            : Colors.orange.withOpacity(0.15),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        active ? 'Active' : 'Paused',
        style: AppTextStyles.labelSm.copyWith(
          color: active ? Colors.green : Colors.orange,
        ),
      ),
    );
  }
}

class _DetailCard extends StatelessWidget {
  const _DetailCard({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.base),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: AppTextStyles.h4),
            const SizedBox(height: AppSpacing.sm),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _KeyValueRow extends StatelessWidget {
  const _KeyValueRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(label, style: AppTextStyles.bodySm),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: AppTextStyles.bodySm.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
