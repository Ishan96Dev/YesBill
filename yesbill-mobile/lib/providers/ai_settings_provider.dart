import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../data/models/ai_provider_info.dart';
import '../data/repositories/ai_settings_repository.dart';
import '../data/models/ai_settings.dart';
import 'core_providers.dart';

final aiSettingsRepositoryProvider = Provider<AiSettingsRepository>((ref) =>
    AiSettingsRepository(remoteDs: ref.watch(aiSettingsRemoteDsProvider)));

final aiSettingsListProvider = FutureProvider<List<AiSettings>>((ref) =>
    ref.watch(aiSettingsRepositoryProvider).getAllSettings());

final aiProviderCatalogProvider = FutureProvider<List<AiProviderInfo>>((ref) =>
  ref.watch(aiSettingsRepositoryProvider).getProviders());

sealed class AiSettingsMutationState { const AiSettingsMutationState(); }
final class AiSettingsMutationIdle extends AiSettingsMutationState { const AiSettingsMutationIdle(); }
final class AiSettingsMutationLoading extends AiSettingsMutationState { const AiSettingsMutationLoading(); }
final class AiSettingsMutationSuccess extends AiSettingsMutationState {
  const AiSettingsMutationSuccess(this.settings); final AiSettings settings;
}
final class AiSettingsMutationError extends AiSettingsMutationState {
  const AiSettingsMutationError(this.message); final String message;
}

class AiSettingsMutationNotifier extends Notifier<AiSettingsMutationState> {
  @override
  AiSettingsMutationState build() => const AiSettingsMutationIdle();

  Future<void> save({required String provider, required String apiKey,
      String? selectedModel, String reasoningEffort = 'none', String? ollamaBaseUrl}) async {
    state = const AiSettingsMutationLoading();
    try {
      final result = await ref.read(aiSettingsRepositoryProvider).saveSettings(
        provider: provider, apiKey: apiKey,
        selectedModel: selectedModel, reasoningEffort: reasoningEffort,
        ollamaBaseUrl: ollamaBaseUrl,
      );
      ref.invalidate(aiSettingsListProvider);
      state = AiSettingsMutationSuccess(result);
    } catch (e) { state = AiSettingsMutationError(e.toString()); }
  }

  Future<void> update({
    required String provider,
    String? apiKey,
    String? selectedModel,
    String? reasoningEffort,
  }) async {
    state = const AiSettingsMutationLoading();
    try {
      final result = await ref.read(aiSettingsRepositoryProvider).updateSettings(
            provider: provider,
            apiKey: apiKey,
            selectedModel: selectedModel,
            reasoningEffort: reasoningEffort,
          );
      ref.invalidate(aiSettingsListProvider);
      state = AiSettingsMutationSuccess(result);
    } catch (e) {
      state = AiSettingsMutationError(e.toString());
    }
  }

  Future<void> delete(String provider) async {
    state = const AiSettingsMutationLoading();
    try {
      await ref.read(aiSettingsRepositoryProvider).deleteSettings(provider);
      ref.invalidate(aiSettingsListProvider);
      state = const AiSettingsMutationIdle();
    } catch (e) { state = AiSettingsMutationError(e.toString()); }
  }

  Future<bool> validateKey({required String provider, required String apiKey}) async {
    state = const AiSettingsMutationLoading();
    try {
      final result = await ref.read(aiSettingsRepositoryProvider).validateKey(
        provider: provider, apiKey: apiKey,
      );
      state = const AiSettingsMutationIdle();
      return result.valid;
    } catch (e) { state = AiSettingsMutationError(e.toString()); return false; }
  }

  /// Called when an existing saved key fails validation.
  /// Marks is_key_valid=false in the DB and inserts an ai_key_invalid notification.
  Future<void> markKeyInvalid(String provider) async {
    final client = ref.read(supabaseClientProvider);
    final userId = client.auth.currentUser?.id;
    if (userId == null) return;
    try {
      await client
          .from('user_ai_settings')
          .update({'is_key_valid': false})
          .eq('user_id', userId)
          .eq('provider', provider);
      ref.invalidate(aiSettingsListProvider);
      // Insert notification (fire-and-forget; ignore duplicate errors)
      await client.from('notifications').insert({
        'user_id': userId,
        'type': 'ai_key_invalid',
        'title': 'API key is invalid',
        'message':
            'Your saved $provider API key has expired or been revoked. Please update it in Settings → AI Providers.',
        'data': {'path': '/settings/ai/$provider'},
      });
    } catch (_) {
      // Non-fatal — do not surface errors to the user
    }
  }
}

final aiSettingsMutationProvider = NotifierProvider<AiSettingsMutationNotifier, AiSettingsMutationState>(
    AiSettingsMutationNotifier.new);

final ollamaModelsProvider =
    FutureProvider.autoDispose.family<List<String>, String>((ref, baseUrl) async {
  final repo = ref.read(aiSettingsRepositoryProvider);
  return repo.getOllamaModels(baseUrl);
});
