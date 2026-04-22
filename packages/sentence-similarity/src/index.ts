import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskInput,
  type UniversalTaskOutput,
  type UniversalTaskPipeline,
  type UniversalTaskRequest,
  type UniversalTaskResult,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("sentence-similarity");
export const huggingFaceTask = createHuggingFaceTaskPackage("sentence-similarity");

export type SentenceSimilarityInput = UniversalTaskInput<"sentence-similarity">;
export type SentenceSimilarityOutput = UniversalTaskOutput<"sentence-similarity">;
export type SentenceSimilarityRequest<Input = SentenceSimilarityInput> = UniversalTaskRequest<
  "sentence-similarity",
  Input
>;
export type SentenceSimilarityResult<Output = SentenceSimilarityOutput> = UniversalTaskResult<
  "sentence-similarity",
  Output
>;
export type SentenceSimilarityPipeline<
  Input = SentenceSimilarityInput,
  Output = SentenceSimilarityOutput,
> = UniversalTaskPipeline<"sentence-similarity", Input, Output>;

export type CreateSentenceSimilarityPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"sentence-similarity">,
  "descriptor"
>;

export function createSentenceSimilarityPipeline<
  Input = SentenceSimilarityInput,
  Output = SentenceSimilarityOutput,
>(options: CreateSentenceSimilarityPipelineOptions): SentenceSimilarityPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createSentenceSimilarityPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
