import type {
  ParseTimedTextOptions,
  SerializeTimedTextOptions,
  TimedTextCue,
  TimedTextDocument,
  TimedTextFormat,
  TimedTextWord,
} from "./model";
import { collectTimedTextText, normalizeTimedTextDocument } from "./editing";

const SRT_TIMESTAMP_PATTERN =
  /^\s*(?<start>\d{2,}:\d{2}:\d{2}[,.]\d{3})\s+-->\s+(?<end>\d{2,}:\d{2}:\d{2}[,.]\d{3})(?:\s+.*)?\s*$/u;
const VTT_TIMESTAMP_PATTERN =
  /^\s*(?<start>(?:\d{2,}:)?\d{2}:\d{2}\.\d{3})\s+-->\s+(?<end>(?:\d{2,}:)?\d{2}:\d{2}\.\d{3})(?:\s+.*)?\s*$/u;
const ASS_TIMESTAMP_PATTERN =
  /^\s*(?<hours>\d+):(?<minutes>\d{2}):(?<seconds>\d{2})(?:\.(?<centiseconds>\d{1,2}))?\s*$/u;
const YOUTUBE_TIMESTAMP_PATTERN =
  /^\s*(?<start>(?:\d+:)?\d{2}:\d{2}\.\d{3})\s*,\s*(?<end>(?:\d+:)?\d{2}:\d{2}\.\d{3})\s*$/u;

interface AssStyle {
  alignment?: string;
  backColor?: string;
  bold?: string;
  fontName?: string;
  fontSize?: string;
  italic?: string;
  marginL?: string;
  marginR?: string;
  marginV?: string;
  name: string;
  outlineColor?: string;
  primaryColor?: string;
  underline?: string;
}

interface AssMetadata {
  scriptInfo?: Record<string, string>;
  styles?: Record<string, AssStyle>;
}

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
  settings?: unknown;
  words?: unknown;
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

  if (extension === "ass" || extension === "ssa") {
    return "ass";
  }

  if (extension === "srt") {
    return "srt";
  }

  if (extension === "sbv" || extension === "sub") {
    return "youtube";
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

  if (normalized.startsWith("[Script Info]") || normalized.includes("\n[Events]")) {
    return "ass";
  }

  if (normalized.startsWith("<transcript") || normalized.startsWith("<timedtext")) {
    return "youtube";
  }

  if (normalized.startsWith("{") || normalized.startsWith("[")) {
    return "transcript-json";
  }

  if (
    splitCueBlocks(normalized).some((block) =>
      YOUTUBE_TIMESTAMP_PATTERN.test(block.split("\n")[0] ?? ""),
    )
  ) {
    return "youtube";
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

  if (format === "ass") {
    return parseAss(input);
  }

  if (format === "vtt") {
    return parseVtt(input);
  }

  if (format === "youtube") {
    return parseYoutube(input);
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

  if (format === "ass") {
    return serializeAss(document);
  }

  if (format === "vtt") {
    return serializeVtt(document);
  }

  if (format === "youtube") {
    return serializeYoutube(document);
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

    while (lines[0] !== undefined && lines[0].trim() !== "" && !lines[0].includes("-->")) {
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

    if (
      !trimmedBlock ||
      trimmedBlock.startsWith("NOTE") ||
      trimmedBlock.startsWith("STYLE") ||
      trimmedBlock.startsWith("REGION")
    ) {
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
        `${formatVttTimestamp(cue.startTimeMs)} --> ${formatVttTimestamp(cue.endTimeMs)}${formatVttSettings(cue.settings)}`,
      );
      lines.push(cue.text.trim());
      return lines.join("\n");
    })
    .join("\n\n");

  return `WEBVTT\n\n${cueText}\n`;
}

export function parseAss(input: string): TimedTextDocument {
  const lines = normalizeInput(input).split("\n");
  let section = "";
  let styleFormat: string[] = [];
  let eventFormat: string[] = [];
  const scriptInfo: Record<string, string> = {};
  const styles: Record<string, AssStyle> = {};
  const cues: TimedTextCue[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith(";")) {
      continue;
    }

    const sectionMatch = trimmedLine.match(/^\[(?<name>[^\]]+)\]$/u);
    if (sectionMatch?.groups) {
      section = sectionMatch.groups.name.toLowerCase();
      continue;
    }

    if (section === "script info") {
      const separatorIndex = trimmedLine.indexOf(":");
      if (separatorIndex > 0) {
        scriptInfo[trimmedLine.slice(0, separatorIndex).trim()] = trimmedLine
          .slice(separatorIndex + 1)
          .trim();
      }
      continue;
    }

    if (section === "v4+ styles" || section === "v4 styles") {
      if (trimmedLine.toLowerCase().startsWith("format:")) {
        styleFormat = parseAssFormatLine(trimmedLine);
      } else if (trimmedLine.toLowerCase().startsWith("style:")) {
        const style = parseAssStyleLine(trimmedLine, styleFormat);
        if (style) {
          styles[style.name] = style;
        }
      }
      continue;
    }

    if (section !== "events") {
      continue;
    }

    if (trimmedLine.toLowerCase().startsWith("format:")) {
      eventFormat = parseAssFormatLine(trimmedLine);
      continue;
    }

    if (!trimmedLine.toLowerCase().startsWith("dialogue:")) {
      continue;
    }

    cues.push(parseAssDialogueLine(trimmedLine, eventFormat, cues.length, styles));
  }

  return normalizeTimedTextDocument({
    format: "ass",
    cues,
    metadata: {
      ass: {
        scriptInfo,
        styles,
      } satisfies AssMetadata,
    },
  });
}

