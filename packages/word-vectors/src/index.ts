import {
  extractWordTexts,
  initLinguisticsKernel,
  isLinguisticsKernelReady,
  type TextDocument,
} from "@moritzbrantner/linguistics-core";
import type { CorpusIndex } from "@moritzbrantner/linguistics-corpus";

const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
const DEFAULT_WINDOW_SIZE = 2;
const DEFAULT_LIMIT = 5;
const DEFAULT_MIN_WORD_COUNT = 1;
const DEFAULT_MAX_VOCABULARY_SIZE = Number.POSITIVE_INFINITY;

const modelInternals = new WeakMap<
  WordVectorModel,
  { options: ModelOptions; trainingData: TrainingData }
>();

export interface CreateWordVectorModelOptions {
  texts?: Iterable<string> | string;
  lowercase?: boolean;
  windowSize?: number;
  minWordCount?: number;
  maxVocabularySize?: number;
}

export interface GetWordVectorOptions {
  limit?: number;
  minWeight?: number;
}

export interface FindSimilarWordsOptions {
  limit?: number;
  minScore?: number;
  excludeSelf?: boolean;
}

export interface WordVectorEntry {
  word: string;
  weight: number;
  count: number;
}

export interface WordMeaningVector {
  word: string;
  magnitude: number;
  dimensions: number;
  entries: WordVectorEntry[];
}

export interface WordSimilarity {
  word: string;
  score: number;
  sharedContexts: number;
}

export interface SerializableWordVectorModel {
  lowercase: boolean;
  maxVocabularySize: number;
  minWordCount: number;
  windowSize: number;
  tokenCount: number;
  totalCooccurrenceWeight: number;
  unigramCounts: Array<[string, number]>;
  cooccurrenceTotals: Array<[string, number]>;
  cooccurrenceCounts: Array<[string, Array<[string, number]>]>;
}

export interface WordVectorModel {
  readonly vocabularySize: number;
  readonly tokenCount: number;
  readonly windowSize: number;
  train(texts: Iterable<string> | string): WordVectorModel;
  hasWord(word: string): boolean;
  words(): string[];
  getVector(word: string, options?: GetWordVectorOptions): WordMeaningVector | undefined;
  similarity(leftWord: string, rightWord: string): number;
  findSimilarWords(word: string, options?: FindSimilarWordsOptions): WordSimilarity[];
  findSimilarContexts(word: string, options?: GetWordVectorOptions): WordVectorEntry[];
}

export type TrainFromCorpusSource = CorpusIndex | Pick<CorpusIndex, "documents">;

interface ModelOptions {
  lowercase: boolean;
  maxVocabularySize: number;
  minWordCount: number;
  windowSize: number;
}

interface TrainingData {
  cooccurrenceCounts: Map<string, Map<string, number>>;
  cooccurrenceTotals: Map<string, number>;
  tokenCount: number;
  totalCooccurrenceWeight: number;
  unigramCounts: Map<string, number>;
}

interface WeightedVector {
  magnitude: number;
  weights: Map<string, number>;
}

interface SimilarityScore {
  score: number;
  sharedContexts: number;
}

export function createWordVectorModel(options: CreateWordVectorModelOptions = {}): WordVectorModel {
  const modelOptions = normalizeOptions(options);
  const trainingData = createTrainingData();
  const vectorCache = new Map<string, WeightedVector>();

  trainTexts(trainingData, vectorCache, options.texts, modelOptions);
  return createModel(trainingData, vectorCache, modelOptions);
}

export async function initWordVectorsKernel(input?: unknown): Promise<void> {
  await initLinguisticsKernel(input);
}

export function isWordVectorsKernelReady(): boolean {
  return isLinguisticsKernelReady();
}

export function trainWordVectorModel(
  texts: Iterable<string> | string,
  options: Omit<CreateWordVectorModelOptions, "texts"> = {},
): WordVectorModel {
  return createWordVectorModel({ ...options, texts });
}

export function serializeWordVectorModel(model: WordVectorModel): string {
  const snapshot = getModelSnapshot(model);
  return `${JSON.stringify(snapshot, null, 2)}\n`;
}

export function deserializeWordVectorModel(
  value: string | SerializableWordVectorModel,
): WordVectorModel {
  const snapshot =
    typeof value === "string" ? (JSON.parse(value) as SerializableWordVectorModel) : value;
  const modelOptions = normalizeOptions(snapshot);
  const trainingData: TrainingData = {
    cooccurrenceCounts: new Map(
      snapshot.cooccurrenceCounts.map(([word, entries]) => [word, new Map(entries)]),
    ),
    cooccurrenceTotals: new Map(snapshot.cooccurrenceTotals),
    tokenCount: snapshot.tokenCount,
    totalCooccurrenceWeight: snapshot.totalCooccurrenceWeight,
    unigramCounts: new Map(snapshot.unigramCounts),
  };
  const vectorCache = new Map<string, WeightedVector>();

  return createModel(trainingData, vectorCache, modelOptions);
}

