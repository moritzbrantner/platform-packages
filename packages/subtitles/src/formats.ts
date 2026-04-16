import type {
  ParseTimedTextOptions,
  SerializeTimedTextOptions,
  TimedTextCue,
  TimedTextDocument,
  TimedTextFormat,
} from "./model";
import { collectTimedTextText, normalizeTimedTextDocument } from "./editing";

const SRT_TIMESTAMP_PATTERN =
  /^\s*(?<start>\d{2,}:\d{2}:\d{2}[,.]\d{3})\s+-->\s+(?<end>\d{2,}:\d{2}:\d{2}[,.]\d{3})(?:\s+.*)?\s*$/u;
const VTT_TIMESTAMP_PATTERN =
  /^\s*(?<start>(?:\d{2,}:)?\d{2}:\d{2}\.\d{3})\s+-->\s+(?<end>(?:\d{2,}:)?\d{2}:\d{2}\.\d{3})(?:\s+.*)?\s*$/u;

interface TranscriptJsonValue {
  id?: unknown;
  start?: unknown;
  end?: unknown;
  startTimeMs?: unknown;
  endTimeMs?: unknown;
  text?: unknown;
  speaker?: unknown;
  confidence?: unknown;
  final?: unknown;
  language?: unknown;
  metadata?: unknown;
}

interface TranscriptJsonDocument {
  format?: unknown;
  language?: unknown;
  text?: unknown;
  metadata?: unknown;
  cues?: unknown;
  segments?: unknown;
}

export function detectTimedTextFormat(input: string, fileName?: string): TimedTextFormat {
  const extension = fileName?.split(".").pop()?.toLowerCase();

  if (extension === "srt") {
    return "srt";
  }

  if (extension === "vtt") {
    return "vtt";
  }

  if (extension === "json") {
    return "transcript-json";
  }

  const normalized = normalizeInput(input).trimStart();

  if (normalized.startsWith("WEBVTT")) {
    return "vtt";
  }

  if (normalized.startsWith("{") || normalized.startsWith("[")) {
    return "transcript-json";
  }

  return "srt";
}

export function parseTimedText(
  input: string,
  options: ParseTimedTextOptions = {},
): TimedTextDocument {
  const format = options.format ?? detectTimedTextFormat(input, options.fileName);

  if (format === "srt") {
    return parseSrt(input);
  }

  if (format === "vtt") {
    return parseVtt(input);
  }

  return parseTranscriptJson(input);
}

export function serializeTimedText(
  document: TimedTextDocument,
  options: SerializeTimedTextOptions = {},
): string {
  const format = options.format ?? document.format;

  if (format === "srt") {
    return serializeSrt(document);
  }

  if (format === "vtt") {
    return serializeVtt(document);
  }

  return serializeTranscriptJson(document);
}

export function parseSrt(input: string): TimedTextDocument {
  const blocks = splitCueBlocks(normalizeInput(input));
  const cues = blocks.map((block, index) => parseSrtCueBlock(block, index));

  return normalizeTimedTextDocument({
    format: "srt",
    cues,
  });
}

export function serializeSrt(document: TimedTextDocument): string {
  const normalized = normalizeTimedTextDocument(document, {
    sort: false,
  });

  return `${normalized.cues
    .map(
      (cue, index) =>
        `${index + 1}\n${formatSrtTimestamp(cue.startTimeMs)} --> ${formatSrtTimestamp(cue.endTimeMs)}\n${cue.text.trim()}`,
    )
    .join("\n\n")}\n`;
}

export function parseVtt(input: string): TimedTextDocument {
  const lines = normalizeInput(input).split("\n");

  if (lines[0] && lines[0].startsWith("WEBVTT")) {
    lines.shift();

    while (
      lines[0] !== undefined &&
      lines[0].trim() !== "" &&
      !lines[0].includes("-->")
    ) {
      lines.shift();
    }

    if (lines[0]?.trim() === "") {
      lines.shift();
    }
  }

  const body = lines.join("\n");
  const blocks = splitCueBlocks(body);
  const cues: TimedTextCue[] = [];

  for (const block of blocks) {
    const trimmedBlock = block.trim();

    if (!trimmedBlock || trimmedBlock.startsWith("NOTE") || trimmedBlock.startsWith("STYLE") || trimmedBlock.startsWith("REGION")) {
      continue;
    }

    cues.push(parseVttCueBlock(block, cues.length));
  }

  return normalizeTimedTextDocument({
    format: "vtt",
    cues,
  });
}

