import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("object-detection");
export const huggingFaceTask = createHuggingFaceTaskPackage("object-detection");

export type ObjectDetectionPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "object-detection",
  Input,
  Output
>;

export type CreateObjectDetectionPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"object-detection">,
  "descriptor"
>;

export function createObjectDetectionPipeline<Input = unknown, Output = unknown>(
  options: CreateObjectDetectionPipelineOptions,
): ObjectDetectionPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createObjectDetectionPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
