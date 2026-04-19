import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("image-text-to-video");
export const huggingFaceTask = createHuggingFaceTaskPackage("image-text-to-video");

export type ImageTextToVideoPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "image-text-to-video",
  Input,
  Output
>;

export type CreateImageTextToVideoPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"image-text-to-video">,
  "descriptor"
>;

export function createImageTextToVideoPipeline<Input = unknown, Output = unknown>(
  options: CreateImageTextToVideoPipelineOptions,
): ImageTextToVideoPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createImageTextToVideoPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