export function serializeAss(document: TimedTextDocument): string {
  const normalized = normalizeTimedTextDocument(document, {
    sort: false,
  });
  const assMetadata = parseAssMetadata(normalized.metadata);
  const scriptInfo = {
    ScriptType: "v4.00+",
    PlayResX: "1280",
    PlayResY: "720",
    ...(assMetadata.scriptInfo ?? {}),
  };
  const styles = assMetadata.styles ?? {};
  const usedStyleNames = new Set(
    normalized.cues
      .map((cue) => cue.settings?.["ass-style"])
      .filter((value): value is string => Boolean(value)),
  );

  if (usedStyleNames.size === 0) {
    usedStyleNames.add("Default");
  }

  const styleLines = Array.from(usedStyleNames, (styleName) =>
    formatAssStyle(styles[styleName] ?? { name: styleName }),
  );
  const eventLines = normalized.cues.map((cue) => {
    const layer = cue.settings?.["ass-layer"] ?? "0";
    const style = cue.settings?.["ass-style"] ?? "Default";
    const name = cue.settings?.["ass-name"] ?? "";
    const marginL = padAssMargin(cue.settings?.["ass-margin-l"] ?? styles[style]?.marginL);
    const marginR = padAssMargin(cue.settings?.["ass-margin-r"] ?? styles[style]?.marginR);
    const marginV = padAssMargin(cue.settings?.["ass-margin-v"] ?? styles[style]?.marginV);
    const effect = cue.settings?.["ass-effect"] ?? "";

    return [
      "Dialogue:",
      [
        layer,
        formatAssTimestamp(cue.startTimeMs),
        formatAssTimestamp(cue.endTimeMs),
        style,
        name,
        marginL,
        marginR,
        marginV,
        effect,
        formatAssText(cue.text),
      ].join(","),
    ].join(" ");
  });

  return `${[
    "[Script Info]",
    ...Object.entries(scriptInfo).map(([key, value]) => `${key}: ${value}`),
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    ...styleLines,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ...eventLines,
  ].join("\n")}\n`;
}

export function parseYoutube(input: string): TimedTextDocument {
  const normalized = normalizeInput(input).trim();

  if (normalized.startsWith("<")) {
    return parseYoutubeXml(normalized);
  }

  const cues = splitCueBlocks(normalized).map((block, index) => parseYoutubeCueBlock(block, index));

  return normalizeTimedTextDocument({
    format: "youtube",
    cues,
  });
}

