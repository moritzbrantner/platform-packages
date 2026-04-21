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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("image-to-video");
export const huggingFaceTask = createHuggingFaceTaskPackage("image-to-video");

export type ImageToVideoInput = UniversalTaskInput<"image-to-video">;
export type ImageToVideoOutput = UniversalTaskOutput<"image-to-video">;
export type ImageToVideoRequest<Input = ImageToVideoInput> = UniversalTaskRequest<
  "image-to-video",
  Input
>;
export type ImageToVideoResult<Output = ImageToVideoOutput> = UniversalTaskResult<
  "image-to-video",
  Output
>;
export type ImageToVideoPipeline<
  Input = ImageToVideoInput,
  Output = ImageToVideoOutput,
> = UniversalTaskPipeline<"image-to-video", Input, Output>;

export type CreateImageToVideoPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"image-to-video">,
  "descriptor"
>;

export function createImageToVideoPipeline<
  Input = ImageToVideoInput,
  Output = ImageToVideoOutput,
>(
  options: CreateImageToVideoPipelineOptions,
): ImageToVideoPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createImageToVideoPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
