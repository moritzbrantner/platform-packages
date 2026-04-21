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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("table-question-answering");
export const huggingFaceTask = createHuggingFaceTaskPackage("table-question-answering");

export type TableQuestionAnsweringInput = UniversalTaskInput<"table-question-answering">;
export type TableQuestionAnsweringOutput = UniversalTaskOutput<"table-question-answering">;
export type TableQuestionAnsweringRequest<Input = TableQuestionAnsweringInput> = UniversalTaskRequest<
  "table-question-answering",
  Input
>;
export type TableQuestionAnsweringResult<Output = TableQuestionAnsweringOutput> = UniversalTaskResult<
  "table-question-answering",
  Output
>;
export type TableQuestionAnsweringPipeline<
  Input = TableQuestionAnsweringInput,
  Output = TableQuestionAnsweringOutput,
> = UniversalTaskPipeline<"table-question-answering", Input, Output>;

export type CreateTableQuestionAnsweringPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"table-question-answering">,
  "descriptor"
>;

export function createTableQuestionAnsweringPipeline<
  Input = TableQuestionAnsweringInput,
  Output = TableQuestionAnsweringOutput,
>(
  options: CreateTableQuestionAnsweringPipelineOptions,
): TableQuestionAnsweringPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTableQuestionAnsweringPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
