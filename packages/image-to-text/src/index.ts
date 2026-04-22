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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("image-to-text");
export const huggingFaceTask = createHuggingFaceTaskPackage("image-to-text");

export type ImageToTextInput = UniversalTaskInput<"image-to-text">;
export type ImageToTextOutput = UniversalTaskOutput<"image-to-text">;
export type ImageToTextRequest<Input = ImageToTextInput> = UniversalTaskRequest<
  "image-to-text",
  Input
>;
export type ImageToTextResult<Output = ImageToTextOutput> = UniversalTaskResult<
  "image-to-text",
  Output
>;
export type ImageToTextPipeline<
  Input = ImageToTextInput,
  Output = ImageToTextOutput,
> = UniversalTaskPipeline<"image-to-text", Input, Output>;

export type CreateImageToTextPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"image-to-text">,
  "descriptor"
>;

export function createImageToTextPipeline<Input = ImageToTextInput, Output = ImageToTextOutput>(
  options: CreateImageToTextPipelineOptions,
): ImageToTextPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createImageToTextPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
