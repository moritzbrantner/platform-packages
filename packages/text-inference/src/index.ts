import {
  createTextDocument,
  segmentTextDocument,
  type LanguageTag,
  type TextDocument,
  type TextParagraph,
  type TextSentence,
} from "@moritzbrantner/linguistics-core";

const DEFAULT_HUGGING_FACE_BASE_URL = "https://router.huggingface.co/hf-inference/models";
const DEFAULT_CHUNK_SIZE = 1_200;
const DEFAULT_CHUNK_OVERLAP = 120;

export type HuggingFaceTextTask =
  | "feature-extraction"
  | "question-answering"
  | "summarization"
  | "text-classification"
  | "token-classification";

export interface HuggingFaceModelReference<Task extends HuggingFaceTextTask = HuggingFaceTextTask> {
  task: Task;
  model: string;
  endpoint?: string;
  provider?: "hf-inference" | string;
  parameters?: Record<string, unknown>;
}

export type TextInferenceInput<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> = string | TextDocument<Metadata>;

export interface EnsureTextDocumentOptions<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  id?: string;
  language?: LanguageTag;
  metadata?: Metadata;
  useIntlSegmenter?: boolean;
}

export interface TextChunk<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  index: number;
  text: string;
  start: number;
  end: number;
  language?: LanguageTag;
  documentId: string;
  metadata?: Metadata;
}

export interface ChunkTextOptions<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> extends EnsureTextDocumentOptions<Metadata> {
  strategy?: "character" | "paragraph" | "sentence";
  maxCharacters?: number;
  overlapCharacters?: number;
}

export interface ScoredLabel {
  label: string;
  score: number;
}

export interface TextClassificationRequest {
  model: HuggingFaceModelReference<"text-classification">;
  input: string;
  parameters?: Record<string, unknown>;
  signal?: AbortSignal;
}

export interface TextClassificationResult {
  model: string;
  labels: ScoredLabel[];
  raw: unknown;
}

export interface TokenClassificationRequest {
  model: HuggingFaceModelReference<"token-classification">;
  input: string;
  parameters?: Record<string, unknown>;
  signal?: AbortSignal;
}

export interface TokenClassificationSpan {
  text: string;
  label: string;
  score: number;
  start?: number;
  end?: number;
}

export interface TokenClassificationResult {
  model: string;
  entities: TokenClassificationSpan[];
  raw: unknown;
}

export interface FeatureExtractionRequest {
  model: HuggingFaceModelReference<"feature-extraction">;
  input: string;
  parameters?: Record<string, unknown>;
  signal?: AbortSignal;
}

export type FeatureExtractionValue = number | FeatureExtractionValue[];

export interface FeatureExtractionResult {
  model: string;
  value: FeatureExtractionValue[];
  vector: number[];
  raw: unknown;
}

export interface QuestionAnsweringRequest {
  model: HuggingFaceModelReference<"question-answering">;
  question: string;
  context: string;
  parameters?: Record<string, unknown>;
  signal?: AbortSignal;
}

export interface QuestionAnsweringResult {
  model: string;
  answer: string;
  score: number;
  start?: number;
  end?: number;
  raw: unknown;
}

export interface SummarizationRequest {
  model: HuggingFaceModelReference<"summarization">;
  input: string;
  parameters?: Record<string, unknown>;
  signal?: AbortSignal;
}

export interface SummarizationResult {
  model: string;
  summary: string;
  raw: unknown;
}

export interface TextClassificationProvider {
  id: string;
  classifyText(request: TextClassificationRequest): Promise<TextClassificationResult>;
}

export interface TokenClassificationProvider {
  id: string;
  classifyTokens(request: TokenClassificationRequest): Promise<TokenClassificationResult>;
}

export interface FeatureExtractionProvider {
  id: string;
  extractFeatures(request: FeatureExtractionRequest): Promise<FeatureExtractionResult>;
}

export interface QuestionAnsweringProvider {
  id: string;
  answerQuestion(request: QuestionAnsweringRequest): Promise<QuestionAnsweringResult>;
}

export interface SummarizationProvider {
  id: string;
  summarize(request: SummarizationRequest): Promise<SummarizationResult>;
}

export interface CreateHuggingFaceTextInferenceProviderOptions {
  apiKey?: string;
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  fetch?: typeof globalThis.fetch;
}

export interface HuggingFaceTextInferenceProvider
  extends FeatureExtractionProvider,
    QuestionAnsweringProvider,
    SummarizationProvider,
    TextClassificationProvider,
    TokenClassificationProvider {}

