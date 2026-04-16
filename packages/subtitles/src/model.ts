export type TimedTextFormat = "srt" | "transcript-json" | "vtt";

export interface TimedTextCue {
  id: string;
  startTimeMs: number;
  endTimeMs: number;
  text: string;
  speaker?: string;
  confidence?: number;
  final?: boolean;
  language?: string;
  metadata?: Record<string, unknown>;
}

export interface TimedTextDocument {
  format: TimedTextFormat;
  cues: TimedTextCue[];
  language?: string;
  text?: string;
  metadata?: Record<string, unknown>;
}

export interface TranscriptSegmentLike {
  id?: string;
  startTimeMs: number;
  endTimeMs: number;
  text: string;
  speaker?: string;
  confidence?: number;
  final?: boolean;
  language?: string;
  metadata?: Record<string, unknown>;
}

export interface NormalizeTimedTextDocumentOptions {
  clampToZero?: boolean;
  sort?: boolean;
}

export interface ShiftTimedTextOptions {
  targets?: ReadonlyArray<number | string>;
  clampToZero?: boolean;
}

export interface ParseTimedTextOptions {
  fileName?: string;
  format?: TimedTextFormat;
}

export interface SerializeTimedTextOptions {
  format?: TimedTextFormat;
}
