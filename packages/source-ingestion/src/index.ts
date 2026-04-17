import {
  createTextDocument,
  normalizeText,
  segmentTextDocument,
  type LanguageTag,
  type TextDocument,
} from "@moritzbrantner/linguistics-core";
import { chunkTextForInference, type ChunkTextOptions, type TextChunk } from "@moritzbrantner/text-inference";

export type IngestionConnector = "html" | "plain-text" | "json-feed" | "file-drop";

export interface SourceReference {
  connector: IngestionConnector;
  sourceId?: string;
  url?: string;
  fileId?: string;
  fetchedAt: string;
  publishedAt?: string;
  languageHints?: LanguageTag[];
  title?: string;
}

export interface IngestionMetadata extends Record<string, unknown> {
  source: SourceReference;
  cleaning: {
    boilerplateRemoved: boolean;
    removedLineCount: number;
    originalLength: number;
    cleanedLength: number;
  };
}

export interface IngestedTextDocument {
  document: TextDocument<IngestionMetadata>;
  metadata: IngestionMetadata;
  sourceOffsets: number[];
}

export interface IngestHtmlInput {
  html: string;
  source: Omit<SourceReference, "connector">;
  id?: string;
  language?: LanguageTag;
}

export interface IngestPlainTextInput {
  text: string;
  source: Omit<SourceReference, "connector">;
  id?: string;
  language?: LanguageTag;
}

export interface JsonFeedItem {
  id?: string;
  url?: string;
  title?: string;
  language?: LanguageTag;
  publishedAt?: string;
  content?: string;
  body?: string;
  summary?: string;
  description?: string;
  text?: string;
}

export interface IngestJsonFeedInput {
  feed: string | { items?: JsonFeedItem[] } | JsonFeedItem[];
  source: Omit<SourceReference, "connector">;
  defaultLanguage?: LanguageTag;
}

export interface IngestFileDropInput {
  fileId: string;
  content: string;
  mediaType?: string;
  fileName?: string;
  source?: Partial<Omit<SourceReference, "connector" | "fileId">>;
  id?: string;
  language?: LanguageTag;
}

export interface IngestionChunk extends TextChunk<IngestionMetadata> {
  sourceStart: number;
  sourceEnd: number;
}

export type ChunkingPreset = "compact" | "balanced" | "wide";

export interface ChunkIngestedDocumentOptions {
  preset?: ChunkingPreset;
}

const STRIP_BLOCK_TAGS = ["script", "style", "noscript", "svg", "nav", "footer", "header", "aside", "form"];

const FEED_TEXT_FIELDS: ReadonlyArray<keyof JsonFeedItem> = [
  "content",
  "body",
  "summary",
  "description",
  "text",
];

export function ingestHtml(input: IngestHtmlInput): IngestedTextDocument {
  const reduced = reduceHtmlToText(input.html);

  return buildIngestedTextDocument({
    connector: "html",
    id: input.id ?? input.source.sourceId ?? input.source.url,
    language: input.language,
    source: {
      ...input.source,
      connector: "html",
    },
    cleanedText: reduced.text,
    sourceOffsets: reduced.offsets,
    originalLength: input.html.length,
  });
}

export function ingestPlainText(input: IngestPlainTextInput): IngestedTextDocument {
  const baseOffsets = Array.from(input.text, (_, index) => index);

  return buildIngestedTextDocument({
    connector: "plain-text",
    id: input.id ?? input.source.sourceId ?? input.source.url,
    language: input.language,
    source: {
      ...input.source,
      connector: "plain-text",
    },
    cleanedText: input.text,
    sourceOffsets: baseOffsets,
    originalLength: input.text.length,
  });
}

