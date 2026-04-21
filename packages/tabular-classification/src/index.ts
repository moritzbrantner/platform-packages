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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("tabular-classification");
export const huggingFaceTask = createHuggingFaceTaskPackage("tabular-classification");

export type TabularClassificationInput = UniversalTaskInput<"tabular-classification">;
export type TabularClassificationOutput = UniversalTaskOutput<"tabular-classification">;
export type TabularClassificationRequest<Input = TabularClassificationInput> = UniversalTaskRequest<
  "tabular-classification",
  Input
>;
export type TabularClassificationResult<Output = TabularClassificationOutput> = UniversalTaskResult<
  "tabular-classification",
  Output
>;
export type TabularClassificationPipeline<
  Input = TabularClassificationInput,
  Output = TabularClassificationOutput,
> = UniversalTaskPipeline<"tabular-classification", Input, Output>;

export type CreateTabularClassificationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"tabular-classification">,
  "descriptor"
>;

export function createTabularClassificationPipeline<
  Input = TabularClassificationInput,
  Output = TabularClassificationOutput,
>(
  options: CreateTabularClassificationPipelineOptions,
): TabularClassificationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTabularClassificationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
