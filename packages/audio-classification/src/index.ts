import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("audio-classification");
export const huggingFaceTask = createHuggingFaceTaskPackage("audio-classification");

export type AudioClassificationPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "audio-classification",
  Input,
  Output
>;

export type CreateAudioClassificationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"audio-classification">,
  "descriptor"
>;

export function createAudioClassificationPipeline<Input = unknown, Output = unknown>(
  options: CreateAudioClassificationPipelineOptions,
): AudioClassificationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createAudioClassificationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
