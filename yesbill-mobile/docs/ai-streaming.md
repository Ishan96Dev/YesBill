# SSE Streaming — AI Chat Implementation

## Why Not Dio for SSE?

Dio's `Response` handler buffers the **full response body** before returning it. Server-Sent Events (SSE) use `text/event-stream` with `Transfer-Encoding: chunked` — the body never "completes" until the stream ends. Using Dio would mean waiting for the entire AI response before showing anything.

**Solution**: Use `dart:io`'s `HttpClient` directly to get a raw byte stream.

## Implementation

Location: `lib/data/datasources/remote/chat_remote_ds.dart`

```dart
Stream<SseEvent> _streamSse({...}) async* {
  final client = HttpClient();
  final request = await client.postUrl(url);

  // Required headers for SSE
  request.headers.set('Authorization', 'Bearer $token');
  request.headers.set('Content-Type', 'application/json');
  request.headers.set('Accept', 'text/event-stream');
  request.headers.set('Cache-Control', 'no-cache');
  request.headers.set('X-User-Timezone', userTimezone);

  request.write(jsonEncode(body));
  final response = await request.close();

  // Stream bytes → decode UTF-8 → parse SSE blocks
  final buffer = StringBuffer();
  await for (final chunk in response.transform(utf8.decoder)) {
    buffer.write(chunk);
    String current = buffer.toString();

    // SSE blocks are separated by double newline '\n\n'
    while (current.contains('\n\n')) {
      final idx = current.indexOf('\n\n');
      final block = current.substring(0, idx).trim();
      buffer.clear();
      current = current.substring(idx + 2);
      buffer.write(current);

      if (block.startsWith('data: ')) {
        final data = block.substring(6).trim();
        if (data == '[DONE]') return;  // Stream complete
        final event = SseEvent.parse(data);
        if (event != null) yield event;
      }
    }
  }

  client.close();
}
```

## SSE Event Format (from backend)

The FastAPI backend sends newline-delimited JSON events:

```
data: {"type": "chunk", "content": "Here is your "}

data: {"type": "chunk", "content": "monthly bill summary"}

data: {"type": "title", "title": "March 2025 Bill Analysis"}

data: {"type": "done", "model": "gpt-4o", "message_id": "msg_abc123"}

data: [DONE]
```

For agent streams, also:
```
data: {"type": "action_required", "action_id": "act_123", "description": "Mark milk as delivered for March 5", "payload": {...}}
```

## SseEvent Freezed Union

```dart
@freezed
class SseEvent with _$SseEvent {
  const factory SseEvent.chunk({required String content}) = SseChunk;
  const factory SseEvent.title({required String title}) = SseTitle;
  const factory SseEvent.done({String? model, String? messageId}) = SseDone;
  const factory SseEvent.error({required String message}) = SseError;
  const factory SseEvent.actionRequired({...}) = SseActionRequired;
  const factory SseEvent.reasoning({required String content}) = SseReasoning;
}
```

## Provider Stream Handling

`ChatMessagesNotifier` in `lib/providers/chat_provider.dart`:

1. Add optimistic user message immediately
2. Add streaming placeholder assistant message (`isStreaming: true`)
3. Subscribe to SSE stream
4. Each `chunk` event: append to placeholder's content → `state = [...state.map(update)]`
5. `done` event: finalize placeholder (set `id = messageId`, `isStreaming = false`)
6. `error` event: show error in placeholder content

## Cancellation

```dart
@override
void dispose() {
  _subscription?.cancel();  // StreamSubscription
  super.dispose();
}
```

Auto-dispose providers (`AutoDisposeNotifierProviderFamily`) clean up when the screen is popped.

## Testing SSE Locally

The FastAPI backend must be running locally:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Then set `API_BASE_URL=http://10.0.2.2:8000` (Android emulator localhost) via dart-define.
