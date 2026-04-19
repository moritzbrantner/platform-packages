import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("image-to-3d");
export const huggingFaceTask = createHuggingFaceTaskPackage("image-to-3d");

export type ImageTo3DPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "image-to-3d",
  Input,
  Output
>;

export type CreateImageTo3DPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"image-to-3d">,
  "descriptor"
>;

export function createImageTo3DPipeline<Input = unknown, Output = unknown>(
  options: CreateImageTo3DPipelineOptions,
): ImageTo3DPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createImageTo3DPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
