import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("any-to-any");
export const huggingFaceTask = createHuggingFaceTaskPackage("any-to-any");

export type AnyToAnyPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "any-to-any",
  Input,
  Output
>;

export type CreateAnyToAnyPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"any-to-any">,
  "descriptor"
>;

export function createAnyToAnyPipeline<Input = unknown, Output = unknown>(
  options: CreateAnyToAnyPipelineOptions,
): AnyToAnyPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createAnyToAnyPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
