import type {
  SpeechTranscriptionRequest,
  SpeechTranscriptionResult,
  TranscriptSegment,
  TranscriptSegmentSource,
  TranscriptWord,
} from "./transcript";
import { normalizeTranscriptText } from "./transcript";

export function normalizeProviderResponse(
  payload: unknown,
  request: SpeechTranscriptionRequest,
  source: TranscriptSegmentSource = "upload",
): SpeechTranscriptionResult {
  const payloadRecord = asRecord(payload);
  const text = normalizeTranscriptText(
    firstString(
      payloadRecord?.text,
      payloadRecord?.transcript,
      getPathString(payloadRecord, ["results", 0, "alternatives", 0, "transcript"]),
    ) ?? "",
  );
  const segments = normalizeSegments(payloadRecord, request, source);
  const words = normalizeWords(payloadRecord?.words, request.startedAt ?? 0, request.endedAt);
  const derivedText = text || segments.map((segment) => segment.text).join(" ").trim();

  return {
    text: derivedText,
    segments,
    words: words.length > 0 ? words : segments.flatMap((segment) => segment.words ?? []),
    isFinal:
      firstBoolean(payloadRecord?.isFinal, payloadRecord?.is_final, payloadRecord?.final) ?? true,
    language: firstString(payloadRecord?.language, payloadRecord?.detected_language),
    durationMs: numberFromSeconds(payloadRecord?.duration),
    metadata: payloadRecord ?? undefined,
  };
}

export function buildAudioFileName(request: SpeechTranscriptionRequest): string {
  const extension = request.mimeType?.includes("/") ? request.mimeType.split("/")[1] : "webm";
  return `audio-chunk-${request.chunkIndex ?? 0}.${extension ?? "webm"}`;
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function getPathString(
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

export function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return undefined;
}

export function firstBoolean(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }

  return undefined;
}

export function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}

export function numberFromSeconds(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value * 1000) : undefined;
}

export function coerceTimestamp(value: number | undefined, fallback: number, startTimeMs?: number): number {
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

function normalizeSegments(
  payload: Record<string, unknown> | null,
  request: SpeechTranscriptionRequest,
  source: TranscriptSegmentSource,
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
        source,
        words: normalizeWords(record?.words, startTimeMs, endTimeMs),
      } satisfies TranscriptSegment,
    ];
  });
}

function normalizeWords(
  rawWords: unknown,
  fallbackStartTimeMs: number,
  fallbackEndTimeMs?: number,
): TranscriptWord[] {
  if (!Array.isArray(rawWords)) {
    return [];
  }

  return rawWords.flatMap((word) => {
    const record = asRecord(word);
    const text = firstString(record?.text, record?.word);

    if (!text) {
      return [];
    }

    const startTimeMs = coerceTimestamp(
      firstNumber(record?.start_ms, record?.start, record?.offset_ms),
      fallbackStartTimeMs,
    );
    const endTimeMs = coerceTimestamp(
      firstNumber(record?.end_ms, record?.end, record?.duration_ms),
      fallbackEndTimeMs ?? startTimeMs,
    );

    return [
      {
        text,
        startTimeMs,
        endTimeMs,
        confidence: firstNumber(record?.confidence),
      } satisfies TranscriptWord,
    ];
  });
}
