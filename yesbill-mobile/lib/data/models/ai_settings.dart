import 'package:freezed_annotation/freezed_annotation.dart';

part 'ai_settings.freezed.dart';
part 'ai_settings.g.dart';

@freezed
class AiSettings with _$AiSettings {
  const AiSettings._();

  const factory AiSettings({
    required String id,
    @JsonKey(name: 'user_id') required String userId,
    required String provider,
    @JsonKey(name: 'selected_model') String? selectedModel,
    @JsonKey(name: 'api_key_encrypted') String? apiKeyEncrypted,
    @JsonKey(name: 'enable_insights') @Default(true) bool enableInsights,
    @JsonKey(name: 'is_key_valid') @Default(false) bool isKeyValid,
    @JsonKey(name: 'key_validated_at') DateTime? keyValidatedAt,
    @JsonKey(name: 'default_reasoning_effort') @Default('none') String defaultReasoningEffort,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _AiSettings;

  factory AiSettings.fromJson(Map<String, dynamic> json) =>
      _$AiSettingsFromJson(json);

  /// Backward-compat computed getter — no DB column, derived from key validity
  bool get isActive => isKeyValid;
}

@freezed
class AiModel with _$AiModel {
  const factory AiModel({
    required String provider,
    @JsonKey(name: 'model_id') required String modelId,
    required String name,
    @JsonKey(name: 'thinking_supported') @Default(false) bool thinkingSupported,
    @Default(false) bool available,
  }) = _AiModel;

  factory AiModel.fromJson(Map<String, dynamic> json) =>
      _$AiModelFromJson(json);
}

@freezed
class KeyValidationResult with _$KeyValidationResult {
  const factory KeyValidationResult({
    required bool valid,
    String? message,
    @Default([]) List<AiModel> models,
  }) = _KeyValidationResult;

  factory KeyValidationResult.fromJson(Map<String, dynamic> json) =>
      _$KeyValidationResultFromJson(json);
}
