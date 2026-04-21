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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("token-classification");
export const huggingFaceTask = createHuggingFaceTaskPackage("token-classification");

export type TokenClassificationInput = UniversalTaskInput<"token-classification">;
export type TokenClassificationOutput = UniversalTaskOutput<"token-classification">;
export type TokenClassificationRequest<Input = TokenClassificationInput> = UniversalTaskRequest<
  "token-classification",
  Input
>;
export type TokenClassificationResult<Output = TokenClassificationOutput> = UniversalTaskResult<
  "token-classification",
  Output
>;
export type TokenClassificationPipeline<
  Input = TokenClassificationInput,
  Output = TokenClassificationOutput,
> = UniversalTaskPipeline<"token-classification", Input, Output>;

export type CreateTokenClassificationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"token-classification">,
  "descriptor"
>;

export function createTokenClassificationPipeline<
  Input = TokenClassificationInput,
  Output = TokenClassificationOutput,
>(
  options: CreateTokenClassificationPipelineOptions,
): TokenClassificationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTokenClassificationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
