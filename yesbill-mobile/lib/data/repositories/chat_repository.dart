import 'package:supabase_flutter/supabase_flutter.dart';

import '../datasources/remote/chat_remote_ds.dart';
import '../models/chat_conversation.dart';
import '../models/sse_event.dart';
import '../../core/errors/error_handler.dart';

class ChatRepository {
  ChatRepository({
    required SupabaseClient supabase,
    required ChatRemoteDataSource remoteDs,
  })  : _supabase = supabase,
        _remoteDs = remoteDs;

  final SupabaseClient _supabase;
  final ChatRemoteDataSource _remoteDs;

  // ── Conversations ────────────────────────────────────────────────────────────

  Future<List<ChatConversation>> getConversations() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      final data = await _supabase
          .from('chat_conversations')
          .select()
          .eq('user_id', userId)
          .order('updated_at', ascending: false);

      return (data as List)
          .map((e) => ChatConversation.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<ChatConversation> createConversation({
    String title = 'New Conversation',
    String convType = 'main',
  }) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      final data = await _supabase
          .from('chat_conversations')
          .insert({
            'user_id': userId,
            'title': title,
            'conv_type': convType,
          })
          .select()
          .single();
      return ChatConversation.fromJson(data);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<void> deleteConversation(String convId) async {
    try {
      await _supabase
          .from('chat_conversations')
          .delete()
          .eq('id', convId);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  // ── Messages ──────────────────────────────────────────────────────────────────

  Future<List<ChatMessage>> getMessages(String convId) async {
    try {
      final data = await _supabase
          .from('chat_messages')
          .select()
          .eq('conversation_id', convId)
          .order('created_at', ascending: true);

      return (data as List)
          .map((e) => ChatMessage.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  /// Stream SSE events for a chat message send.
  Stream<SseEvent> sendMessage({
    required String convId,
    required String content,
    String reasoningEffort = 'none',
    String? modelOverride,
    List<String> contextTags = const [],
    required String userTimezone,
  }) {
    try {
      return _remoteDs.streamChatMessage(
        convId: convId,
        content: content,
        reasoningEffort: reasoningEffort,
        modelOverride: modelOverride,
        contextTags: contextTags,
        userTimezone: userTimezone,
      );
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  /// Stream SSE events for an agent action.
  Stream<SseEvent> sendAgentMessage({
    required String convId,
    required String content,
    String reasoningEffort = 'none',
    String? modelOverride,
    required String userTimezone,
  }) {
    try {
      return _remoteDs.streamAgentMessage(
        convId: convId,
        content: content,
        reasoningEffort: reasoningEffort,
        modelOverride: modelOverride,
        userTimezone: userTimezone,
      );
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<void> submitFeedback({
    required String messageId,
    required String feedback,
  }) async {
    try {
      // Backend feedback endpoint is not currently exposed in mobile remote DS.
      // Keeping a no-op here preserves repository API compatibility.
      return;
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }
}
