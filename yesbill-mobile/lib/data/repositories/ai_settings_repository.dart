import '../datasources/remote/ai_settings_remote_ds.dart';
import '../models/ai_provider_info.dart';
import '../models/ai_settings.dart';

class AiSettingsRepository {
  AiSettingsRepository({required AiSettingsRemoteDataSource remoteDs}) : _remoteDs = remoteDs;
  final AiSettingsRemoteDataSource _remoteDs;

  Future<List<AiSettings>> getAllSettings() => _remoteDs.getAllSettings();
  Future<AiSettings> saveSettings({required String provider, required String apiKey,
      String? selectedModel, String reasoningEffort = 'none', String? ollamaBaseUrl}) =>
      _remoteDs.saveSettings(provider: provider, apiKey: apiKey,
          selectedModel: selectedModel, reasoningEffort: reasoningEffort, ollamaBaseUrl: ollamaBaseUrl);
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
