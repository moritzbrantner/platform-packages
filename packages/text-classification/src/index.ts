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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("text-classification");
export const huggingFaceTask = createHuggingFaceTaskPackage("text-classification");

export type TextClassificationInput = UniversalTaskInput<"text-classification">;
export type TextClassificationOutput = UniversalTaskOutput<"text-classification">;
export type TextClassificationRequest<Input = TextClassificationInput> = UniversalTaskRequest<
  "text-classification",
  Input
>;
export type TextClassificationResult<Output = TextClassificationOutput> = UniversalTaskResult<
  "text-classification",
  Output
>;
export type TextClassificationPipeline<
  Input = TextClassificationInput,
  Output = TextClassificationOutput,
> = UniversalTaskPipeline<"text-classification", Input, Output>;

export type CreateTextClassificationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"text-classification">,
  "descriptor"
>;

export function createTextClassificationPipeline<
  Input = TextClassificationInput,
  Output = TextClassificationOutput,
>(options: CreateTextClassificationPipelineOptions): TextClassificationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTextClassificationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
