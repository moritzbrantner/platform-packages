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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("audio-text-to-text");
export const huggingFaceTask = createHuggingFaceTaskPackage("audio-text-to-text");

export type AudioTextToTextInput = UniversalTaskInput<"audio-text-to-text">;
export type AudioTextToTextOutput = UniversalTaskOutput<"audio-text-to-text">;
export type AudioTextToTextRequest<Input = AudioTextToTextInput> = UniversalTaskRequest<
  "audio-text-to-text",
  Input
>;
export type AudioTextToTextResult<Output = AudioTextToTextOutput> = UniversalTaskResult<
  "audio-text-to-text",
  Output
>;
export type AudioTextToTextPipeline<
  Input = AudioTextToTextInput,
  Output = AudioTextToTextOutput,
> = UniversalTaskPipeline<"audio-text-to-text", Input, Output>;

export type CreateAudioTextToTextPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"audio-text-to-text">,
  "descriptor"
>;

export function createAudioTextToTextPipeline<
  Input = AudioTextToTextInput,
  Output = AudioTextToTextOutput,
>(options: CreateAudioTextToTextPipelineOptions): AudioTextToTextPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createAudioTextToTextPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
