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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("keypoint-detection");
export const huggingFaceTask = createHuggingFaceTaskPackage("keypoint-detection");

export type KeypointDetectionInput = UniversalTaskInput<"keypoint-detection">;
export type KeypointDetectionOutput = UniversalTaskOutput<"keypoint-detection">;
export type KeypointDetectionRequest<Input = KeypointDetectionInput> = UniversalTaskRequest<
  "keypoint-detection",
  Input
>;
export type KeypointDetectionResult<Output = KeypointDetectionOutput> = UniversalTaskResult<
  "keypoint-detection",
  Output
>;
export type KeypointDetectionPipeline<
  Input = KeypointDetectionInput,
  Output = KeypointDetectionOutput,
> = UniversalTaskPipeline<"keypoint-detection", Input, Output>;

export type CreateKeypointDetectionPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"keypoint-detection">,
  "descriptor"
>;

export function createKeypointDetectionPipeline<
  Input = KeypointDetectionInput,
  Output = KeypointDetectionOutput,
>(
  options: CreateKeypointDetectionPipelineOptions,
): KeypointDetectionPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createKeypointDetectionPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
