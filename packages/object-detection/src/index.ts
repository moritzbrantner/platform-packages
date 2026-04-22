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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("object-detection");
export const huggingFaceTask = createHuggingFaceTaskPackage("object-detection");

export type ObjectDetectionInput = UniversalTaskInput<"object-detection">;
export type ObjectDetectionOutput = UniversalTaskOutput<"object-detection">;
export type ObjectDetectionRequest<Input = ObjectDetectionInput> = UniversalTaskRequest<
  "object-detection",
  Input
>;
export type ObjectDetectionResult<Output = ObjectDetectionOutput> = UniversalTaskResult<
  "object-detection",
  Output
>;
export type ObjectDetectionPipeline<
  Input = ObjectDetectionInput,
  Output = ObjectDetectionOutput,
> = UniversalTaskPipeline<"object-detection", Input, Output>;

export type CreateObjectDetectionPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"object-detection">,
  "descriptor"
>;

export function createObjectDetectionPipeline<
  Input = ObjectDetectionInput,
  Output = ObjectDetectionOutput,
>(options: CreateObjectDetectionPipelineOptions): ObjectDetectionPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createObjectDetectionPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
