import type {
  SpeechTranscriber,
  SpeechTranscriptionRequest,
  SpeechTranscriptionResult,
  TranscriptSegment,
} from "./transcript";
import { normalizeTranscriptText } from "./transcript";

export interface OpenAICompatibleTranscriberOptions {
  endpoint: string;
  model: string;
  apiKey?: string | (() => string | Promise<string> | undefined) | Promise<string | undefined>;
  headers?:
    | HeadersInit
    | (() => HeadersInit | Promise<HeadersInit | undefined> | undefined)
    | Promise<HeadersInit | undefined>;
  fetch?: typeof fetch;
  fileFieldName?: string;
  modelFieldName?: string;
  languageFieldName?: string;
  promptFieldName?: string;
  extraFields?:
    | Record<string, string | number | boolean | null | undefined>
    | ((
        request: SpeechTranscriptionRequest,
      ) =>
        | Record<string, string | number | boolean | null | undefined>
        | Promise<Record<string, string | number | boolean | null | undefined>>);
  mapResponse?: (
    payload: unknown,
    request: SpeechTranscriptionRequest,
  ) => SpeechTranscriptionResult;
}

export function createOpenAICompatibleTranscriber(
  options: OpenAICompatibleTranscriberOptions,
): SpeechTranscriber {
  const fetchImplementation = options.fetch ?? globalThis.fetch?.bind(globalThis);

  if (!fetchImplementation) {
    throw new Error("Fetch is not available. Provide options.fetch to create a transcriber.");
  }

  return {
    async transcribe(request) {
      const headers = new Headers(await resolveConfigValue(options.headers));
      const apiKey = await resolveConfigValue(options.apiKey);

      if (apiKey && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${apiKey}`);
      }

      const formData = new FormData();
      const fileFieldName = options.fileFieldName ?? "file";
      const modelFieldName = options.modelFieldName ?? "model";
      const languageFieldName = options.languageFieldName ?? "language";
      const promptFieldName = options.promptFieldName ?? "prompt";

      formData.append(fileFieldName, request.audio, buildAudioFileName(request));
      formData.append(modelFieldName, options.model);

      if (request.language) {
        formData.append(languageFieldName, request.language);
      }

      if (request.prompt) {
        formData.append(promptFieldName, request.prompt);
      }

      const extraFields =
        typeof options.extraFields === "function"
          ? await options.extraFields(request)
          : options.extraFields;

      for (const [key, value] of Object.entries(extraFields ?? {})) {
        if (value === null || value === undefined) {
          continue;
        }

        formData.append(key, `${value}`);
      }

      const response = await fetchImplementation(options.endpoint, {
        method: "POST",
        headers,
        body: formData,
        signal: request.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        const statusText = errorText || response.statusText || "Unknown error";
        throw new Error(`Transcription request failed with ${response.status}: ${statusText}`);
      }

      const payload = (await response.json()) as unknown;

      if (options.mapResponse) {
        return options.mapResponse(payload, request);
      }

      return normalizeProviderResponse(payload, request);
    },
  };
}

function normalizeProviderResponse(
  payload: unknown,
  request: SpeechTranscriptionRequest,
): SpeechTranscriptionResult {
  const payloadRecord = asRecord(payload);
  const text = normalizeTranscriptText(
    firstString(
      payloadRecord?.text,
      payloadRecord?.transcript,
      getPathString(payloadRecord, ["results", 0, "alternatives", 0, "transcript"]),
    ) ?? "",
  );
  const segments = normalizeSegments(payloadRecord, request);
  const derivedText = text || segments.map((segment) => segment.text).join(" ").trim();

  return {
    text: derivedText,
    segments,
    isFinal:
      firstBoolean(payloadRecord?.isFinal, payloadRecord?.is_final, payloadRecord?.final) ?? true,
    language: firstString(payloadRecord?.language, payloadRecord?.detected_language),
    durationMs: numberFromSeconds(payloadRecord?.duration),
    metadata: payloadRecord ?? undefined,
  };
}

function normalizeSegments(
  payload: Record<string, unknown> | null,
  request: SpeechTranscriptionRequest,
): TranscriptSegment[] {
  const rawSegments = Array.isArray(payload?.segments)
    ? payload.segments
    : Array.isArray(payload?.chunks)
      ? payload.chunks
      : [];

  if (rawSegments.length === 0) {
    return [];
  }

  return rawSegments.flatMap((segment, index) => {
    const record = asRecord(segment);
    const text = normalizeTranscriptText(
      firstString(
        record?.text,
        record?.transcript,
        getPathString(record, ["alternatives", 0, "transcript"]),
      ) ?? "",
    );

    if (!text) {
      return [];
    }

    const startTimeMs = coerceTimestamp(
      firstNumber(record?.start_ms, record?.start, record?.offset_ms),
      request.startedAt ?? 0,
    );
    const endTimeMs = coerceTimestamp(
      firstNumber(record?.end_ms, record?.end, record?.duration_ms),
      request.endedAt ?? startTimeMs,
      startTimeMs,
    );

    return [
      {
        id:
          firstString(record?.id, record?.segment_id) ??
          `chunk-${request.chunkIndex ?? 0}-segment-${index}`,
        text,
        final:
          firstBoolean(record?.final, record?.is_final, record?.isFinal) ??
          firstBoolean(payload?.isFinal, payload?.is_final, payload?.final) ??
          true,
        startTimeMs,
        endTimeMs,
        confidence: firstNumber(record?.confidence),
        chunkIndex: request.chunkIndex,
        source: "upload",
      } satisfies TranscriptSegment,
    ];
  });
}

function buildAudioFileName(request: SpeechTranscriptionRequest): string {
  const extension = request.mimeType?.includes("/") ? request.mimeType.split("/")[1] : "webm";
  return `audio-chunk-${request.chunkIndex ?? 0}.${extension ?? "webm"}`;
}

async function resolveConfigValue<T>(
  value: T | Promise<T> | (() => T | Promise<T>) | undefined,
): Promise<T | undefined> {
  if (typeof value === "function") {
    return (value as () => T | Promise<T>)();
  }

  return value;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getPathString(
  value: Record<string, unknown> | null,
  path: ReadonlyArray<string | number>,
): string | undefined {
  let current: unknown = value;

  for (const segment of path) {
    if (typeof segment === "number") {
      if (!Array.isArray(current)) {
        return undefined;
      }

      current = current[segment];
      continue;
    }

    const record = asRecord(current);

    if (!record) {
      return undefined;
    }

    current = record[segment];
  }

  return typeof current === "string" ? current : undefined;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return undefined;
}

function firstBoolean(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }

  return undefined;
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}

function numberFromSeconds(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value * 1000) : undefined;
}

function coerceTimestamp(value: number | undefined, fallback: number, startTimeMs?: number): number {
  if (value === undefined) {
    return fallback;
  }

  if (value >= 10_000) {
    return Math.round(value);
  }

  if (startTimeMs !== undefined && value > 0 && value < 1_000) {
    return startTimeMs + Math.round(value * 1000);
  }

  if (value > 0 && value < 1_000) {
    return Math.round(value * 1000);
  }

  return Math.round(value);
}
