import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/chat_conversation.dart';
import '../data/models/sse_event.dart';
import 'core_providers.dart';

/// Conversations list
final conversationsProvider =
    FutureProvider<List<ChatConversation>>((ref) async {
  ref.keepAlive();
  return ref.watch(chatRemoteDsProvider).listConversations(convType: 'main');
});

/// Currently active conversation ID
final activeConversationIdProvider = StateProvider<String?>((ref) => null);

/// Loading state for a single conversation thread.
final chatMessagesLoadingProvider =
    StateProvider.autoDispose.family<bool, String>((ref, _) => true);

/// Load error for a single conversation thread.
final chatMessagesErrorProvider =
    StateProvider.autoDispose.family<Object?, String>((ref, _) => null);

/// Chat messages state — includes streaming placeholder
class ChatMessagesNotifier
    extends AutoDisposeFamilyNotifier<List<ChatMessage>, String> {
  StreamSubscription<SseEvent>? _subscription;
  KeepAliveLink? _keepAliveLink;
  String _streamingContent = '';
  String _reasoningContent = '';
  DateTime? _thinkingStartedAt;
  int _loadGeneration = 0;
  bool _disposed = false;

  @override
  List<ChatMessage> build(String convId) {
    _disposed = false;
    ref.onDispose(() {
      _disposed = true;
      _subscription?.cancel();
      _subscription = null;
      _keepAliveLink = null;
    });
    unawaited(_loadMessages(convId));
    return const [];
  }

  Future<void> reload() => _loadMessages(arg);

  Future<void> _loadMessages(String convId) async {
    final generation = ++_loadGeneration;
    ref.read(chatMessagesLoadingProvider(convId).notifier).state = true;
    ref.read(chatMessagesErrorProvider(convId).notifier).state = null;

    try {
      final messages = await ref.read(chatRemoteDsProvider).getMessages(convId);
      if (_disposed || generation != _loadGeneration) return;
      state = messages;
    } catch (e) {
      if (_disposed || generation != _loadGeneration) return;
      state = const [];
      ref.read(chatMessagesErrorProvider(convId).notifier).state = e;
    } finally {
      if (!_disposed && generation == _loadGeneration) {
        ref.read(chatMessagesLoadingProvider(convId).notifier).state = false;
      }
    }
  }

  Future<void> sendMessage({
    required String content,
    String reasoningEffort = 'none',
    String? modelOverride,
    required String userTimezone,
  }) async {
    // Prevent AutoDispose from killing this provider while streaming.
    // The widget may not have rebuilt to watch it yet when sendMessage is called.
    _keepAliveLink?.close();
    _keepAliveLink = ref.keepAlive();

    // Cancel any in-progress _loadMessages so it cannot overwrite the streaming
    // state with stale DB data after we add the user message + placeholder.
    _subscription?.cancel();
    _subscription = null;
    _loadGeneration++;

    ref.read(chatMessagesErrorProvider(arg).notifier).state = null;

    // Add user message immediately (optimistic)
    state = [
      ...state,
      ChatMessage(
        id: 'temp_user_${DateTime.now().millisecondsSinceEpoch}',
        conversationId: arg,
        role: 'user',
        content: content,
        createdAt: DateTime.now(),
      ),
    ];

    // Add streaming placeholder for assistant
    final streamingId = 'streaming_${DateTime.now().millisecondsSinceEpoch}';
    _streamingContent = '';
    _reasoningContent = '';
    state = [
      ...state,
      ChatMessage(
        id: streamingId,
        conversationId: arg,
        role: 'assistant',
        content: '',
        isStreaming: true,
        createdAt: DateTime.now(),
      ),
    ];

    final stream = ref.read(chatRemoteDsProvider).streamChatMessage(
          convId: arg,
          content: content,
          reasoningEffort: reasoningEffort,
          modelOverride: modelOverride,
          userTimezone: userTimezone,
        );

    _subscription = stream.listen(
      (event) {
        event.when(
          chunk: (text) {
            _streamingContent += text;
            _updateStreamingMessage(streamingId, content: _streamingContent);
          },
          reasoning: (text) {
            _thinkingStartedAt ??= DateTime.now();
            _appendReasoningChunk(text);
            _updateStreamingMessage(streamingId, reasoning: _reasoningContent);
          },
          thinkingStarted: () {
            _thinkingStartedAt ??= DateTime.now();
          },
          title: (_) {
            ref.invalidate(conversationsProvider);
          },
          done: (model, messageId) {
            final durationSecs = _thinkingStartedAt != null
                ? DateTime.now().difference(_thinkingStartedAt!).inSeconds
                : null;
            _thinkingStartedAt = null;
            _finalizeMessage(streamingId,
                model: model,
                messageId: messageId,
                thinkingDurationSeconds: durationSecs);
            ref.invalidate(conversationsProvider);
            _keepAliveLink?.close();
            _keepAliveLink = null;
          },
          error: (msg) {
            _updateStreamingMessage(streamingId,
                content: 'Error: $msg', isStreaming: false);
            _keepAliveLink?.close();
            _keepAliveLink = null;
          },
          actionRequired: (_, __, ___) {
            // Agent only — handled by agent_provider
          },
        );
      },
      onError: (e) {
        _updateStreamingMessage(streamingId,
            content: 'Connection error. Please try again.', isStreaming: false);
        _keepAliveLink?.close();
        _keepAliveLink = null;
      },
    );
  }

  void _updateStreamingMessage(
    String streamingId, {
    String? content,
    String? reasoning,
    bool isStreaming = true,
  }) {
    state = state.map((m) {
      if (m.id == streamingId) {
        return m.copyWith(
          content: content ?? m.content,
          reasoning: reasoning ?? m.reasoning,
          isStreaming: isStreaming,
        );
      }
      return m;
    }).toList();
  }

  void _appendReasoningChunk(String text) {
    final chunk = text.trim();
    if (chunk.isEmpty) return;
    if (_reasoningContent.isNotEmpty) {
      _reasoningContent += '\n';
    }
    _reasoningContent += chunk;
  }

  void _finalizeMessage(String streamingId,
      {String? model, String? messageId, int? thinkingDurationSeconds}) {
    state = state.map((m) {
      if (m.id == streamingId) {
        return m.copyWith(
          id: messageId ?? streamingId,
          content: m.content.trim().isEmpty
              ? 'No response was generated. Please try again.'
              : m.content,
          isStreaming: false,
          modelUsed: model,
          thinkingDurationSeconds: thinkingDurationSeconds,
        );
      }
      return m;
    }).toList();
  }

  void cancelStream() {
    _subscription?.cancel();
    _subscription = null;
  }
}

final chatMessagesProvider = AutoDisposeNotifierProviderFamily<
    ChatMessagesNotifier, List<ChatMessage>, String>(ChatMessagesNotifier.new);
