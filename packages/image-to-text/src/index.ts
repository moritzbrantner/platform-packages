import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("image-to-text");
export const huggingFaceTask = createHuggingFaceTaskPackage("image-to-text");

export type ImageToTextPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "image-to-text",
  Input,
  Output
>;

export type CreateImageToTextPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"image-to-text">,
  "descriptor"
>;

export function createImageToTextPipeline<Input = unknown, Output = unknown>(
  options: CreateImageToTextPipelineOptions,
): ImageToTextPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createImageToTextPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
