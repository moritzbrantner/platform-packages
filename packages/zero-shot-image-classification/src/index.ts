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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor(
  "zero-shot-image-classification",
);
export const huggingFaceTask = createHuggingFaceTaskPackage("zero-shot-image-classification");

export type ZeroShotImageClassificationInput = UniversalTaskInput<"zero-shot-image-classification">;
export type ZeroShotImageClassificationOutput =
  UniversalTaskOutput<"zero-shot-image-classification">;
export type ZeroShotImageClassificationRequest<Input = ZeroShotImageClassificationInput> =
  UniversalTaskRequest<"zero-shot-image-classification", Input>;
export type ZeroShotImageClassificationResult<Output = ZeroShotImageClassificationOutput> =
  UniversalTaskResult<"zero-shot-image-classification", Output>;
export type ZeroShotImageClassificationPipeline<
  Input = ZeroShotImageClassificationInput,
  Output = ZeroShotImageClassificationOutput,
> = UniversalTaskPipeline<"zero-shot-image-classification", Input, Output>;

export type CreateZeroShotImageClassificationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"zero-shot-image-classification">,
  "descriptor"
>;

export function createZeroShotImageClassificationPipeline<
  Input = ZeroShotImageClassificationInput,
  Output = ZeroShotImageClassificationOutput,
>(
  options: CreateZeroShotImageClassificationPipelineOptions,
): ZeroShotImageClassificationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createZeroShotImageClassificationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
