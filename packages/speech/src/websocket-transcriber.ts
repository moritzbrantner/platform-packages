import type {
  SpeechStreamingSessionOptions,
  SpeechStreamingTranscriber,
  SpeechTranscriptionRequest,
  SpeechTranscriptionResult,
} from "./transcript";
import { normalizeProviderResponse } from "./provider-response";

type Awaitable<T> = T | Promise<T>;

export type WebSocketPayload =
  | string
  | Blob
  | ArrayBuffer
  | ArrayBufferView;

export interface WebSocketLike {
  readonly readyState: number;
  binaryType: BinaryType;
  addEventListener(type: "open", listener: () => void): void;
  addEventListener(type: "message", listener: (event: { data: unknown }) => void): void;
  addEventListener(type: "error", listener: () => void): void;
  addEventListener(type: "close", listener: () => void): void;
  removeEventListener(type: "open", listener: () => void): void;
  removeEventListener(type: "message", listener: (event: { data: unknown }) => void): void;
  removeEventListener(type: "error", listener: () => void): void;
  removeEventListener(type: "close", listener: () => void): void;
  send(data: WebSocketPayload): void;
  close(code?: number, reason?: string): void;
}

export interface WebSocketTranscriberOptions {
  url:
    | string
    | ((sessionOptions: SpeechStreamingSessionOptions) => Awaitable<string>);
  protocols?: string | string[];
  model?: string;
  webSocketFactory?: (url: string, protocols?: string | string[]) => WebSocketLike;
  createConnectionMessage?: (
    sessionOptions: SpeechStreamingSessionOptions,
  ) => Awaitable<WebSocketPayload | Record<string, unknown> | undefined>;
  buildChunkMessage?: (
    request: SpeechTranscriptionRequest,
  ) => Awaitable<WebSocketPayload | Record<string, unknown> | undefined>;
  createCloseMessage?: () => Awaitable<WebSocketPayload | Record<string, unknown> | undefined>;
  parseMessageData?: (data: unknown) => Awaitable<unknown>;
  mapMessage?: (
    payload: unknown,
    context: {
      sessionOptions: SpeechStreamingSessionOptions;
    },
  ) => Awaitable<SpeechTranscriptionResult | SpeechTranscriptionResult[] | null | undefined>;
}

const READY_STATE_CONNECTING = 0;
const READY_STATE_OPEN = 1;

export function createWebSocketTranscriber(
  options: WebSocketTranscriberOptions,
): SpeechStreamingTranscriber {
  return {
    async openSession(sessionOptions) {
      const webSocketFactory = options.webSocketFactory ?? defaultWebSocketFactory;
      const url =
        typeof options.url === "function"
          ? await options.url(sessionOptions)
          : options.url;
      const socket = webSocketFactory(url, options.protocols);
      socket.binaryType = "arraybuffer";

      let intentionalClose = false;

      const openPromise = new Promise<void>((resolve, reject) => {
        const handleOpen = () => {
          socket.removeEventListener("open", handleOpen);
          socket.removeEventListener("error", handleOpenError);
          resolve();
        };
        const handleOpenError = () => {
          socket.removeEventListener("open", handleOpen);
          socket.removeEventListener("error", handleOpenError);
          reject(new Error("WebSocket connection failed before opening."));
        };

        socket.addEventListener("open", handleOpen);
        socket.addEventListener("error", handleOpenError);
      });

      const closePromise = new Promise<void>((resolve) => {
        const handleClose = () => {
          resolve();
          sessionOptions.onClose?.();

          if (!intentionalClose) {
            sessionOptions.onError?.(new Error("WebSocket transcription connection closed unexpectedly."));
          }
        };

        socket.addEventListener("close", handleClose);
      });

      const handleMessage = async (event: { data: unknown }) => {
        try {
          const payload = await parseMessageData(options, event.data);
          const mappedResults = await mapMessage(options, payload, sessionOptions);

          if (!mappedResults) {
            return;
          }

          const results = Array.isArray(mappedResults) ? mappedResults : [mappedResults];

          for (const result of results) {
            sessionOptions.onResult(result);
          }
        } catch (cause) {
          sessionOptions.onError?.(toError(cause));
        }
      };
      const handleError = () => {
        sessionOptions.onError?.(new Error("WebSocket transcription error."));
      };

      socket.addEventListener("message", handleMessage);
      socket.addEventListener("error", handleError);

      await openPromise;

      const connectionMessage =
        options.createConnectionMessage
          ? await options.createConnectionMessage(sessionOptions)
          : buildDefaultConnectionMessage(options, sessionOptions);

      if (connectionMessage !== undefined) {
        socket.send(await serializePayload(connectionMessage));
      }

      return {
        async sendAudioChunk(request) {
          if (socket.readyState !== READY_STATE_OPEN) {
            throw new Error("WebSocket transcription connection is not open.");
          }

          const payload =
            options.buildChunkMessage
              ? await options.buildChunkMessage(request)
              : await buildDefaultChunkMessage(options, request);

          if (payload !== undefined) {
            socket.send(await serializePayload(payload));
          }
        },
        async close() {
          if (intentionalClose) {
            await closePromise;
            return;
          }

          intentionalClose = true;
          const closeMessage = options.createCloseMessage
            ? await options.createCloseMessage()
            : { type: "stop" };

          if (closeMessage !== undefined && socket.readyState === READY_STATE_OPEN) {
            socket.send(await serializePayload(closeMessage));
          }

          if (socket.readyState === READY_STATE_OPEN || socket.readyState === READY_STATE_CONNECTING) {
            socket.close();
          }

          await closePromise;
        },
      };
    },
  };
}

