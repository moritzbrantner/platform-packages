import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("document-question-answering");
export const huggingFaceTask = createHuggingFaceTaskPackage("document-question-answering");

export type DocumentQuestionAnsweringPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "document-question-answering",
  Input,
  Output
>;

export type CreateDocumentQuestionAnsweringPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"document-question-answering">,
  "descriptor"
>;

export function createDocumentQuestionAnsweringPipeline<Input = unknown, Output = unknown>(
  options: CreateDocumentQuestionAnsweringPipelineOptions,
): DocumentQuestionAnsweringPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createDocumentQuestionAnsweringPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
