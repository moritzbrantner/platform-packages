import {
  createTextDocument,
  normalizeText,
  normalizeToken,
  type TextDocument,
} from "@moritzbrantner/linguistics-core";

import { DEFAULT_WORD_PREDICTION_TEXTS } from "./default-data";

const CONTEXT_SEPARATOR = "\u0001";
const DEFAULT_LIMIT = 5;
const UNIGRAM_WEIGHT = 0.35;
const RECENCY_WEIGHT = 0.05;

export interface CreateWordPredictionModelOptions {
  texts?: Iterable<string> | string;
  documents?: Iterable<TextDocument>;
  includeDefaultData?: boolean;
  lowercase?: boolean;
  maxContextSize?: number;
}

export interface PredictWordOptions {
  limit?: number;
  minScore?: number;
}

export interface WordPrediction {
  word: string;
  score: number;
  matches: number;
  contextSize: number;
}

export interface WordPredictionModel {
  readonly vocabularySize: number;
  readonly maxContextSize: number;
  readonly tokenCount: number;
  train(texts: Iterable<string> | string): WordPredictionModel;
  predictForInput(input: string, options?: PredictWordOptions): WordPrediction[];
  predictNextWords(context: string, options?: PredictWordOptions): WordPrediction[];
}

interface ModelOptions {
  lowercase: boolean;
  maxContextSize: number;
}

interface CandidateScore {
  contextSize: number;
  matches: number;
  score: number;
  word: string;
}

interface TrainingData {
  surfaceForms: Map<string, Map<string, number>>;
  unigramCounts: Map<string, number>;
  lastSeenAt: Map<string, number>;
  nextWordCountsByContextSize: Map<number, Map<string, Map<string, number>>>;
  totalByContextSize: Map<number, Map<string, number>>;
  maxContextSize: number;
  tokenCount: number;
}

export function createWordPredictionModel(
  options: CreateWordPredictionModelOptions = {},
): WordPredictionModel {
  const modelOptions = normalizeModelOptions(options);
  const trainingData = createTrainingData();

  if (options.includeDefaultData) {
    trainTexts(trainingData, DEFAULT_WORD_PREDICTION_TEXTS, modelOptions);
  }

  trainTexts(trainingData, options.texts, modelOptions);
  trainDocuments(trainingData, options.documents, modelOptions);

  const model: WordPredictionModel = {
    get vocabularySize() {
      return trainingData.unigramCounts.size;
    },
    get maxContextSize() {
      return modelOptions.maxContextSize;
    },
    get tokenCount() {
      return trainingData.tokenCount;
    },
    train(texts) {
      trainTexts(trainingData, texts, modelOptions);
      return model;
    },
    predictForInput(input, predictOptions) {
      const { contextTokens, prefix } = parseInput(input, modelOptions);
      return predictWords(trainingData, contextTokens, prefix, predictOptions);
    },
    predictNextWords(context, predictOptions) {
      return predictWords(trainingData, extractWords(context, modelOptions), "", predictOptions);
    },
  };

  return model;
}

export function trainWordPredictionModel(
  texts: Iterable<string> | string,
  options: Omit<CreateWordPredictionModelOptions, "texts"> = {},
): WordPredictionModel {
  return createWordPredictionModel({ ...options, texts });
}

export function createDefaultWordPredictionModel(
  options: Omit<CreateWordPredictionModelOptions, "includeDefaultData"> = {},
): WordPredictionModel {
  return createWordPredictionModel({
    ...options,
    includeDefaultData: true,
  });
}

function normalizeModelOptions(options: CreateWordPredictionModelOptions): ModelOptions {
  return {
    lowercase: options.lowercase ?? true,
    maxContextSize: clampContextSize(options.maxContextSize ?? 3),
  };
}

