import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("image-classification");
export const huggingFaceTask = createHuggingFaceTaskPackage("image-classification");

export type ImageClassificationPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "image-classification",
  Input,
  Output
>;

export type CreateImageClassificationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"image-classification">,
  "descriptor"
>;

export function createImageClassificationPipeline<Input = unknown, Output = unknown>(
  options: CreateImageClassificationPipelineOptions,
): ImageClassificationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createImageClassificationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
