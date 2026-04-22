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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("image-text-to-image");
export const huggingFaceTask = createHuggingFaceTaskPackage("image-text-to-image");

export type ImageTextToImageInput = UniversalTaskInput<"image-text-to-image">;
export type ImageTextToImageOutput = UniversalTaskOutput<"image-text-to-image">;
export type ImageTextToImageRequest<Input = ImageTextToImageInput> = UniversalTaskRequest<
  "image-text-to-image",
  Input
>;
export type ImageTextToImageResult<Output = ImageTextToImageOutput> = UniversalTaskResult<
  "image-text-to-image",
  Output
>;
export type ImageTextToImagePipeline<
  Input = ImageTextToImageInput,
  Output = ImageTextToImageOutput,
> = UniversalTaskPipeline<"image-text-to-image", Input, Output>;

export type CreateImageTextToImagePipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"image-text-to-image">,
  "descriptor"
>;

export function createImageTextToImagePipeline<
  Input = ImageTextToImageInput,
  Output = ImageTextToImageOutput,
>(options: CreateImageTextToImagePipelineOptions): ImageTextToImagePipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createImageTextToImagePipeline;
export const createModelReference = huggingFaceTask.createModelReference;
