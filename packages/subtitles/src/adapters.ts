import { createTextDocument, type CreateTextDocumentOptions, type TextDocument } from "@moritzbrantner/linguistics-core";

import { collectTimedTextText, fromTranscriptSegments } from "./editing";
import type { TimedTextDocument, TranscriptSegmentLike } from "./model";

export interface SpeechTranscriptionResultLike {
  text: string;
  segments?: Iterable<TranscriptSegmentLike>;
  isFinal?: boolean;
  language?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface FromSpeechTranscriptionResultOptions {
  format?: TimedTextDocument["format"];
  language?: string;
  metadata?: Record<string, unknown>;
}

export interface TimedTextToDocumentOptions
  extends Omit<CreateTextDocumentOptions, "language" | "metadata" | "text"> {
  includeSpeakerLabels?: boolean;
  separator?: string;
  language?: string;
  metadata?: Record<string, unknown>;
}

export function fromSpeechTranscriptionResult(
  result: SpeechTranscriptionResultLike,
  options: FromSpeechTranscriptionResultOptions = {},
): TimedTextDocument {
  const segments = result.segments ? Array.from(result.segments) : [];

  if (segments.length > 0) {
    return fromTranscriptSegments(segments, {
      format: options.format ?? "transcript-json",
      language: options.language ?? result.language,
      text: result.text,
      metadata: {
        ...result.metadata,
        ...options.metadata,
        isFinal: result.isFinal,
        durationMs: result.durationMs,
      },
    });
  }

  return fromTranscriptSegments(
    [
      {
        id: "speech-1",
        startTimeMs: 0,
        endTimeMs: Math.max(0, Math.round(result.durationMs ?? 0)),
        text: result.text,
        final: result.isFinal,
        language: result.language,
        metadata: result.metadata,
      },
    ],
    {
      format: options.format ?? "transcript-json",
      language: options.language ?? result.language,
      text: result.text,
      metadata: {
        ...result.metadata,
        ...options.metadata,
        isFinal: result.isFinal,
        durationMs: result.durationMs,
      },
    },
  );
}

export function toTextDocument(
  document: TimedTextDocument,
  options: TimedTextToDocumentOptions = {},
): TextDocument {
  return createTextDocument({
    id: options.id,
    language: options.language ?? document.language,
    metadata: {
      format: document.format,
      ...document.metadata,
      ...options.metadata,
    },
    text: collectTimedTextText(document, {
      includeSpeakerLabels: options.includeSpeakerLabels,
      separator: options.separator,
    }),
    normalizer: options.normalizer,
    segmenter: options.segmenter,
    tokenNormalizer: options.tokenNormalizer,
    tokenizer: options.tokenizer,
  });
}
