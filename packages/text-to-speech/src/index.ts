import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("text-to-speech");
export const huggingFaceTask = createHuggingFaceTaskPackage("text-to-speech");

export type TextToSpeechPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "text-to-speech",
  Input,
  Output
>;

export type CreateTextToSpeechPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"text-to-speech">,
  "descriptor"
>;

export function createTextToSpeechPipeline<Input = unknown, Output = unknown>(
  options: CreateTextToSpeechPipelineOptions,
): TextToSpeechPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTextToSpeechPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
