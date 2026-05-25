import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_gradients.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_surfaces.dart';
import '../../../providers/ai_settings_provider.dart';
import '../../widgets/common/error_retry_view.dart';
import '../../widgets/common/gradient_card.dart';
import '../../widgets/common/provider_badge.dart';

class AiSettingsScreen extends ConsumerWidget {
  const AiSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final providersAsync = ref.watch(aiProviderCatalogProvider);
    final settingsMap = {
      for (final s in ref.watch(aiSettingsListProvider).valueOrNull ?? [])
        s.provider: s,
    };

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => context.pop(),
        ),
        title: const Text('AI Settings', style: AppTextStyles.h3),
      ),
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            GradientCard(
              gradient: AppGradients.teal,
              child: Text(
                'Choose your AI provider and configure secure API access.',
                style: AppTextStyles.body.copyWith(color: Colors.white),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Expanded(
              child: providersAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, _) => ErrorRetryView(
                  error: error,
                  onRetry: () => ref.invalidate(aiProviderCatalogProvider),
                ),
                data: (providers) {
                  return ListView.separated(
                    padding: const EdgeInsets.only(bottom: 100),
                    itemCount: providers.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(height: AppSpacing.sm),
                    itemBuilder: (context, index) {
                      final p = providers[index];
                      final current = settingsMap[p.id];
                      final isConnected = current?.isActive == true;

                      final selectedModelId = current?.selectedModel;
                      String? selectedModelName;
                      if (selectedModelId != null) {
                        for (final model in p.models) {
                          if (model.id == selectedModelId) {
                            selectedModelName = model.name;
                            break;
                          }
                        }
                      }

                      final modelLabel = selectedModelName ??
                          selectedModelId ??
                          (p.models.isNotEmpty ? p.models.first.name : 'No model');

                      return Container(
                        decoration: BoxDecoration(
                          color: AppSurfaces.panel(context),
                          borderRadius: BorderRadius.circular(16),
                          border: AppSurfaces.cardBorder(context),
                          boxShadow: AppSurfaces.softShadow(context),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.md,
                            vertical: AppSpacing.xs,
                          ),
                          leading: ProviderBadge(providerId: p.id, size: 44),
                          title: Text(
                            p.name,
                            style: AppTextStyles.bodyLg.copyWith(
                              color: Theme.of(context).colorScheme.onSurface,
                            ),
                          ),
                          subtitle: Text(
                            isConnected
                                ? 'Connected • $modelLabel'
                                : modelLabel,
                            style: AppTextStyles.bodySm.copyWith(
                              color: isConnected
                                  ? AppColors.primary
                                  : Theme.of(context)
                                      .colorScheme
                                      .onSurfaceVariant,
                            ),
                          ),
                          trailing:
                              const Icon(LucideIcons.chevronRight, size: 18),
                          onTap: () => context.push('/settings/ai/${p.id}'),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
