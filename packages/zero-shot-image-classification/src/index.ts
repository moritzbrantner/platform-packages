import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("zero-shot-image-classification");
export const huggingFaceTask = createHuggingFaceTaskPackage("zero-shot-image-classification");

export type ZeroShotImageClassificationPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "zero-shot-image-classification",
  Input,
  Output
>;

export type CreateZeroShotImageClassificationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"zero-shot-image-classification">,
  "descriptor"
>;

export function createZeroShotImageClassificationPipeline<Input = unknown, Output = unknown>(
  options: CreateZeroShotImageClassificationPipelineOptions,
): ZeroShotImageClassificationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createZeroShotImageClassificationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
