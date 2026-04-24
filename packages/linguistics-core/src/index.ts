import {
  extractWordTextsWithKernel,
  initLinguisticsKernel,
  isLinguisticsKernelReady,
  segmentTextDocumentWithKernel,
  splitTextSentencesWithKernel,
  type RawKernelSegmentedDocument,
  type RawKernelSpan,
  type RawKernelToken,
} from "./kernel";

export type LanguageTag = string;

export interface TextSpan {
  start: number;
  end: number;
  text: string;
}

export interface TextAnchor {
  start: number;
  end: number;
  text: string;
  normalizedText: string;
  prefix: string;
  suffix: string;
}

export interface TextToken {
  id: string;
  index: number;
  wordIndex: number | null;
  paragraphId: string;
  paragraphIndex: number;
  sentenceId: string;
  sentenceIndex: number;
  span: TextSpan;
  text: string;
  normalized: string;
  leadingText: string;
  isWordLike: boolean;
}

export interface TextSentence {
  id: string;
  index: number;
  paragraphId: string;
  paragraphIndex: number;
  span: TextSpan;
  text: string;
  tokens: TextToken[];
  trailingText: string;
}

export interface TextParagraph {
  id: string;
  index: number;
  span: TextSpan;
  text: string;
  sentences: TextSentence[];
}

export interface TextDocument<Metadata extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  text: string;
  language?: LanguageTag;
  metadata?: Metadata;
  paragraphs: TextParagraph[];
  sentences: TextSentence[];
  tokens: TextToken[];
}

export interface CreateTextDocumentOptions<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  id?: string;
  text: string;
  language?: LanguageTag;
  metadata?: Metadata;
}

export interface SegmentTextDocumentOptions {
  granularity: "paragraph" | "sentence" | "word";
  useIntlSegmenter?: boolean;
}

export interface NormalizeTextOptions {
  form: "NFC" | "NFKC";
  lowercase?: boolean;
  stripDiacritics?: boolean;
}

export interface Analyzer {
  id: string;
  tokenize?(
    document: TextDocument,
    options?: SegmentTextDocumentOptions,
  ): TextDocument | Promise<TextDocument>;
  tag?(document: TextDocument): unknown | Promise<unknown>;
  align?(source: TextDocument, target: TextDocument): unknown | Promise<unknown>;
}

export interface TextChunk<Metadata extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  index: number;
  text: string;
  start: number;
  end: number;
  language?: LanguageTag;
  documentId: string;
  metadata?: Metadata;
}

export interface ChunkTextDocumentOptions {
  strategy?: "character" | "paragraph" | "sentence";
  maxCharacters?: number;
  overlapCharacters?: number;
}

export interface ExtractWordTextsOptions {
  lowercase?: boolean;
  normalizeUnicode?: boolean;
  stripDiacritics?: boolean;
}

interface SegmentSlice {
  index: number;
  segment: string;
  isWordLike?: boolean;
}

interface ChunkCandidate {
  start: number;
  end: number;
  text: string;
}

