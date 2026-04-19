import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("fill-mask");
export const huggingFaceTask = createHuggingFaceTaskPackage("fill-mask");

export type FillMaskPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "fill-mask",
  Input,
  Output
>;

export type CreateFillMaskPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"fill-mask">,
  "descriptor"
>;

export function createFillMaskPipeline<Input = unknown, Output = unknown>(
  options: CreateFillMaskPipelineOptions,
): FillMaskPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createFillMaskPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
