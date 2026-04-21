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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("zero-shot-classification");
export const huggingFaceTask = createHuggingFaceTaskPackage("zero-shot-classification");

export type ZeroShotClassificationInput = UniversalTaskInput<"zero-shot-classification">;
export type ZeroShotClassificationOutput = UniversalTaskOutput<"zero-shot-classification">;
export type ZeroShotClassificationRequest<Input = ZeroShotClassificationInput> = UniversalTaskRequest<
  "zero-shot-classification",
  Input
>;
export type ZeroShotClassificationResult<Output = ZeroShotClassificationOutput> = UniversalTaskResult<
  "zero-shot-classification",
  Output
>;
export type ZeroShotClassificationPipeline<
  Input = ZeroShotClassificationInput,
  Output = ZeroShotClassificationOutput,
> = UniversalTaskPipeline<"zero-shot-classification", Input, Output>;

export type CreateZeroShotClassificationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"zero-shot-classification">,
  "descriptor"
>;

export function createZeroShotClassificationPipeline<
  Input = ZeroShotClassificationInput,
  Output = ZeroShotClassificationOutput,
>(
  options: CreateZeroShotClassificationPipelineOptions,
): ZeroShotClassificationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createZeroShotClassificationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
