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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("mask-generation");
export const huggingFaceTask = createHuggingFaceTaskPackage("mask-generation");

export type MaskGenerationInput = UniversalTaskInput<"mask-generation">;
export type MaskGenerationOutput = UniversalTaskOutput<"mask-generation">;
export type MaskGenerationRequest<Input = MaskGenerationInput> = UniversalTaskRequest<
  "mask-generation",
  Input
>;
export type MaskGenerationResult<Output = MaskGenerationOutput> = UniversalTaskResult<
  "mask-generation",
  Output
>;
export type MaskGenerationPipeline<
  Input = MaskGenerationInput,
  Output = MaskGenerationOutput,
> = UniversalTaskPipeline<"mask-generation", Input, Output>;

export type CreateMaskGenerationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"mask-generation">,
  "descriptor"
>;

export function createMaskGenerationPipeline<
  Input = MaskGenerationInput,
  Output = MaskGenerationOutput,
>(options: CreateMaskGenerationPipelineOptions): MaskGenerationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createMaskGenerationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
