import { DEFAULT_WORD_PREDICTION_TEXTS } from "./default-data";

const TRAINING_TOKEN_PATTERN = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*|[.!?\n]+/gu;
const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
const TRAILING_WORD_PATTERN = /([\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*)$/u;
const BOUNDARY_PATTERN = /^[.!?\n]+$/u;
const CONTEXT_SEPARATOR = "\u0001";
const DEFAULT_LIMIT = 5;
const DEFAULT_COMPLETION_TOKENS = 3;
const UNIGRAM_WEIGHT = 0.35;
const RECENCY_WEIGHT = 0.05;
const SEMANTIC_BACKOFF_WEIGHT = 0.15;

const modelInternals = new WeakMap<WordPredictionModel, { options: ModelOptions; trainingData: TrainingData }>();

export interface CreateWordPredictionModelOptions {
  texts?: Iterable<string> | string;
  includeDefaultData?: boolean;
  lowercase?: boolean;
  maxContextSize?: number;
}

export interface SemanticBackoffCandidate {
  word: string;
  score?: number;
}

export type SemanticBackoffSource = (
  contextTokens: readonly string[],
) => Iterable<string | SemanticBackoffCandidate>;

export interface PredictWordOptions {
  limit?: number;
  minScore?: number;
  fuzzyPrefixDistance?: 0 | 1;
  semanticBackoff?: SemanticBackoffSource;
}

export interface PredictCompletionOptions extends PredictWordOptions {
  maxTokens?: number;
}

export interface WordPrediction {
  word: string;
  score: number;
  matches: number;
  contextSize: number;
}

export interface WordCompletion {
  completion: string;
  words: string[];
  score: number;
}

export interface SerializableWordPredictionModel {
  lowercase: boolean;
  maxContextSize: number;
  tokenCount: number;
  surfaceForms: Array<[string, Array<[string, number]>]>;
  unigramCounts: Array<[string, number]>;
  lastSeenAt: Array<[string, number]>;
  nextWordCountsByContextSize: Array<[number, Array<[string, Array<[string, number]>]>]>;
  totalByContextSize: Array<[number, Array<[string, number]>]>;
}

export interface WordPredictionModel {
  readonly vocabularySize: number;
  readonly maxContextSize: number;
  readonly tokenCount: number;
  train(texts: Iterable<string> | string): WordPredictionModel;
  predictForInput(input: string, options?: PredictWordOptions): WordPrediction[];
  predictNextWords(context: string, options?: PredictWordOptions): WordPrediction[];
  predictCompletion(input: string, options?: PredictCompletionOptions): WordCompletion[];
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
      return predictWords(trainingData, modelOptions, contextTokens, prefix, predictOptions);
    },
    predictNextWords(context, predictOptions) {
      const contextTokens = extractWords(context, modelOptions);
      return predictWords(trainingData, modelOptions, contextTokens, "", predictOptions);
    },
    predictCompletion(input, predictOptions) {
      const { contextTokens, prefix } = parseInput(input, modelOptions);
      return predictCompletion(
        trainingData,
        modelOptions,
        contextTokens,
        prefix,
        predictOptions,
      );
    },
  };

  modelInternals.set(model, { options: modelOptions, trainingData });
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

export function serializeWordPredictionModel(model: WordPredictionModel): string {
  const snapshot = getModelSnapshot(model);

  return `${JSON.stringify(snapshot, null, 2)}\n`;
}

export function deserializeWordPredictionModel(
  value: string | SerializableWordPredictionModel,
): WordPredictionModel {
  const snapshot =
    typeof value === "string"
      ? (JSON.parse(value) as SerializableWordPredictionModel)
      : value;
  const modelOptions: ModelOptions = {
    lowercase: snapshot.lowercase,
    maxContextSize: clampContextSize(snapshot.maxContextSize),
  };
  const trainingData: TrainingData = {
    surfaceForms: new Map(
      snapshot.surfaceForms.map(([word, forms]) => [word, new Map(forms)]),
    ),
    unigramCounts: new Map(snapshot.unigramCounts),
    lastSeenAt: new Map(snapshot.lastSeenAt),
    nextWordCountsByContextSize: new Map(
      snapshot.nextWordCountsByContextSize.map(([size, contexts]) => [
        size,
        new Map(contexts.map(([context, candidates]) => [context, new Map(candidates)])),
      ]),
    ),
    totalByContextSize: new Map(
      snapshot.totalByContextSize.map(([size, contexts]) => [size, new Map(contexts)]),
    ),
    maxContextSize: snapshot.maxContextSize,
    tokenCount: snapshot.tokenCount,
  };

  return createModelFromTrainingData(trainingData, modelOptions);
}