export function serializeYoutube(document: TimedTextDocument): string {
  const normalized = normalizeTimedTextDocument(document, {
    sort: false,
  });

  return `${normalized.cues
    .map(
      (cue) =>
        `${formatYoutubeTimestamp(cue.startTimeMs)},${formatYoutubeTimestamp(cue.endTimeMs)}\n${cue.text.trim()}`,
    )
    .join("\n\n")}\n`;
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
      settings: cue.settings,
      words: cue.words,
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
    text: lines
      .slice(timingLineIndex + 1)
      .join("\n")
      .trim(),
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

  const id = lines.slice(0, timingLineIndex).join(" ").trim();

  return {
    id: id || `cue-${index + 1}`,
    startTimeMs: parseTimestamp(match.groups.start),
    endTimeMs: parseTimestamp(match.groups.end),
    text: lines
      .slice(timingLineIndex + 1)
      .join("\n")
      .trim(),
    settings: parseVttSettings(timingLine),
  };
}

function parseAssFormatLine(line: string): string[] {
  return line
    .slice(line.indexOf(":") + 1)
    .split(",")
    .map((entry) => normalizeAssFieldName(entry));
}

function parseAssStyleLine(line: string, format: string[]): AssStyle | undefined {
  const fields = format.length > 0 ? format : getDefaultAssStyleFormat();
  const values = splitAssCommaFields(line.slice(line.indexOf(":") + 1).trim(), fields.length);
  const record = mapAssFields(fields, values);
  const name = record.name?.trim();

  if (!name) {
    return undefined;
  }

  return {
    name,
    fontName: record.fontname,
    fontSize: record.fontsize,
    primaryColor: record.primarycolour ?? record.primarycolor,
    outlineColor: record.outlinecolour ?? record.outlinecolor,
    backColor: record.backcolour ?? record.backcolor,
    bold: record.bold,
    italic: record.italic,
    underline: record.underline,
    alignment: record.alignment,
    marginL: record.marginl,
    marginR: record.marginr,
    marginV: record.marginv,
  };
}

function parseAssDialogueLine(
  line: string,
  format: string[],
  index: number,
  styles: Record<string, AssStyle>,
): TimedTextCue {
  const fields = format.length > 0 ? format : getDefaultAssEventFormat();
  const values = splitAssCommaFields(line.slice(line.indexOf(":") + 1).trim(), fields.length);
  const record = mapAssFields(fields, values);
  const styleName = record.style?.trim() || "Default";
  const style = styles[styleName];
  const rawText = record.text ?? "";
  const inlineSettings = parseAssInlineSettings(rawText);
  const settings = compactStringRecord({
    "ass-style": styleName,
    "ass-name": record.name,
    "ass-effect": record.effect,
    "ass-layer": record.layer,
    "ass-alignment": inlineSettings.alignment ?? style?.alignment,
    "ass-position": inlineSettings.position,
    "ass-font": style?.fontName,
    "ass-font-size": style?.fontSize,
    "ass-primary-color": style?.primaryColor,
    "ass-outline-color": style?.outlineColor,
    "ass-back-color": style?.backColor,
    "ass-bold": style?.bold,
    "ass-italic": inlineSettings.italic ?? style?.italic,
    "ass-underline": style?.underline,
    "ass-margin-l": record.marginl || style?.marginL,
    "ass-margin-r": record.marginr || style?.marginR,
    "ass-margin-v": record.marginv || style?.marginV,
  });

  return {
    id: `cue-${index + 1}`,
    startTimeMs: parseAssTimestamp(record.start ?? ""),
    endTimeMs: parseAssTimestamp(record.end ?? ""),
    text: cleanAssText(rawText),
    metadata: {
      assText: rawText,
    },
    settings: Object.keys(settings).length > 0 ? settings : undefined,
  };
}

function parseYoutubeCueBlock(block: string, index: number): TimedTextCue {
  const lines = block.split("\n").map((line) => line.trimEnd());
  const timingLine = lines[0] ?? "";
  const match = timingLine.match(YOUTUBE_TIMESTAMP_PATTERN);

  if (!match?.groups) {
    throw new Error(`Invalid YouTube cue at block ${index + 1}: malformed timestamp line.`);
  }

  return {
    id: `cue-${index + 1}`,
    startTimeMs: parseTimestamp(match.groups.start),
    endTimeMs: parseTimestamp(match.groups.end),
    text: lines.slice(1).join("\n").trim(),
  };
}

