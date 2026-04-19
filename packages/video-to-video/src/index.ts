import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("video-to-video");
export const huggingFaceTask = createHuggingFaceTaskPackage("video-to-video");

export type VideoToVideoPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "video-to-video",
  Input,
  Output
>;

export type CreateVideoToVideoPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"video-to-video">,
  "descriptor"
>;

export function createVideoToVideoPipeline<Input = unknown, Output = unknown>(
  options: CreateVideoToVideoPipelineOptions,
): VideoToVideoPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createVideoToVideoPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
