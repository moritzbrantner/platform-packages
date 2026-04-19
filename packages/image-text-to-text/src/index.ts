import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("image-text-to-text");
export const huggingFaceTask = createHuggingFaceTaskPackage("image-text-to-text");

export type ImageTextToTextPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "image-text-to-text",
  Input,
  Output
>;

export type CreateImageTextToTextPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"image-text-to-text">,
  "descriptor"
>;

export function createImageTextToTextPipeline<Input = unknown, Output = unknown>(
  options: CreateImageTextToTextPipelineOptions,
): ImageTextToTextPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createImageTextToTextPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