function createModelFromTrainingData(
  trainingData: TrainingData,
  modelOptions: ModelOptions,
): WordPredictionModel {
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
      return predictWords(trainingData, modelOptions, contextTokens, prefix, predictOptions);
    },
    predictNextWords(context, predictOptions) {
      const contextTokens = extractWords(context, modelOptions);
      return predictWords(trainingData, modelOptions, contextTokens, "", predictOptions);
    },
    predictCompletion(input, predictOptions) {
      const { contextTokens, prefix } = parseInput(input, modelOptions);
      return predictCompletion(
        trainingData,
        modelOptions,
        contextTokens,
        prefix,
        predictOptions,
      );
    },
  };

  modelInternals.set(model, { options: modelOptions, trainingData });
  return model;
}

function getModelSnapshot(model: WordPredictionModel): SerializableWordPredictionModel {
  const internal = modelInternals.get(model);

  if (!internal) {
    throw new Error("Unsupported word prediction model instance.");
  }

  return {
    lowercase: internal.options.lowercase,
    maxContextSize: internal.options.maxContextSize,
    tokenCount: internal.trainingData.tokenCount,
    surfaceForms: Array.from(internal.trainingData.surfaceForms.entries(), ([word, forms]) => [
      word,
      Array.from(forms.entries()),
    ]),
    unigramCounts: Array.from(internal.trainingData.unigramCounts.entries()),
    lastSeenAt: Array.from(internal.trainingData.lastSeenAt.entries()),
    nextWordCountsByContextSize: Array.from(
      internal.trainingData.nextWordCountsByContextSize.entries(),
      ([size, contexts]) => [
        size,
        Array.from(contexts.entries(), ([context, candidates]) => [
          context,
          Array.from(candidates.entries()),
        ]),
      ],
    ),
    totalByContextSize: Array.from(
      internal.trainingData.totalByContextSize.entries(),
      ([size, contexts]) => [size, Array.from(contexts.entries())],
    ),
  };
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
    trainModel(trainingData, text, options);
  }
}

function trainModel(trainingData: TrainingData, text: string, options: ModelOptions): void {
  trainingData.maxContextSize = options.maxContextSize;
  const context: string[] = [];

  for (const token of iterateTrainingTokens(text, options)) {
    if (token.type === "boundary") {
      context.length = 0;
      continue;
    }

    trainingData.tokenCount += 1;
    incrementCount(trainingData.unigramCounts, token.normalized);
    trainingData.lastSeenAt.set(token.normalized, trainingData.tokenCount);
    rememberSurfaceForm(trainingData.surfaceForms, token.normalized, token.surface);

    const maxContextSize = Math.min(context.length, options.maxContextSize);

    for (let size = 1; size <= maxContextSize; size += 1) {
      const contextTokens = context.slice(-size);
      const contextKey = buildContextKey(contextTokens);
      incrementNestedCount(trainingData.nextWordCountsByContextSize, size, contextKey, token.normalized);
      incrementNestedTotal(trainingData.totalByContextSize, size, contextKey);
    }

    context.push(token.normalized);

    if (context.length > options.maxContextSize) {
      context.shift();
    }
  }
}

function* iterateTrainingTokens(
  text: string,
  options: ModelOptions,
): Generator<{ normalized: string; surface: string; type: "word" } | { type: "boundary" }> {
  for (const match of text.matchAll(TRAINING_TOKEN_PATTERN)) {
    const value = match[0];

    if (BOUNDARY_PATTERN.test(value)) {
      yield { type: "boundary" };
      continue;
    }

    yield {
      type: "word",
      normalized: normalizeWord(value, options),
      surface: value,
    };
  }
}

function extractWords(text: string, options: ModelOptions): string[] {
  const words = text.match(WORD_PATTERN) ?? [];
  return words.map((word) => normalizeWord(word, options));
}

function parseInput(
  input: string,
  options: ModelOptions,
): { contextTokens: string[]; prefix: string } {
  const trailingWord = input.match(TRAILING_WORD_PATTERN)?.[1] ?? "";
  const hasTrailingWhitespace = /\s$/u.test(input);

  if (!trailingWord || hasTrailingWhitespace) {
    return {
      contextTokens: extractWords(input, options),
      prefix: "",
    };
  }

  const withoutPrefix = input.slice(0, input.length - trailingWord.length);

  return {
    contextTokens: extractWords(withoutPrefix, options),
    prefix: normalizeWord(trailingWord, options),
  };
}

