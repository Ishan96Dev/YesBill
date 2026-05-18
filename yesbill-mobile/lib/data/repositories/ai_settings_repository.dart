import 'package:supabase_flutter/supabase_flutter.dart' hide AuthException;

import '../../core/errors/app_exception.dart';
import '../../core/errors/error_handler.dart';
import '../datasources/remote/ai_settings_remote_ds.dart';
import '../models/ai_provider_info.dart';
import '../models/ai_settings.dart';

class AiSettingsRepository {
  AiSettingsRepository({
    required AiSettingsRemoteDataSource remoteDs,
    required SupabaseClient supabase,
  })  : _remoteDs = remoteDs,
        _supabase = supabase;

  final AiSettingsRemoteDataSource _remoteDs;
  final SupabaseClient _supabase;

  Future<List<AiSettings>> getAllSettings() => _remoteDs.getAllSettings();

  /// Persists AI settings to Supabase first (matches web onboarding), then
  /// falls back to the FastAPI backend if the direct upsert fails.
  Future<AiSettings> saveSettings({
    required String provider,
    required String apiKey,
    String? selectedModel,
    String reasoningEffort = 'none',
    bool enableInsights = true,
    bool isKeyValid = false,
    String? ollamaBaseUrl,
  }) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) {
      throw const AuthException('Not authenticated');
    }

    final upsertData = <String, dynamic>{
      'user_id': userId,
      'provider': provider,
      'api_key_encrypted': apiKey,
      'selected_model': selectedModel ?? '',
      'enable_insights': enableInsights,
      'is_key_valid': isKeyValid,
      'default_reasoning_effort': reasoningEffort,
      'updated_at': DateTime.now().toUtc().toIso8601String(),
    };
    if (ollamaBaseUrl != null) {
      upsertData['ollama_base_url'] = ollamaBaseUrl;
    }

    try {
      final row = await _supabase
          .from('user_ai_settings')
          .upsert(upsertData, onConflict: 'user_id,provider')
          .select()
          .single();
      return AiSettings.fromJson(Map<String, dynamic>.from(row));
    } catch (e) {
      // Retry without optional columns if schema is behind migrations.
      final message = e.toString();
      if (message.contains('default_reasoning_effort') ||
          message.contains('ollama_base_url')) {
        final safe = Map<String, dynamic>.from(upsertData)
          ..remove('default_reasoning_effort')
          ..remove('ollama_base_url');
        try {
          final row = await _supabase
              .from('user_ai_settings')
              .upsert(safe, onConflict: 'user_id,provider')
              .select()
              .single();
          return AiSettings.fromJson(Map<String, dynamic>.from(row));
        } catch (_) {
          // fall through to backend
        }
      }
    }

    return _remoteDs.saveSettings(
      provider: provider,
      apiKey: apiKey,
      selectedModel: selectedModel,
      reasoningEffort: reasoningEffort,
      enableInsights: enableInsights,
      isKeyValid: isKeyValid,
      ollamaBaseUrl: ollamaBaseUrl,
    );
  }

  Future<void> updateKeyValidation({
    required String provider,
    required bool isValid,
  }) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return;

    try {
      await _supabase.from('user_ai_settings').upsert(
        {
          'user_id': userId,
          'provider': provider,
          'is_key_valid': isValid,
          if (isValid) 'key_validated_at': DateTime.now().toUtc().toIso8601String(),
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        },
        onConflict: 'user_id,provider',
      );
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }
  Future<AiSettings> updateSettings({required String provider, String? apiKey,
      String? selectedModel, String? reasoningEffort}) =>
      _remoteDs.updateSettings(provider: provider, apiKey: apiKey,
          selectedModel: selectedModel, reasoningEffort: reasoningEffort);
  Future<void> deleteSettings(String provider) => _remoteDs.deleteSettings(provider);
  Future<KeyValidationResult> validateKey({required String provider, required String apiKey}) =>
      _remoteDs.validateKey(provider: provider, apiKey: apiKey);
    Future<List<AiProviderInfo>> getProviders() => _remoteDs.getProviders();
  Future<List<String>> getOllamaModels(String baseUrl) => _remoteDs.getOllamaModels(baseUrl);
}