export function ingestJsonFeed(input: IngestJsonFeedInput): IngestedTextDocument[] {
  const parsed = parseJsonFeed(input.feed);

  return parsed.flatMap<IngestedTextDocument>((item, index) => {
    const text = resolveFeedItemText(item);

    if (!text) {
      return [];
    }

    const source: SourceReference = {
      ...input.source,
      connector: "json-feed",
      url: item.url ?? input.source.url,
      sourceId: item.id ?? input.source.sourceId,
      title: item.title ?? input.source.title,
      publishedAt: item.publishedAt ?? input.source.publishedAt,
    };

    const id = item.id ?? item.url ?? `${input.source.sourceId ?? "feed-item"}-${index}`;

    const normalized = looksLikeHtml(text)
      ? ingestHtml({
          html: text,
          source,
          id,
          language: item.language ?? input.defaultLanguage,
        })
      : ingestPlainText({
          text,
          source,
          id,
          language: item.language ?? input.defaultLanguage,
        });

    const metadata: IngestionMetadata = {
      ...normalized.metadata,
      source,
    };
    const document: TextDocument<IngestionMetadata> = {
      ...normalized.document,
      metadata,
    };

    return [
      {
        ...normalized,
        metadata,
        document,
      },
    ];
  });
}

export function ingestFileDrop(input: IngestFileDropInput): IngestedTextDocument[] {
  const sourceBase: Omit<SourceReference, "connector"> = {
    fetchedAt: input.source?.fetchedAt ?? new Date().toISOString(),
    sourceId: input.source?.sourceId ?? input.fileId,
    fileId: input.fileId,
    languageHints: input.source?.languageHints,
    title: input.source?.title ?? input.fileName,
    url: input.source?.url,
    publishedAt: input.source?.publishedAt,
  };

  const kind = detectFileDropKind(input);

  if (kind === "json-feed") {
    return ingestJsonFeed({
      feed: input.content,
      source: sourceBase,
      defaultLanguage: input.language,
    });
  }

  if (kind === "html") {
    return [
      ingestHtml({
        html: input.content,
        source: sourceBase,
        id: input.id ?? input.fileId,
        language: input.language,
      }),
    ];
  }

  return [
    ingestPlainText({
      text: input.content,
      source: sourceBase,
      id: input.id ?? input.fileId,
      language: input.language,
    }),
  ];
}

export function chunkIngestedDocumentForInference(
  ingested: IngestedTextDocument,
  options: ChunkIngestedDocumentOptions = {},
): IngestionChunk[] {
  const chunking = resolveChunkingPreset(options.preset ?? "balanced");
  const chunks = chunkTextForInference<IngestionMetadata>(ingested.document, chunking);

  return chunks.map((chunk: TextChunk<IngestionMetadata>) => ({
    ...chunk,
    sourceStart: resolveSourceStart(ingested.sourceOffsets, chunk.start),
    sourceEnd: resolveSourceEnd(ingested.sourceOffsets, chunk.end),
  }));
}

function buildIngestedTextDocument(input: {
  connector: IngestionConnector;
  id?: string;
  language?: LanguageTag;
  source: SourceReference;
  cleanedText: string;
  sourceOffsets: number[];
  originalLength: number;
}): IngestedTextDocument {
  const normalized = normalizeText(input.cleanedText, {
    form: "NFKC",
  });
  const normalizationOffsets = remapOffsetsForNormalizedText(input.cleanedText, normalized, input.sourceOffsets);
  const cleaned = cleanBoilerplate(normalized, normalizationOffsets);

  const metadata: IngestionMetadata = {
    source: {
      ...input.source,
      connector: input.connector,
      fetchedAt: input.source.fetchedAt,
    },
    cleaning: {
      boilerplateRemoved: cleaned.removedLineCount > 0,
      removedLineCount: cleaned.removedLineCount,
      originalLength: input.originalLength,
      cleanedLength: cleaned.text.length,
    },
  };

  const id = sanitizeDocumentId(input.id ?? input.source.sourceId ?? input.source.url ?? `${input.connector}-source`);

  const document = segmentTextDocument(
    createTextDocument({
      id,
      text: cleaned.text,
      language: input.language ?? input.source.languageHints?.[0],
      metadata,
    }),
    {
      granularity: "word",
      useIntlSegmenter: false,
    },
  );

  return {
    document,
    metadata,
    sourceOffsets: cleaned.offsets,
  };
}

