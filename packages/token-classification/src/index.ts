import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("token-classification");
export const huggingFaceTask = createHuggingFaceTaskPackage("token-classification");

export type TokenClassificationPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "token-classification",
  Input,
  Output
>;

export type CreateTokenClassificationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"token-classification">,
  "descriptor"
>;

export function createTokenClassificationPipeline<Input = unknown, Output = unknown>(
  options: CreateTokenClassificationPipelineOptions,
): TokenClassificationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTokenClassificationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