function defaultWebSocketFactory(url: string, protocols?: string | string[]): WebSocketLike {
  if (typeof globalThis.WebSocket !== "function") {
    throw new Error("WebSocket is not available in this environment.");
  }

  return new globalThis.WebSocket(url, protocols);
}

function buildDefaultConnectionMessage(
  options: WebSocketTranscriberOptions,
  sessionOptions: SpeechStreamingSessionOptions,
): Record<string, unknown> | undefined {
  if (!options.model && !sessionOptions.language && !sessionOptions.prompt && !sessionOptions.metadata) {
    return undefined;
  }

  return {
    type: "start",
    model: options.model,
    language: sessionOptions.language,
    prompt: sessionOptions.prompt,
    metadata: sessionOptions.metadata,
  };
}

async function buildDefaultChunkMessage(
  options: WebSocketTranscriberOptions,
  request: SpeechTranscriptionRequest,
): Promise<Record<string, unknown>> {
  return {
    type: "audio_chunk",
    model: options.model,
    chunkIndex: request.chunkIndex,
    mimeType: request.mimeType,
    language: request.language,
    prompt: request.prompt,
    startedAt: request.startedAt,
    endedAt: request.endedAt,
    previousTranscript: request.previousTranscript,
    audio: await blobToBase64(request.audio),
  };
}

async function parseMessageData(
  options: WebSocketTranscriberOptions,
  data: unknown,
): Promise<unknown> {
  if (options.parseMessageData) {
    return options.parseMessageData(data);
  }

  if (typeof data === "string") {
    return tryParseJson(data);
  }

  if (data instanceof Blob) {
    return tryParseJson(await data.text());
  }

  if (data instanceof ArrayBuffer) {
    return tryParseJson(new TextDecoder().decode(data));
  }

  return data;
}

async function mapMessage(
  options: WebSocketTranscriberOptions,
  payload: unknown,
  sessionOptions: SpeechStreamingSessionOptions,
): Promise<SpeechTranscriptionResult | SpeechTranscriptionResult[] | null | undefined> {
  if (options.mapMessage) {
    return options.mapMessage(payload, { sessionOptions });
  }

  if (!looksLikeTranscriptPayload(payload)) {
    return null;
  }

  return normalizeProviderResponse(payload, {
    audio: new Blob(),
    language: sessionOptions.language,
    prompt: sessionOptions.prompt,
  }, "live-stream");
}

async function serializePayload(
  payload: WebSocketPayload | Record<string, unknown>,
): Promise<WebSocketPayload> {
  if (
    typeof payload === "string" ||
    payload instanceof Blob ||
    payload instanceof ArrayBuffer ||
    ArrayBuffer.isView(payload)
  ) {
    return payload;
  }

  return JSON.stringify(payload);
}

function looksLikeTranscriptPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return false;
  }

  const record = payload as Record<string, unknown>;
  return (
    typeof record.text === "string" ||
    typeof record.transcript === "string" ||
    Array.isArray(record.segments) ||
    Array.isArray(record.results)
  );
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(binary);
  }

  return Buffer.from(bytes).toString("base64");
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}
