import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/chat_conversation.dart';
import '../data/models/sse_event.dart';
import 'core_providers.dart';

final agentConversationsProvider =
    FutureProvider<List<ChatConversation>>((ref) async {
  ref.keepAlive();
  return ref.watch(chatRemoteDsProvider).listConversations(convType: 'agent');
});

final activeAgentConversationIdProvider = StateProvider<String?>((ref) => null);

sealed class AgentState {
  const AgentState({this.messages = const []});

  final List<ChatMessage> messages;
}

final class AgentLoading extends AgentState {
  const AgentLoading({super.messages = const []});
}

final class AgentReady extends AgentState {
  const AgentReady({required super.messages});
}

final class AgentStreaming extends AgentState {
  const AgentStreaming({required super.messages});
}

final class AgentAwaitingConfirmation extends AgentState {
  const AgentAwaitingConfirmation({
    required super.messages,
    required this.actionId,
    required this.description,
    required this.payload,
  });

  final String actionId;
  final String description;
  final Map<String, dynamic> payload;
}

final class AgentError extends AgentState {
  const AgentError(this.message, {super.messages = const []});

  final String message;
}

class AgentNotifier extends AutoDisposeFamilyNotifier<AgentState, String> {
  StreamSubscription<SseEvent>? _subscription;
  KeepAliveLink? _keepAliveLink;
  final List<ChatMessage> _messages = [];
  String _streamingContent = '';
  String _reasoningContent = '';
  DateTime? _thinkingStartedAt;
  int _loadGeneration = 0;
  bool _disposed = false;

  @override
  AgentState build(String convId) {
    _disposed = false;
    ref.onDispose(() {
      _disposed = true;
      _subscription?.cancel();
      _subscription = null;
      _keepAliveLink = null;
    });
    unawaited(_loadMessages(convId));
    return AgentLoading(messages: List.unmodifiable(_messages));
  }

  Future<void> reload() => _loadMessages(arg);

  Future<void> _loadMessages(String convId) async {
    final generation = ++_loadGeneration;
    state = AgentLoading(messages: List.unmodifiable(_messages));

    try {
      final messages = await ref.read(chatRemoteDsProvider).getMessages(convId);
      if (_disposed || generation != _loadGeneration) return;

      _messages
        ..clear()
        ..addAll(messages);
      state = AgentReady(messages: List.unmodifiable(_messages));
    } catch (e) {
      if (_disposed || generation != _loadGeneration) return;
      state = AgentError(e.toString(), messages: List.unmodifiable(_messages));
    }
  }

  Future<void> sendMessage({
    required String content,
    String reasoningEffort = 'none',
    String? modelOverride,
    required String userTimezone,
  }) async {
    // Prevent AutoDispose from killing this provider while streaming.
    _keepAliveLink?.close();
    _keepAliveLink = ref.keepAlive();

    _subscription?.cancel();
    _subscription = null;
    _loadGeneration++;

    final userMsg = ChatMessage(
      id: 'temp_user_${DateTime.now().millisecondsSinceEpoch}',
      conversationId: arg,
      role: 'user',
      content: content,
      createdAt: DateTime.now(),
    );
    _messages.add(userMsg);

    final streamingId = 'streaming_${DateTime.now().millisecondsSinceEpoch}';
    _streamingContent = '';
    _reasoningContent = '';
    _thinkingStartedAt = null;
    _messages.add(
      ChatMessage(
        id: streamingId,
        conversationId: arg,
        role: 'assistant',
        content: '',
        isStreaming: true,
        createdAt: DateTime.now(),
      ),
    );
    state = AgentStreaming(messages: List.unmodifiable(_messages));

    _subscription = ref
        .read(chatRemoteDsProvider)
        .streamAgentMessage(
          convId: arg,
          content: content,
          reasoningEffort: reasoningEffort,
          modelOverride: modelOverride,
          userTimezone: userTimezone,
        )
        .listen(
          (event) => event.when(
            chunk: (chunk) {
              _streamingContent += chunk;
              _updateStreaming(streamingId);
              return null;
            },
            reasoning: (chunk) {
              _thinkingStartedAt ??= DateTime.now();
              _appendReasoningChunk(chunk);
              _updateStreaming(streamingId);
              return null;
            },
            thinkingStarted: () {
              _thinkingStartedAt ??= DateTime.now();
              return null;
            },
            title: (_) {
              ref.invalidate(agentConversationsProvider);
              return null;
            },
            done: (model, messageId) {
              // If action_required already fired, preserve AgentAwaitingConfirmation
              // state — the backend sends done as a stream terminator even when an
              // action is pending. Calling _finalizeMessage here would overwrite the
              // confirmation state AND replace the empty content with the error string.
              final durationSecs = _thinkingStartedAt != null
                  ? DateTime.now().difference(_thinkingStartedAt!).inSeconds
                  : null;
              _thinkingStartedAt = null;
              if (state is! AgentAwaitingConfirmation) {
                _finalizeMessage(streamingId,
                    model: model,
                    messageId: messageId,
                    thinkingDurationSeconds: durationSecs);
              }
              ref.invalidate(agentConversationsProvider);
              _keepAliveLink?.close();
              _keepAliveLink = null;
              return null;
            },
            error: (message) {
              _setErrorOnStreaming(streamingId, message);
              _keepAliveLink?.close();
              _keepAliveLink = null;
              return null;
            },
            actionRequired: (actionId, description, payload) {
              // If the agent produced no text before requesting an action, remove
              // the empty streaming placeholder rather than leaving an empty bubble.
              if (_streamingContent.trim().isEmpty) {
                _messages.removeWhere((m) => m.id == streamingId);
              } else {
                _updateStreaming(streamingId, isStreaming: false);
              }
              state = AgentAwaitingConfirmation(
                messages: List.unmodifiable(_messages),
                actionId: actionId,
                description: description,
                payload: payload,
              );
              _keepAliveLink?.close();
              _keepAliveLink = null;
              return null;
            },
          ),
          onError: (error) {
            _setErrorOnStreaming(streamingId, error.toString());
            _keepAliveLink?.close();
            _keepAliveLink = null;
          },
        );
  }

