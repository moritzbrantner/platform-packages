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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("zero-shot-object-detection");
export const huggingFaceTask = createHuggingFaceTaskPackage("zero-shot-object-detection");

export type ZeroShotObjectDetectionInput = UniversalTaskInput<"zero-shot-object-detection">;
export type ZeroShotObjectDetectionOutput = UniversalTaskOutput<"zero-shot-object-detection">;
export type ZeroShotObjectDetectionRequest<Input = ZeroShotObjectDetectionInput> =
  UniversalTaskRequest<"zero-shot-object-detection", Input>;
export type ZeroShotObjectDetectionResult<Output = ZeroShotObjectDetectionOutput> =
  UniversalTaskResult<"zero-shot-object-detection", Output>;
export type ZeroShotObjectDetectionPipeline<
  Input = ZeroShotObjectDetectionInput,
  Output = ZeroShotObjectDetectionOutput,
> = UniversalTaskPipeline<"zero-shot-object-detection", Input, Output>;

export type CreateZeroShotObjectDetectionPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"zero-shot-object-detection">,
  "descriptor"
>;

export function createZeroShotObjectDetectionPipeline<
  Input = ZeroShotObjectDetectionInput,
  Output = ZeroShotObjectDetectionOutput,
>(
  options: CreateZeroShotObjectDetectionPipelineOptions,
): ZeroShotObjectDetectionPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createZeroShotObjectDetectionPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
