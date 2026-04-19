import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("text-generation");
export const huggingFaceTask = createHuggingFaceTaskPackage("text-generation");

export type TextGenerationPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "text-generation",
  Input,
  Output
>;

export type CreateTextGenerationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"text-generation">,
  "descriptor"
>;

export function createTextGenerationPipeline<Input = unknown, Output = unknown>(
  options: CreateTextGenerationPipelineOptions,
): TextGenerationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTextGenerationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
