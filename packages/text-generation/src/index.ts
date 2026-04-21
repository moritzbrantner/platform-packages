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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("text-generation");
export const huggingFaceTask = createHuggingFaceTaskPackage("text-generation");

export type TextGenerationInput = UniversalTaskInput<"text-generation">;
export type TextGenerationOutput = UniversalTaskOutput<"text-generation">;
export type TextGenerationRequest<Input = TextGenerationInput> = UniversalTaskRequest<
  "text-generation",
  Input
>;
export type TextGenerationResult<Output = TextGenerationOutput> = UniversalTaskResult<
  "text-generation",
  Output
>;
export type TextGenerationPipeline<
  Input = TextGenerationInput,
  Output = TextGenerationOutput,
> = UniversalTaskPipeline<"text-generation", Input, Output>;

export type CreateTextGenerationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"text-generation">,
  "descriptor"
>;

export function createTextGenerationPipeline<
  Input = TextGenerationInput,
  Output = TextGenerationOutput,
>(
  options: CreateTextGenerationPipelineOptions,
): TextGenerationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTextGenerationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
