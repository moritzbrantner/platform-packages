import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("sentence-similarity");
export const huggingFaceTask = createHuggingFaceTaskPackage("sentence-similarity");

export type SentenceSimilarityPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "sentence-similarity",
  Input,
  Output
>;

export type CreateSentenceSimilarityPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"sentence-similarity">,
  "descriptor"
>;

export function createSentenceSimilarityPipeline<Input = unknown, Output = unknown>(
  options: CreateSentenceSimilarityPipelineOptions,
): SentenceSimilarityPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createSentenceSimilarityPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
