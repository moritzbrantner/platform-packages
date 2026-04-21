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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("video-text-to-text");
export const huggingFaceTask = createHuggingFaceTaskPackage("video-text-to-text");

export type VideoTextToTextInput = UniversalTaskInput<"video-text-to-text">;
export type VideoTextToTextOutput = UniversalTaskOutput<"video-text-to-text">;
export type VideoTextToTextRequest<Input = VideoTextToTextInput> = UniversalTaskRequest<
  "video-text-to-text",
  Input
>;
export type VideoTextToTextResult<Output = VideoTextToTextOutput> = UniversalTaskResult<
  "video-text-to-text",
  Output
>;
export type VideoTextToTextPipeline<
  Input = VideoTextToTextInput,
  Output = VideoTextToTextOutput,
> = UniversalTaskPipeline<"video-text-to-text", Input, Output>;

export type CreateVideoTextToTextPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"video-text-to-text">,
  "descriptor"
>;

export function createVideoTextToTextPipeline<
  Input = VideoTextToTextInput,
  Output = VideoTextToTextOutput,
>(
  options: CreateVideoTextToTextPipelineOptions,
): VideoTextToTextPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createVideoTextToTextPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