interface ChunkCandidate {
  start: number;
  end: number;
  text: string;
}

interface HuggingFaceRequestOptions {
  model: HuggingFaceModelReference;
  payload: Record<string, unknown>;
  signal?: AbortSignal;
}

export function ensureTextDocument<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(
  input: TextInferenceInput<Metadata>,
  options: EnsureTextDocumentOptions<Metadata> = {},
): TextDocument<Metadata> {
  if (typeof input !== "string") {
    return input;
  }

  return segmentTextDocument(
    createTextDocument({
      id: options.id,
      text: input,
      language: options.language,
      metadata: options.metadata,
    }),
    {
      granularity: "word",
      useIntlSegmenter: options.useIntlSegmenter,
    },
  );
}

export function chunkTextForInference<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(
  input: TextInferenceInput<Metadata>,
  options: ChunkTextOptions<Metadata> = {},
): TextChunk<Metadata>[] {
  const strategy = options.strategy ?? "sentence";
  const maxCharacters = Math.max(1, Math.floor(options.maxCharacters ?? DEFAULT_CHUNK_SIZE));
  const defaultOverlap = strategy === "character" ? DEFAULT_CHUNK_OVERLAP : 0;
  const overlapCharacters = Math.max(
    0,
    Math.floor(Math.min(options.overlapCharacters ?? defaultOverlap, maxCharacters - 1)),
  );
  const document = ensureTextDocument(input, options);
  const candidates =
    strategy === "character"
      ? createCharacterChunks(document.text, maxCharacters, overlapCharacters)
      : collectSegmentChunks(document, strategy, maxCharacters, overlapCharacters);

  return candidates.map((chunk, index) => ({
    id: `${document.id}-chunk-${index}`,
    index,
    text: chunk.text,
    start: chunk.start,
    end: chunk.end,
    language: document.language,
    documentId: document.id,
    metadata: document.metadata,
  }));
}

export function mergeScoredLabels(labelGroups: Iterable<ReadonlyArray<ScoredLabel>>): ScoredLabel[] {
  const counts = new Map<string, { total: number; count: number; max: number }>();

  for (const group of labelGroups) {
    for (const label of group) {
      const next = counts.get(label.label) ?? { total: 0, count: 0, max: 0 };
      next.total += label.score;
      next.count += 1;
      next.max = Math.max(next.max, label.score);
      counts.set(label.label, next);
    }
  }

  return Array.from(counts.entries())
    .map(([label, value]) => ({
      label,
      score: value.total / value.count,
      maxScore: value.max,
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.maxScore - left.maxScore ||
        left.label.localeCompare(right.label),
    )
    .map(({ label, score }) => ({ label, score }));
}

export function collapseFeatureVector(value: FeatureExtractionValue | FeatureExtractionValue[]): number[] {
  const vectors = collectFeatureVectors(value);

  if (vectors.length === 0) {
    return [];
  }

  return averageFeatureVectors(vectors);
}

export function averageFeatureVectors(vectors: Iterable<ReadonlyArray<number>>): number[] {
  const list = Array.from(vectors, (vector) => Array.from(vector));

  if (list.length === 0) {
    return [];
  }

  const width = Math.max(...list.map((vector) => vector.length));
  const sums = new Array<number>(width).fill(0);
  const counts = new Array<number>(width).fill(0);

  for (const vector of list) {
    for (let index = 0; index < vector.length; index += 1) {
      sums[index] += vector[index] ?? 0;
      counts[index] += 1;
    }
  }

  return sums.map((sum, index) => (counts[index] > 0 ? sum / counts[index] : 0));
}

export function createHuggingFaceTextInferenceProvider(
  options: CreateHuggingFaceTextInferenceProviderOptions = {},
): HuggingFaceTextInferenceProvider {
  const fetchImpl = options.fetch ?? globalThis.fetch;

  if (!fetchImpl) {
    throw new Error("A fetch implementation is required to create a Hugging Face provider.");
  }

  async function post({ model, payload, signal }: HuggingFaceRequestOptions): Promise<unknown> {
    const endpoint = resolveHuggingFaceEndpoint(model, options.baseUrl);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.defaultHeaders,
    };

    if (options.apiKey) {
      headers.Authorization = `Bearer ${options.apiKey}`;
    }

    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal,
    });
    const rawText = await response.text();
    const parsed = rawText.length > 0 ? safeParseJson(rawText) : null;

    if (!response.ok) {
      throw new Error(
        `Hugging Face inference request failed (${response.status} ${response.statusText}): ${rawText}`,
      );
    }

    return parsed;
  }

  return {
    id: "huggingface",
    async classifyText(request) {
      const raw = await post({
        model: request.model,
        payload: {
          inputs: request.input,
          parameters: {
            ...request.model.parameters,
            ...request.parameters,
          },
        },
        signal: request.signal,
      });

      return {
        model: request.model.model,
        labels: normalizeClassificationOutput(raw),
        raw,
      };
    },
    async classifyTokens(request) {
      const raw = await post({
        model: request.model,
        payload: {
          inputs: request.input,
          parameters: {
            ...request.model.parameters,
            ...request.parameters,
          },
        },
        signal: request.signal,
      });

      return {
        model: request.model.model,
        entities: normalizeTokenClassificationOutput(raw),
        raw,
      };
    },
    async extractFeatures(request) {
      const raw = await post({
        model: request.model,
        payload: {
          inputs: request.input,
          parameters: {
            ...request.model.parameters,
            ...request.parameters,
          },
        },
        signal: request.signal,
      });

      const value = normalizeFeatureExtractionOutput(raw);

      return {
        model: request.model.model,
        value,
        vector: collapseFeatureVector(value),
        raw,
      };
    },
    async answerQuestion(request) {
      const raw = await post({
        model: request.model,
        payload: {
          inputs: {
            question: request.question,
            context: request.context,
          },
          parameters: {
            ...request.model.parameters,
            ...request.parameters,
          },
        },
        signal: request.signal,
      });
      const answer = normalizeQuestionAnsweringOutput(raw);

      return {
        model: request.model.model,
        answer: answer.answer,
        score: answer.score,
        start: answer.start,
        end: answer.end,
        raw,
      };
    },
    async summarize(request) {
      const raw = await post({
        model: request.model,
        payload: {
          inputs: request.input,
          parameters: {
            ...request.model.parameters,
            ...request.parameters,
          },
        },
        signal: request.signal,
      });

      return {
        model: request.model.model,
        summary: normalizeSummarizationOutput(raw),
        raw,
      };
    },
  };
}

