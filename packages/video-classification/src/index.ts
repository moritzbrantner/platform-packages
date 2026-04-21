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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("video-classification");
export const huggingFaceTask = createHuggingFaceTaskPackage("video-classification");

export type VideoClassificationInput = UniversalTaskInput<"video-classification">;
export type VideoClassificationOutput = UniversalTaskOutput<"video-classification">;
export type VideoClassificationRequest<Input = VideoClassificationInput> = UniversalTaskRequest<
  "video-classification",
  Input
>;
export type VideoClassificationResult<Output = VideoClassificationOutput> = UniversalTaskResult<
  "video-classification",
  Output
>;
export type VideoClassificationPipeline<
  Input = VideoClassificationInput,
  Output = VideoClassificationOutput,
> = UniversalTaskPipeline<"video-classification", Input, Output>;

export type CreateVideoClassificationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"video-classification">,
  "descriptor"
>;

export function createVideoClassificationPipeline<
  Input = VideoClassificationInput,
  Output = VideoClassificationOutput,
>(
  options: CreateVideoClassificationPipelineOptions,
): VideoClassificationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createVideoClassificationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
