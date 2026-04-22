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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("text-to-speech");
export const huggingFaceTask = createHuggingFaceTaskPackage("text-to-speech");

export type TextToSpeechInput = UniversalTaskInput<"text-to-speech">;
export type TextToSpeechOutput = UniversalTaskOutput<"text-to-speech">;
export type TextToSpeechRequest<Input = TextToSpeechInput> = UniversalTaskRequest<
  "text-to-speech",
  Input
>;
export type TextToSpeechResult<Output = TextToSpeechOutput> = UniversalTaskResult<
  "text-to-speech",
  Output
>;
export type TextToSpeechPipeline<
  Input = TextToSpeechInput,
  Output = TextToSpeechOutput,
> = UniversalTaskPipeline<"text-to-speech", Input, Output>;

export type CreateTextToSpeechPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"text-to-speech">,
  "descriptor"
>;

export function createTextToSpeechPipeline<Input = TextToSpeechInput, Output = TextToSpeechOutput>(
  options: CreateTextToSpeechPipelineOptions,
): TextToSpeechPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTextToSpeechPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
