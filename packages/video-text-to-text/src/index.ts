import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("video-text-to-text");
export const huggingFaceTask = createHuggingFaceTaskPackage("video-text-to-text");

export type VideoTextToTextPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "video-text-to-text",
  Input,
  Output
>;

export type CreateVideoTextToTextPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"video-text-to-text">,
  "descriptor"
>;

export function createVideoTextToTextPipeline<Input = unknown, Output = unknown>(
  options: CreateVideoTextToTextPipelineOptions,
): VideoTextToTextPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createVideoTextToTextPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
