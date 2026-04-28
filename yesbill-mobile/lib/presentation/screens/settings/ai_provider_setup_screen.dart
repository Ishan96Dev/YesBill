import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/validators.dart';
import '../../../providers/ai_settings_provider.dart';
import '../../widgets/auth_widgets.dart';
import '../../widgets/common/app_dropdown.dart';

class AiProviderSetupScreen extends ConsumerStatefulWidget {
  const AiProviderSetupScreen({super.key, required this.provider});
  final String provider;

  @override
  ConsumerState<AiProviderSetupScreen> createState() =>
      _AiProviderSetupScreenState();
}

class _AiProviderSetupScreenState extends ConsumerState<AiProviderSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _apiKeyCtrl = TextEditingController();
  bool _obscureKey = true;
  String _reasoningEffort = 'none';
  String? _selectedModel;
  bool _hydrated = false;

  @override
  void dispose() {
    _apiKeyCtrl.dispose();
    super.dispose();
  }

  Future<void> _save({
    required String providerName,
    required bool hasExistingKey,
  }) async {
    if (!_formKey.currentState!.validate()) return;

    final mutation = ref.read(aiSettingsMutationProvider.notifier);
    final inputApiKey = _apiKeyCtrl.text.trim();

    if (inputApiKey.isEmpty && hasExistingKey) {
      await mutation.update(
        provider: widget.provider,
        selectedModel: _selectedModel,
        reasoningEffort: _reasoningEffort,
      );
    } else {
      final valid = await mutation.validateKey(
        provider: widget.provider,
        apiKey: inputApiKey,
      );

      if (!valid) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('API key validation failed. Please check and retry.'),
          ),
        );
        return;
      }

      await mutation.save(
        provider: widget.provider,
        apiKey: inputApiKey,
        selectedModel: _selectedModel,
        reasoningEffort: _reasoningEffort,
      );
    }

    if (!mounted) return;
    final state = ref.read(aiSettingsMutationProvider);
    if (state is AiSettingsMutationError) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(state.message)),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Settings saved for $providerName'),
        backgroundColor: AppColors.success,
      ),
    );
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final providersAsync = ref.watch(aiProviderCatalogProvider);
    final settings = ref.watch(aiSettingsListProvider).valueOrNull ?? const [];
    final existingMatches =
        settings.where((s) => s.provider == widget.provider).toList();
    final existing = existingMatches.isEmpty ? null : existingMatches.first;

    final hasExistingKey = existing?.isKeyValid == true;

    final isLoading = ref.watch(aiSettingsMutationProvider) is AiSettingsMutationLoading;
    return providersAsync.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (error, _) => Scaffold(
        appBar: AppBar(title: const Text('AI Provider')),
        body: Center(child: Text(error.toString())),
      ),
      data: (providers) {
        final providerMatches =
            providers.where((p) => p.id == widget.provider).toList();
        final provider = providerMatches.isEmpty ? null : providerMatches.first;

        if (provider == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('AI Provider')),
            body: const Center(child: Text('Provider not found')),
          );
        }

        if (!_hydrated) {
          _reasoningEffort = existing?.defaultReasoningEffort ?? 'none';
          _selectedModel = existing?.selectedModel ??
              (provider.models.isNotEmpty ? provider.models.first.id : null);
          _hydrated = true;
        }

        return Scaffold(
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(LucideIcons.arrowLeft),
              onPressed: () => context.pop(),
            ),
            title: Text(provider.name, style: AppTextStyles.h3),
          ),
          body: SingleChildScrollView(
            child: Form(
              key: _formKey,
              autovalidateMode: AutovalidateMode.onUserInteraction,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _ProviderHeroBanner(provider: provider),
                  Padding(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(provider.name, style: AppTextStyles.h2),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          provider.description,
                          style: AppTextStyles.body.copyWith(
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xl),
                        AppDropdown<String>(
                          label: 'Model',
                          value: _selectedModel,
                          items: provider.models
                              .map(
                                (m) => AppDropdownItem(
                                  value: m.id,
                                  label: m.name,
                                  subtitle: (m.description != null &&
                                          m.description!.isNotEmpty)
                                      ? m.description
                                      : null,
                                ),
                              )
                              .toList(),
                          onChanged: (value) {
                            if (value != null) setState(() => _selectedModel = value);
                          },
                        ),
                        const SizedBox(height: AppSpacing.lg),
                        const Text('API Key', style: AppTextStyles.label),
                        const SizedBox(height: AppSpacing.sm),
                        if (hasExistingKey)
                          Padding(
                            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                            child: Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.success.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(999),
                                  ),
                                  child: Text(
                                    'Validated key on file',
                                    style: AppTextStyles.labelSm.copyWith(
                                      color: AppColors.success,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                                if (existing?.keyValidatedAt != null)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Theme.of(context)
                                          .colorScheme
                                          .surfaceContainerHighest,
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                    child: Text(
                                      'Last checked ${existing!.keyValidatedAt!.toLocal().toString().split('.').first}',
                                      style: AppTextStyles.labelSm.copyWith(
                                        color: Theme.of(context)
                                            .colorScheme
                                            .onSurfaceVariant,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        TextFormField(
                          controller: _apiKeyCtrl,
                          obscureText: _obscureKey,
                          onChanged: (_) => setState(() {}),
                          validator: (value) {
                            final trimmed = (value ?? '').trim();
                            if (trimmed.isEmpty && hasExistingKey) {
                              return null;
                            }
                            return Validators.apiKey(
                              value,
                              provider: widget.provider,
                            );
                          },
                          style: AppTextStyles.body,
                          decoration: InputDecoration(
                            hintText: hasExistingKey
                                ? 'Leave blank to keep current key'
                                : 'Enter your API key',
                            hintStyle: AppTextStyles.body.copyWith(
                              color: Theme.of(context).colorScheme.onSurfaceVariant,
                            ),
                            filled: true,
                            fillColor:
                                Theme.of(context).colorScheme.surfaceContainerHighest,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(
                                color: Theme.of(context).colorScheme.outline,
                              ),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(
                                color: Theme.of(context).colorScheme.outline,
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(
                                color: AppColors.primary,
                                width: 2,
                              ),
                            ),
                            prefixIcon: Icon(
                              LucideIcons.key,
                              color: Theme.of(context).colorScheme.onSurfaceVariant,
                              size: 18,
                            ),
                            suffixIcon: IconButton(
                              style: IconButton.styleFrom(
                                backgroundColor: Colors.transparent,
                                shape: const CircleBorder(),
                                minimumSize: const Size(40, 40),
                              ),
                              icon: Icon(
                                _obscureKey ? LucideIcons.eyeOff : LucideIcons.eye,
                                color:
                                    Theme.of(context).colorScheme.onSurfaceVariant,
                                size: 18,
                              ),
                              onPressed: () =>
                                  setState(() => _obscureKey = !_obscureKey),
                            ),
                          ),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        ApiKeyStrengthIndicator(
                          value: _apiKeyCtrl.text,
                          provider: widget.provider,
                          hasStoredValidKey: hasExistingKey,
                        ),
                        const SizedBox(height: AppSpacing.xl),
                        AppDropdown<String>(
                          label: 'Reasoning effort',
                          value: _reasoningEffort,
                          items: const [
                            AppDropdownItem(value: 'none', label: 'None', subtitle: 'Fastest — no chain-of-thought'),
                            AppDropdownItem(value: 'low', label: 'Low', subtitle: 'Light reasoning'),
                            AppDropdownItem(value: 'medium', label: 'Medium', subtitle: 'Balanced speed & depth'),
                            AppDropdownItem(value: 'high', label: 'High', subtitle: 'Thorough analysis'),
                          ],
                          onChanged: (value) {
                            if (value != null) setState(() => _reasoningEffort = value);
                          },
                        ),
                        const SizedBox(height: AppSpacing.xl),
                        FilledButton(
                          onPressed: isLoading
                              ? null
                              : () => _save(
                                    providerName: provider.name,
                                    hasExistingKey: hasExistingKey,
                                  ),
                          style: FilledButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            minimumSize: const Size.fromHeight(52),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : Text(
                                  'Save Settings',
                                  style: AppTextStyles.h4.copyWith(
                                    color: Colors.white,
                                  ),
                                ),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Center(
                          child: TextButton.icon(
                            onPressed: () async {
                              final uri = Uri.tryParse(provider.docsUrl ?? '');
                              if (uri != null && uri.hasScheme) {
                                await launchUrl(uri, mode: LaunchMode.externalApplication);
                              }
                            },
                            icon: const Icon(
                              LucideIcons.externalLink,
                              size: 14,
                              color: AppColors.primary,
                            ),
                            label: Text(
                              'Get an API key from ${provider.name}',
                              style: AppTextStyles.bodySm.copyWith(
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

// ── Provider hero banner ───────────────────────────────────────────────────────
String? _providerLocalAsset(String providerId) {
  return switch (providerId) {
    'openai' => 'assets/images/openai.png',
    'anthropic' => 'assets/images/anthropic.png',
    'google' => 'assets/images/google-ai.png',
    _ => null,
  };
}

Color _providerBgColor(String providerId) {
  return switch (providerId) {
    'openai' => const Color(0xFF10A37F),
    'anthropic' => const Color(0xFFE07B54),
    'google' => const Color(0xFF4285F4),
    _ => AppColors.primary,
  };
}

class _ProviderHeroBanner extends StatelessWidget {
  const _ProviderHeroBanner({required this.provider});
  final dynamic provider;

  @override
  Widget build(BuildContext context) {
    final assetPath = _providerLocalAsset(provider.id as String);
    final bgColor = _providerBgColor(provider.id as String);

    return Container(
      height: 180,
      decoration: BoxDecoration(
        color: bgColor.withOpacity(0.08),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: Center(
        child: assetPath != null
            ? Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.96),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: bgColor.withOpacity(0.18),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(16),
                child: Image.asset(
                  assetPath,
                  fit: BoxFit.contain,
                  filterQuality: FilterQuality.high,
                ),
              )
            : Text(
                provider.name as String,
                style: AppTextStyles.h2.copyWith(color: bgColor),
              ),
      ),
    );
  }
}
