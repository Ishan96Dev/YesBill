import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../data/models/user_service.dart';
import '../../../providers/services_provider.dart';
import '../../widgets/common/error_retry_view.dart';
import '../../widgets/common/loading_shimmer.dart';
import 'widgets/service_form.dart';

class EditServiceScreen extends ConsumerWidget {
  const EditServiceScreen({super.key, required this.serviceId});

  final String serviceId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final servicesAsync = ref.watch(userServicesProvider);
    final mutation = ref.watch(serviceMutationProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      body: servicesAsync.when(
        loading: () => const SafeArea(
          child: Padding(
            padding: EdgeInsets.all(16),
            child: ShimmerList(count: 5, itemHeight: 56),
          ),
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
            return SafeArea(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Service not found',
                        style: AppTextStyles.h3.copyWith(
                          color: Theme.of(context).colorScheme.onSurface,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'This service may have been deleted already.',
                        style: AppTextStyles.body.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 14),
                      FilledButton(
                        onPressed: () => context.go('/services'),
                        child: const Text('Back to Services'),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }

          return SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 10, 14, 4),
                  child: Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Theme.of(context).colorScheme.surfaceContainerHigh,
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x0F2D3337),
                              blurRadius: 12,
                              offset: Offset(0, 4),
                            ),
                          ],
                        ),
                        child: IconButton(
                          padding: EdgeInsets.zero,
                          onPressed: () => context.pop(),
                          icon: const Icon(LucideIcons.arrowLeft, size: 16),
                        ),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(left: 10),
                          child: Text(
                            'Edit Service',
                            style: AppTextStyles.h4.copyWith(
                              color: Theme.of(context).colorScheme.onSurface,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primary.withOpacity(0.1),
                        ),
                        alignment: Alignment.center,
                        child: const Icon(
                          LucideIcons.user,
                          size: 16,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: ServiceForm(
                    initial: service,
                    isSubmitting: mutation.isLoading,
                    submitLabel: 'Save Service',
                    onSubmit: (fields) async {
                      final ok = await ref
                          .read(serviceMutationProvider.notifier)
                          .updateService(serviceId, fields);
                      if (ok && context.mounted) {
                        context.pop();
                      }
                      return ok;
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
                  child: TextButton(
                    onPressed: mutation.isLoading
                        ? null
                        : () async {
                            final ok = await ref
                                .read(serviceMutationProvider.notifier)
                                .deleteService(serviceId);
                            if (ok && context.mounted) {
                              context.go('/services');
                            }
                          },
                    child: const Text(
                      'Delete Service',
                      style: TextStyle(
                        color: AppColors.error,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
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
