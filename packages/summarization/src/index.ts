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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("summarization");
export const huggingFaceTask = createHuggingFaceTaskPackage("summarization");

export type SummarizationInput = UniversalTaskInput<"summarization">;
export type SummarizationOutput = UniversalTaskOutput<"summarization">;
export type SummarizationRequest<Input = SummarizationInput> = UniversalTaskRequest<
  "summarization",
  Input
>;
export type SummarizationResult<Output = SummarizationOutput> = UniversalTaskResult<
  "summarization",
  Output
>;
export type SummarizationPipeline<
  Input = SummarizationInput,
  Output = SummarizationOutput,
> = UniversalTaskPipeline<"summarization", Input, Output>;

export type CreateSummarizationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"summarization">,
  "descriptor"
>;

export function createSummarizationPipeline<
  Input = SummarizationInput,
  Output = SummarizationOutput,
>(
  options: CreateSummarizationPipelineOptions,
): SummarizationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createSummarizationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
