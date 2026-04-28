import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/errors/error_handler.dart';
import '../../models/ai_provider_info.dart';
import '../../models/ai_settings.dart';

class AiSettingsRemoteDataSource {
  AiSettingsRemoteDataSource(this._dio);
  final Dio _dio;

  Map<String, dynamic> _normalizeSettingsJson(Map<String, dynamic> raw) {
    return Map<String, dynamic>.from(raw);
  }

  Future<List<AiSettings>> getAllSettings() async {
    try {
      final resp = await _dio.get(ApiConstants.aiSettings);
      final data = resp.data;
      final list = data is List<dynamic>
          ? data
          : (data is Map && data['settings'] is List<dynamic>
              ? data['settings'] as List<dynamic>
              : <dynamic>[]);
      return list
          .whereType<Map>()
          .map((e) => _normalizeSettingsJson(Map<String, dynamic>.from(e)))
          .map(AiSettings.fromJson)
          .toList();
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<AiSettings> saveSettings({
    required String provider,
    required String apiKey,
    String? selectedModel,
    String reasoningEffort = 'none',
  }) async {
    try {
      final resp = await _dio.post(ApiConstants.aiSettings, data: {
        'provider': provider,
        'api_key': apiKey,
        if (selectedModel != null) 'selected_model': selectedModel,
        'default_reasoning_effort': reasoningEffort,
      });
      return AiSettings.fromJson(
        _normalizeSettingsJson(Map<String, dynamic>.from(resp.data as Map)),
      );
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<AiSettings> updateSettings({
    required String provider,
    String? apiKey,
    String? selectedModel,
    String? reasoningEffort,
  }) async {
    try {
      final resp = await _dio.patch(
        ApiConstants.aiSettingsByProvider(provider),
        data: {
          if (apiKey != null) 'api_key': apiKey,
          if (selectedModel != null) 'selected_model': selectedModel,
          if (reasoningEffort != null)
            'default_reasoning_effort': reasoningEffort,
        },
      );
      return AiSettings.fromJson(
        _normalizeSettingsJson(Map<String, dynamic>.from(resp.data as Map)),
      );
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<void> deleteSettings(String provider) async {
    try {
      await _dio.delete(ApiConstants.aiSettingsByProvider(provider));
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<KeyValidationResult> validateKey({
    required String provider,
    required String apiKey,
  }) async {
    try {
      final resp = await _dio.post(ApiConstants.aiValidateKey, data: {
        'provider': provider,
        'api_key': apiKey,
      });

      final data = Map<String, dynamic>.from(resp.data as Map);
      final rawModels = data['models'] ?? data['models_available'];
      final parsedModels = <AiModel>[];

      if (rawModels is List) {
        for (final raw in rawModels) {
          if (raw is Map) {
            parsedModels.add(AiModel.fromJson(Map<String, dynamic>.from(raw)));
          } else if (raw is String && raw.trim().isNotEmpty) {
            parsedModels.add(
              AiModel(
                provider: provider,
                modelId: raw,
                name: raw,
                available: true,
              ),
            );
          }
        }
      }

      return KeyValidationResult(
        valid: data['valid'] == true,
        message: data['message'] as String?,
        models: parsedModels,
      );
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<List<AiProviderInfo>> getProviders() async {
    try {
      final resp = await _dio.get(ApiConstants.aiProviders);
      final raw = resp.data as List<dynamic>;
      return raw
          .whereType<Map>()
          .map((e) => AiProviderInfo.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }
}
