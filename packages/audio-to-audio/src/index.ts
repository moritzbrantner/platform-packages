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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("audio-to-audio");
export const huggingFaceTask = createHuggingFaceTaskPackage("audio-to-audio");

export type AudioToAudioInput = UniversalTaskInput<"audio-to-audio">;
export type AudioToAudioOutput = UniversalTaskOutput<"audio-to-audio">;
export type AudioToAudioRequest<Input = AudioToAudioInput> = UniversalTaskRequest<
  "audio-to-audio",
  Input
>;
export type AudioToAudioResult<Output = AudioToAudioOutput> = UniversalTaskResult<
  "audio-to-audio",
  Output
>;
export type AudioToAudioPipeline<
  Input = AudioToAudioInput,
  Output = AudioToAudioOutput,
> = UniversalTaskPipeline<"audio-to-audio", Input, Output>;

export type CreateAudioToAudioPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"audio-to-audio">,
  "descriptor"
>;

export function createAudioToAudioPipeline<
  Input = AudioToAudioInput,
  Output = AudioToAudioOutput,
>(
  options: CreateAudioToAudioPipelineOptions,
): AudioToAudioPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createAudioToAudioPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
