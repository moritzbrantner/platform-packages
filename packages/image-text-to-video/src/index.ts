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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("image-text-to-video");
export const huggingFaceTask = createHuggingFaceTaskPackage("image-text-to-video");

export type ImageTextToVideoInput = UniversalTaskInput<"image-text-to-video">;
export type ImageTextToVideoOutput = UniversalTaskOutput<"image-text-to-video">;
export type ImageTextToVideoRequest<Input = ImageTextToVideoInput> = UniversalTaskRequest<
  "image-text-to-video",
  Input
>;
export type ImageTextToVideoResult<Output = ImageTextToVideoOutput> = UniversalTaskResult<
  "image-text-to-video",
  Output
>;
export type ImageTextToVideoPipeline<
  Input = ImageTextToVideoInput,
  Output = ImageTextToVideoOutput,
> = UniversalTaskPipeline<"image-text-to-video", Input, Output>;

export type CreateImageTextToVideoPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"image-text-to-video">,
  "descriptor"
>;

export function createImageTextToVideoPipeline<
  Input = ImageTextToVideoInput,
  Output = ImageTextToVideoOutput,
>(options: CreateImageTextToVideoPipelineOptions): ImageTextToVideoPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createImageTextToVideoPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
