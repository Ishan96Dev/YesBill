import 'package:freezed_annotation/freezed_annotation.dart';
part 'ai_model.freezed.dart';
part 'ai_model.g.dart';

@freezed
class AiModel with _$AiModel {
  const factory AiModel({
    required String id,
    required String name,
    @JsonKey(name: 'label') required String label,
    @JsonKey(name: 'provider_id') required String providerId,
    @JsonKey(name: 'context_window') int? contextWindow,
    @JsonKey(name: 'max_output_tokens') int? maxOutputTokens,
    String? description,
    @JsonKey(name: 'is_active') @Default(true) bool isActive,
    @JsonKey(name: 'is_preview') @Default(false) bool isPreview,
    @JsonKey(name: 'is_deprecated') @Default(false) bool isDeprecated,
    @JsonKey(name: 'sort_order') int? sortOrder,
    @JsonKey(name: 'reasoning_supported') @Default(false) bool reasoningSupported,
    @JsonKey(name: 'thinking_param_type') String? thinkingParamType,
    @JsonKey(name: 'supported_effort_levels') @Default([]) List<String> supportedEffortLevels,
    @JsonKey(name: 'default_effort_level') String? defaultEffortLevel,
    @JsonKey(name: 'can_disable_thinking') @Default(false) bool canDisableThinking,
    @JsonKey(name: 'supports_tools') @Default(false) bool supportsTools,
  }) = _AiModel;
  factory AiModel.fromJson(Map<String, dynamic> json) => _$AiModelFromJson(json);
}

extension AiModelExt on AiModel {
  String get providerLabel {
    switch (providerId.toLowerCase()) {
      case 'openai': return 'OpenAI';
      case 'anthropic': return 'Anthropic';
      case 'google': return 'Google AI';
      default: return providerId;
    }
  }
}