export function createWordVectorBackoffSource(model: WordVectorModel) {
  return (contextTokens: readonly string[]) => {
    const head = contextTokens.at(-1);

    if (!head) {
      return [];
    }

    const similarWords = model.findSimilarWords(head, {
      limit: DEFAULT_LIMIT,
      minScore: 0.05,
    });
    const similarContexts = model.findSimilarContexts(head, {
      limit: DEFAULT_LIMIT,
      minWeight: 0,
    });

    return [
      ...similarWords.map((entry) => ({ word: entry.word, score: entry.score })),
      ...similarContexts.map((entry) => ({ word: entry.word, score: entry.weight })),
    ];
  };
}

export function trainFromDocuments(
  documents: readonly TextDocument[],
  options: Omit<CreateWordVectorModelOptions, "texts"> = {},
): WordVectorModel {
  return createWordVectorModel({
    ...options,
    texts: documents.map((document) => document.text),
  });
}

export function trainFromCorpus(
  corpus: TrainFromCorpusSource,
  options: Omit<CreateWordVectorModelOptions, "texts"> = {},
): WordVectorModel {
  return trainFromDocuments(corpus.documents, options);
}

function createModel(
  trainingData: TrainingData,
  vectorCache: Map<string, WeightedVector>,
  modelOptions: ModelOptions,
): WordVectorModel {
  const model: WordVectorModel = {
    get vocabularySize() {
      return getVocabulary(trainingData, modelOptions).length;
    },
    get tokenCount() {
      return trainingData.tokenCount;
    },
    get windowSize() {
      return modelOptions.windowSize;
    },
    train(texts) {
      trainTexts(trainingData, vectorCache, texts, modelOptions);
      return model;
    },
    hasWord(word) {
      const normalized = normalizeWord(word, modelOptions);
      return getVocabularySet(trainingData, modelOptions).has(normalized);
    },
    words() {
      return getVocabulary(trainingData, modelOptions);
    },
    getVector(word, vectorOptions = {}) {
      const normalized = normalizeWord(word, modelOptions);
      const vocabulary = getVocabularySet(trainingData, modelOptions);

      if (!vocabulary.has(normalized)) {
        return undefined;
      }

      const fullVector = getWeightedVector(
        trainingData,
        vectorCache,
        modelOptions,
        normalized,
        vocabulary,
      );
      const minWeight = vectorOptions.minWeight ?? 0;
      const entries = Array.from(fullVector.weights.entries())
        .map(([contextWord, weight]) => ({
          word: contextWord,
          weight,
          count: trainingData.cooccurrenceCounts.get(normalized)?.get(contextWord) ?? 0,
        }))
        .filter((entry) => entry.weight >= minWeight)
        .sort(compareVectorEntries);

      const limit = clampLimit(vectorOptions.limit, entries.length);

      return {
        word: normalized,
        magnitude: fullVector.magnitude,
        dimensions: vocabulary.size,
        entries: entries.slice(0, limit),
      };
    },
    similarity(leftWord, rightWord) {
      return scoreSimilarity(
        trainingData,
        vectorCache,
        modelOptions,
        normalizeWord(leftWord, modelOptions),
        normalizeWord(rightWord, modelOptions),
      ).score;
    },
    findSimilarWords(word, similarityOptions = {}) {
      const normalized = normalizeWord(word, modelOptions);
      const vocabulary = getVocabulary(trainingData, modelOptions);

      if (!vocabulary.includes(normalized)) {
        return [];
      }

      const limit = clampLimit(similarityOptions.limit, vocabulary.length);
      const minScore = similarityOptions.minScore ?? 0;
      const excludeSelf = similarityOptions.excludeSelf ?? true;
      const matches: WordSimilarity[] = [];

      for (const candidate of vocabulary) {
        if (excludeSelf && candidate === normalized) {
          continue;
        }

        const { score, sharedContexts } = scoreSimilarity(
          trainingData,
          vectorCache,
          modelOptions,
          normalized,
          candidate,
        );

        if (score < minScore || score <= 0) {
          continue;
        }

        matches.push({
          word: candidate,
          score,
          sharedContexts,
        });
      }

      matches.sort(compareSimilarWords);
      return matches.slice(0, limit);
    },
    findSimilarContexts(word, vectorOptions = {}) {
      return model.getVector(word, vectorOptions)?.entries ?? [];
    },
  };

  modelInternals.set(model, { options: modelOptions, trainingData });
  return model;
}

