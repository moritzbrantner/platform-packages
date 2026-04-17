import {
  chunkTextForInference,
  type ChunkTextOptions,
  type HuggingFaceModelReference,
  type SummarizationProvider,
  type TextInferenceInput,
} from "@moritzbrantner/text-inference";

const DEFAULT_MAX_PASSES = 3;

export interface SummaryChunk {
  chunkId: string;
  chunkIndex: number;
  sourceText: string;
  summary: string;
}

export interface TextSummaryResult {
  summary: string;
  chunks: SummaryChunk[];
  passes: number;
  model: string;
}

export interface CreateTextSummarizationPipelineOptions<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  provider: SummarizationProvider;
  model: HuggingFaceModelReference<"summarization">;
  reducerModel?: HuggingFaceModelReference<"summarization">;
  chunking?: ChunkTextOptions<Metadata>;
  maxPasses?: number;
  joinSeparator?: string;
}

export interface TextSummarizationPipeline<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  summarize(
    input: TextInferenceInput<Metadata>,
    options?: {
      chunking?: ChunkTextOptions<Metadata>;
      maxPasses?: number;
    },
  ): Promise<TextSummaryResult>;
}

export function createTextSummarizationPipeline<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(
  options: CreateTextSummarizationPipelineOptions<Metadata>,
): TextSummarizationPipeline<Metadata> {
  return {
    async summarize(input, summarizeOptions = {}) {
      const maxPasses = Math.max(1, Math.floor(summarizeOptions.maxPasses ?? options.maxPasses ?? DEFAULT_MAX_PASSES));
      const joinSeparator = options.joinSeparator ?? "\n\n";
      let currentInput = input;
      let pass = 0;
      let chunkSummaries: SummaryChunk[] = [];
      let finalSummary = "";

      while (pass < maxPasses) {
        const chunks = chunkTextForInference(currentInput, summarizeOptions.chunking ?? options.chunking);
        const summaries = await Promise.all(
          chunks.map(async (chunk) => {
            const result = await options.provider.summarize({
              model: pass === 0 ? options.model : options.reducerModel ?? options.model,
              input: chunk.text,
            });

            return {
              chunkId: chunk.id,
              chunkIndex: chunk.index,
              sourceText: chunk.text,
              summary: result.summary,
            } satisfies SummaryChunk;
          }),
        );
        const joinedSummary = summaries.map((chunk) => chunk.summary).filter(Boolean).join(joinSeparator);

        chunkSummaries = summaries;
        finalSummary = joinedSummary;
        pass += 1;

        if (summaries.length <= 1) {
          break;
        }

        const nextChunks = chunkTextForInference(joinedSummary, summarizeOptions.chunking ?? options.chunking);

        if (nextChunks.length <= 1) {
          break;
        }

        currentInput = joinedSummary;
      }

      return {
        summary: finalSummary,
        chunks: chunkSummaries,
        passes: pass,
        model: options.model.model,
      };
    },
  };
}
