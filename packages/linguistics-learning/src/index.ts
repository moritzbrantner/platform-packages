import {
  normalizeText,
  segmentTextDocument,
  type LanguageTag,
  type TextDocument,
  type TextSpan,
  type TextToken,
} from "@moritzbrantner/linguistics-core";
import type { CorpusIndex } from "@moritzbrantner/linguistics-corpus";

export interface InterlinearAlignmentInput {
  sourceTokenIndex: number;
  gloss: string;
  targetText?: string;
  targetTokenIndex?: number;
  note?: string;
}

export interface InterlinearToken {
  sourceTokenIndex: number;
  span: TextSpan;
  text: string;
  gloss: string;
  targetText?: string;
  targetTokenIndex?: number;
  note?: string;
}

export interface InterlinearBlock {
  documentId: string;
  language?: LanguageTag;
  text: string;
  tokens: InterlinearToken[];
  alignments: InterlinearAlignmentInput[];
}

export interface DeriveStudyTermsOptions {
  minFrequency?: number;
  includeNamedEntities?: boolean;
  includeMultiwordTerms?: boolean;
}

export interface StudyTerm {
  id: string;
  language?: LanguageTag;
  surfaces: string[];
  lemma: string;
  count: number;
  kind: "multiword" | "word";
  spans: TextSpan[];
  gloss?: string;
}

export interface CorpusStudyTermsOptions extends DeriveStudyTermsOptions {
  documentIds?: ReadonlyArray<string>;
  languages?: ReadonlyArray<LanguageTag>;
}

export interface CorpusStudyTerm {
  id: string;
  language?: LanguageTag;
  surfaces: string[];
  lemma: string;
  count: number;
  kind: "multiword" | "word";
  documentCount: number;
  documentIds: string[];
  gloss?: string;
}

export interface FlashcardSourceTerm {
  id: string;
  surfaces: string[];
  lemma: string;
  gloss?: string;
}

export interface CreateFlashcardSetOptions {
  sourceLanguage: LanguageTag;
  targetLanguage: LanguageTag;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  termId: string;
}

export interface FlashcardSet {
  sourceLanguage: LanguageTag;
  targetLanguage: LanguageTag;
  cards: Flashcard[];
}

export interface RecallResult {
  quality: number;
  reviewedAt?: Date | number | string;
}

export interface RecallGrade {
  quality: number;
  reviewedAt: string;
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  dueAt: string;
}

const MIN_EASE_FACTOR = 1.3;

export function createInterlinearBlock(
  document: TextDocument,
  alignments: ReadonlyArray<InterlinearAlignmentInput>,
): InterlinearBlock {
  const segmented = ensureWordDocument(document);
  const wordTokens = segmented.tokens.filter((token) => token.isWordLike);
  const tokens = alignments.flatMap((alignment) => {
    const token = wordTokens[alignment.sourceTokenIndex];

    if (!token) {
      return [];
    }

    return [
      {
        sourceTokenIndex: alignment.sourceTokenIndex,
        span: { ...token.span },
        text: token.text,
        gloss: alignment.gloss,
        targetText: alignment.targetText,
        targetTokenIndex: alignment.targetTokenIndex,
        note: alignment.note,
      } satisfies InterlinearToken,
    ];
  });

  return {
    documentId: segmented.id,
    language: segmented.language,
    text: segmented.text,
    tokens,
    alignments: alignments.map((alignment) => ({ ...alignment })),
  };
}

export function deriveStudyTerms(
  document: TextDocument,
  options: DeriveStudyTermsOptions = {},
): StudyTerm[] {
  const segmented = ensureWordDocument(document);
  const wordTokens = segmented.tokens.filter((token) => token.isWordLike);
  const minFrequency = Math.max(1, Math.floor(options.minFrequency ?? 1));
  const groups = new Map<string, StudyTerm>();

  for (const token of wordTokens) {
    if (!options.includeNamedEntities && looksLikeNamedEntity(token)) {
      continue;
    }

    const lemma = lemmatize(token.text);
    const key = `word:${lemma}`;
    const existing = groups.get(key);

    if (existing) {
      existing.count += 1;
      existing.spans.push({ ...token.span });
      addSurface(existing.surfaces, token.text);
      continue;
    }

    groups.set(key, {
      id: key,
      language: segmented.language,
      surfaces: [token.text],
      lemma,
      count: 1,
      kind: "word",
      spans: [{ ...token.span }],
    });
  }

  if (options.includeMultiwordTerms) {
    const phraseCounts = new Map<string, { count: number; spans: TextSpan[]; surfaces: Set<string> }>();

    for (let index = 0; index < wordTokens.length - 1; index += 1) {
      const left = wordTokens[index];
      const right = wordTokens[index + 1];

      if (left.sentenceId !== right.sentenceId) {
        continue;
      }

      const surface = `${left.text} ${right.text}`;
      const lemma = `${lemmatize(left.text)} ${lemmatize(right.text)}`;
      const next = phraseCounts.get(lemma) ?? {
        count: 0,
        spans: [],
        surfaces: new Set<string>(),
      };

      next.count += 1;
      next.spans.push({
        start: left.span.start,
        end: right.span.end,
        text: `${left.text} ${right.text}`,
      });
      next.surfaces.add(surface);
      phraseCounts.set(lemma, next);
    }

    for (const [lemma, entry] of phraseCounts) {
      if (entry.count < minFrequency) {
        continue;
      }

      groups.set(`multiword:${lemma}`, {
        id: `multiword:${lemma}`,
        language: segmented.language,
        surfaces: Array.from(entry.surfaces).sort(),
        lemma,
        count: entry.count,
        kind: "multiword",
        spans: entry.spans.map((span) => ({ ...span })),
      });
    }
  }

  return Array.from(groups.values())
    .filter((term) => term.count >= minFrequency)
    .sort(
      (left, right) =>
        right.count - left.count ||
        left.kind.localeCompare(right.kind) ||
        left.lemma.localeCompare(right.lemma),
    );
}

