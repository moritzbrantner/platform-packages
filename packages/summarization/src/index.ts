import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("summarization");
export const huggingFaceTask = createHuggingFaceTaskPackage("summarization");

export type SummarizationPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "summarization",
  Input,
  Output
>;

export type CreateSummarizationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"summarization">,
  "descriptor"
>;

export function createSummarizationPipeline<Input = unknown, Output = unknown>(
  options: CreateSummarizationPipelineOptions,
): SummarizationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createSummarizationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