function parseYoutubeXml(input: string): TimedTextDocument {
  const cues: TimedTextCue[] = [];
  const textElementPattern = /<text\b(?<attributes>[^>]*)>(?<text>[\s\S]*?)<\/text>/giu;
  const paragraphElementPattern = /<p\b(?<attributes>[^>]*)>(?<text>[\s\S]*?)<\/p>/giu;

  for (const match of input.matchAll(textElementPattern)) {
    const attributes = parseXmlAttributes(match.groups?.attributes ?? "");
    const startTimeMs = parseXmlSeconds(attributes.start, "start", cues.length);
    const durationMs =
      attributes.dur === undefined
        ? undefined
        : parseXmlSeconds(attributes.dur, "dur", cues.length);

    cues.push({
      id: `cue-${cues.length + 1}`,
      startTimeMs,
      endTimeMs: startTimeMs + (durationMs ?? 0),
      text: cleanYoutubeXmlText(match.groups?.text ?? ""),
    });
  }

  if (cues.length === 0) {
    for (const match of input.matchAll(paragraphElementPattern)) {
      const attributes = parseXmlAttributes(match.groups?.attributes ?? "");
      const startTimeMs = parseXmlMilliseconds(attributes.t, "t", cues.length);
      const durationMs =
        attributes.d === undefined
          ? undefined
          : parseXmlMilliseconds(attributes.d, "d", cues.length);

      cues.push({
        id: `cue-${cues.length + 1}`,
        startTimeMs,
        endTimeMs: startTimeMs + (durationMs ?? 0),
        text: cleanYoutubeXmlText(match.groups?.text ?? ""),
      });
    }
  }

  return normalizeTimedTextDocument({
    format: "youtube",
    cues,
    metadata: {
      youtubeSource: "xml",
    },
  });
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
    settings: parseSettings(cue.settings),
    words: parseWords(cue.words, index),
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

function parseAssTimestamp(value: string): number {
  const match = value.match(ASS_TIMESTAMP_PATTERN);

  if (!match?.groups) {
    throw new Error(`Invalid ASS timestamp: ${value}`);
  }

  const centiseconds = (match.groups.centiseconds ?? "0").padEnd(2, "0").slice(0, 2);

  return (
    Number(match.groups.hours) * 3_600_000 +
    Number(match.groups.minutes) * 60_000 +
    Number(match.groups.seconds) * 1000 +
    Number(centiseconds) * 10
  );
}

function formatSrtTimestamp(value: number): string {
  return formatTimestampParts(value).join(",");
}

function formatAssTimestamp(value: number): string {
  const safeValue = Math.max(0, Math.round(value / 10) * 10);
  const hours = Math.floor(safeValue / 3_600_000);
  const minutes = Math.floor((safeValue % 3_600_000) / 60_000);
  const seconds = Math.floor((safeValue % 60_000) / 1000);
  const centiseconds = Math.floor((safeValue % 1000) / 10);

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}.${String(centiseconds).padStart(2, "0")}`;
}

function formatVttTimestamp(value: number): string {
  return formatTimestampParts(value).join(".");
}

function formatYoutubeTimestamp(value: number): string {
  const safeValue = Math.max(0, Math.round(value));
  const hours = Math.floor(safeValue / 3_600_000);
  const minutes = Math.floor((safeValue % 3_600_000) / 60_000);
  const seconds = Math.floor((safeValue % 60_000) / 1000);
  const milliseconds = safeValue % 1000;

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}.${String(milliseconds).padStart(3, "0")}`;
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

function compactStringRecord(value: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== "",
    ),
  );
}

function splitAssCommaFields(value: string, expectedFieldCount: number): string[] {
  if (expectedFieldCount <= 1) {
    return [value];
  }

  const parts = value.split(",");
  const head = parts.slice(0, expectedFieldCount - 1);
  const tail = parts.slice(expectedFieldCount - 1).join(",");

  return [...head, tail].map((part) => part.trim());
}

