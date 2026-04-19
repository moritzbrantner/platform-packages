import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("audio-text-to-text");
export const huggingFaceTask = createHuggingFaceTaskPackage("audio-text-to-text");

export type AudioTextToTextPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "audio-text-to-text",
  Input,
  Output
>;

export type CreateAudioTextToTextPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"audio-text-to-text">,
  "descriptor"
>;

export function createAudioTextToTextPipeline<Input = unknown, Output = unknown>(
  options: CreateAudioTextToTextPipelineOptions,
): AudioTextToTextPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createAudioTextToTextPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
