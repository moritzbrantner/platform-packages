import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("image-text-to-image");
export const huggingFaceTask = createHuggingFaceTaskPackage("image-text-to-image");

export type ImageTextToImagePipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "image-text-to-image",
  Input,
  Output
>;

export type CreateImageTextToImagePipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"image-text-to-image">,
  "descriptor"
>;

export function createImageTextToImagePipeline<Input = unknown, Output = unknown>(
  options: CreateImageTextToImagePipelineOptions,
): ImageTextToImagePipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createImageTextToImagePipeline;
export const createModelReference = huggingFaceTask.createModelReference;
