import type { CorpusIndex, CorpusTermCount } from "@moritzbrantner/linguistics-corpus";
import { countTerms } from "@moritzbrantner/linguistics-corpus";
import { normalizeToken, type TextDocument } from "@moritzbrantner/linguistics-core";

export interface InterlinearAnnotation {
  tokenId?: string;
  normalized?: string;
  gloss?: string;
  lemma?: string;
  translation?: string;
  partOfSpeech?: string;
  notes?: string;
}

export interface InterlinearRow {
  tokenId: string;
  sentenceId: string;
  paragraphId: string;
  surface: string;
  normalized: string;
  gloss?: string;
  lemma?: string;
  translation?: string;
  partOfSpeech?: string;
  notes?: string;
}

export interface CreateInterlinearRowsOptions {
  includePunctuation?: boolean;
}

export interface StudyTerm {
  term: string;
  count: number;
  surfaceForms: string[];
  documentIds: string[];
}

export interface DeriveStudyTermsOptions {
  minimumCount?: number;
}

export function createInterlinearRows(
  document: TextDocument,
  annotations: Iterable<InterlinearAnnotation>,
  options: CreateInterlinearRowsOptions = {},
): InterlinearRow[] {
  const byTokenId = new Map<string, InterlinearAnnotation>();
  const byNormalized = new Map<string, InterlinearAnnotation>();

  for (const annotation of annotations) {
    if (annotation.tokenId) {
      byTokenId.set(annotation.tokenId, annotation);
    }

    if (annotation.normalized) {
      byNormalized.set(annotation.normalized, annotation);
    }
  }

  return document.tokens
    .filter((token) => options.includePunctuation || token.isWord)
    .map((token) => {
      const annotation = byTokenId.get(token.id) ?? byNormalized.get(token.normalized);

      return {
        tokenId: token.id,
        sentenceId: token.sentenceId,
        paragraphId: token.paragraphId,
        surface: token.text,
        normalized: token.normalized,
        gloss: annotation?.gloss,
        lemma: annotation?.lemma,
        translation: annotation?.translation,
        partOfSpeech: annotation?.partOfSpeech,
        notes: annotation?.notes,
      };
    });
}

export function deriveStudyTerms(
  input: TextDocument | Iterable<TextDocument>,
  options: DeriveStudyTermsOptions = {},
): StudyTerm[] {
  const documents = isDocument(input) ? [input] : Array.from(input);
  const minimumCount = Math.max(1, Math.floor(options.minimumCount ?? 1));
  const byTerm = new Map<string, { count: number; surfaces: Map<string, number>; documentIds: Set<string> }>();

  for (const document of documents) {
    for (const token of document.tokens) {
      if (!token.isWord) {
        continue;
      }

      let entry = byTerm.get(token.normalized);

      if (!entry) {
        entry = {
          count: 0,
          surfaces: new Map(),
          documentIds: new Set(),
        };
        byTerm.set(token.normalized, entry);
      }

      entry.count += 1;
      entry.documentIds.add(document.id);
      entry.surfaces.set(token.text, (entry.surfaces.get(token.text) ?? 0) + 1);
    }
  }

  return Array.from(byTerm.entries())
    .filter(([, entry]) => entry.count >= minimumCount)
    .map(([term, entry]) => ({
      term,
      count: entry.count,
      surfaceForms: Array.from(entry.surfaces.entries())
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
        .map(([surface]) => surface),
      documentIds: Array.from(entry.documentIds).sort((left, right) => left.localeCompare(right)),
    }))
    .sort((left, right) => right.count - left.count || left.term.localeCompare(right.term));
}

export function rankStudyTerms(
  terms: Iterable<StudyTerm>,
  corpusStats?: Iterable<CorpusTermCount> | CorpusIndex,
): StudyTerm[] {
  const ranked = Array.from(terms, (term) => ({
    ...term,
    surfaceForms: [...term.surfaceForms],
    documentIds: [...term.documentIds],
  }));
  const corpusCounts = resolveCorpusCounts(corpusStats);

  return ranked.sort((left, right) => {
    const leftScore = scoreTerm(left, corpusCounts.get(left.term));
    const rightScore = scoreTerm(right, corpusCounts.get(right.term));

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return left.term.localeCompare(right.term);
  });
}

export function findUnknownTerms(
  document: TextDocument,
  knownTerms: Iterable<string>,
): StudyTerm[] {
  const known = new Set(Array.from(knownTerms, (term) => normalizeKnownTerm(term)));

  return deriveStudyTerms(document).filter((term) => !known.has(term.term));
}

function resolveCorpusCounts(
  corpusStats: Iterable<CorpusTermCount> | CorpusIndex | undefined,
): Map<string, CorpusTermCount> {
  if (!corpusStats) {
    return new Map();
  }

  const terms =
    typeof (corpusStats as Iterable<CorpusTermCount>)[Symbol.iterator] === "function"
      ? Array.from(corpusStats as Iterable<CorpusTermCount>)
      : countTerms({ index: corpusStats as CorpusIndex });

  return new Map(terms.map((term) => [term.term, term]));
}

function scoreTerm(term: StudyTerm, corpusCount: CorpusTermCount | undefined) {
  if (!corpusCount) {
    return term.count;
  }

  return term.count / (corpusCount.count + 1) ** 2;
}

function isDocument(value: TextDocument | Iterable<TextDocument>): value is TextDocument {
  return typeof (value as TextDocument).text === "string";
}

function normalizeKnownTerm(term: string) {
  return normalizeToken(term);
}
