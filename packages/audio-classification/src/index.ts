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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("audio-classification");
export const huggingFaceTask = createHuggingFaceTaskPackage("audio-classification");

export type AudioClassificationInput = UniversalTaskInput<"audio-classification">;
export type AudioClassificationOutput = UniversalTaskOutput<"audio-classification">;
export type AudioClassificationRequest<Input = AudioClassificationInput> = UniversalTaskRequest<
  "audio-classification",
  Input
>;
export type AudioClassificationResult<Output = AudioClassificationOutput> = UniversalTaskResult<
  "audio-classification",
  Output
>;
export type AudioClassificationPipeline<
  Input = AudioClassificationInput,
  Output = AudioClassificationOutput,
> = UniversalTaskPipeline<"audio-classification", Input, Output>;

export type CreateAudioClassificationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"audio-classification">,
  "descriptor"
>;

export function createAudioClassificationPipeline<
  Input = AudioClassificationInput,
  Output = AudioClassificationOutput,
>(options: CreateAudioClassificationPipelineOptions): AudioClassificationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createAudioClassificationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
