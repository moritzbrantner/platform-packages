import {
  createTextDocument,
  normalizeLanguageTag,
  sliceDocumentText,
  type TextDocument,
  type TextSentence,
  type TextToken,
} from "@moritzbrantner/linguistics-core";

export interface CorpusIndex {
  documents: TextDocument[];
  terms: CorpusTermCount[];
}

export interface CorpusTermCount {
  term: string;
  count: number;
  documentCount: number;
}

export interface CorpusMatch {
  document: TextDocument;
  sentence: TextSentence;
  tokens: TextToken[];
  matchedTerms: string[];
  matchedText: string;
}

export interface ConcordanceLine {
  document: TextDocument;
  sentence: TextSentence;
  leftContext: string;
  matchText: string;
  rightContext: string;
}

export interface CreateCorpusIndexOptions {
  documents: Iterable<TextDocument>;
}

export interface CorpusQueryOptions {
  index: CorpusIndex;
  language?: string;
  metadata?: Record<string, unknown>;
  limit?: number;
}

export interface ConcordanceOptions extends CorpusQueryOptions {
  window?: number;
}

export interface CountTermsOptions {
  index: CorpusIndex;
  language?: string;
  metadata?: Record<string, unknown>;
}

export interface ListDocumentsByLanguageOptions {
  index: CorpusIndex;
}

export function createCorpusIndex(options: CreateCorpusIndexOptions): CorpusIndex {
  const documents = Array.from(options.documents, copyDocumentReference).sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  const counts = buildTermCounts(documents);

  return {
    documents,
    terms: Array.from(counts.values()).sort(
      (left, right) =>
        right.count - left.count ||
        right.documentCount - left.documentCount ||
        left.term.localeCompare(right.term),
    ),
  };
}

export function searchCorpus(query: string, options: CorpusQueryOptions): CorpusMatch[] {
  const documents = filterDocuments(options.index.documents, options);
  const queryTerms = tokenizeQuery(query);

  if (queryTerms.length === 0) {
    return [];
  }

  const matches =
    queryTerms.length === 1
      ? searchSingleTerm(documents, queryTerms[0])
      : searchPhrase(documents, queryTerms);

  return matches.slice(0, normalizeLimit(options.limit));
}

export function createConcordance(term: string, options: ConcordanceOptions): ConcordanceLine[] {
  const window = Math.max(0, Math.floor(options.window ?? 3));

  return searchCorpus(term, options).map((match) => {
    const hit = match.tokens[0];
    const wordTokens = match.sentence.tokens.filter((token) => token.isWord);
    const hitIndex = wordTokens.findIndex((token) => token.id === hit?.id);
    const leftTokens = wordTokens.slice(Math.max(0, hitIndex - window), hitIndex);
    const rightTokens = wordTokens.slice(hitIndex + 1, hitIndex + 1 + window);

    return {
      document: match.document,
      sentence: match.sentence,
      leftContext: leftTokens.map((token) => token.text).join(" "),
      matchText: hit?.text ?? "",
      rightContext: rightTokens.map((token) => token.text).join(" "),
    };
  });
}

export function countTerms(options: CountTermsOptions): CorpusTermCount[] {
  return Array.from(buildTermCounts(filterDocuments(options.index.documents, options)).values()).sort(
      (left, right) =>
        right.count - left.count ||
        right.documentCount - left.documentCount ||
        left.term.localeCompare(right.term),
    );
}

export function listDocumentsByLanguage(
  language: string,
  options: ListDocumentsByLanguageOptions,
): TextDocument[] {
  const target = normalizeLanguageTag(language);

  if (!target) {
    return [];
  }

  return options.index.documents.filter((document) => document.language === target);
}

function searchSingleTerm(documents: TextDocument[], term: string): CorpusMatch[] {
  const matches: CorpusMatch[] = [];

  for (const document of documents) {
    for (const sentence of document.sentences) {
      for (const token of sentence.tokens) {
        if (!token.isWord || token.normalized !== term) {
          continue;
        }

        matches.push({
          document,
          sentence,
          tokens: [token],
          matchedTerms: [term],
          matchedText: token.text,
        });
      }
    }
  }

  return matches;
}

function searchPhrase(documents: TextDocument[], queryTerms: string[]): CorpusMatch[] {
  const matches: CorpusMatch[] = [];

  for (const document of documents) {
    for (const sentence of document.sentences) {
      const wordTokens = sentence.tokens.filter((token) => token.isWord);

      for (let start = 0; start <= wordTokens.length - queryTerms.length; start += 1) {
        const slice = wordTokens.slice(start, start + queryTerms.length);

        if (!slice.every((token, index) => token.normalized === queryTerms[index])) {
          continue;
        }

        matches.push({
          document,
          sentence,
          tokens: slice,
          matchedTerms: queryTerms,
          matchedText: sliceDocumentText(document, {
            start: slice[0]?.range.start ?? 0,
            end: slice.at(-1)?.range.end ?? 0,
          }),
        });
      }
    }
  }

  return matches;
}

function filterDocuments(
  documents: TextDocument[],
  options: Pick<CorpusQueryOptions, "language" | "metadata">,
): TextDocument[] {
  const language = normalizeLanguageTag(options.language);

  return documents.filter((document) => {
    if (language && document.language !== language) {
      return false;
    }

    if (!options.metadata) {
      return true;
    }

    return Object.entries(options.metadata).every(
      ([key, value]) => document.metadata?.[key] === value,
    );
  });
}

function buildTermCounts(documents: TextDocument[]): Map<string, CorpusTermCount> {
  const counts = new Map<string, CorpusTermCount>();
  const documentTerms = new Map<string, Set<string>>();

  for (const document of documents) {
    const seen = new Set<string>();
    documentTerms.set(document.id, seen);

    for (const token of document.tokens) {
      if (!token.isWord) {
        continue;
      }

      const existing = counts.get(token.normalized);

      if (existing) {
        existing.count += 1;
      } else {
        counts.set(token.normalized, {
          term: token.normalized,
          count: 1,
          documentCount: 0,
        });
      }

      seen.add(token.normalized);
    }
  }

  for (const seenTerms of documentTerms.values()) {
    for (const term of seenTerms) {
      const existing = counts.get(term);

      if (existing) {
        existing.documentCount += 1;
      }
    }
  }

  return counts;
}

function tokenizeQuery(query: string): string[] {
  return createTextDocument({
    id: "query",
    text: query,
  }).tokens
    .filter((token) => token.isWord)
    .map((token) => token.normalized);
}

function copyDocumentReference(document: TextDocument) {
  return {
    ...document,
    metadata: document.metadata ? { ...document.metadata } : undefined,
  };
}

function normalizeLimit(limit: number | undefined) {
  return Math.max(1, Math.floor(limit ?? Number.POSITIVE_INFINITY));
}
