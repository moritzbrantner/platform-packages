import {
  createTextDocument,
  segmentTextDocument,
  type TextDocument,
} from "@moritzbrantner/linguistics-core";

export type ParallelTextAlignmentSource = "manual" | "model" | "heuristic" | "unverified";

export type ParallelTextToken = {
  id: string;
  sentenceId: string;
  sentenceIndex: number;
  wordIndex: number | null;
  text: string;
  normalized: string;
  leadingText: string;
  isWord: boolean;
};

export type ParallelTextSentence = {
  id: string;
  index: number;
  paragraphId: string;
  paragraphIndex: number;
  text: string;
  tokens: ParallelTextToken[];
  trailingText: string;
};

export type ParallelTextParagraph = {
  id: string;
  index: number;
  text: string;
  sentences: ParallelTextSentence[];
};

export type SentenceAlignmentInput = {
  original: number | number[];
  translated: number | number[];
  confidence?: number;
  source?: ParallelTextAlignmentSource;
};

export type TokenAlignmentInput = {
  originalSentence: number;
  translatedSentence: number;
  originalToken: number;
  translatedToken: number;
  confidence?: number;
  source?: ParallelTextAlignmentSource;
};

export type ParallelTextTokenLink = {
  id: string;
  originalTokenId: string;
  translatedTokenId: string;
  confidence?: number;
  source: ParallelTextAlignmentSource;
};

export type ParallelTextAlignmentRow = {
  id: string;
  originalSentenceIndices: number[];
  translatedSentenceIndices: number[];
  originalSentences: ParallelTextSentence[];
  translatedSentences: ParallelTextSentence[];
  tokenLinks: ParallelTextTokenLink[];
  confidence?: number;
  source: ParallelTextAlignmentSource;
};

export type ParallelTextModel = {
  originalParagraphs: ParallelTextParagraph[];
  originalSentences: ParallelTextSentence[];
  translatedParagraphs: ParallelTextParagraph[];
  translatedSentences: ParallelTextSentence[];
  rows: ParallelTextAlignmentRow[];
};

export type CreateParallelTextModelOptions = {
  originalText: string;
  translatedText: string;
  sentenceAlignments?: SentenceAlignmentInput[];
  tokenAlignments?: TokenAlignmentInput[];
};

export type CreateAlignmentModelOptions = {
  original: string | TextDocument;
  translated: string | TextDocument;
  sentenceAlignments?: SentenceAlignmentInput[];
  tokenAlignments?: TokenAlignmentInput[];
};

export type SerializedAlignment = {
  version: 1;
  sentenceAlignments: SentenceAlignmentInput[];
  tokenAlignments: TokenAlignmentInput[];
};

type AlignmentRowSeed = {
  originalSentenceIndices: number[];
  translatedSentenceIndices: number[];
  confidence?: number;
  source: ParallelTextAlignmentSource;
};

type SegmentedDocument = {
  paragraphs: ParallelTextParagraph[];
  sentences: ParallelTextSentence[];
};

export function createParallelTextModel(
  options: CreateParallelTextModelOptions,
): ParallelTextModel {
  return createAlignmentModel({
    original: options.originalText,
    translated: options.translatedText,
    sentenceAlignments: options.sentenceAlignments,
    tokenAlignments: options.tokenAlignments,
  });
}

