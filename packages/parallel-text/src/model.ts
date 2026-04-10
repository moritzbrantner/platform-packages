export interface ParallelTextToken {
  id: string;
  sentenceId: string;
  sentenceIndex: number;
  wordIndex: number | null;
  text: string;
  normalized: string;
  leadingText: string;
  isWord: boolean;
}

export interface ParallelTextSentence {
  id: string;
  index: number;
  paragraphId: string;
  paragraphIndex: number;
  text: string;
  tokens: ParallelTextToken[];
  trailingText: string;
}

export interface ParallelTextParagraph {
  id: string;
  index: number;
  text: string;
  sentences: ParallelTextSentence[];
}

export interface SentenceAlignmentInput {
  original: number | number[];
  translated: number | number[];
  confidence?: number;
}

export interface TokenAlignmentInput {
  originalSentence: number;
  translatedSentence: number;
  originalToken: number;
  translatedToken: number;
  confidence?: number;
}

export interface ParallelTextTokenLink {
  id: string;
  originalTokenId: string;
  translatedTokenId: string;
  confidence?: number;
  source: "auto" | "manual";
}

export interface ParallelTextAlignmentRow {
  id: string;
  originalSentenceIndices: number[];
  translatedSentenceIndices: number[];
  originalSentences: ParallelTextSentence[];
  translatedSentences: ParallelTextSentence[];
  tokenLinks: ParallelTextTokenLink[];
  confidence?: number;
  source: "auto" | "manual";
}

export interface ParallelTextModel {
  originalParagraphs: ParallelTextParagraph[];
  originalSentences: ParallelTextSentence[];
  translatedParagraphs: ParallelTextParagraph[];
  translatedSentences: ParallelTextSentence[];
  rows: ParallelTextAlignmentRow[];
}

export interface CreateParallelTextModelOptions {
  originalText: string;
  translatedText: string;
  sentenceAlignments?: SentenceAlignmentInput[];
  tokenAlignments?: TokenAlignmentInput[];
}

interface AlignmentRowSeed {
  originalSentenceIndices: number[];
  translatedSentenceIndices: number[];
  confidence?: number;
  source: "auto" | "manual";
}

interface SegmentedDocument {
  paragraphs: ParallelTextParagraph[];
  sentences: ParallelTextSentence[];
}

const sentencePattern = /[^.!?…。！？\n]+[.!?…。！？]*|[^\n]+/gu;
const tokenPattern = /\p{L}[\p{L}\p{M}\p{N}'’-]*|\p{N}+|[^\s]/gu;

export function createParallelTextModel({
  originalText,
  translatedText,
  sentenceAlignments,
  tokenAlignments,
}: CreateParallelTextModelOptions): ParallelTextModel {
  const originalDocument = segmentDocument(originalText, "original");
  const translatedDocument = segmentDocument(translatedText, "translated");
  const rowSeeds = sentenceAlignments?.length
    ? createManualRows(
        sentenceAlignments,
        originalDocument.sentences.length,
        translatedDocument.sentences.length,
      )
    : createAutomaticRows(
        originalDocument.sentences.length,
        translatedDocument.sentences.length,
      );

  const rows = rowSeeds.map((row, index) => {
    const rowOriginalSentences = row.originalSentenceIndices.map(
      (sentenceIndex) => originalDocument.sentences[sentenceIndex],
    );
    const rowTranslatedSentences = row.translatedSentenceIndices.map(
      (sentenceIndex) => translatedDocument.sentences[sentenceIndex],
    );

    return {
      id: `row-${index}`,
      originalSentenceIndices: row.originalSentenceIndices,
      translatedSentenceIndices: row.translatedSentenceIndices,
      originalSentences: rowOriginalSentences,
      translatedSentences: rowTranslatedSentences,
      tokenLinks: createTokenLinksForRow(
        rowOriginalSentences,
        rowTranslatedSentences,
        tokenAlignments ?? [],
      ),
      confidence: row.confidence,
      source: row.source,
    } satisfies ParallelTextAlignmentRow;
  });

  return {
    originalParagraphs: originalDocument.paragraphs,
    originalSentences: originalDocument.sentences,
    translatedParagraphs: translatedDocument.paragraphs,
    translatedSentences: translatedDocument.sentences,
    rows,
  };
}

export function segmentText(
  text: string,
  side: "original" | "translated",
): ParallelTextSentence[] {
  return segmentDocument(text, side).sentences;
}

function segmentDocument(
  text: string,
  side: "original" | "translated",
): SegmentedDocument {
  const trimmed = text.trim();

  if (!trimmed) {
    return {
      paragraphs: [],
      sentences: [],
    };
  }

  const sentences: ParallelTextSentence[] = [];
  const paragraphs = trimmed
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.replace(/\s*\n+\s*/g, " ").trim())
    .filter(Boolean)
    .map((paragraphText, paragraphIndex) => {
      const paragraphId = `${side}-paragraph-${paragraphIndex}`;
      const sentenceTexts = Array.from(
        paragraphText.matchAll(sentencePattern),
        (match) => match[0].trim(),
      ).filter(Boolean);
      const paragraphSentences =
        sentenceTexts.length > 0 ? sentenceTexts : [paragraphText];

      const nextSentences = paragraphSentences.map((sentenceText) => {
        const sentence = createSentence(
          sentenceText,
          side,
          sentences.length,
          paragraphId,
          paragraphIndex,
        );
        sentences.push(sentence);
        return sentence;
      });

      return {
        id: paragraphId,
        index: paragraphIndex,
        text: paragraphText,
        sentences: nextSentences,
      } satisfies ParallelTextParagraph;
    });

  return {
    paragraphs,
    sentences,
  };
}

