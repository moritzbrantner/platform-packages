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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor(
  "document-question-answering",
);
export const huggingFaceTask = createHuggingFaceTaskPackage("document-question-answering");

export type DocumentQuestionAnsweringInput = UniversalTaskInput<"document-question-answering">;
export type DocumentQuestionAnsweringOutput = UniversalTaskOutput<"document-question-answering">;
export type DocumentQuestionAnsweringRequest<Input = DocumentQuestionAnsweringInput> =
  UniversalTaskRequest<"document-question-answering", Input>;
export type DocumentQuestionAnsweringResult<Output = DocumentQuestionAnsweringOutput> =
  UniversalTaskResult<"document-question-answering", Output>;
export type DocumentQuestionAnsweringPipeline<
  Input = DocumentQuestionAnsweringInput,
  Output = DocumentQuestionAnsweringOutput,
> = UniversalTaskPipeline<"document-question-answering", Input, Output>;

export type CreateDocumentQuestionAnsweringPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"document-question-answering">,
  "descriptor"
>;

export function createDocumentQuestionAnsweringPipeline<
  Input = DocumentQuestionAnsweringInput,
  Output = DocumentQuestionAnsweringOutput,
>(
  options: CreateDocumentQuestionAnsweringPipelineOptions,
): DocumentQuestionAnsweringPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createDocumentQuestionAnsweringPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
