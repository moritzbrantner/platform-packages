import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("table-question-answering");
export const huggingFaceTask = createHuggingFaceTaskPackage("table-question-answering");

export type TableQuestionAnsweringPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "table-question-answering",
  Input,
  Output
>;

export type CreateTableQuestionAnsweringPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"table-question-answering">,
  "descriptor"
>;

export function createTableQuestionAnsweringPipeline<Input = unknown, Output = unknown>(
  options: CreateTableQuestionAnsweringPipelineOptions,
): TableQuestionAnsweringPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTableQuestionAnsweringPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
