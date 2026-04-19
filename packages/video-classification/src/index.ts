import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("video-classification");
export const huggingFaceTask = createHuggingFaceTaskPackage("video-classification");

export type VideoClassificationPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "video-classification",
  Input,
  Output
>;

export type CreateVideoClassificationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"video-classification">,
  "descriptor"
>;

export function createVideoClassificationPipeline<Input = unknown, Output = unknown>(
  options: CreateVideoClassificationPipelineOptions,
): VideoClassificationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createVideoClassificationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
