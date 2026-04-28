class AiProviderInfo {
  const AiProviderInfo({
    required this.id,
    required this.name,
    required this.description,
    required this.logoUrl,
    required this.docsUrl,
    required this.keyPrefix,
    required this.models,
  });

  final String id;
  final String name;
  final String description;
  final String logoUrl;
  final String docsUrl;
  final String keyPrefix;
  final List<AiProviderModelInfo> models;

  factory AiProviderInfo.fromJson(Map<String, dynamic> json) {
    final rawModels = json['models'];
    return AiProviderInfo(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      logoUrl: (json['logo_url'] ?? '').toString(),
      docsUrl: (json['docs_url'] ?? '').toString(),
      keyPrefix: (json['key_prefix'] ?? '').toString(),
      models: rawModels is List
          ? rawModels
              .whereType<Map>()
              .map((e) => AiProviderModelInfo.fromJson(
                  Map<String, dynamic>.from(e)))
              .toList()
          : const <AiProviderModelInfo>[],
    );
  }
}

class AiProviderModelInfo {
  const AiProviderModelInfo({
    required this.id,
    required this.name,
    required this.description,
    required this.recommended,
    required this.isPreview,
    required this.isDeprecated,
    required this.reasoningSupported,
    required this.reasoningLabel,
  });

  final String id;
  final String name;
  final String description;
  final bool recommended;
  final bool isPreview;
  final bool isDeprecated;
  final bool reasoningSupported;
  final String reasoningLabel;

  factory AiProviderModelInfo.fromJson(Map<String, dynamic> json) {
    return AiProviderModelInfo(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      recommended: json['recommended'] == true,
      isPreview: json['is_preview'] == true,
      isDeprecated: json['is_deprecated'] == true,
      reasoningSupported: json['reasoning_supported'] == true,
      reasoningLabel: (json['reasoning_label'] ?? 'Reasoning support').toString(),
    );
  }
}
