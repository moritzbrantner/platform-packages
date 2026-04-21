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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("fill-mask");
export const huggingFaceTask = createHuggingFaceTaskPackage("fill-mask");

export type FillMaskInput = UniversalTaskInput<"fill-mask">;
export type FillMaskOutput = UniversalTaskOutput<"fill-mask">;
export type FillMaskRequest<Input = FillMaskInput> = UniversalTaskRequest<
  "fill-mask",
  Input
>;
export type FillMaskResult<Output = FillMaskOutput> = UniversalTaskResult<
  "fill-mask",
  Output
>;
export type FillMaskPipeline<
  Input = FillMaskInput,
  Output = FillMaskOutput,
> = UniversalTaskPipeline<"fill-mask", Input, Output>;

export type CreateFillMaskPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"fill-mask">,
  "descriptor"
>;

export function createFillMaskPipeline<
  Input = FillMaskInput,
  Output = FillMaskOutput,
>(
  options: CreateFillMaskPipelineOptions,
): FillMaskPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createFillMaskPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