function clampContextSize(value: number): number {
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function createTrainingData(): TrainingData {
  return {
    surfaceForms: new Map(),
    unigramCounts: new Map(),
    lastSeenAt: new Map(),
    nextWordCountsByContextSize: new Map(),
    totalByContextSize: new Map(),
    maxContextSize: 1,
    tokenCount: 0,
  };
}

function* iterateTexts(
  texts: Iterable<string> | string | undefined,
): Generator<string, void, undefined> {
  if (typeof texts === "string") {
    yield texts;
    return;
  }

  if (!texts) {
    return;
  }

  yield* texts;
}

function trainTexts(
  trainingData: TrainingData,
  texts: Iterable<string> | string | undefined,
  options: ModelOptions,
): void {
  for (const text of iterateTexts(texts)) {
    trainDocument(trainingData, createPredictionDocument(text, options), options);
  }
}

function trainDocuments(
  trainingData: TrainingData,
  documents: Iterable<TextDocument> | undefined,
  options: ModelOptions,
): void {
  if (!documents) {
    return;
  }

  for (const document of documents) {
    trainDocument(trainingData, document, options);
  }
}

function trainDocument(
  trainingData: TrainingData,
  document: TextDocument,
  options: ModelOptions,
): void {
  trainingData.maxContextSize = options.maxContextSize;

  for (const sentence of document.sentences) {
    const context: string[] = [];

    for (const token of sentence.tokens) {
      if (!token.isWord) {
        continue;
      }

      const normalized = normalizePredictionToken(token.text, options);
      trainingData.tokenCount += 1;
      incrementCount(trainingData.unigramCounts, normalized);
      trainingData.lastSeenAt.set(normalized, trainingData.tokenCount);
      rememberSurfaceForm(trainingData.surfaceForms, normalized, token.text);

      const maxContextSize = Math.min(context.length, options.maxContextSize);

      for (let size = 1; size <= maxContextSize; size += 1) {
        const contextTokens = context.slice(-size);
        const contextKey = buildContextKey(contextTokens);
        incrementNestedCount(trainingData.nextWordCountsByContextSize, size, contextKey, normalized);
        incrementNestedTotal(trainingData.totalByContextSize, size, contextKey);
      }

      context.push(normalized);

      if (context.length > options.maxContextSize) {
        context.shift();
      }
    }
  }
}

function extractWords(text: string, options: ModelOptions): string[] {
  return createPredictionDocument(text, options).tokens
    .filter((token) => token.isWord)
    .map((token) => normalizePredictionToken(token.text, options));
}

function parseInput(
  input: string,
  options: ModelOptions,
): { contextTokens: string[]; prefix: string } {
  const document = createPredictionDocument(input, options);
  const wordTokens = document.tokens.filter((token) => token.isWord);
  const hasTrailingWhitespace = /\s$/u.test(document.text);
  const lastWord = wordTokens.at(-1);

  if (
    !lastWord ||
    hasTrailingWhitespace ||
    lastWord.range.end < document.text.length
  ) {
    return {
      contextTokens: wordTokens.map((token) => normalizePredictionToken(token.text, options)),
      prefix: "",
    };
  }

  return {
    contextTokens: wordTokens
      .slice(0, -1)
      .map((token) => normalizePredictionToken(token.text, options)),
    prefix: normalizePredictionToken(lastWord.text, options),
  };
}

function predictWords(
  trainingData: TrainingData,
  contextTokens: string[],
  prefix: string,
  options: PredictWordOptions = {},
): WordPrediction[] {
  if (trainingData.tokenCount === 0) {
    return [];
  }

  const limit = Math.max(1, Math.floor(options.limit ?? DEFAULT_LIMIT));
  const minScore = options.minScore ?? 0;
  const scores = new Map<string, CandidateScore>();
  const normalizedContext = contextTokens.slice(-trainingData.maxContextSize);

  for (let size = normalizedContext.length; size >= 1; size -= 1) {
    const contextKey = buildContextKey(normalizedContext.slice(-size));
    const candidates = trainingData.nextWordCountsByContextSize.get(size)?.get(contextKey);
    const total = trainingData.totalByContextSize.get(size)?.get(contextKey);

    if (!candidates || !total) {
      continue;
    }

    const contextWeight = (size + 1) * (size + 1);

    for (const [candidate, count] of candidates) {
      if (prefix && !candidate.startsWith(prefix)) {
        continue;
      }

      const score = (count / total) * contextWeight;
      upsertCandidate(
        scores,
        candidate,
        score,
        count,
        size,
        resolveSurfaceForm(trainingData, candidate),
      );
    }
  }

  for (const [candidate, count] of trainingData.unigramCounts) {
    if (prefix && !candidate.startsWith(prefix)) {
      continue;
    }

    const frequencyScore = (count / trainingData.tokenCount) * UNIGRAM_WEIGHT;
    const recencyScore =
      ((trainingData.lastSeenAt.get(candidate) ?? 0) / trainingData.tokenCount) * RECENCY_WEIGHT;

    upsertCandidate(
      scores,
      candidate,
      frequencyScore + recencyScore,
      count,
      0,
      resolveSurfaceForm(trainingData, candidate),
    );
  }

  return Array.from(scores.values())
    .filter((candidate) => candidate.score >= minScore)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.contextSize !== left.contextSize) {
        return right.contextSize - left.contextSize;
      }

      if (right.matches !== left.matches) {
        return right.matches - left.matches;
      }

      return left.word.localeCompare(right.word);
    })
    .slice(0, limit)
    .map((candidate) => ({
      word: candidate.word,
      score: Number(candidate.score.toFixed(6)),
      matches: candidate.matches,
      contextSize: candidate.contextSize,
    }));
}

