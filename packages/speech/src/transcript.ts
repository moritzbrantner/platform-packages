export type TranscriptSegmentSource = "upload" | "live-chunk" | "live-stream" | "manual";

export interface TranscriptWord {
  text: string;
  startTimeMs: number;
  endTimeMs: number;
  confidence?: number;
}

export interface TranscriptSegment {
  id: string;
  text: string;
  final: boolean;
  startTimeMs: number;
  endTimeMs: number;
  confidence?: number;
  chunkIndex?: number;
  source?: TranscriptSegmentSource;
  words?: TranscriptWord[];
}

export interface SpeechTranscriptionRequest {
  audio: Blob;
  mimeType?: string;
  language?: string;
  prompt?: string;
  signal?: AbortSignal;
  chunkIndex?: number;
  startedAt?: number;
  endedAt?: number;
  previousTranscript?: string;
  metadata?: Record<string, unknown>;
}

export interface SpeechTranscriptionResult {
  text: string;
  segments?: TranscriptSegment[];
  words?: TranscriptWord[];
  isFinal?: boolean;
  language?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface SpeechTranscriber {
  transcribe(request: SpeechTranscriptionRequest): Promise<SpeechTranscriptionResult>;
}

export interface SpeechStreamingSessionOptions {
  language?: string;
  prompt?: string;
  signal?: AbortSignal;
  metadata?: Record<string, unknown>;
  onClose?: () => void;
  onError?: (error: Error) => void;
  onResult: (result: SpeechTranscriptionResult) => void;
}

export interface SpeechStreamingTranscriptionSession {
  sendAudioChunk(request: SpeechTranscriptionRequest): Promise<void>;
  close(): Promise<void>;
}

export interface SpeechStreamingTranscriber {
  openSession(
    options: SpeechStreamingSessionOptions,
  ): Promise<SpeechStreamingTranscriptionSession> | SpeechStreamingTranscriptionSession;
}

export interface CollectTranscriptTextOptions {
  includeInterim?: boolean;
}

const SENTENCE_BOUNDARY_PATTERN = /(?<=[.!?])\s+|\n+/u;

export function normalizeTranscriptText(text: string): string {
  return text.replace(/\s+/gu, " ").trim();
}

export function mergeTranscriptTexts(previous: string, incoming: string): string {
  const previousWords = tokenizeTranscript(previous);
  const incomingWords = tokenizeTranscript(incoming);

  if (previousWords.length === 0) {
    return incomingWords.join(" ");
  }

  if (incomingWords.length === 0) {
    return previousWords.join(" ");
  }

  const previousText = previousWords.join(" ");
  const incomingText = incomingWords.join(" ");

  if (previousText.toLowerCase() === incomingText.toLowerCase()) {
    return previousText;
  }

  if (incomingText.toLowerCase().startsWith(previousText.toLowerCase())) {
    return incomingText;
  }

  if (previousText.toLowerCase().endsWith(incomingText.toLowerCase())) {
    return previousText;
  }

  const maxOverlap = Math.min(previousWords.length, incomingWords.length);

  for (let overlap = maxOverlap; overlap >= 1; overlap -= 1) {
    const previousSuffix = previousWords.slice(-overlap).join(" ").toLowerCase();
    const incomingPrefix = incomingWords.slice(0, overlap).join(" ").toLowerCase();

    if (previousSuffix === incomingPrefix) {
      return [...previousWords, ...incomingWords.slice(overlap)].join(" ");
    }
  }

  return [...previousWords, ...incomingWords].join(" ");
}

export function collectTranscriptText(
  segments: Iterable<TranscriptSegment>,
  options: CollectTranscriptTextOptions = {},
): string {
  let transcript = "";

  for (const segment of segments) {
    if (!options.includeInterim && !segment.final) {
      continue;
    }

    transcript = mergeTranscriptTexts(transcript, segment.text);
  }

  return transcript;
}

export function mergeTranscriptSegments(
  previous: readonly TranscriptSegment[],
  incoming: Iterable<TranscriptSegment>,
): TranscriptSegment[] {
  const merged = previous.map((segment) => ({ ...segment }));
  const indexById = new Map(merged.map((segment, index) => [segment.id, index]));

  for (const segment of incoming) {
    const existingIndex = indexById.get(segment.id);

    if (existingIndex === undefined) {
      indexById.set(segment.id, merged.length);
      merged.push({ ...segment });
      continue;
    }

    merged[existingIndex] = {
      ...merged[existingIndex],
      ...segment,
    };
  }

  return merged.sort(
    (left, right) =>
      left.startTimeMs - right.startTimeMs ||
      left.endTimeMs - right.endTimeMs ||
      left.id.localeCompare(right.id),
  );
}

export function transcriptToPhrases(text: string): string[] {
  return text
    .split(SENTENCE_BOUNDARY_PATTERN)
    .map((phrase) => normalizeTranscriptText(phrase))
    .filter(Boolean);
}

function tokenizeTranscript(text: string): string[] {
  const normalized = normalizeTranscriptText(text);
  return normalized ? normalized.split(/\s+/u) : [];
}
