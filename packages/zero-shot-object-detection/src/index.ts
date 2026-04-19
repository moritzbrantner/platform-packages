import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("zero-shot-object-detection");
export const huggingFaceTask = createHuggingFaceTaskPackage("zero-shot-object-detection");

export type ZeroShotObjectDetectionPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "zero-shot-object-detection",
  Input,
  Output
>;

export type CreateZeroShotObjectDetectionPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"zero-shot-object-detection">,
  "descriptor"
>;

export function createZeroShotObjectDetectionPipeline<Input = unknown, Output = unknown>(
  options: CreateZeroShotObjectDetectionPipelineOptions,
): ZeroShotObjectDetectionPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createZeroShotObjectDetectionPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