function predictWords(
  trainingData: TrainingData,
  modelOptions: ModelOptions,
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
      if (!matchesPrefix(candidate, prefix, options.fuzzyPrefixDistance ?? 0)) {
        continue;
      }

      const score = (count / total) * contextWeight;
      upsertCandidate(scores, candidate, score, count, size, resolveSurfaceForm(trainingData, candidate));
    }
  }

  for (const [candidate, count] of trainingData.unigramCounts) {
    if (!matchesPrefix(candidate, prefix, options.fuzzyPrefixDistance ?? 0)) {
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

  if (options.semanticBackoff) {
    for (const suggestion of options.semanticBackoff(normalizedContext)) {
      const candidateWord = typeof suggestion === "string" ? suggestion : suggestion.word;
      const normalizedCandidate = normalizeWord(candidateWord, modelOptions);

      upsertCandidate(
        scores,
        normalizedCandidate,
        (typeof suggestion === "string" ? 1 : suggestion.score ?? 1) * SEMANTIC_BACKOFF_WEIGHT,
        0,
        0,
        candidateWord,
      );
    }
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

function predictCompletion(
  trainingData: TrainingData,
  modelOptions: ModelOptions,
  contextTokens: string[],
  prefix: string,
  options: PredictCompletionOptions = {},
): WordCompletion[] {
  const starters = predictWords(trainingData, modelOptions, contextTokens, prefix, options);
  const maxTokens = Math.max(1, Math.floor(options.maxTokens ?? DEFAULT_COMPLETION_TOKENS));

  return starters.map((starter) => {
    const words = [starter.word];
    let score = starter.score;
    let currentContext = [...contextTokens, normalizeWord(starter.word, modelOptions)];

    for (let index = 1; index < maxTokens; index += 1) {
      if (bestObservedContextSize(trainingData, currentContext) === 0) {
        break;
      }

      const next = predictWords(trainingData, modelOptions, currentContext, "", {
        ...options,
        limit: 1,
        minScore: 0,
      })[0];

      if (!next || next.contextSize === 0) {
        break;
      }

      words.push(next.word);
      score *= next.score;
      currentContext = [...currentContext, normalizeWord(next.word, modelOptions)];
    }

    return {
      completion: words.join(" "),
      words,
      score: Number(score.toFixed(6)),
    };
  });
}

function bestObservedContextSize(trainingData: TrainingData, contextTokens: string[]): number {
  const normalizedContext = contextTokens.slice(-trainingData.maxContextSize);

  for (let size = normalizedContext.length; size >= 1; size -= 1) {
    const contextKey = buildContextKey(normalizedContext.slice(-size));

    if (trainingData.nextWordCountsByContextSize.get(size)?.has(contextKey)) {
      return size;
    }
  }

  return 0;
}

function matchesPrefix(candidate: string, prefix: string, distance: 0 | 1): boolean {
  if (!prefix) {
    return true;
  }

  if (candidate.startsWith(prefix)) {
    return true;
  }

  if (distance === 0) {
    return false;
  }

  const slice = candidate.slice(0, prefix.length + 1);
  return editDistanceAtMostOne(slice, prefix);
}

function editDistanceAtMostOne(left: string, right: string): boolean {
  const lengthDelta = Math.abs(left.length - right.length);

  if (lengthDelta > 1) {
    return false;
  }

  let indexLeft = 0;
  let indexRight = 0;
  let edits = 0;

  while (indexLeft < left.length && indexRight < right.length) {
    if (left[indexLeft] === right[indexRight]) {
      indexLeft += 1;
      indexRight += 1;
      continue;
    }

    edits += 1;

    if (edits > 1) {
      return false;
    }

    if (left.length > right.length) {
      indexLeft += 1;
    } else if (left.length < right.length) {
      indexRight += 1;
    } else {
      indexLeft += 1;
      indexRight += 1;
    }
  }

  if (indexLeft < left.length || indexRight < right.length) {
    edits += 1;
  }

  return edits <= 1;
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

function normalizeWord(word: string, options: ModelOptions): string {
  return options.lowercase ? word.toLocaleLowerCase() : word;
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
