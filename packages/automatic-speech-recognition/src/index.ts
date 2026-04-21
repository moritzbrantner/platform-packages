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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("automatic-speech-recognition");
export const huggingFaceTask = createHuggingFaceTaskPackage("automatic-speech-recognition");

export type AutomaticSpeechRecognitionInput = UniversalTaskInput<"automatic-speech-recognition">;
export type AutomaticSpeechRecognitionOutput = UniversalTaskOutput<"automatic-speech-recognition">;
export type AutomaticSpeechRecognitionRequest<Input = AutomaticSpeechRecognitionInput> = UniversalTaskRequest<
  "automatic-speech-recognition",
  Input
>;
export type AutomaticSpeechRecognitionResult<Output = AutomaticSpeechRecognitionOutput> = UniversalTaskResult<
  "automatic-speech-recognition",
  Output
>;
export type AutomaticSpeechRecognitionPipeline<
  Input = AutomaticSpeechRecognitionInput,
  Output = AutomaticSpeechRecognitionOutput,
> = UniversalTaskPipeline<"automatic-speech-recognition", Input, Output>;

export type CreateAutomaticSpeechRecognitionPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"automatic-speech-recognition">,
  "descriptor"
>;

export function createAutomaticSpeechRecognitionPipeline<
  Input = AutomaticSpeechRecognitionInput,
  Output = AutomaticSpeechRecognitionOutput,
>(
  options: CreateAutomaticSpeechRecognitionPipelineOptions,
): AutomaticSpeechRecognitionPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createAutomaticSpeechRecognitionPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
