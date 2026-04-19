import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("zero-shot-classification");
export const huggingFaceTask = createHuggingFaceTaskPackage("zero-shot-classification");

export type ZeroShotClassificationPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "zero-shot-classification",
  Input,
  Output
>;

export type CreateZeroShotClassificationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"zero-shot-classification">,
  "descriptor"
>;

export function createZeroShotClassificationPipeline<Input = unknown, Output = unknown>(
  options: CreateZeroShotClassificationPipelineOptions,
): ZeroShotClassificationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createZeroShotClassificationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
