import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("visual-document-retrieval");
export const huggingFaceTask = createHuggingFaceTaskPackage("visual-document-retrieval");

export type VisualDocumentRetrievalPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "visual-document-retrieval",
  Input,
  Output
>;

export type CreateVisualDocumentRetrievalPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"visual-document-retrieval">,
  "descriptor"
>;

export function createVisualDocumentRetrievalPipeline<Input = unknown, Output = unknown>(
  options: CreateVisualDocumentRetrievalPipelineOptions,
): VisualDocumentRetrievalPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createVisualDocumentRetrievalPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
