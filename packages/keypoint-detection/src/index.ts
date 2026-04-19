import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("keypoint-detection");
export const huggingFaceTask = createHuggingFaceTaskPackage("keypoint-detection");

export type KeypointDetectionPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "keypoint-detection",
  Input,
  Output
>;

export type CreateKeypointDetectionPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"keypoint-detection">,
  "descriptor"
>;

export function createKeypointDetectionPipeline<Input = unknown, Output = unknown>(
  options: CreateKeypointDetectionPipelineOptions,
): KeypointDetectionPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createKeypointDetectionPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
