import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/services_provider.dart';
import 'widgets/service_form.dart';

class AddServiceScreen extends ConsumerWidget {
  const AddServiceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mutation = ref.watch(serviceMutationProvider);
    final userId = ref.watch(authProvider).user?.id;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 8, 14, 2),
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
                    child: Center(
                      child: Text(
                        'YesBill',
                        style: AppTextStyles.body.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 32),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  Text(
                    'Add New Service',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.h1.copyWith(
                      color: Theme.of(context).colorScheme.onSurface,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Categorize your logistics',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.body.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: ServiceForm(
                isSubmitting: mutation.isLoading,
                submitLabel: 'Save Service',
                onSubmit: (fields) async {
                  if (userId == null) return false;
                  final ok = await ref
                      .read(serviceMutationProvider.notifier)
                      .createService({
                    ...fields,
                    'user_id': userId,
                  });
                  if (ok && context.mounted) {
                    context.pop();
                  }
                  return ok;
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
