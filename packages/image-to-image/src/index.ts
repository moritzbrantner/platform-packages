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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("image-to-image");
export const huggingFaceTask = createHuggingFaceTaskPackage("image-to-image");

export type ImageToImageInput = UniversalTaskInput<"image-to-image">;
export type ImageToImageOutput = UniversalTaskOutput<"image-to-image">;
export type ImageToImageRequest<Input = ImageToImageInput> = UniversalTaskRequest<
  "image-to-image",
  Input
>;
export type ImageToImageResult<Output = ImageToImageOutput> = UniversalTaskResult<
  "image-to-image",
  Output
>;
export type ImageToImagePipeline<
  Input = ImageToImageInput,
  Output = ImageToImageOutput,
> = UniversalTaskPipeline<"image-to-image", Input, Output>;

export type CreateImageToImagePipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"image-to-image">,
  "descriptor"
>;

export function createImageToImagePipeline<
  Input = ImageToImageInput,
  Output = ImageToImageOutput,
>(
  options: CreateImageToImagePipelineOptions,
): ImageToImagePipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createImageToImagePipeline;
export const createModelReference = huggingFaceTask.createModelReference;
