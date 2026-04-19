import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("image-to-video");
export const huggingFaceTask = createHuggingFaceTaskPackage("image-to-video");

export type ImageToVideoPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "image-to-video",
  Input,
  Output
>;

export type CreateImageToVideoPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"image-to-video">,
  "descriptor"
>;

export function createImageToVideoPipeline<Input = unknown, Output = unknown>(
  options: CreateImageToVideoPipelineOptions,
): ImageToVideoPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createImageToVideoPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