function parseJsonFeed(feed: IngestJsonFeedInput["feed"]): JsonFeedItem[] {
  if (typeof feed === "string") {
    const parsed = JSON.parse(feed) as unknown;
    return parseJsonFeed(parsed as IngestJsonFeedInput["feed"]);
  }

  if (Array.isArray(feed)) {
    return feed;
  }

  if (feed && Array.isArray(feed.items)) {
    return feed.items;
  }

  return [];
}

function resolveFeedItemText(item: JsonFeedItem): string {
  return FEED_TEXT_FIELDS.map((field) => item[field]).find((value): value is string => typeof value === "string") ?? "";
}

function reduceHtmlToText(html: string): { text: string; offsets: number[] } {
  const stripped = removeTaggedSections(html, STRIP_BLOCK_TAGS);
  const withBreaks = injectLineBreakHints(stripped.text, stripped.offsets);
  const plain = stripHtmlTags(withBreaks.text, withBreaks.offsets);
  const decoded = decodeHtmlEntities(plain.text, plain.offsets);

  return collapseWhitespace(decoded.text, decoded.offsets);
}

function removeTaggedSections(
  input: string,
  offsets: number[],
  tags: readonly string[],
): { text: string; offsets: number[] };
function removeTaggedSections(input: string, tags: readonly string[]): { text: string; offsets: number[] };
function removeTaggedSections(
  input: string,
  arg2: number[] | readonly string[],
  arg3?: readonly string[],
): { text: string; offsets: number[] } {
  const offsets = Array.isArray(arg2) ? arg2 : Array.from(input, (_, index) => index);
  const tags = Array.isArray(arg2) ? arg3 ?? [] : arg2;
  const escaped = tags.map((tag) => tag.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")).join("|");

  if (!escaped) {
    return { text: input, offsets };
  }

  const pattern = new RegExp(`<(${escaped})\\b[^>]*>[\\s\\S]*?<\\/\\1>`, "giu");
  const output: string[] = [];
  const outputOffsets: number[] = [];
  let cursor = 0;

  for (const match of input.matchAll(pattern)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;

    for (let index = cursor; index < start; index += 1) {
      output.push(input[index]);
      outputOffsets.push(offsets[index] ?? index);
    }

    output.push("\n");
    outputOffsets.push(offsets[Math.max(start - 1, 0)] ?? 0);
    cursor = end;
  }

  for (let index = cursor; index < input.length; index += 1) {
    output.push(input[index]);
    outputOffsets.push(offsets[index] ?? index);
  }

  return { text: output.join(""), offsets: outputOffsets };
}

function injectLineBreakHints(input: string, offsets: number[]): { text: string; offsets: number[] } {
  const pattern = /<(?:\/)?(?:article|section|div|p|br|li|h[1-6]|main)\b[^>]*>/giu;
  const output: string[] = [];
  const outputOffsets: number[] = [];
  let cursor = 0;

  for (const match of input.matchAll(pattern)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;

    for (let index = cursor; index < start; index += 1) {
      output.push(input[index]);
      outputOffsets.push(offsets[index] ?? index);
    }

    output.push("\n");
    outputOffsets.push(offsets[Math.max(start - 1, 0)] ?? 0);

    for (let index = start; index < end; index += 1) {
      output.push(input[index]);
      outputOffsets.push(offsets[index] ?? index);
    }

    cursor = end;
  }

  for (let index = cursor; index < input.length; index += 1) {
    output.push(input[index]);
    outputOffsets.push(offsets[index] ?? index);
  }

  return { text: output.join(""), offsets: outputOffsets };
}

function stripHtmlTags(input: string, offsets: number[]): { text: string; offsets: number[] } {
  const output: string[] = [];
  const outputOffsets: number[] = [];
  let insideTag = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];

    if (character === "<") {
      insideTag = true;
      continue;
    }

    if (character === ">") {
      insideTag = false;
      continue;
    }

    if (insideTag) {
      continue;
    }

    output.push(character);
    outputOffsets.push(offsets[index] ?? index);
  }

  return { text: output.join(""), offsets: outputOffsets };
}

