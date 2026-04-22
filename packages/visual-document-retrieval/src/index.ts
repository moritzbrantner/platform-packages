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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("visual-document-retrieval");
export const huggingFaceTask = createHuggingFaceTaskPackage("visual-document-retrieval");

export type VisualDocumentRetrievalInput = UniversalTaskInput<"visual-document-retrieval">;
export type VisualDocumentRetrievalOutput = UniversalTaskOutput<"visual-document-retrieval">;
export type VisualDocumentRetrievalRequest<Input = VisualDocumentRetrievalInput> =
  UniversalTaskRequest<"visual-document-retrieval", Input>;
export type VisualDocumentRetrievalResult<Output = VisualDocumentRetrievalOutput> =
  UniversalTaskResult<"visual-document-retrieval", Output>;
export type VisualDocumentRetrievalPipeline<
  Input = VisualDocumentRetrievalInput,
  Output = VisualDocumentRetrievalOutput,
> = UniversalTaskPipeline<"visual-document-retrieval", Input, Output>;

export type CreateVisualDocumentRetrievalPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"visual-document-retrieval">,
  "descriptor"
>;

export function createVisualDocumentRetrievalPipeline<
  Input = VisualDocumentRetrievalInput,
  Output = VisualDocumentRetrievalOutput,
>(
  options: CreateVisualDocumentRetrievalPipelineOptions,
): VisualDocumentRetrievalPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createVisualDocumentRetrievalPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
