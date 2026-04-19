import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("image-to-image");
export const huggingFaceTask = createHuggingFaceTaskPackage("image-to-image");

export type ImageToImagePipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "image-to-image",
  Input,
  Output
>;

export type CreateImageToImagePipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"image-to-image">,
  "descriptor"
>;

export function createImageToImagePipeline<Input = unknown, Output = unknown>(
  options: CreateImageToImagePipelineOptions,
): ImageToImagePipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createImageToImagePipeline;
export const createModelReference = huggingFaceTask.createModelReference;
