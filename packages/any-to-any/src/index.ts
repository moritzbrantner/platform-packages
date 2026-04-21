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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("any-to-any");
export const huggingFaceTask = createHuggingFaceTaskPackage("any-to-any");

export type AnyToAnyInput = UniversalTaskInput<"any-to-any">;
export type AnyToAnyOutput = UniversalTaskOutput<"any-to-any">;
export type AnyToAnyRequest<Input = AnyToAnyInput> = UniversalTaskRequest<
  "any-to-any",
  Input
>;
export type AnyToAnyResult<Output = AnyToAnyOutput> = UniversalTaskResult<
  "any-to-any",
  Output
>;
export type AnyToAnyPipeline<
  Input = AnyToAnyInput,
  Output = AnyToAnyOutput,
> = UniversalTaskPipeline<"any-to-any", Input, Output>;

export type CreateAnyToAnyPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"any-to-any">,
  "descriptor"
>;

export function createAnyToAnyPipeline<
  Input = AnyToAnyInput,
  Output = AnyToAnyOutput,
>(
  options: CreateAnyToAnyPipelineOptions,
): AnyToAnyPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createAnyToAnyPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
