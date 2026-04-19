import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("tabular-classification");
export const huggingFaceTask = createHuggingFaceTaskPackage("tabular-classification");

export type TabularClassificationPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "tabular-classification",
  Input,
  Output
>;

export type CreateTabularClassificationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"tabular-classification">,
  "descriptor"
>;

export function createTabularClassificationPipeline<Input = unknown, Output = unknown>(
  options: CreateTabularClassificationPipelineOptions,
): TabularClassificationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTabularClassificationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