function decodeHtmlEntities(input: string, offsets: number[]): { text: string; offsets: number[] } {
  const entities: Record<string, string> = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
    "&lt;": "<",
    "&gt;": ">",
  };

  const output: string[] = [];
  const outputOffsets: number[] = [];
  let index = 0;

  while (index < input.length) {
    const next = Object.entries(entities).find(([entity]) => input.startsWith(entity, index));

    if (!next) {
      output.push(input[index]);
      outputOffsets.push(offsets[index] ?? index);
      index += 1;
      continue;
    }

    output.push(next[1]);
    outputOffsets.push(offsets[index] ?? index);
    index += next[0].length;
  }

  return { text: output.join(""), offsets: outputOffsets };
}

function collapseWhitespace(input: string, offsets: number[]): { text: string; offsets: number[] } {
  const output: string[] = [];
  const outputOffsets: number[] = [];
  let previousWhitespace = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const next = character === "\r" ? "\n" : character;
    const whitespace = /[\t\v\f ]/u.test(next);

    if (whitespace) {
      if (previousWhitespace) {
        continue;
      }

      output.push(" ");
      outputOffsets.push(offsets[index] ?? index);
      previousWhitespace = true;
      continue;
    }

    if (next === "\n") {
      if (output.at(-1) !== "\n") {
        output.push("\n");
        outputOffsets.push(offsets[index] ?? index);
      }
      previousWhitespace = false;
      continue;
    }

    output.push(next);
    outputOffsets.push(offsets[index] ?? index);
    previousWhitespace = false;
  }

  return {
    text: output.join("").replace(/^\s+|\s+$/gu, ""),
    offsets: trimOffsets(output.join(""), outputOffsets),
  };
}

function remapOffsetsForNormalizedText(source: string, normalized: string, offsets: number[]): number[] {
  if (source === normalized) {
    return offsets;
  }

  const normalizedOffsets: number[] = [];
  let sourceIndex = 0;

  for (const character of normalized) {
    const alignedIndex = source.indexOf(character, sourceIndex);

    if (alignedIndex >= 0) {
      normalizedOffsets.push(offsets[alignedIndex] ?? alignedIndex);
      sourceIndex = alignedIndex + 1;
      continue;
    }

    normalizedOffsets.push(offsets[Math.max(0, sourceIndex - 1)] ?? 0);
  }

  return normalizedOffsets;
}

function cleanBoilerplate(input: string, offsets: number[]): { text: string; offsets: number[]; removedLineCount: number } {
  const lines = input.split("\n");
  const lineOffsets = splitOffsetsByLine(input, offsets);
  const frequency = new Map<string, number>();

  for (const line of lines) {
    const key = normalizeForBoilerplate(line);

    if (!key) {
      continue;
    }

    frequency.set(key, (frequency.get(key) ?? 0) + 1);
  }

  const keptLines: string[] = [];
  const keptOffsets: number[] = [];
  let removedLineCount = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    const key = normalizeForBoilerplate(line);

    const shouldRemove =
      !line ||
      (key.length > 0 && (frequency.get(key) ?? 0) > 1) ||
      isBoilerplateLine(line);

    if (shouldRemove) {
      removedLineCount += 1;
      continue;
    }

    if (keptLines.length > 0) {
      keptLines.push("\n");
      keptOffsets.push(lineOffsets[index][0] ?? keptOffsets.at(-1) ?? 0);
    }

    keptLines.push(line);
    keptOffsets.push(...lineOffsets[index]);
  }

  const text = keptLines.join("");

  return {
    text,
    offsets: trimOffsets(text, keptOffsets),
    removedLineCount,
  };
}