function getModelSnapshot(model: WordVectorModel): SerializableWordVectorModel {
  const internal = modelInternals.get(model);

  if (!internal) {
    throw new Error("Unsupported word vector model instance.");
  }

  return {
    lowercase: internal.options.lowercase,
    maxVocabularySize: internal.options.maxVocabularySize,
    minWordCount: internal.options.minWordCount,
    windowSize: internal.options.windowSize,
    tokenCount: internal.trainingData.tokenCount,
    totalCooccurrenceWeight: internal.trainingData.totalCooccurrenceWeight,
    unigramCounts: Array.from(internal.trainingData.unigramCounts.entries()),
    cooccurrenceTotals: Array.from(internal.trainingData.cooccurrenceTotals.entries()),
    cooccurrenceCounts: Array.from(
      internal.trainingData.cooccurrenceCounts.entries(),
      ([word, entries]) => [word, Array.from(entries.entries())],
    ),
  };
}

function normalizeOptions(options: CreateWordVectorModelOptions): ModelOptions {
  return {
    lowercase: options.lowercase ?? true,
    maxVocabularySize: clampMaxVocabularySize(
      options.maxVocabularySize ?? DEFAULT_MAX_VOCABULARY_SIZE,
    ),
    minWordCount: clampMinWordCount(options.minWordCount ?? DEFAULT_MIN_WORD_COUNT),
    windowSize: clampWindowSize(options.windowSize ?? DEFAULT_WINDOW_SIZE),
  };
}

