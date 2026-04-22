type SessionState = {
  language?: string;
  model?: string;
  prompt?: string;
};

type StartMessage = {
  type: "start";
  language?: string;
  model?: string;
  prompt?: string;
};

type AudioChunkMessage = {
  type: "audio_chunk";
  audio: string;
  chunkIndex?: number;
  mimeType?: string;
  language?: string;
  model?: string;
  prompt?: string;
  startedAt?: number;
  endedAt?: number;
  previousTranscript?: string;
};

type StopMessage = {
  type: "stop";
};

type IncomingMessage = StartMessage | AudioChunkMessage | StopMessage;

const port = Number.parseInt(process.env.SPEECH_SERVER_PORT ?? "8787", 10);
const endpoint =
  process.env.OPENAI_TRANSCRIPTION_ENDPOINT ?? "https://api.openai.com/v1/audio/transcriptions";
const defaultModel = process.env.OPENAI_TRANSCRIPTION_MODEL ?? "whisper-1";
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is required.");
}

const server = Bun.serve<SessionState>({
  port,
  fetch(request, serverInstance) {
    const upgraded = serverInstance.upgrade(request, {
      data: {},
    });

    if (upgraded) {
      return undefined;
    }

    return new Response("WebSocket upgrade expected.", {
      status: 426,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  },
  websocket: {
    async message(socket, rawMessage) {
      try {
        const message = parseIncomingMessage(rawMessage);

        if (message.type === "start") {
          socket.data.language = message.language;
          socket.data.model = message.model;
          socket.data.prompt = message.prompt;
          socket.send(
            JSON.stringify({
              type: "ready",
              model: socket.data.model ?? defaultModel,
              language: socket.data.language,
            }),
          );
          return;
        }

        if (message.type === "stop") {
          socket.send(JSON.stringify({ type: "stopped" }));
          socket.close();
          return;
        }

        const result = await transcribeChunk({
          audio: decodeBase64(message.audio),
          mimeType: message.mimeType ?? "audio/webm",
          language: message.language ?? socket.data.language,
          model: message.model ?? socket.data.model ?? defaultModel,
          prompt: message.prompt ?? socket.data.prompt,
          chunkIndex: message.chunkIndex ?? 0,
          startedAt: message.startedAt ?? 0,
          endedAt: message.endedAt ?? message.startedAt ?? 0,
        });

        socket.send(JSON.stringify(result));
      } catch (error) {
        socket.send(
          JSON.stringify({
            type: "error",
            message: error instanceof Error ? error.message : String(error),
          }),
        );
      }
    },
  },
});

console.log(`Speech websocket example server listening on ws://localhost:${server.port}`);

async function transcribeChunk(input: {
  audio: Uint8Array;
  mimeType: string;
  language?: string;
  model: string;
  prompt?: string;
  chunkIndex: number;
  startedAt: number;
  endedAt: number;
}) {
  const formData = new FormData();

  formData.append(
    "file",
    new File(
      [input.audio],
      `audio-chunk-${input.chunkIndex}.${extensionFromMimeType(input.mimeType)}`,
      {
        type: input.mimeType,
      },
    ),
  );
  formData.append("model", input.model);

  if (input.language) {
    formData.append("language", input.language);
  }

  if (input.prompt) {
    formData.append("prompt", input.prompt);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      `Transcription request failed with ${response.status}: ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const text =
    typeof payload.text === "string"
      ? payload.text.trim()
      : typeof payload.transcript === "string"
        ? payload.transcript.trim()
        : "";
  const language = typeof payload.language === "string" ? payload.language : input.language;
  const durationSeconds =
    typeof payload.duration === "number" && Number.isFinite(payload.duration)
      ? payload.duration
      : Math.max(0, input.endedAt - input.startedAt) / 1000;

  return {
    text,
    isFinal: true,
    language,
    segments: [
      {
        id: `chunk-${input.chunkIndex}`,
        text,
        start: input.startedAt / 1000,
        end: input.startedAt / 1000 + durationSeconds,
        final: true,
      },
    ],
  };
}

function parseIncomingMessage(
  rawMessage: string | Buffer | Uint8Array | ArrayBuffer,
): IncomingMessage {
  const text =
    typeof rawMessage === "string"
      ? rawMessage
      : rawMessage instanceof ArrayBuffer
        ? new TextDecoder().decode(rawMessage)
        : rawMessage instanceof Uint8Array
          ? new TextDecoder().decode(rawMessage)
          : rawMessage.toString();
  const value = JSON.parse(text) as Partial<IncomingMessage>;

  if (value.type === "start") {
    return value as StartMessage;
  }

  if (value.type === "audio_chunk" && typeof value.audio === "string") {
    return value as AudioChunkMessage;
  }

  if (value.type === "stop") {
    return value as StopMessage;
  }

  throw new Error("Unsupported websocket message.");
}

function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, "base64"));
}

function extensionFromMimeType(mimeType: string): string {
  const extension = mimeType.split("/")[1]?.trim();

  if (!extension) {
    return "webm";
  }

  return extension;
}