function collectSegmentChunks(
  document: TextDocument,
  strategy: "paragraph" | "sentence",
  maxCharacters: number,
  overlapCharacters: number,
): ChunkCandidate[] {
  const items = strategy === "paragraph" ? document.paragraphs : document.sentences;

  if (items.length === 0) {
    return createCharacterChunks(document.text, maxCharacters, overlapCharacters);
  }

  const chunks: ChunkCandidate[] = [];
  let currentStart = -1;
  let currentEnd = -1;

  for (const item of items) {
    if (item.text.length > maxCharacters) {
      flushCurrentChunk(document, chunks, currentStart, currentEnd);
      currentStart = -1;
      currentEnd = -1;
      chunks.push(...splitOversizedSegment(item, maxCharacters, overlapCharacters));
      continue;
    }

    if (currentStart < 0) {
      currentStart = item.span.start;
      currentEnd = item.span.end;
      continue;
    }

    const nextStart = Math.max(0, currentStart);
    const nextEnd = item.span.end;
    const nextText = document.text.slice(nextStart, nextEnd);

    if (nextText.length <= maxCharacters) {
      currentEnd = nextEnd;
      continue;
    }

    flushCurrentChunk(document, chunks, currentStart, currentEnd);
    currentStart = item.span.start;
    currentEnd = item.span.end;
  }

  flushCurrentChunk(document, chunks, currentStart, currentEnd);
  return withCharacterOverlap(chunks, document.text, overlapCharacters);
}

function splitOversizedSegment(
  item: TextParagraph | TextSentence,
  maxCharacters: number,
  overlapCharacters: number,
): ChunkCandidate[] {
  return createCharacterChunks(item.text, maxCharacters, overlapCharacters).map((chunk) => ({
    start: item.span.start + chunk.start,
    end: item.span.start + chunk.end,
    text: chunk.text,
  }));
}

function createCharacterChunks(
  text: string,
  maxCharacters: number,
  overlapCharacters: number,
): ChunkCandidate[] {
  if (text.length === 0) {
    return [{ start: 0, end: 0, text: "" }];
  }

  const step = Math.max(1, maxCharacters - overlapCharacters);
  const chunks: ChunkCandidate[] = [];

  for (let start = 0; start < text.length; start += step) {
    const end = Math.min(text.length, start + maxCharacters);
    chunks.push({
      start,
      end,
      text: text.slice(start, end),
    });

    if (end >= text.length) {
      break;
    }
  }

  return chunks;
}

