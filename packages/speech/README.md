# @moritzbrantner/speech

Microphone capture, chunked speech-to-text orchestration, and transport adapters for HTTP and websocket transcription flows.

## Websocket protocol

`createWebSocketTranscriber()` defaults to a small JSON protocol:

Client to server:

```json
{ "type": "start", "model": "whisper-live", "language": "en", "prompt": "optional" }
```

```json
{
  "type": "audio_chunk",
  "model": "whisper-live",
  "chunkIndex": 0,
  "mimeType": "audio/webm",
  "language": "en",
  "prompt": "optional",
  "startedAt": 0,
  "endedAt": 1800,
  "previousTranscript": "optional prior text",
  "audio": "<base64>"
}
```

```json
{ "type": "stop" }
```

Server to client:

```json
{
  "text": "hello from websocket",
  "isFinal": false,
  "language": "en",
  "segments": [
    {
      "id": "chunk-0",
      "text": "hello from websocket",
      "start": 0,
      "end": 1.8,
      "final": false
    }
  ]
}
```

Notes:

- `text` is the aggregate text for that event.
- `segments` may be omitted if the backend only returns plain text.
- `isFinal: false` is appropriate for interim updates.
- The React hook merges segments by `id`, so the server can resend the same segment id with updated text as the transcript stabilizes.

## Local Whisper server

If you want the browser component to talk to a machine that has Whisper installed locally, use the Python example at [`examples/local-whisper-websocket-server.py`](./examples/local-whisper-websocket-server.py).

It:

- accepts the default websocket protocol above
- decodes incoming base64 audio chunks
- transcribes them with a local `faster-whisper` model
- streams normalized transcription events back to the browser

Dependencies:

```bash
pip install -r packages/speech/examples/requirements-local-whisper.txt
```

Environment variables:

- `SPEECH_SERVER_HOST`: optional, defaults to `127.0.0.1`
- `SPEECH_SERVER_PORT`: optional, defaults to `8787`
- `WHISPER_MODEL`: optional, defaults to `base`
- `WHISPER_DEVICE`: optional, defaults to `auto`
- `WHISPER_COMPUTE_TYPE`: optional, defaults to `default`
- `WHISPER_BEAM_SIZE`: optional, defaults to `1`
- `WHISPER_VAD_FILTER`: optional, defaults to `false`

Run it with:

```bash
python3 packages/speech/examples/local-whisper-websocket-server.py
```

Then set the playground endpoint to:

```text
ws://127.0.0.1:8787
```

This is the closest match to "talk to a local server that has whisper installed".

## Proxy server

If you want a thin websocket wrapper in front of an HTTP transcription API instead, a Bun reference server lives at [`examples/whisper-websocket-server.ts`](./examples/whisper-websocket-server.ts). It:

- accepts the default websocket protocol above
- decodes incoming base64 audio chunks
- forwards each chunk to an OpenAI-compatible transcription endpoint
- streams normalized transcription events back to the browser

Environment variables:

- `OPENAI_API_KEY`: required bearer token
- `OPENAI_TRANSCRIPTION_ENDPOINT`: optional, defaults to `https://api.openai.com/v1/audio/transcriptions`
- `OPENAI_TRANSCRIPTION_MODEL`: optional, defaults to `whisper-1`
- `SPEECH_SERVER_PORT`: optional, defaults to `8787`

Run it with:

```bash
bun packages/speech/examples/whisper-websocket-server.ts
```

Then set the playground endpoint to:

```text
ws://localhost:8787
```

If you want a different wire format, keep using `createWebSocketTranscriber()` and override `createConnectionMessage`, `buildChunkMessage`, or `mapMessage`.
