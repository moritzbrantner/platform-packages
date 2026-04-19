import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("tabular-regression");
export const huggingFaceTask = createHuggingFaceTaskPackage("tabular-regression");

export type TabularRegressionPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "tabular-regression",
  Input,
  Output
>;

export type CreateTabularRegressionPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"tabular-regression">,
  "descriptor"
>;

export function createTabularRegressionPipeline<Input = unknown, Output = unknown>(
  options: CreateTabularRegressionPipelineOptions,
): TabularRegressionPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTabularRegressionPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