const DEFAULT_DOCUMENT_ID = "document";
const DEFAULT_CONTEXT_WINDOW = 24;
const DEFAULT_CHUNK_SIZE = 1_200;
const DEFAULT_CHUNK_OVERLAP = 120;
const FALLBACK_SENTENCE_PATTERN = /[^.!?…。！？؟\n]+[.!?…。！？؟]*|[^\n]+/gu;
const FALLBACK_TOKEN_PATTERN = /\p{L}[\p{L}\p{M}\p{N}'’-]*|\p{N}+|[^\s]/gu;

export function createTextDocument<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>({ id, text, language, metadata }: CreateTextDocumentOptions<Metadata>): TextDocument<Metadata> {
  return {
    id: id?.trim() || DEFAULT_DOCUMENT_ID,
    text,
    language,
    metadata: metadata ? { ...metadata } : undefined,
    paragraphs: segmentParagraphs(text, id?.trim() || DEFAULT_DOCUMENT_ID),
    sentences: [],
    tokens: [],
  };
}

export function segmentTextDocument<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(document: TextDocument<Metadata>, options: SegmentTextDocumentOptions): TextDocument<Metadata> {
  if (options.useIntlSegmenter === false && isLinguisticsKernelReady()) {
    const kernelDocument = segmentTextDocumentFromKernel(document, options);

    if (kernelDocument) {
      return kernelDocument;
    }
  }

  const paragraphs =
    document.paragraphs.length > 0
      ? cloneParagraphs(document.paragraphs)
      : segmentParagraphs(document.text, document.id);

  if (options.granularity === "paragraph") {
    return {
      ...document,
      paragraphs,
      sentences: [],
      tokens: [],
    };
  }

  const sentences: TextSentence[] = [];
  const tokens: TextToken[] = [];
  const paragraphSentences = paragraphs.map((paragraph, paragraphIndex) => {
    const segments = segmentSentences(
      paragraph.text,
      document.language,
      options.useIntlSegmenter !== false,
    );

    const nextSentences = (
      segments.length > 0 ? segments : [{ index: 0, segment: paragraph.text }]
    ).map((slice) => {
      const span = createSpan(
        document.text,
        paragraph.span.start + slice.index,
        paragraph.span.start + slice.index + slice.segment.length,
      );
      const sentenceId = `${document.id}-sentence-${sentences.length}`;
      const nextTokens =
        options.granularity === "word"
          ? createSentenceTokens(
              document,
              paragraph,
              paragraphIndex,
              sentenceId,
              sentences.length,
              span,
              slice.segment,
              options.useIntlSegmenter !== false,
            )
          : [];

      const sentence: TextSentence = {
        id: sentenceId,
        index: sentences.length,
        paragraphId: paragraph.id,
        paragraphIndex,
        span,
        text: slice.segment,
        tokens: nextTokens,
        trailingText:
          nextTokens.length > 0
            ? slice.segment.slice((nextTokens.at(-1)?.span.end ?? span.start) - span.start)
            : "",
      };

      sentences.push(sentence);
      tokens.push(...nextTokens);
      return sentence;
    });

    return {
      ...paragraph,
      sentences: nextSentences,
    };
  });

  return {
    ...document,
    paragraphs: paragraphSentences,
    sentences,
    tokens,
  };
}

export function normalizeText(text: string, options: NormalizeTextOptions): string {
  let normalized = text.normalize(options.form);

  if (options.lowercase) {
    normalized = normalized.toLocaleLowerCase();
  }

  if (options.stripDiacritics) {
    normalized = normalized.normalize("NFKD").replace(/\p{M}/gu, "").normalize(options.form);
  }

  return normalized;
}

export { initLinguisticsKernel, isLinguisticsKernelReady };

export function extractWordTexts(
  text: string,
  options: ExtractWordTextsOptions = {},
): string[] {
  const surfaces = extractWordTextsWithKernel(text) ?? fallbackExtractWordTexts(text);

  return surfaces.map((surface) => {
    let value = options.normalizeUnicode === false ? surface : surface.normalize("NFKC");

    if (options.lowercase) {
      value = value.toLocaleLowerCase();
    }

    if (options.stripDiacritics) {
      value = value.normalize("NFKD").replace(/\p{M}/gu, "").normalize("NFKC");
    }

    return value;
  });
}

export function splitTextSentences(text: string): string[] {
  return splitTextSentencesWithKernel(text) ?? segmentSentences(text, undefined, false).map(
    (segment) => segment.segment,
  );
}

export function anchorSpan(
  document: TextDocument,
  span: Pick<TextSpan, "end" | "start">,
): TextAnchor {
  const resolved = createSpan(document.text, span.start, span.end);

  return {
    start: resolved.start,
    end: resolved.end,
    text: resolved.text,
    normalizedText: normalizeText(resolved.text, {
      form: "NFKC",
      lowercase: true,
      stripDiacritics: true,
    }),
    prefix: document.text.slice(
      Math.max(0, resolved.start - DEFAULT_CONTEXT_WINDOW),
      resolved.start,
    ),
    suffix: document.text.slice(
      resolved.end,
      Math.min(document.text.length, resolved.end + DEFAULT_CONTEXT_WINDOW),
    ),
  };
}

export function reanchorSpan(document: TextDocument, anchor: TextAnchor): TextSpan | null {
  if (
    anchor.start >= 0 &&
    anchor.end <= document.text.length &&
    document.text.slice(anchor.start, anchor.end) === anchor.text
  ) {
    return createSpan(document.text, anchor.start, anchor.end);
  }

  const exactMatches = findSubstringMatches(document.text, anchor.text);

  if (exactMatches.length > 0) {
    return scoreAnchorMatches(document.text, anchor, exactMatches);
  }

  if (!anchor.normalizedText) {
    return null;
  }

  const normalizedMatches = findNormalizedMatches(document.text, anchor.normalizedText);
  return normalizedMatches.length > 0
    ? scoreAnchorMatches(document.text, anchor, normalizedMatches)
    : null;
}

export function chunkTextDocument<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(input: TextDocument<Metadata>, options: ChunkTextDocumentOptions = {}): TextChunk<Metadata>[] {
  const strategy = options.strategy ?? "sentence";
  const maxCharacters = Math.max(1, Math.floor(options.maxCharacters ?? DEFAULT_CHUNK_SIZE));
  const defaultOverlap = strategy === "character" ? DEFAULT_CHUNK_OVERLAP : 0;
  const overlapCharacters = Math.max(
    0,
    Math.floor(Math.min(options.overlapCharacters ?? defaultOverlap, maxCharacters - 1)),
  );
  const document =
    strategy === "sentence" && input.sentences.length === 0
      ? segmentTextDocument(input, { granularity: "sentence" })
      : input;
  const candidates =
    strategy === "character"
      ? createCharacterChunks(document.text, maxCharacters, overlapCharacters)
      : collectSegmentChunks(document, strategy, maxCharacters, overlapCharacters);

  return candidates.map((chunk, index) => ({
    id: `${document.id}-chunk-${index}`,
    index,
    text: chunk.text,
    start: chunk.start,
    end: chunk.end,
    language: document.language,
    documentId: document.id,
    metadata: document.metadata,
  }));
}

function segmentParagraphs(text: string, documentId: string): TextParagraph[] {
  const paragraphs: TextParagraph[] = [];

  for (const match of text.matchAll(/\S[\s\S]*?(?=(?:\n\s*\n)+|$)/gu)) {
    const value = match[0];
    const blockStart = match.index ?? 0;
    const leadingTrim = value.match(/^\s*/u)?.[0].length ?? 0;
    const trailingTrim = value.match(/\s*$/u)?.[0].length ?? 0;
    const start = blockStart + leadingTrim;
    const end = blockStart + value.length - trailingTrim;

    if (end <= start) {
      continue;
    }

    paragraphs.push({
      id: `${documentId}-paragraph-${paragraphs.length}`,
      index: paragraphs.length,
      span: createSpan(text, start, end),
      text: text.slice(start, end),
      sentences: [],
    });
  }

  if (paragraphs.length === 0 && text.trim()) {
    paragraphs.push({
      id: `${documentId}-paragraph-0`,
      index: 0,
      span: createSpan(text, 0, text.length),
      text,
      sentences: [],
    });
  }

  return paragraphs;
}

function cloneParagraphs(paragraphs: readonly TextParagraph[]): TextParagraph[] {
  return paragraphs.map((paragraph) => ({
    ...paragraph,
    span: { ...paragraph.span },
    sentences: paragraph.sentences.map((sentence) => ({
      ...sentence,
      span: { ...sentence.span },
      tokens: sentence.tokens.map((token) => ({
        ...token,
        span: { ...token.span },
      })),
    })),
  }));
}

function createSentenceTokens(
  document: TextDocument,
  paragraph: TextParagraph,
  paragraphIndex: number,
  sentenceId: string,
  sentenceIndex: number,
  sentenceSpan: TextSpan,
  sentenceText: string,
  useIntlSegmenter: boolean,
): TextToken[] {
  const segments = segmentWords(sentenceText, document.language, useIntlSegmenter);
  const matches = segments.length > 0 ? segments : fallbackTokens(sentenceText);
  const tokens: TextToken[] = [];
  let wordIndex = 0;
  let lastBoundary = 0;

  for (const match of matches) {
    if (!match.segment || !match.segment.trim()) {
      continue;
    }

    const tokenStart = sentenceSpan.start + match.index;
    const tokenEnd = tokenStart + match.segment.length;
    const tokenText = sentenceText.slice(match.index, match.index + match.segment.length);
    const isWordLike = match.isWordLike ?? /[\p{L}\p{N}]/u.test(tokenText);

    tokens.push({
      id: `${sentenceId}-token-${tokens.length}`,
      index: tokens.length,
      wordIndex: isWordLike ? wordIndex++ : null,
      paragraphId: paragraph.id,
      paragraphIndex,
      sentenceId,
      sentenceIndex,
      span: createSpan(document.text, tokenStart, tokenEnd),
      text: tokenText,
      normalized: normalizeText(tokenText, {
        form: "NFKC",
        lowercase: true,
        stripDiacritics: true,
      }),
      leadingText: sentenceText.slice(lastBoundary, match.index),
      isWordLike,
    });
    lastBoundary = match.index + match.segment.length;
  }

  return tokens;
}

function segmentSentences(
  text: string,
  language: LanguageTag | undefined,
  useIntlSegmenter: boolean,
): SegmentSlice[] {
  const segments =
    useIntlSegmenter && typeof Intl?.Segmenter === "function"
      ? Array.from(
          new Intl.Segmenter(language, { granularity: "sentence" }).segment(text),
          (entry) => ({ index: entry.index, segment: entry.segment }),
        )
      : [];

  const filtered = trimSegmentSlices(segments);
  return filtered.length > 0 ? filtered : trimSegmentSlices(fallbackSentences(text));
}

function segmentWords(
  text: string,
  language: LanguageTag | undefined,
  useIntlSegmenter: boolean,
): SegmentSlice[] {
  if (useIntlSegmenter && typeof Intl?.Segmenter === "function") {
    return Array.from(
      new Intl.Segmenter(language, { granularity: "word" }).segment(text),
      (entry) => ({
        index: entry.index,
        segment: entry.segment,
        isWordLike: entry.isWordLike,
      }),
    );
  }

  return [];
}

function fallbackSentences(text: string): SegmentSlice[] {
  return Array.from(text.matchAll(FALLBACK_SENTENCE_PATTERN), (match) => ({
    index: match.index ?? 0,
    segment: match[0],
  })).filter((entry) => entry.segment.trim());
}

function trimSegmentSlices(segments: SegmentSlice[]): SegmentSlice[] {
  return segments
    .map((segment) => {
      const leadingWhitespace = segment.segment.match(/^\s*/u)?.[0].length ?? 0;
      const trailingWhitespace = segment.segment.match(/\s*$/u)?.[0].length ?? 0;

      return {
        ...segment,
        index: segment.index + leadingWhitespace,
        segment: segment.segment.slice(
          leadingWhitespace,
          Math.max(leadingWhitespace, segment.segment.length - trailingWhitespace),
        ),
      };
    })
    .filter((segment) => segment.segment.length > 0);
}

function fallbackExtractWordTexts(text: string): string[] {
  return Array.from(text.matchAll(FALLBACK_TOKEN_PATTERN), (match) => match[0]).filter((token) =>
    /[\p{L}\p{N}]/u.test(token),
  );
}

function segmentTextDocumentFromKernel<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(document: TextDocument<Metadata>, options: SegmentTextDocumentOptions): TextDocument<Metadata> | null {
  try {
    const raw = segmentTextDocumentWithKernel(document.text, {
      includePunctuation: options.granularity === "word",
      includeTokens: options.granularity === "word",
      keepApostrophes: true,
    });

    if (!raw) {
      return null;
    }

    return materializeKernelDocument(document, options, raw);
  } catch {
    return null;
  }
}

function materializeKernelDocument<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(
  document: TextDocument<Metadata>,
  options: SegmentTextDocumentOptions,
  raw: RawKernelSegmentedDocument,
): TextDocument<Metadata> {
  const paragraphs = raw.paragraphs.map((paragraph, paragraphIndex) => ({
    id: `${document.id}-paragraph-${paragraphIndex}`,
    index: paragraphIndex,
    span: toSpan(paragraph),
    text: paragraph.text,
    sentences: [] as TextSentence[],
  }));

  if (options.granularity === "paragraph") {
    return {
      ...document,
      paragraphs,
      sentences: [],
      tokens: [],
    };
  }

  const sentences: TextSentence[] = [];
  const tokens: TextToken[] = [];
  let tokenCursor = 0;

  raw.sentences.forEach((rawSentence, sentenceIndex) => {
    const paragraphIndex = findOwningParagraphIndex(paragraphs, rawSentence);
    const paragraph = paragraphs[paragraphIndex];
    const sentenceId = `${document.id}-sentence-${sentenceIndex}`;
    const tokenContext = {
      cursor: tokenCursor,
      tokens,
    };
    const sentenceTokens =
      options.granularity === "word"
        ? materializeSentenceTokens(
            document,
            rawSentence,
            paragraph,
            sentenceId,
            sentenceIndex,
            raw.tokens,
            tokenContext,
          )
        : [];

    tokenCursor = tokenContext.cursor;

    const sentence: TextSentence = {
      id: sentenceId,
      index: sentenceIndex,
      paragraphId: paragraph.id,
      paragraphIndex,
      span: toSpan(rawSentence),
      text: rawSentence.text,
      tokens: sentenceTokens,
      trailingText:
        sentenceTokens.length > 0
          ? rawSentence.text.slice(
              (sentenceTokens.at(-1)?.span.end ?? rawSentence.start) - rawSentence.start,
            )
          : "",
    };

    sentences.push(sentence);
    paragraph.sentences.push(sentence);
  });

  return {
    ...document,
    paragraphs,
    sentences,
    tokens,
  };
}

function materializeSentenceTokens<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(
  document: TextDocument<Metadata>,
  sentence: RawKernelSpan,
  paragraph: TextParagraph,
  sentenceId: string,
  sentenceIndex: number,
  rawTokens: RawKernelToken[],
  context: {
    cursor: number;
    tokens: TextToken[];
  },
): TextToken[] {
  const sentenceTokens: TextToken[] = [];
  let wordIndex = 0;
  let lastBoundary = 0;

  while (
    context.cursor < rawTokens.length &&
    rawTokens[context.cursor]!.end <= sentence.end
  ) {
    const rawToken = rawTokens[context.cursor]!;
    context.cursor += 1;

    if (rawToken.start < sentence.start) {
      continue;
    }

    const isWordLike = isWordLikeToken(rawToken.kind);
    const token: TextToken = {
      id: `${sentenceId}-token-${sentenceTokens.length}`,
      index: context.tokens.length,
      wordIndex: isWordLike ? wordIndex++ : null,
      paragraphId: paragraph.id,
      paragraphIndex: paragraph.index,
      sentenceId,
      sentenceIndex,
      span: toSpan(rawToken),
      text: rawToken.text,
      normalized: normalizeText(rawToken.text, {
        form: "NFKC",
        lowercase: true,
        stripDiacritics: true,
      }),
      leadingText: sentence.text.slice(lastBoundary, rawToken.start - sentence.start),
      isWordLike,
    };

    lastBoundary = rawToken.end - sentence.start;
    sentenceTokens.push(token);
    context.tokens.push(token);
  }

  return sentenceTokens;
}

function findOwningParagraphIndex(paragraphs: TextParagraph[], sentence: RawKernelSpan): number {
  const foundIndex = paragraphs.findIndex(
    (paragraph) => paragraph.span.start <= sentence.start && sentence.end <= paragraph.span.end,
  );

  return foundIndex === -1 ? Math.max(paragraphs.length - 1, 0) : foundIndex;
}

function isWordLikeToken(kind: string): boolean {
  return (
    kind === "word" ||
    kind === "number" ||
    kind === "url" ||
    kind === "email" ||
    kind === "mention" ||
    kind === "hashtag"
  );
}

function toSpan(value: RawKernelSpan | RawKernelToken): TextSpan {
  return {
    start: value.start,
    end: value.end,
    text: value.text,
  };
}

function fallbackTokens(text: string): SegmentSlice[] {
  return Array.from(text.matchAll(FALLBACK_TOKEN_PATTERN), (match) => ({
    index: match.index ?? 0,
    segment: match[0],
    isWordLike: /[\p{L}\p{N}]/u.test(match[0]),
  }));
}

function createSpan(text: string, start: number, end: number): TextSpan {
  const safeStart = Math.max(0, Math.min(start, text.length));
  const safeEnd = Math.max(safeStart, Math.min(end, text.length));

  return {
    start: safeStart,
    end: safeEnd,
    text: text.slice(safeStart, safeEnd),
  };
}

function collectSegmentChunks(
  document: TextDocument,
  strategy: "paragraph" | "sentence",
  maxCharacters: number,
  overlapCharacters: number,
): ChunkCandidate[] {
  const items = strategy === "paragraph" ? document.paragraphs : document.sentences;

  if (items.length === 0) {
    return createCharacterChunks(document.text, maxCharacters, overlapCharacters);
  }

  const chunks: ChunkCandidate[] = [];
  let currentStart = -1;
  let currentEnd = -1;

  for (const item of items) {
    if (item.text.length > maxCharacters) {
      flushCurrentChunk(document, chunks, currentStart, currentEnd);
      currentStart = -1;
      currentEnd = -1;
      chunks.push(...splitOversizedSegment(item, maxCharacters, overlapCharacters));
      continue;
    }

    if (currentStart < 0) {
      currentStart = item.span.start;
      currentEnd = item.span.end;
      continue;
    }

    const nextStart = Math.max(0, currentStart);
    const nextEnd = item.span.end;
    const nextText = document.text.slice(nextStart, nextEnd);

    if (nextText.length <= maxCharacters) {
      currentEnd = nextEnd;
      continue;
    }

    flushCurrentChunk(document, chunks, currentStart, currentEnd);
    currentStart = item.span.start;
    currentEnd = item.span.end;
  }

  flushCurrentChunk(document, chunks, currentStart, currentEnd);
  return withCharacterOverlap(chunks, document.text, overlapCharacters);
}

function splitOversizedSegment(
  item: TextParagraph | TextSentence,
  maxCharacters: number,
  overlapCharacters: number,
): ChunkCandidate[] {
  return createCharacterChunks(item.text, maxCharacters, overlapCharacters).map((chunk) => ({
    start: item.span.start + chunk.start,
    end: item.span.start + chunk.end,
    text: chunk.text,
  }));
}

function createCharacterChunks(
  text: string,
  maxCharacters: number,
  overlapCharacters: number,
): ChunkCandidate[] {
  if (text.length === 0) {
    return [{ start: 0, end: 0, text: "" }];
  }

  const step = Math.max(1, maxCharacters - overlapCharacters);
  const chunks: ChunkCandidate[] = [];

  for (let start = 0; start < text.length; start += step) {
    const end = Math.min(text.length, start + maxCharacters);
    chunks.push({
      start,
      end,
      text: text.slice(start, end),
    });

    if (end >= text.length) {
      break;
    }
  }

  return chunks;
}

function withCharacterOverlap(
  chunks: ChunkCandidate[],
  text: string,
  overlapCharacters: number,
): ChunkCandidate[] {
  if (overlapCharacters <= 0 || chunks.length <= 1) {
    return chunks;
  }

  return chunks.map((chunk, index) => {
    if (index === 0) {
      return chunk;
    }

    const start = Math.max(0, chunk.start - overlapCharacters);
    return {
      start,
      end: chunk.end,
      text: text.slice(start, chunk.end),
    };
  });
}

function flushCurrentChunk(
  document: TextDocument,
  target: ChunkCandidate[],
  start: number,
  end: number,
): void {
  if (start < 0 || end < start) {
    return;
  }

  target.push({
    start,
    end,
    text: document.text.slice(start, end),
  });
}

function findSubstringMatches(text: string, search: string): Array<{ start: number; end: number }> {
  if (!search) {
    return [];
  }

  const matches: Array<{ start: number; end: number }> = [];
  let index = text.indexOf(search);

  while (index !== -1) {
    matches.push({
      start: index,
      end: index + search.length,
    });
    index = text.indexOf(search, index + 1);
  }

  return matches;
}

function findNormalizedMatches(
  text: string,
  normalizedSearch: string,
): Array<{ start: number; end: number }> {
  const graphemes = Array.from(text);
  const normalizedUnits = graphemes.map((character) =>
    normalizeText(character, {
      form: "NFKC",
      lowercase: true,
      stripDiacritics: true,
    }),
  );

  const offsets = graphemes.reduce<number[]>((positions, character) => {
    positions.push((positions.at(-1) ?? 0) + character.length);
    return positions;
  }, []);
  const normalized = normalizedUnits.join("");
  const matches: Array<{ start: number; end: number }> = [];
  let searchIndex = normalized.indexOf(normalizedSearch);

  while (searchIndex !== -1) {
    let accumulated = 0;
    let startIndex = 0;
    let endIndex = graphemes.length;

    for (let index = 0; index < normalizedUnits.length; index += 1) {
      const nextAccumulated = accumulated + normalizedUnits[index].length;

      if (accumulated <= searchIndex && searchIndex < nextAccumulated) {
        startIndex = index;
      }

      if (
        accumulated < searchIndex + normalizedSearch.length &&
        searchIndex + normalizedSearch.length <= nextAccumulated
      ) {
        endIndex = index + 1;
        break;
      }

      accumulated = nextAccumulated;
    }

    matches.push({
      start: startIndex === 0 ? 0 : (offsets[startIndex - 1] ?? 0),
      end: offsets[endIndex - 1] ?? text.length,
    });

    searchIndex = normalized.indexOf(normalizedSearch, searchIndex + 1);
  }

  return matches;
}

function scoreAnchorMatches(
  text: string,
  anchor: TextAnchor,
  candidates: Array<{ start: number; end: number }>,
): TextSpan | null {
  const best = candidates
    .map((candidate) => ({
      ...candidate,
      score:
        overlapScore(
          anchor.prefix,
          text.slice(Math.max(0, candidate.start - anchor.prefix.length), candidate.start),
        ) +
        overlapScore(
          anchor.suffix,
          text.slice(candidate.end, candidate.end + anchor.suffix.length),
        ) -
        Math.abs(anchor.start - candidate.start) / 1000,
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        Math.abs(anchor.start - left.start) - Math.abs(anchor.start - right.start) ||
        left.start - right.start,
    )[0];

  return best ? createSpan(text, best.start, best.end) : null;
}

function overlapScore(expected: string, actual: string): number {
  const maxLength = Math.min(expected.length, actual.length);
  let best = 0;

  for (let length = maxLength; length >= 1; length -= 1) {
    if (
      expected.slice(expected.length - length) === actual.slice(actual.length - length) ||
      expected.slice(0, length) === actual.slice(0, length)
    ) {
      best = length;
      break;
    }
  }

  return best;
}