  void _updateStreaming(String id, {bool isStreaming = true}) {
    final index = _messages.indexWhere((message) => message.id == id);
    if (index == -1) return;

    _messages[index] = _messages[index].copyWith(
      content: _streamingContent,
      reasoning: _reasoningContent.isEmpty ? null : _reasoningContent,
      isStreaming: isStreaming,
    );

    if (state is! AgentAwaitingConfirmation) {
      state = AgentStreaming(messages: List.unmodifiable(_messages));
    }
  }

  void _appendReasoningChunk(String text) {
    final chunk = text.trim();
    if (chunk.isEmpty) return;
    if (_reasoningContent.isNotEmpty) {
      _reasoningContent += '\n';
    }
    _reasoningContent += chunk;
  }

  void _finalizeMessage(
    String id, {
    String? model,
    String? messageId,
    int? thinkingDurationSeconds,
  }) {
    final index = _messages.indexWhere((message) => message.id == id);
    if (index == -1) return;

    final msg = _messages[index];

    // If neither text nor reasoning was produced, silently remove the empty
    // placeholder rather than showing a misleading "No agent response" error.
    // This can happen when the backend exhausts its tool-call iteration limit
    // without generating final text (e.g. model kept calling IMMEDIATE tools).
    if (msg.content.trim().isEmpty &&
        (msg.reasoning == null || msg.reasoning!.trim().isEmpty)) {
      _messages.removeAt(index);
      state = AgentReady(messages: List.unmodifiable(_messages));
      return;
    }

    _messages[index] = msg.copyWith(
      id: messageId ?? id,
      isStreaming: false,
      modelUsed: model,
      thinkingDurationSeconds: thinkingDurationSeconds,
    );
    state = AgentReady(messages: List.unmodifiable(_messages));
  }

  void _setErrorOnStreaming(String id, String rawMessage) {
    final message = rawMessage.trim().isEmpty
        ? 'Agent request failed. Please try again.'
        : rawMessage.trim();
    final index = _messages.indexWhere((entry) => entry.id == id);

    if (index == -1) {
      _messages.add(
        ChatMessage(
          id: 'agent_error_${DateTime.now().millisecondsSinceEpoch}',
          conversationId: arg,
          role: 'assistant',
          content: message,
          createdAt: DateTime.now(),
        ),
      );
    } else {
      _messages[index] = _messages[index].copyWith(
        content: message,
        isStreaming: false,
      );
    }

    state = AgentError(message, messages: List.unmodifiable(_messages));
  }

  Future<void> confirmAction(String actionId) async {
    try {
      final result = await ref.read(chatRemoteDsProvider).executeAgentAction(
            actionId: actionId,
            confirmed: true,
          );
      final rawMessage = result['message'];
      final message = rawMessage is String && rawMessage.trim().isNotEmpty
          ? rawMessage.trim()
          : 'Done! The requested action was completed.';
      final rawMessageId = result['message_id'];

      _messages.add(
        ChatMessage(
          id: rawMessageId?.toString() ??
              'agent_exec_${DateTime.now().millisecondsSinceEpoch}',
          conversationId: arg,
          role: 'assistant',
          content: message,
          createdAt: DateTime.now(),
        ),
      );

      state = AgentReady(messages: List.unmodifiable(_messages));
      ref.invalidate(agentConversationsProvider);
    } catch (e) {
      state = AgentError(e.toString(), messages: List.unmodifiable(_messages));
    }
  }

  Future<void> cancelAction(String actionId) async {
    try {
      await ref.read(chatRemoteDsProvider).executeAgentAction(
            actionId: actionId,
            confirmed: false,
          );
      _messages.add(
        ChatMessage(
          id: 'agent_cancel_${DateTime.now().millisecondsSinceEpoch}',
          conversationId: arg,
          role: 'assistant',
          content: 'Action cancelled. Is there anything else I can help with?',
          createdAt: DateTime.now(),
        ),
      );

      state = AgentReady(messages: List.unmodifiable(_messages));
      ref.invalidate(agentConversationsProvider);
    } catch (e) {
      state = AgentError(e.toString(), messages: List.unmodifiable(_messages));
    }
  }

  void cancelStream() {
    _subscription?.cancel();
    _subscription = null;
    _keepAliveLink?.close();
    _keepAliveLink = null;
    state = AgentReady(messages: List.unmodifiable(_messages));
  }
}

final agentProvider =
    AutoDisposeNotifierProviderFamily<AgentNotifier, AgentState, String>(
        AgentNotifier.new);