function splitOffsetsByLine(text: string, offsets: number[]): number[][] {
  const lines: number[][] = [[]];

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === "\n") {
      lines.push([]);
      continue;
    }

    lines.at(-1)?.push(offsets[index] ?? index);
  }

  return lines;
}

function normalizeForBoilerplate(line: string): string {
  return line.replace(/[^\p{L}\p{N}]+/gu, " ").trim().toLowerCase();
}

function isBoilerplateLine(line: string): boolean {
  if (!line) {
    return true;
  }

  const lowered = line.toLowerCase();

  return (
    lowered.includes("privacy policy") ||
    lowered.includes("cookie") ||
    lowered.includes("terms of service") ||
    lowered.includes("all rights reserved") ||
    lowered.includes("subscribe")
  );
}

function trimOffsets(text: string, offsets: number[]): number[] {
  if (text.length === offsets.length) {
    return offsets;
  }

  if (offsets.length > text.length) {
    return offsets.slice(0, text.length);
  }

  if (offsets.length === 0) {
    return Array.from(text, () => 0);
  }

  const expanded = [...offsets];

  while (expanded.length < text.length) {
    expanded.push(expanded.at(-1) ?? 0);
  }

  return expanded;
}

function resolveChunkingPreset(preset: ChunkingPreset): ChunkTextOptions<IngestionMetadata> {
  switch (preset) {
    case "compact":
      return {
        strategy: "sentence",
        maxCharacters: 420,
        overlapCharacters: 40,
      };
    case "wide":
      return {
        strategy: "paragraph",
        maxCharacters: 1_600,
        overlapCharacters: 80,
      };
    case "balanced":
    default:
      return {
        strategy: "sentence",
        maxCharacters: 900,
        overlapCharacters: 90,
      };
  }
}

function resolveSourceStart(offsets: number[], start: number): number {
  if (offsets.length === 0) {
    return 0;
  }

  return offsets[Math.max(0, Math.min(start, offsets.length - 1))] ?? 0;
}

function resolveSourceEnd(offsets: number[], end: number): number {
  if (offsets.length === 0) {
    return 0;
  }

  const index = Math.max(0, Math.min(end - 1, offsets.length - 1));
  return (offsets[index] ?? 0) + 1;
}

function detectFileDropKind(input: IngestFileDropInput): "html" | "plain-text" | "json-feed" {
  const mediaType = input.mediaType?.toLowerCase() ?? "";
  const fileName = input.fileName?.toLowerCase() ?? "";

  if (mediaType.includes("json") || fileName.endsWith(".json")) {
    return "json-feed";
  }

  if (mediaType.includes("html") || fileName.endsWith(".html") || fileName.endsWith(".htm")) {
    return "html";
  }

  if (looksLikeJsonFeed(input.content)) {
    return "json-feed";
  }

  if (looksLikeHtml(input.content)) {
    return "html";
  }

  return "plain-text";
}

function looksLikeHtml(value: string): boolean {
  return /<html\b|<body\b|<article\b|<p\b|<div\b/iu.test(value);
}

function looksLikeJsonFeed(value: string): boolean {
  const trimmed = value.trim();

  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) {
    return false;
  }

  return trimmed.includes("\"items\"") || trimmed.includes("\"content\"") || trimmed.includes("\"summary\"");
}

function sanitizeDocumentId(id: string): string {
  const trimmed = id.trim();

  if (!trimmed) {
    return "source-document";
  }

  return trimmed.replace(/[^a-z0-9-_.:/]+/giu, "-").slice(0, 120);
}
