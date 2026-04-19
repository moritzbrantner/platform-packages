import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("automatic-speech-recognition");
export const huggingFaceTask = createHuggingFaceTaskPackage("automatic-speech-recognition");

export type AutomaticSpeechRecognitionPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "automatic-speech-recognition",
  Input,
  Output
>;

export type CreateAutomaticSpeechRecognitionPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"automatic-speech-recognition">,
  "descriptor"
>;

export function createAutomaticSpeechRecognitionPipeline<Input = unknown, Output = unknown>(
  options: CreateAutomaticSpeechRecognitionPipelineOptions,
): AutomaticSpeechRecognitionPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createAutomaticSpeechRecognitionPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
