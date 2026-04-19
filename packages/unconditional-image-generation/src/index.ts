import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("unconditional-image-generation");
export const huggingFaceTask = createHuggingFaceTaskPackage("unconditional-image-generation");

export type UnconditionalImageGenerationPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "unconditional-image-generation",
  Input,
  Output
>;

export type CreateUnconditionalImageGenerationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"unconditional-image-generation">,
  "descriptor"
>;

export function createUnconditionalImageGenerationPipeline<Input = unknown, Output = unknown>(
  options: CreateUnconditionalImageGenerationPipelineOptions,
): UnconditionalImageGenerationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createUnconditionalImageGenerationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