function createSentence(
  text: string,
  side: "original" | "translated",
  sentenceIndex: number,
  paragraphId: string,
  paragraphIndex: number,
): ParallelTextSentence {
  const sentenceId = `${side}-sentence-${sentenceIndex}`;
  const tokens: ParallelTextToken[] = [];
  let lastEnd = 0;
  let wordIndex = 0;

  for (const match of text.matchAll(tokenPattern)) {
    const tokenText = match[0];
    const matchIndex = match.index ?? 0;
    const isWord = /[\p{L}\p{N}]/u.test(tokenText);

    tokens.push({
      id: `${sentenceId}-token-${tokens.length}`,
      sentenceId,
      sentenceIndex,
      wordIndex: isWord ? wordIndex++ : null,
      text: tokenText,
      normalized: normalizeToken(tokenText),
      leadingText: text.slice(lastEnd, matchIndex),
      isWord,
    });

    lastEnd = matchIndex + tokenText.length;
  }

  return {
    id: sentenceId,
    index: sentenceIndex,
    paragraphId,
    paragraphIndex,
    text,
    tokens,
    trailingText: text.slice(lastEnd),
  };
}

function normalizeToken(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "");
}

function createManualRows(
  sentenceAlignments: SentenceAlignmentInput[],
  originalCount: number,
  translatedCount: number,
): AlignmentRowSeed[] {
  const rows: AlignmentRowSeed[] = sentenceAlignments.map((alignment) => ({
    originalSentenceIndices: normalizeIndices(alignment.original, originalCount),
    translatedSentenceIndices: normalizeIndices(alignment.translated, translatedCount),
    confidence: alignment.confidence,
    source: "manual" as const,
  }));

  const usedOriginal = new Set(rows.flatMap((row) => row.originalSentenceIndices));
  const usedTranslated = new Set(rows.flatMap((row) => row.translatedSentenceIndices));

  for (let index = 0; index < originalCount; index += 1) {
    if (!usedOriginal.has(index)) {
      rows.push({
        originalSentenceIndices: [index],
        translatedSentenceIndices: [],
        source: "auto" as const,
      });
    }
  }

  for (let index = 0; index < translatedCount; index += 1) {
    if (!usedTranslated.has(index)) {
      rows.push({
        originalSentenceIndices: [],
        translatedSentenceIndices: [index],
        source: "auto" as const,
      });
    }
  }

  return rows;
}

function createAutomaticRows(
  originalCount: number,
  translatedCount: number,
): AlignmentRowSeed[] {
  if (originalCount === 0 && translatedCount === 0) {
    return [];
  }

  if (originalCount === 0) {
    return Array.from({ length: translatedCount }, (_, index) => ({
      originalSentenceIndices: [],
      translatedSentenceIndices: [index],
      source: "auto" as const,
    }));
  }

  if (translatedCount === 0) {
    return Array.from({ length: originalCount }, (_, index) => ({
      originalSentenceIndices: [index],
      translatedSentenceIndices: [],
      source: "auto" as const,
    }));
  }

  if (originalCount === translatedCount) {
    return Array.from({ length: originalCount }, (_, index) => ({
      originalSentenceIndices: [index],
      translatedSentenceIndices: [index],
      source: "auto" as const,
    }));
  }

  if (originalCount > translatedCount) {
    return Array.from({ length: translatedCount }, (_, translatedIndex) => ({
      originalSentenceIndices: createIndexRange(
        Math.floor((translatedIndex * originalCount) / translatedCount),
        Math.max(
          Math.floor(((translatedIndex + 1) * originalCount) / translatedCount) - 1,
          Math.floor((translatedIndex * originalCount) / translatedCount),
        ),
      ),
      translatedSentenceIndices: [translatedIndex],
      source: "auto" as const,
    }));
  }

  return Array.from({ length: originalCount }, (_, originalIndex) => ({
    originalSentenceIndices: [originalIndex],
    translatedSentenceIndices: createIndexRange(
      Math.floor((originalIndex * translatedCount) / originalCount),
      Math.max(
        Math.floor(((originalIndex + 1) * translatedCount) / originalCount) - 1,
        Math.floor((originalIndex * translatedCount) / originalCount),
      ),
    ),
    source: "auto" as const,
  }));
}