export function deriveCorpusStudyTerms(
  corpus: CorpusIndex,
  options: CorpusStudyTermsOptions = {},
): CorpusStudyTerm[] {
  const allowedDocumentIds = options.documentIds ? new Set(options.documentIds) : undefined;
  const allowedLanguages = options.languages ? new Set(options.languages) : undefined;
  const terms = new Map<
    string,
    CorpusStudyTerm & {
      documentIdSet: Set<string>;
    }
  >();

  for (const document of corpus.documents) {
    if (allowedDocumentIds && !allowedDocumentIds.has(document.id)) {
      continue;
    }

    if (
      allowedLanguages &&
      (!document.language || !allowedLanguages.has(document.language))
    ) {
      continue;
    }

    for (const term of deriveStudyTerms(document, options)) {
      const key = `${term.language ?? "und"}:${term.kind}:${term.lemma}`;
      const existing = terms.get(key);

      if (existing) {
        existing.count += term.count;
        existing.documentIdSet.add(document.id);

        for (const surface of term.surfaces) {
          addSurface(existing.surfaces, surface);
        }

        continue;
      }

      terms.set(key, {
        id: key,
        language: term.language,
        surfaces: [...term.surfaces].sort(),
        lemma: term.lemma,
        count: term.count,
        kind: term.kind,
        documentCount: 1,
        documentIds: [document.id],
        gloss: term.gloss,
        documentIdSet: new Set([document.id]),
      });
    }
  }

  return Array.from(terms.values())
    .map(({ documentIdSet, ...term }) => ({
      ...term,
      documentCount: documentIdSet.size,
      documentIds: Array.from(documentIdSet).sort(),
    }))
    .sort(
      (left, right) =>
        right.count - left.count ||
        right.documentCount - left.documentCount ||
        left.kind.localeCompare(right.kind) ||
        left.lemma.localeCompare(right.lemma),
    );
}

export function createFlashcardSet(
  terms: ReadonlyArray<FlashcardSourceTerm>,
  options: CreateFlashcardSetOptions,
): FlashcardSet {
  return {
    sourceLanguage: options.sourceLanguage,
    targetLanguage: options.targetLanguage,
    cards: terms.map((term) => ({
      id: `card-${term.id}`,
      front: term.surfaces[0] ?? term.lemma,
      back: term.gloss ?? term.lemma,
      termId: term.id,
    })),
  };
}

export function gradeRecall(
  result: RecallResult,
  history: ReadonlyArray<RecallGrade> = [],
): RecallGrade {
  const quality = Math.max(0, Math.min(5, Math.round(result.quality)));
  const reviewedAt = new Date(result.reviewedAt ?? Date.now());
  const previous = history.at(-1);
  const previousEase = previous?.easeFactor ?? 2.5;
  const nextEase = Math.max(
    MIN_EASE_FACTOR,
    Number(
      (
        previousEase +
        (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
      ).toFixed(3),
    ),
  );
  const repetitions =
    quality < 3 ? 0 : previous ? previous.repetitions + 1 : 1;
  const intervalDays =
    quality < 3
      ? 1
      : repetitions === 1
        ? 1
        : repetitions === 2
          ? 6
          : Math.max(1, Math.round((previous?.intervalDays ?? 6) * nextEase));
  const dueAt = new Date(reviewedAt.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return {
    quality,
    reviewedAt: reviewedAt.toISOString(),
    repetitions,
    easeFactor: nextEase,
    intervalDays,
    dueAt: dueAt.toISOString(),
  };
}

function ensureWordDocument(document: TextDocument): TextDocument {
  return document.tokens.length > 0
    ? document
    : segmentTextDocument(document, {
        granularity: "word",
        useIntlSegmenter: false,
      });
}

function looksLikeNamedEntity(token: TextToken): boolean {
  return /^[A-Z][\p{L}\p{M}\p{N}'’-]*$/u.test(token.text) && token.wordIndex !== 0;
}

function lemmatize(value: string): string {
  let lemma = normalizeText(value, {
    form: "NFKC",
    lowercase: true,
    stripDiacritics: true,
  });

  if (lemma.endsWith("ies") && lemma.length > 4) {
    return `${lemma.slice(0, -3)}y`;
  }

  if (lemma.endsWith("ied") && lemma.length > 4) {
    return `${lemma.slice(0, -3)}y`;
  }

  for (const suffix of ["ing", "ed", "es", "s"] as const) {
    if (lemma.endsWith(suffix) && lemma.length > suffix.length + 2) {
      lemma = lemma.slice(0, -suffix.length);
      if (/(.)\1$/u.test(lemma)) {
        lemma = lemma.slice(0, -1);
      }
      break;
    }
  }

  return lemma;
}

function addSurface(surfaces: string[], surface: string): void {
  if (!surfaces.includes(surface)) {
    surfaces.push(surface);
    surfaces.sort();
  }
}