function upsertCandidate(
  scores: Map<string, CandidateScore>,
  candidate: string,
  score: number,
  matches: number,
  contextSize: number,
  word: string,
): void {
  const existing = scores.get(candidate);

  if (!existing) {
    scores.set(candidate, { contextSize, matches, score, word });
    return;
  }

  existing.score += score;
  existing.matches += matches;
  existing.contextSize = Math.max(existing.contextSize, contextSize);
}

function resolveSurfaceForm(trainingData: TrainingData, normalizedWord: string): string {
  const forms = trainingData.surfaceForms.get(normalizedWord);

  if (!forms) {
    return normalizedWord;
  }

  let bestForm = normalizedWord;
  let bestCount = -1;

  for (const [surfaceForm, count] of forms) {
    if (count > bestCount) {
      bestForm = surfaceForm;
      bestCount = count;
    }
  }

  return bestForm;
}

function buildContextKey(tokens: string[]): string {
  return tokens.join(CONTEXT_SEPARATOR);
}

function normalizePredictionToken(word: string, options: ModelOptions): string {
  return options.lowercase ? normalizeToken(word) : normalizeText(word);
}

function createPredictionDocument(text: string, options: ModelOptions) {
  return createTextDocument({
    text,
    tokenNormalizer: (value) => normalizePredictionToken(value, options),
  });
}

function rememberSurfaceForm(
  surfaceForms: Map<string, Map<string, number>>,
  normalized: string,
  surface: string,
): void {
  let forms = surfaceForms.get(normalized);

  if (!forms) {
    forms = new Map();
    surfaceForms.set(normalized, forms);
  }

  incrementCount(forms, surface);
}

function incrementNestedCount(
  store: Map<number, Map<string, Map<string, number>>>,
  contextSize: number,
  contextKey: string,
  nextWord: string,
): void {
  let byContext = store.get(contextSize);

  if (!byContext) {
    byContext = new Map();
    store.set(contextSize, byContext);
  }

  let candidates = byContext.get(contextKey);

  if (!candidates) {
    candidates = new Map();
    byContext.set(contextKey, candidates);
  }

  incrementCount(candidates, nextWord);
}

function incrementNestedTotal(
  store: Map<number, Map<string, number>>,
  contextSize: number,
  contextKey: string,
): void {
  let byContext = store.get(contextSize);

  if (!byContext) {
    byContext = new Map();
    store.set(contextSize, byContext);
  }

  incrementCount(byContext, contextKey);
}

function incrementCount(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}