function createTokenLinksForRow(
  originalSentences: ParallelTextSentence[],
  translatedSentences: ParallelTextSentence[],
  tokenAlignments: TokenAlignmentInput[],
): ParallelTextTokenLink[] {
  const originalTokens = flattenWordTokens(originalSentences);
  const translatedTokens = flattenWordTokens(translatedSentences);

  if (!originalTokens.length || !translatedTokens.length) {
    return [];
  }

  const links: ParallelTextTokenLink[] = [];
  const linkIds = new Set<string>();
  const pairedOriginal = new Set<string>();
  const pairedTranslated = new Set<string>();
  const originalSentenceIndices = new Set(originalSentences.map((sentence) => sentence.index));
  const translatedSentenceIndices = new Set(translatedSentences.map((sentence) => sentence.index));

  const pushLink = (
    originalToken: ParallelTextToken | undefined,
    translatedToken: ParallelTextToken | undefined,
    source: "auto" | "manual",
    confidence?: number,
  ) => {
    if (!originalToken || !translatedToken) {
      return;
    }

    const linkId = `${originalToken.id}|${translatedToken.id}`;

    if (linkIds.has(linkId)) {
      return;
    }

    linkIds.add(linkId);
    pairedOriginal.add(originalToken.id);
    pairedTranslated.add(translatedToken.id);
    links.push({
      id: `link-${links.length}`,
      originalTokenId: originalToken.id,
      translatedTokenId: translatedToken.id,
      confidence,
      source,
    });
  };

  for (const alignment of tokenAlignments) {
    if (
      !originalSentenceIndices.has(alignment.originalSentence) ||
      !translatedSentenceIndices.has(alignment.translatedSentence)
    ) {
      continue;
    }

    const originalSentence = originalSentences.find(
      (sentence) => sentence.index === alignment.originalSentence,
    );
    const translatedSentence = translatedSentences.find(
      (sentence) => sentence.index === alignment.translatedSentence,
    );

    pushLink(
      getWordTokenByIndex(originalSentence, alignment.originalToken),
      getWordTokenByIndex(translatedSentence, alignment.translatedToken),
      "manual",
      alignment.confidence,
    );
  }

  const originalCandidates = originalTokens.filter((token) => !pairedOriginal.has(token.id));
  const translatedCandidates = translatedTokens.filter((token) => !pairedTranslated.has(token.id));
  const uniqueMatches = createUniqueMatches(originalCandidates, translatedCandidates);

  for (const match of uniqueMatches) {
    pushLink(match.originalToken, match.translatedToken, "auto");
  }

  const remainingOriginal = originalTokens.filter((token) => !pairedOriginal.has(token.id));
  const remainingTranslated = translatedTokens.filter((token) => !pairedTranslated.has(token.id));

  if (remainingTranslated.length) {
    for (let index = 0; index < remainingOriginal.length; index += 1) {
      pushLink(
        remainingOriginal[index],
        remainingTranslated[
          relativeIndex(index, remainingOriginal.length, remainingTranslated.length)
        ],
        "auto",
      );
    }
  }

  if (remainingOriginal.length) {
    for (let index = 0; index < remainingTranslated.length; index += 1) {
      pushLink(
        remainingOriginal[
          relativeIndex(index, remainingTranslated.length, remainingOriginal.length)
        ],
        remainingTranslated[index],
        "auto",
      );
    }
  }

  return links;
}

function createUniqueMatches(
  originalTokens: ParallelTextToken[],
  translatedTokens: ParallelTextToken[],
) {
  const originalByValue = groupTokensByValue(originalTokens);
  const translatedByValue = groupTokensByValue(translatedTokens);
  const matches: Array<{
    originalToken: ParallelTextToken;
    translatedToken: ParallelTextToken;
  }> = [];

  for (const [value, originals] of originalByValue) {
    const translated = translatedByValue.get(value);

    if (!translated || originals.length !== 1 || translated.length !== 1) {
      continue;
    }

    matches.push({
      originalToken: originals[0],
      translatedToken: translated[0],
    });
  }

  return matches;
}

function groupTokensByValue(tokens: ParallelTextToken[]) {
  const groups = new Map<string, ParallelTextToken[]>();

  for (const token of tokens) {
    if (!token.normalized) {
      continue;
    }

    const next = groups.get(token.normalized);

    if (next) {
      next.push(token);
      continue;
    }

    groups.set(token.normalized, [token]);
  }

  return groups;
}

function flattenWordTokens(sentences: ParallelTextSentence[]) {
  return sentences.flatMap((sentence) => sentence.tokens.filter((token) => token.isWord));
}

function getWordTokenByIndex(
  sentence: ParallelTextSentence | undefined,
  wordIndex: number,
) {
  return sentence?.tokens.find((token) => token.wordIndex === wordIndex);
}

function normalizeIndices(value: number | number[], maxCount: number) {
  const indices = Array.isArray(value) ? value : [value];

  return Array.from(new Set(indices))
    .filter((index) => Number.isInteger(index) && index >= 0 && index < maxCount)
    .sort((left, right) => left - right);
}

function createIndexRange(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function relativeIndex(position: number, sourceCount: number, targetCount: number) {
  if (targetCount <= 1 || sourceCount <= 1) {
    return 0;
  }

  return Math.round((position * (targetCount - 1)) / (sourceCount - 1));
}
