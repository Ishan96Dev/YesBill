import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/config/app_config.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/errors/error_handler.dart';
import '../../models/ai_analytics_data.dart';
import '../../models/chat_conversation.dart';
import '../../models/sse_event.dart';
import '../local/secure_storage.dart';

/// Remote data source for chat and agent endpoints.
///
/// SSE streaming uses [HttpClient] directly (not Dio) because Dio buffers
/// the full response body, which breaks server-sent events.
class ChatRemoteDataSource {
  ChatRemoteDataSource({required Dio dio, required SecureStorageService storage})
      : _dio = dio,
        _storage = storage;

  final Dio _dio;
  final SecureStorageService _storage;

  // ── Conversation CRUD ─────────────────────────────────────────────────────

  Future<List<ChatConversation>> listConversations({String? convType}) async {
    try {
      final resp = await _dio.get(
        ApiConstants.chatConversations,
        queryParameters: convType != null ? {'conv_type': convType} : {},
      );
      final data = resp.data;
      final list = data is List<dynamic>
          ? data
          : (data is Map && data['conversations'] is List<dynamic>
              ? data['conversations'] as List<dynamic>
              : <dynamic>[]);
      return list
          .whereType<Map>()
          .map((e) => _normalizeConversationJson(Map<String, dynamic>.from(e)))
          .map(ChatConversation.fromJson)
          .toList();
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<ChatConversation> createConversation({
    required String convType,
    String title = 'New Conversation',
  }) async {
    try {
      final resp = await _dio.post(ApiConstants.chatConversations, data: {
        'conv_type': convType,
        'title': title,
      });
      final m = Map<String, dynamic>.from(resp.data as Map);
      return ChatConversation.fromJson(_normalizeConversationJson(m));
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<void> renameConversation(String id, String title) async {
    try {
      await _dio.patch(ApiConstants.chatConvById(id), data: {'title': title});
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<void> deleteConversation(String id) async {
    try {
      await _dio.delete(ApiConstants.chatConvById(id));
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<void> deleteAllConversations({String? convType}) async {
    try {
      await _dio.delete(
        ApiConstants.chatConversations,
        queryParameters: convType != null ? {'conv_type': convType} : null,
      );
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<List<ChatMessage>> getMessages(String convId) async {
    try {
      final resp = await _dio.get(ApiConstants.chatConvMessages(convId));
      final data = resp.data;
      final list = data is List<dynamic>
          ? data
          : (data is Map && data['messages'] is List<dynamic>
              ? data['messages'] as List<dynamic>
              : <dynamic>[]);

      return list
          .whereType<Map>()
          .map(
            (e) => _normalizeMessageJson(
              Map<String, dynamic>.from(e),
              convId: convId,
            ),
          )
          .map(ChatMessage.fromJson)
          .toList();
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<Uint8List> exportConversation(
    String id, {
    String format = 'markdown',
  }) async {
    try {
      final resp = await _dio.get(
        ApiConstants.chatConvExport(id),
        queryParameters: {'format': format},
        options: Options(responseType: ResponseType.bytes),
      );
      return _toBytes(resp.data);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<Uint8List> exportAllConversations({
    String format = 'markdown',
  }) async {
    try {
      final resp = await _dio.get(
        ApiConstants.chatExportAllConversations,
        queryParameters: {'format': format},
        options: Options(responseType: ResponseType.bytes),
      );
      return _toBytes(resp.data);
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<List<AiModel>> getAvailableModels() async {
    try {
      final resp = await _dio.get(ApiConstants.chatModels);
      final data = resp.data;
      final list = data is List<dynamic>
          ? data
          : (data is Map && data['models'] is List<dynamic>
              ? data['models'] as List<dynamic>
              : <dynamic>[]);
      return list
          .whereType<Map>()
          .map((e) => AiModel.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Uint8List _toBytes(dynamic data) {
    if (data is Uint8List) return data;
    if (data is List<int>) return Uint8List.fromList(data);
    if (data is List) {
      return Uint8List.fromList(data.cast<int>());
    }
    if (data is String) {
      return Uint8List.fromList(utf8.encode(data));
    }
    throw const FormatException('Unexpected export response payload.');
  }

  Map<String, dynamic> _normalizeConversationJson(Map<String, dynamic> raw) {
    return {
      ...raw,
      'id': (raw['id'] ?? '').toString(),
      'user_id': (raw['user_id'] ?? '').toString(),
      'title': raw['title']?.toString().trim().isNotEmpty == true
          ? raw['title'].toString().trim()
          : 'New Conversation',
      'conv_type': raw['conv_type']?.toString().trim().isNotEmpty == true
          ? raw['conv_type'].toString().trim()
          : 'main',
    };
  }

  Map<String, dynamic> _normalizeMessageJson(
    Map<String, dynamic> raw, {
    required String convId,
  }) {
    final rawTags = raw['context_tags'];
    final contextTags = rawTags is List
        ? rawTags
            .where((item) => item != null)
            .map((item) => item.toString().trim())
            .where((item) => item.isNotEmpty)
            .toList()
        : rawTags is String && rawTags.trim().isNotEmpty
            ? [rawTags.trim()]
            : null;

    final rawMetadata = raw['metadata'];

    return {
      ...raw,
      'id': (raw['id'] ?? '').toString(),
      'conversation_id': (raw['conversation_id'] ?? convId).toString(),
      'user_id': raw['user_id']?.toString(),
      'role': raw['role']?.toString().trim().isNotEmpty == true
          ? raw['role'].toString().trim()
          : 'user',
      'content': (raw['content'] ?? '').toString(),
      'reasoning': raw['reasoning']?.toString(),
      'model_used': raw['model_used']?.toString(),
      'feedback': raw['feedback']?.toString(),
      'context_tags': contextTags,
      'metadata': rawMetadata is Map
          ? Map<String, dynamic>.from(rawMetadata as Map)
          : null,
    };
  }

  Future<String> getAnalyticsSummary({String? yearMonth, int? days}) async {
    try {
      final resp = await _dio.get(ApiConstants.chatAnalyticsSummary, queryParameters: {
        if (yearMonth != null) 'year_month': yearMonth,
        if (days != null) 'days': days,
      });
      return resp.data['summary'] as String? ?? '';
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Future<AiAnalyticsData> getAnalyticsData({String? yearMonth}) async {
    try {
      final resp = await _dio.get(
        ApiConstants.chatAnalyticsSummary,
        queryParameters: {
          if (yearMonth != null) 'year_month': yearMonth,
        },
      );
      final data = resp.data;
      if (data is Map<String, dynamic>) {
        return AiAnalyticsData.fromJson(data);
      }
      return AiAnalyticsData.empty();
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  // ── SSE Streaming ──────────────────────────────────────────────────────────

  /// Stream chat messages from the FastAPI SSE endpoint.
  /// Uses [HttpClient] directly to handle chunked transfer encoding.
  Stream<SseEvent> streamChatMessage({
    required String convId,
    required String content,
    String reasoningEffort = 'none',
    String? modelOverride,
    List<String> contextTags = const [],
    required String userTimezone,
  }) {
    return _streamSse(
      endpoint: ApiConstants.chatConvMessages(convId),
      body: {
        'content': content,
        'reasoning_effort': reasoningEffort,
        if (modelOverride != null) 'model': modelOverride,
        'context_tags': contextTags,
      },
      userTimezone: userTimezone,
    );
  }

  /// Stream agent messages (same pattern, different endpoint).
  Stream<SseEvent> streamAgentMessage({
    required String convId,
    required String content,
    String reasoningEffort = 'none',
    String? modelOverride,
    required String userTimezone,
  }) {
    return _streamSse(
      endpoint: ApiConstants.agentConvMessages(convId),
      body: {
        'content': content,
        'reasoning_effort': reasoningEffort,
        if (modelOverride != null) 'model': modelOverride,
      },
      userTimezone: userTimezone,
    );
  }

  /// Execute a confirmed agent action.
  Future<Map<String, dynamic>> executeAgentAction({
    required String actionId,
    required bool confirmed,
  }) async {
    try {
      final resp = await _dio.post(ApiConstants.agentExecute, data: {
        'action_id': actionId,
        'confirmed': confirmed,
      });
      return resp.data as Map<String, dynamic>;
    } catch (e) {
      throw ErrorHandler.handle(e);
    }
  }

  Stream<SseEvent> _streamSse({
    required String endpoint,
    required Map<String, dynamic> body,
    required String userTimezone,
  }) async* {
    // Prefer the live Supabase session token (always fresh, auto-refreshed).
    // Fall back to secure storage only when the Supabase client has no session.
    final supabaseToken =
        Supabase.instance.client.auth.currentSession?.accessToken;
    final token = supabaseToken ?? await _storage.readAccessToken();
    final url = Uri.parse('${AppConfig.apiBaseUrl}$endpoint');

    final client = HttpClient();
    HttpClientRequest? request;
    HttpClientResponse? response;

    try {
      request = await client.postUrl(url);
      request.headers.set('Authorization', 'Bearer ${token ?? ''}');
      request.headers.set('Content-Type', 'application/json');
      request.headers.set('Accept', 'text/event-stream');
      request.headers.set('Cache-Control', 'no-cache');
      request.headers.set('X-User-Timezone', userTimezone);
      request.write(jsonEncode(body));

      response = await request.close();

      if (response.statusCode != 200) {
        final errorBody = await response.transform(utf8.decoder).join();
        throw ApiException(response.statusCode, errorBody);
      }

      final buffer = StringBuffer();
      await for (final chunk in response.transform(utf8.decoder)) {
        buffer.write(chunk);
        String current = buffer.toString();

        while (current.contains('\n\n')) {
          final idx = current.indexOf('\n\n');
          final block = current.substring(0, idx).trim();
          buffer.clear();
          current = current.substring(idx + 2);
          buffer.write(current);

          if (block.startsWith('data: ')) {
            final data = block.substring(6).trim();
            if (data == '[DONE]') return;
            final event = SseEvent.parse(data);
            if (event != null) yield event;
          }
        }
      }
    } finally {
      client.close();
    }
  }
}

// Import needed for ApiException in the SSE stream
class ApiException implements Exception {
  const ApiException(this.statusCode, this.message);
  final int statusCode;
  final String message;
  @override
  String toString() => 'ApiException($statusCode): $message';
}

class AiModel {
  const AiModel({
    required this.provider,
    required this.modelId,
    required this.name,
    this.thinkingSupported = false,
  });
  final String provider;
  final String modelId;
  final String name;
  final bool thinkingSupported;

  factory AiModel.fromJson(Map<String, dynamic> json) => AiModel(
        provider: json['provider'] as String? ?? '',
        modelId: json['model_id'] as String? ?? '',
        name: json['name'] as String? ?? json['model_id'] as String? ?? '',
        thinkingSupported: json['thinking_supported'] as bool? ?? false,
      );
}