function clampWindowSize(value: number): number {
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function clampMinWordCount(value: number): number {
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function clampMaxVocabularySize(value: number): number {
  if (value === Number.POSITIVE_INFINITY) {
    return value;
  }

  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function clampLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) {
    return Math.max(1, fallback || DEFAULT_LIMIT);
  }

  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function createTrainingData(): TrainingData {
  return {
    cooccurrenceCounts: new Map(),
    cooccurrenceTotals: new Map(),
    tokenCount: 0,
    totalCooccurrenceWeight: 0,
    unigramCounts: new Map(),
  };
}

function trainTexts(
  trainingData: TrainingData,
  vectorCache: Map<string, WeightedVector>,
  texts: Iterable<string> | string | undefined,
  options: ModelOptions,
): void {
  for (const text of iterateTexts(texts)) {
    trainText(trainingData, text, options);
  }

  vectorCache.clear();
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

function trainText(trainingData: TrainingData, text: string, options: ModelOptions): void {
  const tokens = extractWords(text, options);

  for (const token of tokens) {
    trainingData.tokenCount += 1;
    incrementCount(trainingData.unigramCounts, token.normalized, 1);
  }

  for (let index = 0; index < tokens.length; index += 1) {
    const currentWord = tokens[index]?.normalized;

    if (!currentWord) {
      continue;
    }

    const limit = Math.min(tokens.length - 1, index + options.windowSize);

    for (let neighborIndex = index + 1; neighborIndex <= limit; neighborIndex += 1) {
      const neighborWord = tokens[neighborIndex]?.normalized;

      if (!neighborWord) {
        continue;
      }

      const distance = neighborIndex - index;
      const weight = 1 / distance;

      incrementNestedCount(trainingData.cooccurrenceCounts, currentWord, neighborWord, weight);
      incrementNestedCount(trainingData.cooccurrenceCounts, neighborWord, currentWord, weight);
      incrementCount(trainingData.cooccurrenceTotals, currentWord, weight);
      incrementCount(trainingData.cooccurrenceTotals, neighborWord, weight);
      trainingData.totalCooccurrenceWeight += weight * 2;
    }
  }
}

function extractWords(text: string, options: ModelOptions): Array<{ normalized: string }> {
  const matches = isWordVectorsKernelReady()
    ? extractWordTexts(text, {
        lowercase: options.lowercase,
        normalizeUnicode: false,
      })
    : (text.match(WORD_PATTERN) ?? []);

  return matches.map((word) => ({
    normalized: normalizeWord(word, options),
  }));
}

function normalizeWord(word: string, options: ModelOptions): string {
  return options.lowercase ? word.toLocaleLowerCase() : word;
}

function getVocabulary(trainingData: TrainingData, options: ModelOptions): string[] {
  return Array.from(trainingData.unigramCounts.entries())
    .filter(([, count]) => count >= options.minWordCount)
    .sort((left, right) => {
      const countDelta = right[1] - left[1];

      if (countDelta !== 0) {
        return countDelta;
      }

      return left[0].localeCompare(right[0]);
    })
    .slice(0, options.maxVocabularySize)
    .map(([word]) => word);
}

function getVocabularySet(trainingData: TrainingData, options: ModelOptions): Set<string> {
  return new Set(getVocabulary(trainingData, options));
}

function getWeightedVector(
  trainingData: TrainingData,
  vectorCache: Map<string, WeightedVector>,
  options: ModelOptions,
  word: string,
  vocabulary: Set<string>,
): WeightedVector {
  const cachedVector = vectorCache.get(word);

  if (cachedVector) {
    return cachedVector;
  }

  if (!vocabulary.has(word)) {
    return { magnitude: 0, weights: new Map() };
  }

  const row = trainingData.cooccurrenceCounts.get(word);
  const wordTotal = trainingData.cooccurrenceTotals.get(word) ?? 0;
  const weights = new Map<string, number>();
  let magnitude = 0;

  if (row && wordTotal > 0 && trainingData.totalCooccurrenceWeight > 0) {
    for (const [contextWord, count] of row.entries()) {
      if (!vocabulary.has(contextWord)) {
        continue;
      }

      const contextTotal = trainingData.cooccurrenceTotals.get(contextWord) ?? 0;
      const weight = computePpmi(
        count,
        wordTotal,
        contextTotal,
        trainingData.totalCooccurrenceWeight,
      );

      if (weight <= 0) {
        continue;
      }

      weights.set(contextWord, weight);
      magnitude += weight ** 2;
    }
  }

  const weightedVector = {
    magnitude: Math.sqrt(magnitude),
    weights,
  };

  vectorCache.set(word, weightedVector);
  return weightedVector;
}

function computePpmi(
  count: number,
  wordTotal: number,
  contextTotal: number,
  totalWeight: number,
): number {
  if (count <= 0 || wordTotal <= 0 || contextTotal <= 0 || totalWeight <= 0) {
    return 0;
  }

  const value = Math.log2((count * totalWeight) / (wordTotal * contextTotal));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function scoreSimilarity(
  trainingData: TrainingData,
  vectorCache: Map<string, WeightedVector>,
  options: ModelOptions,
  leftWord: string,
  rightWord: string,
): SimilarityScore {
  const vocabulary = getVocabularySet(trainingData, options);

  if (!vocabulary.has(leftWord) || !vocabulary.has(rightWord)) {
    return { score: 0, sharedContexts: 0 };
  }

  if (leftWord === rightWord) {
    const vector = getWeightedVector(trainingData, vectorCache, options, leftWord, vocabulary);
    return {
      score: vector.magnitude > 0 ? 1 : 0,
      sharedContexts: vector.weights.size,
    };
  }

  const leftVector = getWeightedVector(trainingData, vectorCache, options, leftWord, vocabulary);
  const rightVector = getWeightedVector(trainingData, vectorCache, options, rightWord, vocabulary);

  if (leftVector.magnitude === 0 || rightVector.magnitude === 0) {
    return { score: 0, sharedContexts: 0 };
  }

  const [smallerVector, largerVector] =
    leftVector.weights.size <= rightVector.weights.size
      ? [leftVector.weights, rightVector.weights]
      : [rightVector.weights, leftVector.weights];

  let dotProduct = 0;
  let sharedContexts = 0;

  for (const [contextWord, leftWeight] of smallerVector.entries()) {
    const rightWeight = largerVector.get(contextWord);

    if (rightWeight === undefined) {
      continue;
    }

    dotProduct += leftWeight * rightWeight;
    sharedContexts += 1;
  }

  if (dotProduct === 0) {
    return { score: 0, sharedContexts };
  }

  return {
    score: dotProduct / (leftVector.magnitude * rightVector.magnitude),
    sharedContexts,
  };
}

function incrementCount(map: Map<string, number>, key: string, amount: number): void {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function incrementNestedCount(
  map: Map<string, Map<string, number>>,
  rowKey: string,
  columnKey: string,
  amount: number,
): void {
  let row = map.get(rowKey);

  if (!row) {
    row = new Map();
    map.set(rowKey, row);
  }

  row.set(columnKey, (row.get(columnKey) ?? 0) + amount);
}

function compareVectorEntries(left: WordVectorEntry, right: WordVectorEntry): number {
  const weightDelta = right.weight - left.weight;

  if (weightDelta !== 0) {
    return weightDelta;
  }

  const countDelta = right.count - left.count;

  if (countDelta !== 0) {
    return countDelta;
  }

  return left.word.localeCompare(right.word);
}

function compareSimilarWords(left: WordSimilarity, right: WordSimilarity): number {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  if (right.sharedContexts !== left.sharedContexts) {
    return right.sharedContexts - left.sharedContexts;
  }

  return left.word.localeCompare(right.word);
}
