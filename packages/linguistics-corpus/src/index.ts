import {
  normalizeText,
  segmentTextDocument,
  type LanguageTag,
  type TextDocument,
  type TextToken,
} from "@moritzbrantner/linguistics-core";

export interface CorpusSearchOptions {
  fields?: string[];
  languages?: ReadonlyArray<LanguageTag>;
  metadataFilters?: Record<
    string,
    string | number | boolean | null | ReadonlyArray<string | number | boolean | null>
  >;
  limit?: number;
}

export interface ConcordanceOptions {
  documentIds?: ReadonlyArray<string>;
  windowTokens?: number;
}

export interface TermFrequencyOptions {
  byLanguage?: boolean;
  minCount?: number;
}

export interface CorpusSearchResult {
  documentId: string;
  document: TextDocument;
  score: number;
  matches: number;
  fields: string[];
  snippet: string;
}

export interface ConcordanceEntry {
  documentId: string;
  sentenceId: string;
  keyword: string;
  leftContext: string;
  rightContext: string;
}

export interface TermFrequencyEntry {
  term: string;
  count: number;
  language?: LanguageTag;
}

export interface CorpusIndex {
  documents: TextDocument[];
  searchCorpus(query: string, options?: CorpusSearchOptions): CorpusSearchResult[];
  concordance(term: string, options?: ConcordanceOptions): ConcordanceEntry[];
  termFrequencies(options?: TermFrequencyOptions): TermFrequencyEntry[];
}

interface IndexedDocument {
  document: TextDocument;
  metadataFields: Map<string, string>;
  normalizedText: string;
  tokenTexts: string[];
  tokenNormals: string[];
  wordTokens: TextToken[];
}

const DEFAULT_CONCORDANCE_WINDOW = 5;
const DEFAULT_LIMIT = 10;
const TERM_PATTERN = /\p{L}[\p{L}\p{M}\p{N}'’-]*|\p{N}+/gu;

export function createCorpusIndex(documents: Iterable<TextDocument>): CorpusIndex {
  const entries = Array.from(documents, (document) => indexDocument(document));

  return {
    documents: entries.map((entry) => entry.document),
    searchCorpus(query, options) {
      return searchCorpus(entries, query, options);
    },
    concordance(term, options) {
      return concordance(entries, term, options);
    },
    termFrequencies(options) {
      return termFrequencies(entries, options);
    },
  };
}

export function searchCorpus(
  source: CorpusIndex | Iterable<TextDocument> | IndexedDocument[],
  query: string,
  options: CorpusSearchOptions = {},
): CorpusSearchResult[] {
  const entries = resolveEntries(source);
  const queryTerms = extractTerms(query);

  if (queryTerms.length === 0) {
    return [];
  }

  const matches = entries
    .filter((entry) => matchesLanguage(entry.document, options.languages))
    .filter((entry) => matchesMetadata(entry.document.metadata, options.metadataFilters))
    .map((entry) => scoreDocument(entry, queryTerms, options.fields))
    .filter((result): result is CorpusSearchResult => result !== null)
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.matches - left.matches ||
        left.documentId.localeCompare(right.documentId),
    );

  return matches.slice(0, clampLimit(options.limit ?? DEFAULT_LIMIT));
}

