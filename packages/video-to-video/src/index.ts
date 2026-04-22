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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("video-to-video");
export const huggingFaceTask = createHuggingFaceTaskPackage("video-to-video");

export type VideoToVideoInput = UniversalTaskInput<"video-to-video">;
export type VideoToVideoOutput = UniversalTaskOutput<"video-to-video">;
export type VideoToVideoRequest<Input = VideoToVideoInput> = UniversalTaskRequest<
  "video-to-video",
  Input
>;
export type VideoToVideoResult<Output = VideoToVideoOutput> = UniversalTaskResult<
  "video-to-video",
  Output
>;
export type VideoToVideoPipeline<
  Input = VideoToVideoInput,
  Output = VideoToVideoOutput,
> = UniversalTaskPipeline<"video-to-video", Input, Output>;

export type CreateVideoToVideoPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"video-to-video">,
  "descriptor"
>;

export function createVideoToVideoPipeline<Input = VideoToVideoInput, Output = VideoToVideoOutput>(
  options: CreateVideoToVideoPipelineOptions,
): VideoToVideoPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createVideoToVideoPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