function withCharacterOverlap(
  chunks: ChunkCandidate[],
  text: string,
  overlapCharacters: number,
): ChunkCandidate[] {
  if (overlapCharacters <= 0 || chunks.length <= 1) {
    return chunks;
  }

  return chunks.map((chunk, index) => {
    if (index === 0) {
      return chunk;
    }

    const start = Math.max(0, chunk.start - overlapCharacters);
    return {
      start,
      end: chunk.end,
      text: text.slice(start, chunk.end),
    };
  });
}

function flushCurrentChunk(
  document: TextDocument,
  target: ChunkCandidate[],
  start: number,
  end: number,
): void {
  if (start < 0 || end < start) {
    return;
  }

  target.push({
    start,
    end,
    text: document.text.slice(start, end),
  });
}

function collectFeatureVectors(
  value: FeatureExtractionValue | FeatureExtractionValue[],
): number[][] {
  if (!Array.isArray(value)) {
    return [];
  }

  if (value.every((entry) => typeof entry === "number")) {
    return [value as number[]];
  }

  return value.flatMap((entry) =>
    Array.isArray(entry) ? collectFeatureVectors(entry as FeatureExtractionValue[]) : [],
  );
}

function resolveHuggingFaceEndpoint(
  model: HuggingFaceModelReference,
  baseUrl = DEFAULT_HUGGING_FACE_BASE_URL,
): string {
  if (model.endpoint) {
    return model.endpoint;
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/u, "");
  return `${normalizedBaseUrl}/${encodeModelPath(model.model)}`;
}

function encodeModelPath(model: string): string {
  return model
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function normalizeClassificationOutput(raw: unknown): ScoredLabel[] {
  const items = Array.isArray(raw)
    ? Array.isArray(raw[0])
      ? (raw[0] as unknown[])
      : raw
    : raw
      ? [raw]
      : [];

  return items
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;

      const label = typeof record.label === "string" ? record.label : undefined;
      const score = typeof record.score === "number" ? record.score : undefined;

      if (!label || score === undefined) {
        return null;
      }

      return { label, score };
    })
    .filter((item): item is ScoredLabel => item !== null)
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label));
}

function normalizeTokenClassificationOutput(raw: unknown): TokenClassificationSpan[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const normalized: TokenClassificationSpan[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as Record<string, unknown>;
    const text =
      typeof record.word === "string"
        ? record.word
        : typeof record.text === "string"
          ? record.text
          : undefined;
    const label =
      typeof record.entity_group === "string"
        ? record.entity_group
        : typeof record.entity === "string"
          ? record.entity
          : undefined;
    const score = typeof record.score === "number" ? record.score : undefined;

    if (!text || !label || score === undefined) {
      continue;
    }

    const entity: TokenClassificationSpan = {
      text,
      label,
      score,
    };

    if (typeof record.start === "number") {
      entity.start = record.start;
    }

    if (typeof record.end === "number") {
      entity.end = record.end;
    }

    normalized.push(entity);
  }

  return normalized.sort(
    (left, right) => right.score - left.score || left.label.localeCompare(right.label),
  );
}

function normalizeFeatureExtractionOutput(raw: unknown): FeatureExtractionValue[] {
  if (Array.isArray(raw)) {
    return raw as FeatureExtractionValue[];
  }

  return [];
}

function normalizeQuestionAnsweringOutput(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return {
      answer: "",
      score: 0,
      start: undefined,
      end: undefined,
    };
  }

  const record = raw as Record<string, unknown>;

  return {
    answer: typeof record.answer === "string" ? record.answer : "",
    score: typeof record.score === "number" ? record.score : 0,
    start: typeof record.start === "number" ? record.start : undefined,
    end: typeof record.end === "number" ? record.end : undefined,
  };
}

function normalizeSummarizationOutput(raw: unknown): string {
  if (Array.isArray(raw) && raw[0] && typeof raw[0] === "object") {
    const first = raw[0] as Record<string, unknown>;

    if (typeof first.summary_text === "string") {
      return first.summary_text;
    }
  }

  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;

    if (typeof record.summary_text === "string") {
      return record.summary_text;
    }
  }

  if (typeof raw === "string") {
    return raw;
  }

  return "";
}