export function createAlignmentModel({
  original,
  translated,
  sentenceAlignments,
  tokenAlignments,
}: CreateAlignmentModelOptions): ParallelTextModel {
  const originalDocument = segmentDocument(original, "original");
  const translatedDocument = segmentDocument(translated, "translated");
  const rowSeeds = sentenceAlignments?.length
    ? createExplicitRows(
        sentenceAlignments,
        originalDocument.sentences.length,
        translatedDocument.sentences.length,
      )
    : createAutomaticRows(originalDocument.sentences.length, translatedDocument.sentences.length);

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

export function serializeAlignment(
  value:
    | ParallelTextModel
    | {
        sentenceAlignments?: SentenceAlignmentInput[];
        tokenAlignments?: TokenAlignmentInput[];
      },
): string {
  const payload: SerializedAlignment =
    "rows" in value
      ? {
          version: 1,
          sentenceAlignments: value.rows
            .filter((row) => isDurableAlignmentSource(row.source))
            .map((row) => ({
              original: row.originalSentenceIndices,
              translated: row.translatedSentenceIndices,
              confidence: row.confidence,
              source: row.source,
            })),
          tokenAlignments: value.rows.flatMap((row) => {
            const alignments: TokenAlignmentInput[] = [];

            for (const link of row.tokenLinks.filter((candidate) =>
              isDurableAlignmentSource(candidate.source),
            )) {
              const originalToken = row.originalSentences
                .flatMap((sentence) => sentence.tokens)
                .find((token) => token.id === link.originalTokenId);
              const translatedToken = row.translatedSentences
                .flatMap((sentence) => sentence.tokens)
                .find((token) => token.id === link.translatedTokenId);

              if (
                originalToken?.wordIndex === null ||
                translatedToken?.wordIndex === null ||
                originalToken === undefined ||
                translatedToken === undefined
              ) {
                continue;
              }

              alignments.push({
                originalSentence: originalToken.sentenceIndex,
                translatedSentence: translatedToken.sentenceIndex,
                originalToken: originalToken.wordIndex,
                translatedToken: translatedToken.wordIndex,
                confidence: link.confidence,
                source: link.source,
              });
            }

            return alignments;
          }),
        }
      : {
          version: 1,
          sentenceAlignments:
            value.sentenceAlignments?.map((alignment) => ({ ...alignment })) ?? [],
          tokenAlignments: value.tokenAlignments?.map((alignment) => ({ ...alignment })) ?? [],
        };

  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function parseAlignment(input: string): SerializedAlignment {
  const parsed = JSON.parse(input) as Partial<SerializedAlignment>;

  return {
    version: 1,
    sentenceAlignments: Array.isArray(parsed.sentenceAlignments) ? parsed.sentenceAlignments : [],
    tokenAlignments: Array.isArray(parsed.tokenAlignments) ? parsed.tokenAlignments : [],
  };
}

export function segmentText(text: string, side: "original" | "translated"): ParallelTextSentence[] {
  return segmentDocument(text, side).sentences;
}

function segmentDocument(
  value: string | TextDocument,
  side: "original" | "translated",
): SegmentedDocument {
  const segmented = ensureSegmentedDocument(value, side);

  return {
    paragraphs: segmented.paragraphs.map((paragraph) => ({
      id: paragraph.id,
      index: paragraph.index,
      text: paragraph.text,
      sentences: paragraph.sentences.map((sentence) => ({
        id: sentence.id,
        index: sentence.index,
        paragraphId: sentence.paragraphId,
        paragraphIndex: sentence.paragraphIndex,
        text: sentence.text,
        tokens: sentence.tokens.map((token) => ({
          id: token.id,
          sentenceId: token.sentenceId,
          sentenceIndex: token.sentenceIndex,
          wordIndex: token.wordIndex,
          text: token.text,
          normalized: token.normalized,
          leadingText: token.leadingText,
          isWord: token.isWordLike,
        })),
        trailingText: sentence.trailingText,
      })),
    })),
    sentences: segmented.sentences.map((sentence) => ({
      id: sentence.id,
      index: sentence.index,
      paragraphId: sentence.paragraphId,
      paragraphIndex: sentence.paragraphIndex,
      text: sentence.text,
      tokens: sentence.tokens.map((token) => ({
        id: token.id,
        sentenceId: token.sentenceId,
        sentenceIndex: token.sentenceIndex,
        wordIndex: token.wordIndex,
        text: token.text,
        normalized: token.normalized,
        leadingText: token.leadingText,
        isWord: token.isWordLike,
      })),
      trailingText: sentence.trailingText,
    })),
  };
}

function ensureSegmentedDocument(
  value: string | TextDocument,
  side: "original" | "translated",
): TextDocument {
  const baseDocument =
    typeof value === "string"
      ? createTextDocument({
          id: side,
          text: value,
        })
      : value.id === side
        ? value
        : {
            ...value,
            id: side,
          };

  return baseDocument.tokens.length > 0
    ? baseDocument
    : segmentTextDocument(baseDocument, {
        granularity: "word",
      });
}

function createExplicitRows(
  sentenceAlignments: SentenceAlignmentInput[],
  originalCount: number,
  translatedCount: number,
): AlignmentRowSeed[] {
  const rows: AlignmentRowSeed[] = sentenceAlignments.map((alignment) => ({
    originalSentenceIndices: normalizeIndices(alignment.original, originalCount),
    translatedSentenceIndices: normalizeIndices(alignment.translated, translatedCount),
    confidence: alignment.confidence,
    source: alignment.source ?? "manual",
  }));

  const usedOriginal = new Set(rows.flatMap((row) => row.originalSentenceIndices));
  const usedTranslated = new Set(rows.flatMap((row) => row.translatedSentenceIndices));

  for (let index = 0; index < originalCount; index += 1) {
    if (!usedOriginal.has(index)) {
      rows.push({
        originalSentenceIndices: [index],
        translatedSentenceIndices: [],
        source: "unverified",
      });
    }
  }

  for (let index = 0; index < translatedCount; index += 1) {
    if (!usedTranslated.has(index)) {
      rows.push({
        originalSentenceIndices: [],
        translatedSentenceIndices: [index],
        source: "unverified",
      });
    }
  }

  return rows;
}

function createAutomaticRows(originalCount: number, translatedCount: number): AlignmentRowSeed[] {
  if (originalCount === 0 && translatedCount === 0) {
    return [];
  }

  if (originalCount === 0) {
    return Array.from({ length: translatedCount }, (_, index) => ({
      originalSentenceIndices: [],
      translatedSentenceIndices: [index],
      source: "unverified" as const,
    }));
  }

  if (translatedCount === 0) {
    return Array.from({ length: originalCount }, (_, index) => ({
      originalSentenceIndices: [index],
      translatedSentenceIndices: [],
      source: "unverified" as const,
    }));
  }

  if (originalCount === translatedCount) {
    return Array.from({ length: originalCount }, (_, index) => ({
      originalSentenceIndices: [index],
      translatedSentenceIndices: [index],
      source: "heuristic" as const,
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
      source: "heuristic" as const,
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
    source: "heuristic" as const,
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
    source: ParallelTextAlignmentSource,
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
      alignment.source ?? "manual",
      alignment.confidence,
    );
  }

  const originalCandidates = originalTokens.filter((token) => !pairedOriginal.has(token.id));
  const translatedCandidates = translatedTokens.filter((token) => !pairedTranslated.has(token.id));
  const uniqueMatches = createUniqueMatches(originalCandidates, translatedCandidates);

  for (const match of uniqueMatches) {
    pushLink(match.originalToken, match.translatedToken, "heuristic", 0.5);
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

function getWordTokenByIndex(sentence: ParallelTextSentence | undefined, wordIndex: number) {
  return sentence?.tokens.find((token) => token.wordIndex === wordIndex);
}

function isDurableAlignmentSource(source: ParallelTextAlignmentSource) {
  return source === "manual" || source === "model";
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
