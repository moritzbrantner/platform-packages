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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("unconditional-image-generation");
export const huggingFaceTask = createHuggingFaceTaskPackage("unconditional-image-generation");

export type UnconditionalImageGenerationInput = UniversalTaskInput<"unconditional-image-generation">;
export type UnconditionalImageGenerationOutput = UniversalTaskOutput<"unconditional-image-generation">;
export type UnconditionalImageGenerationRequest<Input = UnconditionalImageGenerationInput> = UniversalTaskRequest<
  "unconditional-image-generation",
  Input
>;
export type UnconditionalImageGenerationResult<Output = UnconditionalImageGenerationOutput> = UniversalTaskResult<
  "unconditional-image-generation",
  Output
>;
export type UnconditionalImageGenerationPipeline<
  Input = UnconditionalImageGenerationInput,
  Output = UnconditionalImageGenerationOutput,
> = UniversalTaskPipeline<"unconditional-image-generation", Input, Output>;

export type CreateUnconditionalImageGenerationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"unconditional-image-generation">,
  "descriptor"
>;

export function createUnconditionalImageGenerationPipeline<
  Input = UnconditionalImageGenerationInput,
  Output = UnconditionalImageGenerationOutput,
>(
  options: CreateUnconditionalImageGenerationPipelineOptions,
): UnconditionalImageGenerationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createUnconditionalImageGenerationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
