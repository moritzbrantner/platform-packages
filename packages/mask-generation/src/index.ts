import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("mask-generation");
export const huggingFaceTask = createHuggingFaceTaskPackage("mask-generation");

export type MaskGenerationPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "mask-generation",
  Input,
  Output
>;

export type CreateMaskGenerationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"mask-generation">,
  "descriptor"
>;

export function createMaskGenerationPipeline<Input = unknown, Output = unknown>(
  options: CreateMaskGenerationPipelineOptions,
): MaskGenerationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createMaskGenerationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
