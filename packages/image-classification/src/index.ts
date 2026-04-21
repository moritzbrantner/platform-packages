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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("image-classification");
export const huggingFaceTask = createHuggingFaceTaskPackage("image-classification");

export type ImageClassificationInput = UniversalTaskInput<"image-classification">;
export type ImageClassificationOutput = UniversalTaskOutput<"image-classification">;
export type ImageClassificationRequest<Input = ImageClassificationInput> = UniversalTaskRequest<
  "image-classification",
  Input
>;
export type ImageClassificationResult<Output = ImageClassificationOutput> = UniversalTaskResult<
  "image-classification",
  Output
>;
export type ImageClassificationPipeline<
  Input = ImageClassificationInput,
  Output = ImageClassificationOutput,
> = UniversalTaskPipeline<"image-classification", Input, Output>;

export type CreateImageClassificationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"image-classification">,
  "descriptor"
>;

export function createImageClassificationPipeline<
  Input = ImageClassificationInput,
  Output = ImageClassificationOutput,
>(
  options: CreateImageClassificationPipelineOptions,
): ImageClassificationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createImageClassificationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
