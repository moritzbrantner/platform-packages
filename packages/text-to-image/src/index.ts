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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("text-to-image");
export const huggingFaceTask = createHuggingFaceTaskPackage("text-to-image");

export type TextToImageInput = UniversalTaskInput<"text-to-image">;
export type TextToImageOutput = UniversalTaskOutput<"text-to-image">;
export type TextToImageRequest<Input = TextToImageInput> = UniversalTaskRequest<
  "text-to-image",
  Input
>;
export type TextToImageResult<Output = TextToImageOutput> = UniversalTaskResult<
  "text-to-image",
  Output
>;
export type TextToImagePipeline<
  Input = TextToImageInput,
  Output = TextToImageOutput,
> = UniversalTaskPipeline<"text-to-image", Input, Output>;

export type CreateTextToImagePipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"text-to-image">,
  "descriptor"
>;

export function createTextToImagePipeline<
  Input = TextToImageInput,
  Output = TextToImageOutput,
>(
  options: CreateTextToImagePipelineOptions,
): TextToImagePipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTextToImagePipeline;
export const createModelReference = huggingFaceTask.createModelReference;
