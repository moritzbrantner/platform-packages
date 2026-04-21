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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("translation");
export const huggingFaceTask = createHuggingFaceTaskPackage("translation");

export type TranslationInput = UniversalTaskInput<"translation">;
export type TranslationOutput = UniversalTaskOutput<"translation">;
export type TranslationRequest<Input = TranslationInput> = UniversalTaskRequest<
  "translation",
  Input
>;
export type TranslationResult<Output = TranslationOutput> = UniversalTaskResult<
  "translation",
  Output
>;
export type TranslationPipeline<
  Input = TranslationInput,
  Output = TranslationOutput,
> = UniversalTaskPipeline<"translation", Input, Output>;

export type CreateTranslationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"translation">,
  "descriptor"
>;

export function createTranslationPipeline<
  Input = TranslationInput,
  Output = TranslationOutput,
>(
  options: CreateTranslationPipelineOptions,
): TranslationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTranslationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