export function serializeVtt(document: TimedTextDocument): string {
  const normalized = normalizeTimedTextDocument(document, {
    sort: false,
  });
  const cueText = normalized.cues
    .map((cue, index) => {
      const lines = [];
      if (!isGeneratedCueId(cue.id, index)) {
        lines.push(cue.id);
      }

      lines.push(
        `${formatVttTimestamp(cue.startTimeMs)} --> ${formatVttTimestamp(cue.endTimeMs)}`,
      );
      lines.push(cue.text.trim());
      return lines.join("\n");
    })
    .join("\n\n");

  return `WEBVTT\n\n${cueText}\n`;
}

export function parseTranscriptJson(input: string): TimedTextDocument {
  let parsed: unknown;

  try {
    parsed = JSON.parse(input);
  } catch (error) {
    throw new Error(
      `Invalid transcript JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (Array.isArray(parsed)) {
    return normalizeTimedTextDocument({
      format: "transcript-json",
      cues: parsed.map((entry, index) => parseTranscriptJsonCue(entry, index)),
    });
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Transcript JSON must be an object or an array.");
  }

  const document = parsed as TranscriptJsonDocument;
  const cueValues = Array.isArray(document.cues)
    ? document.cues
    : Array.isArray(document.segments)
      ? document.segments
      : undefined;

  if (!cueValues) {
    throw new Error("Transcript JSON must contain a `cues` or `segments` array.");
  }

  return normalizeTimedTextDocument({
    format: "transcript-json",
    cues: cueValues.map((entry, index) => parseTranscriptJsonCue(entry, index)),
    language: typeof document.language === "string" ? document.language : undefined,
    text: typeof document.text === "string" ? document.text : undefined,
    metadata: isRecord(document.metadata) ? document.metadata : undefined,
  });
}

export function serializeTranscriptJson(document: TimedTextDocument): string {
  const normalized = normalizeTimedTextDocument(document, {
    sort: false,
  });
  const payload = {
    format: "transcript-json",
    language: normalized.language,
    text: normalized.text ?? collectTimedTextText(normalized),
    metadata: normalized.metadata,
    cues: normalized.cues.map((cue) => ({
      id: cue.id,
      startTimeMs: cue.startTimeMs,
      endTimeMs: cue.endTimeMs,
      text: cue.text,
      speaker: cue.speaker,
      confidence: cue.confidence,
      final: cue.final,
      language: cue.language,
      metadata: cue.metadata,
    })),
  };

  return `${JSON.stringify(stripUndefinedProperties(payload), null, 2)}\n`;
}

function parseSrtCueBlock(block: string, index: number): TimedTextCue {
  const lines = block.split("\n").map((line) => line.trimEnd());
  const timingLineIndex = lines.findIndex((line) => line.includes("-->"));

  if (timingLineIndex === -1) {
    throw new Error(`Invalid SRT cue at block ${index + 1}: missing timestamp line.`);
  }

  const timingLine = lines[timingLineIndex];
  const idLine = timingLineIndex > 0 ? lines[timingLineIndex - 1]?.trim() : "";
  const match = timingLine.match(SRT_TIMESTAMP_PATTERN);

  if (!match?.groups) {
    throw new Error(`Invalid SRT cue at block ${index + 1}: malformed timestamp line.`);
  }

  return {
    id: isNumericId(idLine) ? `cue-${index + 1}` : idLine || `cue-${index + 1}`,
    startTimeMs: parseTimestamp(match.groups.start),
    endTimeMs: parseTimestamp(match.groups.end),
    text: lines.slice(timingLineIndex + 1).join("\n").trim(),
  };
}

function parseVttCueBlock(block: string, index: number): TimedTextCue {
  const lines = block.split("\n").map((line) => line.trimEnd());
  const timingLineIndex = lines.findIndex((line) => line.includes("-->"));

  if (timingLineIndex === -1) {
    throw new Error(`Invalid VTT cue at block ${index + 1}: missing timestamp line.`);
  }

  const timingLine = lines[timingLineIndex];
  const match = timingLine.match(VTT_TIMESTAMP_PATTERN);

  if (!match?.groups) {
    throw new Error(`Invalid VTT cue at block ${index + 1}: malformed timestamp line.`);
  }

  const id = lines
    .slice(0, timingLineIndex)
    .join(" ")
    .trim();

  return {
    id: id || `cue-${index + 1}`,
    startTimeMs: parseTimestamp(match.groups.start),
    endTimeMs: parseTimestamp(match.groups.end),
    text: lines.slice(timingLineIndex + 1).join("\n").trim(),
  };
}

function parseTranscriptJsonCue(value: unknown, index: number): TimedTextCue {
  if (!value || typeof value !== "object") {
    throw new Error(`Invalid transcript segment at index ${index}.`);
  }

  const cue = value as TranscriptJsonValue;
  const startTimeMs = parseTranscriptJsonTimestamp(cue.startTimeMs, cue.start, "start", index);
  const endTimeMs = parseTranscriptJsonTimestamp(cue.endTimeMs, cue.end, "end", index);

  return {
    id: typeof cue.id === "string" && cue.id.trim() ? cue.id : `cue-${index + 1}`,
    startTimeMs,
    endTimeMs,
    text: typeof cue.text === "string" ? cue.text : "",
    speaker: typeof cue.speaker === "string" ? cue.speaker : undefined,
    confidence: typeof cue.confidence === "number" ? cue.confidence : undefined,
    final: typeof cue.final === "boolean" ? cue.final : undefined,
    language: typeof cue.language === "string" ? cue.language : undefined,
    metadata: isRecord(cue.metadata) ? cue.metadata : undefined,
  };
}

function parseTranscriptJsonTimestamp(
  millisecondsValue: unknown,
  secondsValue: unknown,
  label: "end" | "start",
  index: number,
): number {
  if (typeof millisecondsValue === "number" && Number.isFinite(millisecondsValue)) {
    return Math.round(millisecondsValue);
  }

  if (typeof secondsValue === "number" && Number.isFinite(secondsValue)) {
    return Math.round(secondsValue * 1000);
  }

  throw new Error(`Missing ${label} timestamp for transcript segment at index ${index}.`);
}

function parseTimestamp(value: string): number {
  const normalized = value.replace(",", ".");
  const parts = normalized.split(":");

  if (parts.length !== 2 && parts.length !== 3) {
    throw new Error(`Invalid timestamp: ${value}`);
  }

  const [hours, minutes, seconds] =
    parts.length === 3 ? parts : ["0", parts[0] ?? "0", parts[1] ?? "0.000"];
  const [secondPart, millisecondPart] = seconds.split(".");

  if (
    !/^\d+$/u.test(hours) ||
    !/^\d{2}$/u.test(minutes) ||
    !/^\d{2}$/u.test(secondPart ?? "") ||
    !/^\d{3}$/u.test(millisecondPart ?? "")
  ) {
    throw new Error(`Invalid timestamp: ${value}`);
  }

  return (
    Number(hours) * 3_600_000 +
    Number(minutes) * 60_000 +
    Number(secondPart) * 1000 +
    Number(millisecondPart)
  );
}

function formatSrtTimestamp(value: number): string {
  return formatTimestampParts(value).join(",");
}

function formatVttTimestamp(value: number): string {
  return formatTimestampParts(value).join(".");
}

function formatTimestampParts(value: number): [string, string] {
  const safeValue = Math.max(0, Math.round(value));
  const hours = Math.floor(safeValue / 3_600_000);
  const minutes = Math.floor((safeValue % 3_600_000) / 60_000);
  const seconds = Math.floor((safeValue % 60_000) / 1000);
  const milliseconds = safeValue % 1000;

  return [
    `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
      seconds,
    ).padStart(2, "0")}`,
    String(milliseconds).padStart(3, "0"),
  ];
}

function splitCueBlocks(input: string): string[] {
  const trimmed = input.trim();
  return trimmed ? trimmed.split(/\n\s*\n+/u).filter(Boolean) : [];
}

function normalizeInput(input: string): string {
  return input.replace(/^\uFEFF/u, "").replace(/\r\n?/gu, "\n");
}

function stripUndefinedProperties<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedProperties(item)) as T;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, stripUndefinedProperties(entry)]),
  ) as T;
}

function isNumericId(value: string): boolean {
  return /^\d+$/u.test(value);
}

function isGeneratedCueId(value: string, index: number): boolean {
  return value === `cue-${index + 1}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
