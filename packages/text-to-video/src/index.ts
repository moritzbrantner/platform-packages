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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("text-to-video");
export const huggingFaceTask = createHuggingFaceTaskPackage("text-to-video");

export type TextToVideoInput = UniversalTaskInput<"text-to-video">;
export type TextToVideoOutput = UniversalTaskOutput<"text-to-video">;
export type TextToVideoRequest<Input = TextToVideoInput> = UniversalTaskRequest<
  "text-to-video",
  Input
>;
export type TextToVideoResult<Output = TextToVideoOutput> = UniversalTaskResult<
  "text-to-video",
  Output
>;
export type TextToVideoPipeline<
  Input = TextToVideoInput,
  Output = TextToVideoOutput,
> = UniversalTaskPipeline<"text-to-video", Input, Output>;

export type CreateTextToVideoPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"text-to-video">,
  "descriptor"
>;

export function createTextToVideoPipeline<
  Input = TextToVideoInput,
  Output = TextToVideoOutput,
>(
  options: CreateTextToVideoPipelineOptions,
): TextToVideoPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTextToVideoPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
