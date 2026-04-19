import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("audio-to-audio");
export const huggingFaceTask = createHuggingFaceTaskPackage("audio-to-audio");

export type AudioToAudioPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "audio-to-audio",
  Input,
  Output
>;

export type CreateAudioToAudioPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"audio-to-audio">,
  "descriptor"
>;

export function createAudioToAudioPipeline<Input = unknown, Output = unknown>(
  options: CreateAudioToAudioPipelineOptions,
): AudioToAudioPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createAudioToAudioPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
