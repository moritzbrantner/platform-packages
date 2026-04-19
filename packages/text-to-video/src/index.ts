import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("text-to-video");
export const huggingFaceTask = createHuggingFaceTaskPackage("text-to-video");

export type TextToVideoPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "text-to-video",
  Input,
  Output
>;

export type CreateTextToVideoPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"text-to-video">,
  "descriptor"
>;

export function createTextToVideoPipeline<Input = unknown, Output = unknown>(
  options: CreateTextToVideoPipelineOptions,
): TextToVideoPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTextToVideoPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
