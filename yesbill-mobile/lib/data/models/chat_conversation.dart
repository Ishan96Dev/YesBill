import 'package:freezed_annotation/freezed_annotation.dart';

part 'chat_conversation.freezed.dart';
part 'chat_conversation.g.dart';

@freezed
class ChatConversation with _$ChatConversation {
  const factory ChatConversation({
    required String id,
    @JsonKey(name: 'user_id') required String userId,
    @Default('New Conversation') String title,
    @JsonKey(name: 'conv_type') @Default('main') String convType,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _ChatConversation;

  factory ChatConversation.fromJson(Map<String, dynamic> json) =>
      _$ChatConversationFromJson(json);
}

@freezed
class ChatMessage with _$ChatMessage {
  const factory ChatMessage({
    required String id,
    @JsonKey(name: 'conversation_id') required String conversationId,
    @JsonKey(name: 'user_id') String? userId,
    @Default('user') String role,
    @Default('') String content,
    String? reasoning,
    @JsonKey(name: 'thinking_duration_seconds') int? thinkingDurationSeconds,
    @JsonKey(name: 'model_used') String? modelUsed,
    String? feedback,
    @JsonKey(name: 'is_streaming') @Default(false) bool isStreaming,
    @JsonKey(name: 'context_tags') List<String>? contextTags,
    Map<String, dynamic>? metadata,
    @JsonKey(name: 'created_at') DateTime? createdAt,
  }) = _ChatMessage;

  factory ChatMessage.fromJson(Map<String, dynamic> json) =>
      _$ChatMessageFromJson(json);
}

extension ChatMessageRole on ChatMessage {
  bool get isUser => role == 'user';
  bool get isAssistant => role == 'assistant';
}
