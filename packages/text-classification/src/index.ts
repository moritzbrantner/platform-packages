import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("text-classification");
export const huggingFaceTask = createHuggingFaceTaskPackage("text-classification");

export type TextClassificationPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "text-classification",
  Input,
  Output
>;

export type CreateTextClassificationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"text-classification">,
  "descriptor"
>;

export function createTextClassificationPipeline<Input = unknown, Output = unknown>(
  options: CreateTextClassificationPipelineOptions,
): TextClassificationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTextClassificationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
