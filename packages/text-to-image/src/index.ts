import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("text-to-image");
export const huggingFaceTask = createHuggingFaceTaskPackage("text-to-image");

export type TextToImagePipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "text-to-image",
  Input,
  Output
>;

export type CreateTextToImagePipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"text-to-image">,
  "descriptor"
>;

export function createTextToImagePipeline<Input = unknown, Output = unknown>(
  options: CreateTextToImagePipelineOptions,
): TextToImagePipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTextToImagePipeline;
export const createModelReference = huggingFaceTask.createModelReference;
