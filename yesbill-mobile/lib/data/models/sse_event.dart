import 'dart:convert';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'sse_event.freezed.dart';
part 'sse_event.g.dart';

/// Freezed union representing all possible SSE event types from the chat endpoint.
/// Mirrors the backend's streaming format in chat_service.py
@freezed
class SseEvent with _$SseEvent {
  /// Streamed text chunk from the LLM
  const factory SseEvent.chunk({required String content}) = SseChunk;

  /// Conversation title generated from context
  const factory SseEvent.title({required String title}) = SseTitle;

  /// Stream complete signal with metadata
  const factory SseEvent.done({
    String? model,
    @JsonKey(name: 'message_id') String? messageId,
  }) = SseDone;

  /// Error from the backend during streaming
  const factory SseEvent.error({required String message}) = SseError;

  /// Agent action requiring user confirmation (agent endpoint only)
  const factory SseEvent.actionRequired({
    @JsonKey(name: 'action_id') required String actionId,
    required String description,
    required Map<String, dynamic> payload,
  }) = SseActionRequired;

  /// Reasoning/thinking text (for extended thinking models)
  const factory SseEvent.reasoning({required String content}) = SseReasoning;

  /// Signals that thinking has started (for models that don't emit reasoning text)
  const factory SseEvent.thinkingStarted() = SseThinkingStarted;

  factory SseEvent.fromJson(Map<String, dynamic> json) =>
      _$SseEventFromJson(json);

  /// Parse raw SSE data string into [SseEvent].
  static SseEvent? parse(String data) {
    try {
      if (data == '[DONE]') return null;
      final json = _parseJson(data);
      if (json == null) return null;

      final type = json['type'] as String?;
      switch (type) {
        case 'chunk':
          return SseEvent.chunk(content: json['content'] as String? ?? '');
        case 'title':
          return SseEvent.title(title: json['title'] as String? ?? '');
        case 'done':
          return SseEvent.done(
            model: json['model'] as String?,
            messageId: json['message_id'] as String?,
          );
        case 'error':
          return SseEvent.error(
              message: json['message'] as String? ?? 'Unknown error');
        case 'action_required':
          final actionsList = json['actions'] as List<dynamic>?;
          final firstAction = (actionsList != null && actionsList.isNotEmpty)
              ? actionsList[0] as Map<String, dynamic>?
              : null;
          final actionId =
              ((firstAction?['action_id'] ?? json['action_id']) as String?)
                      ?.trim() ??
                  '';
          final description =
              (json['summary_text'] as String?)?.trim() ??
                  (firstAction?['summary_text'] as String?)?.trim() ??
                  (json['description'] as String?)?.trim() ??
                  '';
          final payload =
              firstAction ?? (json['payload'] as Map<String, dynamic>? ?? {});
          if (actionId.isEmpty) return null;
          return SseEvent.actionRequired(
            actionId: actionId,
            description: description,
            payload: payload,
          );
        case 'reasoning':
          final reasoningContent = json['content'] as String?;
          if (reasoningContent == null || reasoningContent.trim().isEmpty) {
            return null;
          }
          return SseEvent.reasoning(content: reasoningContent);
        case 'thinking':
          final thinkingContent = json['content'] as String?;
          if (thinkingContent == null || thinkingContent.trim().isEmpty) {
            return SseEvent.thinkingStarted(); // Signals that thinking began
          }
          return SseEvent.reasoning(content: thinkingContent);
        case 'thinking_wait':
          return null; // Status-only event — suppressed so UI keeps its own placeholder
        case 'thinking_progress':
          return null; // Status-only event — suppressed so UI keeps its own placeholder
        default:
          // Fallback: treat raw string as chunk
          if (json.containsKey('content')) {
            return SseEvent.chunk(content: json['content'] as String? ?? '');
          }
          return null;
      }
    } catch (_) {
      return null;
    }
  }

  static Map<String, dynamic>? _parseJson(String data) {
    try {
      // ignore: avoid_dynamic_calls
      return (const _JsonDecoder().convert(data)) as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }
}

// ignore: unused_element
class _JsonDecoder extends Converter<String, Object?> {
  const _JsonDecoder();
  @override
  Object? convert(String input) => jsonDecode(input);
}
