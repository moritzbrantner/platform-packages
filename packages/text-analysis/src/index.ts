import type { TextDocument, TextToken } from "@moritzbrantner/linguistics-core";
import {
  averageFeatureVectors,
  chunkTextForInference,
  ensureTextDocument,
  mergeScoredLabels,
  type ChunkTextOptions,
  type FeatureExtractionProvider,
  type HuggingFaceModelReference,
  type ScoredLabel,
  type TextClassificationProvider,
  type TextInferenceInput,
  type TokenClassificationProvider,
} from "@moritzbrantner/text-inference";

const DEFAULT_KEYWORD_LIMIT = 8;

export interface TextAnalysisKeyword {
  text: string;
  weight: number;
  source: "entity" | "term-frequency";
}

export interface TextAnalysisEntity {
  text: string;
  label: string;
  score: number;
  count: number;
}

export interface TextAnalysisChunkResult {
  chunkId: string;
  chunkIndex: number;
  text: string;
  categories: ScoredLabel[];
  entities: TextAnalysisEntity[];
  embedding?: number[];
}

export interface TextAnalysisResult<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  document: TextDocument<Metadata>;
  categories: ScoredLabel[];
  entities: TextAnalysisEntity[];
  embedding?: number[];
  keywords: TextAnalysisKeyword[];
  chunks: TextAnalysisChunkResult[];
}

export interface CreateTextAnalysisPipelineOptions<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  classifier?: {
    provider: TextClassificationProvider;
    model: HuggingFaceModelReference<"text-classification">;
  };
  entityRecognizer?: {
    provider: TokenClassificationProvider;
    model: HuggingFaceModelReference<"token-classification">;
  };
  embedder?: {
    provider: FeatureExtractionProvider;
    model: HuggingFaceModelReference<"feature-extraction">;
  };
  chunking?: ChunkTextOptions<Metadata>;
  keywordLimit?: number;
}

export interface TextAnalysisPipeline<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  analyze(
    input: TextInferenceInput<Metadata>,
    options?: {
      chunking?: ChunkTextOptions<Metadata>;
      keywordLimit?: number;
    },
  ): Promise<TextAnalysisResult<Metadata>>;
}

export function createTextAnalysisPipeline<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(options: CreateTextAnalysisPipelineOptions<Metadata>): TextAnalysisPipeline<Metadata> {
  return {
    async analyze(input, analysisOptions = {}) {
      const document = ensureTextDocument(input, options.chunking);
      const chunks = chunkTextForInference(input, analysisOptions.chunking ?? options.chunking);
      const chunkResults = await Promise.all(
        chunks.map(async (chunk) => {
          const [categories, entities, embedding] = await Promise.all([
            options.classifier
              ? options.classifier.provider
                  .classifyText({
                    model: options.classifier.model,
                    input: chunk.text,
                  })
                  .then((result) => result.labels)
              : Promise.resolve([]),
            options.entityRecognizer
              ? options.entityRecognizer.provider
                  .classifyTokens({
                    model: options.entityRecognizer.model,
                    input: chunk.text,
                  })
                  .then((result) => collapseEntities(result.entities))
              : Promise.resolve([]),
            options.embedder
              ? options.embedder.provider
                  .extractFeatures({
                    model: options.embedder.model,
                    input: chunk.text,
                  })
                  .then((result) => result.vector)
              : Promise.resolve(undefined),
          ]);

          return {
            chunkId: chunk.id,
            chunkIndex: chunk.index,
            text: chunk.text,
            categories,
            entities,
            embedding,
          } satisfies TextAnalysisChunkResult;
        }),
      );

      const keywords = rankKeywords(
        document,
        mergeEntities(chunkResults.flatMap((chunk) => chunk.entities)),
        analysisOptions.keywordLimit ?? options.keywordLimit ?? DEFAULT_KEYWORD_LIMIT,
      );
      const embeddings = chunkResults.flatMap((chunk) =>
        chunk.embedding ? [chunk.embedding] : [],
      );

      return {
        document,
        categories: mergeScoredLabels(chunkResults.map((chunk) => chunk.categories)),
        entities: mergeEntities(chunkResults.flatMap((chunk) => chunk.entities)),
        embedding: embeddings.length > 0 ? averageFeatureVectors(embeddings) : undefined,
        keywords,
        chunks: chunkResults,
      };
    },
  };
}

function collapseEntities(
  entities: Array<{
    text: string;
    label: string;
    score: number;
  }>,
): TextAnalysisEntity[] {
  return mergeEntities(
    entities.map((entity) => ({
      text: entity.text,
      label: entity.label,
      score: entity.score,
      count: 1,
    })),
  );
}

function mergeEntities(entities: Iterable<TextAnalysisEntity>): TextAnalysisEntity[] {
  const merged = new Map<
    string,
    { text: string; label: string; totalScore: number; count: number }
  >();

  for (const entity of entities) {
    const key = `${entity.label}\u0000${entity.text.toLocaleLowerCase()}`;
    const next = merged.get(key) ?? {
      text: entity.text,
      label: entity.label,
      totalScore: 0,
      count: 0,
    };
    next.totalScore += entity.score * entity.count;
    next.count += entity.count;
    merged.set(key, next);
  }

  return Array.from(merged.values())
    .map((entity) => ({
      text: entity.text,
      label: entity.label,
      score: entity.totalScore / entity.count,
      count: entity.count,
    }))
    .sort(
      (left, right) =>
        right.count - left.count || right.score - left.score || left.text.localeCompare(right.text),
    );
}

function rankKeywords(
  document: TextDocument,
  entities: readonly TextAnalysisEntity[],
  limit: number,
): TextAnalysisKeyword[] {
  const entityKeywords = entities.map((entity) => ({
    text: entity.text,
    weight: entity.count + entity.score,
    source: "entity" as const,
  }));
  const frequencyKeywords = Array.from(countWordTokens(document.tokens).entries())
    .map(([text, count]) => ({
      text,
      weight: count,
      source: "term-frequency" as const,
    }))
    .filter(
      (keyword) => !entities.some((entity) => entity.text.toLocaleLowerCase() === keyword.text),
    )
    .sort((left, right) => right.weight - left.weight || left.text.localeCompare(right.text));

  return [...entityKeywords, ...frequencyKeywords]
    .sort((left, right) => right.weight - left.weight || left.text.localeCompare(right.text))
    .slice(0, Math.max(1, Math.floor(limit)));
}

function countWordTokens(tokens: readonly TextToken[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const token of tokens) {
    if (!token.isWordLike) {
      continue;
    }

    const normalized = token.normalized;

    if (normalized.length < 3 || STOP_WORDS.has(normalized)) {
      continue;
    }

    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  return counts;
}

const STOP_WORDS = new Set([
  "and",
  "are",
  "but",
  "for",
  "from",
  "has",
  "have",
  "into",
  "its",
  "not",
  "that",
  "the",
  "their",
  "them",
  "they",
  "this",
  "was",
  "with",
]);