function normalizeAssFieldName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/gu, "");
}

function mapAssFields(fields: string[], values: string[]): Record<string, string> {
  return Object.fromEntries(fields.map((field, index) => [field, values[index] ?? ""]));
}

function getDefaultAssStyleFormat(): string[] {
  return [
    "name",
    "fontname",
    "fontsize",
    "primarycolour",
    "secondarycolour",
    "outlinecolour",
    "backcolour",
    "bold",
    "italic",
    "underline",
    "strikeout",
    "scalex",
    "scaley",
    "spacing",
    "angle",
    "borderstyle",
    "outline",
    "shadow",
    "alignment",
    "marginl",
    "marginr",
    "marginv",
    "encoding",
  ];
}

function getDefaultAssEventFormat(): string[] {
  return [
    "layer",
    "start",
    "end",
    "style",
    "name",
    "marginl",
    "marginr",
    "marginv",
    "effect",
    "text",
  ];
}

function parseAssInlineSettings(text: string): {
  alignment?: string;
  italic?: string;
  position?: string;
} {
  const overrideText = Array.from(
    text.matchAll(/\{(?<body>[^}]*)\}/gu),
    (match) => match.groups?.body ?? "",
  ).join("\\");
  const alignment = overrideText.match(/\\an(?<value>[1-9])/u)?.groups?.value;
  const positionMatch = overrideText.match(/\\pos\((?<x>-?\d+(?:\.\d+)?),(?<y>-?\d+(?:\.\d+)?)\)/u);
  const italicMatch = overrideText.match(/\\i(?<value>[01])/u);

  return {
    alignment,
    position: positionMatch?.groups
      ? `${positionMatch.groups.x},${positionMatch.groups.y}`
      : undefined,
    italic: italicMatch?.groups?.value === "1" ? "-1" : undefined,
  };
}

function cleanAssText(text: string): string {
  return text
    .replace(/\{[^}]*\}/gu, "")
    .replace(/\\[Nn]/gu, "\n")
    .replace(/\\h/gu, " ")
    .trim();
}

function formatAssText(text: string): string {
  return text.replace(/\r\n?/gu, "\n").replace(/\n/gu, "\\N");
}

function parseAssMetadata(metadata: Record<string, unknown> | undefined): AssMetadata {
  const ass = metadata?.ass;

  if (!isRecord(ass)) {
    return {};
  }

  return {
    scriptInfo: isStringRecord(ass.scriptInfo) ? ass.scriptInfo : undefined,
    styles: parseAssStylesMetadata(ass.styles),
  };
}

function parseAssStylesMetadata(value: unknown): Record<string, AssStyle> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const styles = Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) => {
      if (!isRecord(entry)) {
        return [];
      }

      const name = typeof entry.name === "string" && entry.name.trim() ? entry.name : key;
      return [
        [
          name,
          {
            name,
            fontName: getOptionalString(entry.fontName),
            fontSize: getOptionalString(entry.fontSize),
            primaryColor: getOptionalString(entry.primaryColor),
            outlineColor: getOptionalString(entry.outlineColor),
            backColor: getOptionalString(entry.backColor),
            bold: getOptionalString(entry.bold),
            italic: getOptionalString(entry.italic),
            underline: getOptionalString(entry.underline),
            alignment: getOptionalString(entry.alignment),
            marginL: getOptionalString(entry.marginL),
            marginR: getOptionalString(entry.marginR),
            marginV: getOptionalString(entry.marginV),
          } satisfies AssStyle,
        ],
      ];
    }),
  );

  return Object.keys(styles).length > 0 ? styles : undefined;
}

