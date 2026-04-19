import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("translation");
export const huggingFaceTask = createHuggingFaceTaskPackage("translation");

export type TranslationPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "translation",
  Input,
  Output
>;

export type CreateTranslationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"translation">,
  "descriptor"
>;

export function createTranslationPipeline<Input = unknown, Output = unknown>(
  options: CreateTranslationPipelineOptions,
): TranslationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTranslationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
