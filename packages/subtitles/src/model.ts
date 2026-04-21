export type TimedTextFormat = "ass" | "srt" | "transcript-json" | "vtt" | "youtube";

export interface TimedTextWord {
  text: string;
  startTimeMs: number;
  endTimeMs: number;
  confidence?: number;
}

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
  settings?: Record<string, string>;
  words?: TimedTextWord[];
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
  settings?: Record<string, string>;
  words?: TimedTextWord[];
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

export interface TimedTextOverlap {
  firstCueId: string;
  secondCueId: string;
  overlapMs: number;
}

export interface TimedTextValidationIssue {
  code: "cue-overlap" | "invalid-cue-range" | "word-outside-cue";
  cueId: string;
  message: string;
  relatedCueId?: string;
}
