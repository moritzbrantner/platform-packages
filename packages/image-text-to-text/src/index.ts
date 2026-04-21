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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("image-text-to-text");
export const huggingFaceTask = createHuggingFaceTaskPackage("image-text-to-text");

export type ImageTextToTextInput = UniversalTaskInput<"image-text-to-text">;
export type ImageTextToTextOutput = UniversalTaskOutput<"image-text-to-text">;
export type ImageTextToTextRequest<Input = ImageTextToTextInput> = UniversalTaskRequest<
  "image-text-to-text",
  Input
>;
export type ImageTextToTextResult<Output = ImageTextToTextOutput> = UniversalTaskResult<
  "image-text-to-text",
  Output
>;
export type ImageTextToTextPipeline<
  Input = ImageTextToTextInput,
  Output = ImageTextToTextOutput,
> = UniversalTaskPipeline<"image-text-to-text", Input, Output>;

export type CreateImageTextToTextPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"image-text-to-text">,
  "descriptor"
>;

export function createImageTextToTextPipeline<
  Input = ImageTextToTextInput,
  Output = ImageTextToTextOutput,
>(
  options: CreateImageTextToTextPipelineOptions,
): ImageTextToTextPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createImageTextToTextPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