export function concordance(
  source: CorpusIndex | Iterable<TextDocument> | IndexedDocument[],
  term: string,
  options: ConcordanceOptions = {},
): ConcordanceEntry[] {
  const entries = resolveEntries(source);
  const normalizedTerm = normalizeTerm(term);
  const allowedIds = options.documentIds ? new Set(options.documentIds) : undefined;
  const windowTokens = Math.max(1, Math.floor(options.windowTokens ?? DEFAULT_CONCORDANCE_WINDOW));

  if (!normalizedTerm) {
    return [];
  }

  const results: ConcordanceEntry[] = [];

  for (const entry of entries) {
    if (allowedIds && !allowedIds.has(entry.document.id)) {
      continue;
    }

    const bySentence = new Map<string, typeof entry.wordTokens>();

    for (const token of entry.wordTokens) {
      const sentenceTokens = bySentence.get(token.sentenceId);

      if (sentenceTokens) {
        sentenceTokens.push(token);
        continue;
      }

      bySentence.set(token.sentenceId, [token]);
    }

    for (const sentenceTokens of bySentence.values()) {
      const wordTokens = sentenceTokens.filter((token) => token.isWordLike);

      for (let index = 0; index < wordTokens.length; index += 1) {
        const token = wordTokens[index];

        if (token.normalized !== normalizedTerm) {
          continue;
        }

        results.push({
          documentId: entry.document.id,
          sentenceId: token.sentenceId,
          keyword: token.text,
          leftContext: wordTokens
            .slice(Math.max(0, index - windowTokens), index)
            .map((word) => word.text)
            .join(" "),
          rightContext: wordTokens
            .slice(index + 1, index + 1 + windowTokens)
            .map((word) => word.text)
            .join(" "),
        });
      }
    }
  }

  return results.sort(
    (left, right) =>
      left.documentId.localeCompare(right.documentId) ||
      left.sentenceId.localeCompare(right.sentenceId) ||
      left.leftContext.localeCompare(right.leftContext),
  );
}

export function termFrequencies(
  source: CorpusIndex | Iterable<TextDocument> | IndexedDocument[],
  options: TermFrequencyOptions = {},
): TermFrequencyEntry[] {
  const entries = resolveEntries(source);
  const minCount = Math.max(1, Math.floor(options.minCount ?? 1));
  const counts = new Map<string, { count: number; language?: LanguageTag; surface: Map<string, number> }>();

  for (const entry of entries) {
    for (let index = 0; index < entry.tokenNormals.length; index += 1) {
      const normalized = entry.tokenNormals[index];
      const surface = entry.tokenTexts[index];
      const languageKey = options.byLanguage ? entry.document.language ?? "und" : "";
      const key = `${languageKey}\u0000${normalized}`;
      const next = counts.get(key) ?? {
        count: 0,
        language: options.byLanguage ? entry.document.language ?? "und" : undefined,
        surface: new Map<string, number>(),
      };

      next.count += 1;
      next.surface.set(surface, (next.surface.get(surface) ?? 0) + 1);
      counts.set(key, next);
    }
  }

  return Array.from(counts.entries())
    .filter(([, value]) => value.count >= minCount)
    .map(([key, value]) => {
      const [, normalized] = key.split("\u0000");

      return {
        term: resolveSurfaceForm(normalized, value.surface),
        count: value.count,
        language: value.language,
      } satisfies TermFrequencyEntry;
    })
    .sort(
      (left, right) =>
        right.count - left.count ||
        (left.language ?? "").localeCompare(right.language ?? "") ||
        left.term.localeCompare(right.term),
    );
}

function resolveEntries(
  source: CorpusIndex | Iterable<TextDocument> | IndexedDocument[],
): IndexedDocument[] {
  if (
    Array.isArray(source) &&
    source.every((entry) => typeof entry === "object" && entry !== null && "metadataFields" in entry)
  ) {
    return source;
  }

  if (!Array.isArray(source) && "searchCorpus" in source && "documents" in source) {
    return source.documents.map((document) => indexDocument(document));
  }

  return Array.from(source as Iterable<TextDocument>, (document) => indexDocument(document));
}

function indexDocument(document: TextDocument): IndexedDocument {
  const segmented = segmentDocument(document);
  const wordTokens = segmented.tokens;

  return {
    document: segmented.document,
    metadataFields: collectMetadataFields(segmented.document.metadata),
    normalizedText: normalizeTerm(segmented.document.text),
    tokenTexts: wordTokens.filter((token) => token.isWordLike).map((token) => token.text),
    tokenNormals: wordTokens.filter((token) => token.isWordLike).map((token) => token.normalized),
    wordTokens,
  };
}

function segmentDocument(document: TextDocument) {
  const segmented =
    document.tokens.length > 0
      ? document
      : segmentTextDocument(document, {
          granularity: "word",
          useIntlSegmenter: false,
        });

  return {
    document: segmented,
    tokens: segmented.tokens,
  };
}