function formatAssStyle(style: AssStyle): string {
  return `Style: ${[
    style.name,
    style.fontName ?? "Arial",
    style.fontSize ?? "44",
    style.primaryColor ?? "&H00FFFFFF",
    "&H000000FF",
    style.outlineColor ?? "&H00000000",
    style.backColor ?? "&H96000000",
    style.bold ?? "0",
    style.italic ?? "0",
    style.underline ?? "0",
    "0",
    "100",
    "100",
    "0",
    "0",
    "1",
    "2",
    "0",
    style.alignment ?? "2",
    padAssMargin(style.marginL),
    padAssMargin(style.marginR),
    padAssMargin(style.marginV ?? "40"),
    "1",
  ].join(",")}`;
}

function padAssMargin(value: string | undefined): string {
  const numericValue = Number.parseInt(value ?? "0", 10);

  if (!Number.isFinite(numericValue)) {
    return "0000";
  }

  return String(Math.max(0, numericValue)).padStart(4, "0");
}

function parseXmlAttributes(value: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const pattern = /(?<name>[\w:-]+)\s*=\s*(?:"(?<double>[^"]*)"|'(?<single>[^']*)')/gu;

  for (const match of value.matchAll(pattern)) {
    if (!match.groups?.name) {
      continue;
    }

    attributes[match.groups.name] = decodeXmlEntities(
      match.groups.double ?? match.groups.single ?? "",
    );
  }

  return attributes;
}

function parseXmlSeconds(value: string | undefined, label: string, index: number): number {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    throw new Error(`Invalid YouTube XML ${label} value at cue ${index + 1}.`);
  }

  return Math.round(numericValue * 1000);
}

function parseXmlMilliseconds(value: string | undefined, label: string, index: number): number {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    throw new Error(`Invalid YouTube XML ${label} value at cue ${index + 1}.`);
  }

  return Math.round(numericValue);
}

function cleanYoutubeXmlText(value: string): string {
  return decodeXmlEntities(value)
    .replace(/<br\s*\/?>/giu, "\n")
    .replace(/<[^>]*>/gu, "")
    .trim();
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&quot;/gu, '"')
    .replace(/&apos;/gu, "'")
    .replace(/&lt;/gu, "<")
    .replace(/&gt;/gu, ">")
    .replace(/&amp;/gu, "&")
    .replace(/&#(?<decimal>\d+);/gu, (_, decimal: string) => String.fromCodePoint(Number(decimal)))
    .replace(/&#x(?<hexadecimal>[\da-f]+);/giu, (_, hexadecimal: string) =>
      String.fromCodePoint(Number.parseInt(hexadecimal, 16)),
    );
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === "string");
}

function getOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
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

function parseVttSettings(line: string): Record<string, string> | undefined {
  const rawSettings = line.split("-->", 2)[1]?.trim().split(/\s+/u).slice(1) ?? [];
  const settingsEntries = rawSettings
    .map((entry) => entry.split(":", 2))
    .filter((entry) => entry.length === 2 && entry[0] && entry[1]);

  return settingsEntries.length > 0 ? Object.fromEntries(settingsEntries) : undefined;
}

function formatVttSettings(settings: Record<string, string> | undefined): string {
  if (!settings) {
    return "";
  }

  const entries = Object.entries(settings).filter(([, value]) => value.trim());
  return entries.length > 0 ? ` ${entries.map(([key, value]) => `${key}:${value}`).join(" ")}` : "";
}

function parseSettings(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const entries = Object.entries(value)
    .filter(([, entry]) => typeof entry === "string")
    .map(([key, entry]) => [key, entry as string] as const);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function parseWords(value: unknown, index: number): TimedTextWord[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.flatMap((word, wordIndex) => {
    if (!word || typeof word !== "object") {
      throw new Error(`Invalid word timing at transcript segment ${index}, word ${wordIndex}.`);
    }

    const record = word as Record<string, unknown>;
    const text = typeof record.text === "string" ? record.text : "";

    if (!text) {
      return [];
    }

    return [
      {
        text,
        startTimeMs: parseTranscriptJsonTimestamp(record.startTimeMs, record.start, "start", index),
        endTimeMs: parseTranscriptJsonTimestamp(record.endTimeMs, record.end, "end", index),
        confidence: typeof record.confidence === "number" ? record.confidence : undefined,
      } satisfies TimedTextWord,
    ];
  });
}
