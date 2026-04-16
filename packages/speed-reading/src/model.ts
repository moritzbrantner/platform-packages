export interface SpeedReadingToken {
  id: string;
  index: number;
  text: string;
  coreText: string;
  normalized: string;
  prefix: string;
  suffix: string;
  displayStart: number;
  displayEnd: number;
  sourceStart: number;
  sourceEnd: number;
}

export interface SpeedReadingChunk {
  id: string;
  index: number;
  text: string;
  normalized: string;
  tokenIds: string[];
  wordCount: number;
  pauseMultiplier: number;
  startOffset: number;
  endOffset: number;
}

export interface SpeedReadingModel {
  text: string;
  tokens: SpeedReadingToken[];
  chunks: SpeedReadingChunk[];
}

export interface CreateSpeedReadingModelOptions {
  text: string;
  wordsPerChunk?: number;
}

const ABBREVIATION_PART = String.raw`(?:\p{L}\.){2,}`;
const NUMBER_PART = String.raw`\p{N}+(?:[.,:/]\p{N}+)*`;
const WORD_PART = String.raw`\p{L}[\p{L}\p{M}\p{N}]*(?:['’][\p{L}\p{M}\p{N}]+)*`;
const CORE_TOKEN_PATTERN = new RegExp(
  String.raw`(?:${ABBREVIATION_PART}|${NUMBER_PART}|${WORD_PART})(?:-(?:${ABBREVIATION_PART}|${NUMBER_PART}|${WORD_PART}))*`,
  "gu",
);

export function createSpeedReadingModel(
  options: CreateSpeedReadingModelOptions,
): SpeedReadingModel {
  return {
    text: options.text,
    tokens: tokenizeSpeedReadingText(options.text),
    chunks: splitSpeedReadingText(options.text, {
      wordsPerChunk: options.wordsPerChunk,
    }),
  };
}

export function tokenizeSpeedReadingText(text: string): SpeedReadingToken[] {
  const matches = Array.from(text.matchAll(CORE_TOKEN_PATTERN));

  if (matches.length === 0) {
    return [];
  }

  const tokens: SpeedReadingToken[] = [];
  let nextPrefix = extractPrefix(text.slice(0, matches[0]?.index ?? 0));

  for (const [index, match] of matches.entries()) {
    const coreText = match[0];
    const sourceStart = match.index ?? 0;
    const sourceEnd = sourceStart + coreText.length;
    const nextMatchStart = matches[index + 1]?.index ?? text.length;
    const between = text.slice(sourceEnd, nextMatchStart);
    const { suffix, prefixForNext } = splitBetweenTokens(between);
    const displayStart = sourceStart - nextPrefix.length;
    const displayEnd = sourceEnd + suffix.length;

    tokens.push({
      id: `token-${index}`,
      index,
      text: text.slice(displayStart, displayEnd),
      coreText,
      normalized: normalizeToken(coreText),
      prefix: nextPrefix,
      suffix,
      displayStart,
      displayEnd,
      sourceStart,
      sourceEnd,
    });

    nextPrefix = prefixForNext;
  }

  const lastToken = tokens[tokens.length - 1];
  const trailingSuffix = extractTrailingSuffix(text.slice(lastToken.sourceEnd));

  if (trailingSuffix) {
    lastToken.suffix += trailingSuffix;
    lastToken.displayEnd += trailingSuffix.length;
    lastToken.text = text.slice(lastToken.displayStart, lastToken.displayEnd);
  }

  return tokens;
}

export function splitSpeedReadingText(
  text: string,
  options: Pick<CreateSpeedReadingModelOptions, "wordsPerChunk"> = {},
): SpeedReadingChunk[] {
  const tokens = tokenizeSpeedReadingText(text);
  const wordsPerChunk = clampWordsPerChunk(options.wordsPerChunk ?? 1);

  if (tokens.length === 0) {
    const trimmed = text.trim();

    return trimmed
      ? [
          {
            id: "chunk-0",
            index: 0,
            text: trimmed,
            normalized: normalizeToken(trimmed),
            tokenIds: [],
            wordCount: 1,
            pauseMultiplier: getPauseMultiplier(trimmed),
            startOffset: text.indexOf(trimmed),
            endOffset: text.indexOf(trimmed) + trimmed.length,
          },
        ]
      : [];
  }

  const chunks: SpeedReadingChunk[] = [];

  for (let index = 0; index < tokens.length; index += wordsPerChunk) {
    const chunkTokens = tokens.slice(index, index + wordsPerChunk);
    const startToken = chunkTokens[0];
    const endToken = chunkTokens[chunkTokens.length - 1];
    const chunkText = text.slice(startToken.displayStart, endToken.displayEnd);

    chunks.push({
      id: `chunk-${chunks.length}`,
      index: chunks.length,
      text: chunkText,
      normalized: normalizeToken(chunkText),
      tokenIds: chunkTokens.map((token) => token.id),
      wordCount: chunkTokens.length,
      pauseMultiplier: getPauseMultiplier(endToken.text, chunkTokens.length),
      startOffset: startToken.displayStart,
      endOffset: endToken.displayEnd,
    });
  }

  return chunks;
}

function clampWordsPerChunk(value: number): number {
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function splitBetweenTokens(value: string): {
  suffix: string;
  prefixForNext: string;
} {
  if (!value) {
    return {
      suffix: "",
      prefixForNext: "",
    };
  }

  const whitespaceMatches = Array.from(value.matchAll(/\s+/gu));
  const lastWhitespace = whitespaceMatches.at(-1);

  if (!lastWhitespace || lastWhitespace.index === undefined) {
    return {
      suffix: value.trim(),
      prefixForNext: "",
    };
  }

  return {
    suffix: value.slice(0, lastWhitespace.index).trim(),
    prefixForNext: value.slice(lastWhitespace.index + lastWhitespace[0].length),
  };
}

function extractPrefix(value: string): string {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const whitespaceMatches = Array.from(value.matchAll(/\s+/gu));
  const lastWhitespace = whitespaceMatches.at(-1);

  if (!lastWhitespace || lastWhitespace.index === undefined) {
    return trimmed;
  }

  return value.slice(lastWhitespace.index + lastWhitespace[0].length);
}

function extractTrailingSuffix(value: string): string {
  return value.trim();
}

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "");
}

function getPauseMultiplier(value: string, wordCount = 1): number {
  const trimmed = value.trim();
  let multiplier = Math.max(1, wordCount);

  if (/[.?!…。！？]["')\]}]*$/u.test(trimmed)) {
    multiplier += 0.8;
  } else if (/[,;:]["')\]}]*$/u.test(trimmed)) {
    multiplier += 0.35;
  } else if (/[)\]}]["']*$/u.test(trimmed)) {
    multiplier += 0.1;
  }

  const plainLength = trimmed.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").length;

  if (plainLength >= 9) {
    multiplier += 0.12;
  }

  return Number(multiplier.toFixed(2));
}