function collectMetadataFields(
  metadata: Record<string, unknown> | undefined,
): Map<string, string> {
  const fields = new Map<string, string>();

  if (!metadata) {
    return fields;
  }

  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      fields.set(key, String(value));
      continue;
    }

    if (Array.isArray(value)) {
      fields.set(
        key,
        value
          .filter((entry) =>
            typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean",
          )
          .join(" "),
      );
    }
  }

  return fields;
}

function scoreDocument(
  entry: IndexedDocument,
  queryTerms: string[],
  fields: string[] | undefined,
): CorpusSearchResult | null {
  const searchFields = resolveFields(entry, fields);
  let score = 0;
  let matches = 0;
  const matchedFields = new Set<string>();
  let firstMatchIndex = -1;

  for (const term of queryTerms) {
    for (const [fieldName, value] of searchFields) {
      const normalizedValue = normalizeTerm(value);
      const count = countOccurrences(normalizedValue, term);

      if (count === 0) {
        continue;
      }

      score += count * (fieldName === "text" ? 4 : 2);
      matches += count;
      matchedFields.add(fieldName);

      if (fieldName === "text" && firstMatchIndex === -1) {
        firstMatchIndex = normalizedValue.indexOf(term);
      }
    }
  }

  if (score === 0) {
    return null;
  }

  return {
    documentId: entry.document.id,
    document: entry.document,
    score,
    matches,
    fields: Array.from(matchedFields).sort(),
    snippet: createSnippet(entry.document.text, firstMatchIndex),
  };
}

function resolveFields(
  entry: IndexedDocument,
  requestedFields: string[] | undefined,
): Array<[string, string]> {
  if (!requestedFields || requestedFields.length === 0) {
    return [["text", entry.document.text]];
  }

  const fields: Array<[string, string]> = [];

  for (const field of requestedFields) {
    if (field === "text") {
      fields.push(["text", entry.document.text]);
      continue;
    }

    const metadataKey = field.startsWith("metadata.") ? field.slice("metadata.".length) : field;
    const value = entry.metadataFields.get(metadataKey);

    if (value !== undefined) {
      fields.push([metadataKey, value]);
    }
  }

  return fields;
}

function matchesLanguage(
  document: TextDocument,
  languages: ReadonlyArray<LanguageTag> | undefined,
): boolean {
  return !languages || languages.length === 0 || languages.includes(document.language ?? "und");
}

function matchesMetadata(
  metadata: Record<string, unknown> | undefined,
  filters: CorpusSearchOptions["metadataFilters"],
): boolean {
  if (!filters) {
    return true;
  }

  for (const [key, expected] of Object.entries(filters)) {
    const actual = metadata?.[key] ?? null;

    if (Array.isArray(expected)) {
      if (!expected.includes(actual as never)) {
        return false;
      }

      continue;
    }

    if (actual !== expected) {
      return false;
    }
  }

  return true;
}

function extractTerms(value: string): string[] {
  return Array.from(value.matchAll(TERM_PATTERN), (match) => normalizeTerm(match[0])).filter(Boolean);
}

function normalizeTerm(value: string): string {
  return normalizeText(value, {
    form: "NFKC",
    lowercase: true,
    stripDiacritics: true,
  });
}

function countOccurrences(value: string, search: string): number {
  if (!search) {
    return 0;
  }

  let count = 0;
  let index = value.indexOf(search);

  while (index !== -1) {
    count += 1;
    index = value.indexOf(search, index + search.length);
  }

  return count;
}

function createSnippet(text: string, matchIndex: number): string {
  if (matchIndex < 0) {
    return text.slice(0, 80).trim();
  }

  const start = Math.max(0, matchIndex - 24);
  const end = Math.min(text.length, matchIndex + 56);
  return text.slice(start, end).trim();
}

function resolveSurfaceForm(normalized: string, surfaces: Map<string, number>): string {
  let best = normalized;
  let bestCount = -1;

  for (const [surface, count] of surfaces) {
    if (count > bestCount || (count === bestCount && surface.localeCompare(best) < 0)) {
      best = surface;
      bestCount = count;
    }
  }

  return best;
}

function clampLimit(limit: number): number {
  return !Number.isFinite(limit) || limit < 1 ? 1 : Math.floor(limit);
}
