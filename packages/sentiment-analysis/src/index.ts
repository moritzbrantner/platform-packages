import {
  chunkTextForInference,
  type ChunkTextOptions,
  type HuggingFaceModelReference,
  type ScoredLabel,
  type TextClassificationProvider,
  type TextInferenceInput,
} from "@moritzbrantner/text-inference";

export type CanonicalSentiment = "mixed" | "negative" | "neutral" | "positive";

export interface SentimentChunkResult {
  chunkId: string;
  chunkIndex: number;
  text: string;
  sentiment: CanonicalSentiment;
  scores: Record<CanonicalSentiment, number>;
  labels: ScoredLabel[];
}

export interface SentimentAnalysisResult {
  sentiment: CanonicalSentiment;
  scores: Record<CanonicalSentiment, number>;
  labels: ScoredLabel[];
  chunks: SentimentChunkResult[];
}

export interface CreateSentimentAnalysisPipelineOptions<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  provider: TextClassificationProvider;
  model: HuggingFaceModelReference<"text-classification">;
  chunking?: ChunkTextOptions<Metadata>;
  labelMap?: Record<string, Exclude<CanonicalSentiment, "mixed">>;
}

export interface SentimentAnalysisPipeline<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  analyze(
    input: TextInferenceInput<Metadata>,
    options?: {
      chunking?: ChunkTextOptions<Metadata>;
      labelMap?: Record<string, Exclude<CanonicalSentiment, "mixed">>;
    },
  ): Promise<SentimentAnalysisResult>;
}

export function createSentimentAnalysisPipeline<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(options: CreateSentimentAnalysisPipelineOptions<Metadata>): SentimentAnalysisPipeline<Metadata> {
  return {
    async analyze(input, analysisOptions = {}) {
      const chunks = chunkTextForInference(input, analysisOptions.chunking ?? options.chunking);
      const labelMap = normalizeLabelMap(analysisOptions.labelMap ?? options.labelMap);
      const chunkResults = await Promise.all(
        chunks.map(async (chunk) => {
          const classification = await options.provider.classifyText({
            model: options.model,
            input: chunk.text,
          });
          const scores = toSentimentScores(classification.labels, labelMap);

          return {
            chunkId: chunk.id,
            chunkIndex: chunk.index,
            text: chunk.text,
            sentiment: resolveSentiment(scores),
            scores,
            labels: classification.labels,
          } satisfies SentimentChunkResult;
        }),
      );

      const aggregateScores = averageScores(chunkResults.map((chunk) => chunk.scores));

      return {
        sentiment: resolveSentiment(aggregateScores),
        scores: aggregateScores,
        labels: rankAggregateLabels(chunkResults.flatMap((chunk) => chunk.labels)),
        chunks: chunkResults,
      };
    },
  };
}

function toSentimentScores(
  labels: readonly ScoredLabel[],
  labelMap: Map<string, Exclude<CanonicalSentiment, "mixed">>,
): Record<CanonicalSentiment, number> {
  const scores: Record<CanonicalSentiment, number> = {
    positive: 0,
    negative: 0,
    neutral: 0,
    mixed: 0,
  };

  for (const label of labels) {
    const sentiment = resolveLabelSentiment(label.label, labelMap);

    if (!sentiment) {
      continue;
    }

    scores[sentiment] += label.score;
  }

  return scores;
}

function resolveSentiment(scores: Record<CanonicalSentiment, number>): CanonicalSentiment {
  const positive = scores.positive;
  const negative = scores.negative;
  const neutral = scores.neutral;

  if (positive > 0.25 && negative > 0.25 && Math.abs(positive - negative) < 0.2) {
    return "mixed";
  }

  if (neutral >= positive && neutral >= negative) {
    return "neutral";
  }

  return positive >= negative ? "positive" : "negative";
}

function averageScores(
  values: Iterable<Record<CanonicalSentiment, number>>,
): Record<CanonicalSentiment, number> {
  const entries = Array.from(values);

  if (entries.length === 0) {
    return {
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0,
    };
  }

  const total = entries.reduce(
    (aggregate, value) => ({
      positive: aggregate.positive + value.positive,
      negative: aggregate.negative + value.negative,
      neutral: aggregate.neutral + value.neutral,
      mixed: aggregate.mixed + value.mixed,
    }),
    {
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0,
    },
  );

  return {
    positive: total.positive / entries.length,
    negative: total.negative / entries.length,
    neutral: total.neutral / entries.length,
    mixed: total.mixed / entries.length,
  };
}

function rankAggregateLabels(labels: readonly ScoredLabel[]): ScoredLabel[] {
  const merged = new Map<string, { total: number; count: number }>();

  for (const label of labels) {
    const next = merged.get(label.label) ?? { total: 0, count: 0 };
    next.total += label.score;
    next.count += 1;
    merged.set(label.label, next);
  }

  return Array.from(merged.entries())
    .map(([label, value]) => ({
      label,
      score: value.total / value.count,
    }))
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label));
}

function normalizeLabelMap(
  labelMap: Record<string, Exclude<CanonicalSentiment, "mixed">> | undefined,
): Map<string, Exclude<CanonicalSentiment, "mixed">> {
  const normalized = new Map<string, Exclude<CanonicalSentiment, "mixed">>();

  for (const [label, sentiment] of Object.entries(labelMap ?? {})) {
    normalized.set(label.toLocaleLowerCase(), sentiment);
  }

  return normalized;
}

function resolveLabelSentiment(
  label: string,
  labelMap: Map<string, Exclude<CanonicalSentiment, "mixed">>,
): Exclude<CanonicalSentiment, "mixed"> | null {
  const normalized = label.toLocaleLowerCase();

  if (labelMap.has(normalized)) {
    return labelMap.get(normalized) ?? null;
  }

  if (
    normalized.includes("positive") ||
    normalized.includes("pos") ||
    normalized.includes("5 stars") ||
    normalized.includes("4 stars")
  ) {
    return "positive";
  }

  if (
    normalized.includes("negative") ||
    normalized.includes("neg") ||
    normalized.includes("1 star") ||
    normalized.includes("2 stars")
  ) {
    return "negative";
  }

  if (
    normalized.includes("neutral") ||
    normalized.includes("neu") ||
    normalized.includes("3 stars")
  ) {
    return "neutral";
  }

  return null;
}
