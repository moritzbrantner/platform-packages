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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("tabular-regression");
export const huggingFaceTask = createHuggingFaceTaskPackage("tabular-regression");

export type TabularRegressionInput = UniversalTaskInput<"tabular-regression">;
export type TabularRegressionOutput = UniversalTaskOutput<"tabular-regression">;
export type TabularRegressionRequest<Input = TabularRegressionInput> = UniversalTaskRequest<
  "tabular-regression",
  Input
>;
export type TabularRegressionResult<Output = TabularRegressionOutput> = UniversalTaskResult<
  "tabular-regression",
  Output
>;
export type TabularRegressionPipeline<
  Input = TabularRegressionInput,
  Output = TabularRegressionOutput,
> = UniversalTaskPipeline<"tabular-regression", Input, Output>;

export type CreateTabularRegressionPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"tabular-regression">,
  "descriptor"
>;

export function createTabularRegressionPipeline<
  Input = TabularRegressionInput,
  Output = TabularRegressionOutput,
>(options: CreateTabularRegressionPipelineOptions): TabularRegressionPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTabularRegressionPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
