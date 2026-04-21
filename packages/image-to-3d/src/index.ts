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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("image-to-3d");
export const huggingFaceTask = createHuggingFaceTaskPackage("image-to-3d");

export type ImageTo3DInput = UniversalTaskInput<"image-to-3d">;
export type ImageTo3DOutput = UniversalTaskOutput<"image-to-3d">;
export type ImageTo3DRequest<Input = ImageTo3DInput> = UniversalTaskRequest<
  "image-to-3d",
  Input
>;
export type ImageTo3DResult<Output = ImageTo3DOutput> = UniversalTaskResult<
  "image-to-3d",
  Output
>;
export type ImageTo3DPipeline<
  Input = ImageTo3DInput,
  Output = ImageTo3DOutput,
> = UniversalTaskPipeline<"image-to-3d", Input, Output>;

export type CreateImageTo3DPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"image-to-3d">,
  "descriptor"
>;

export function createImageTo3DPipeline<
  Input = ImageTo3DInput,
  Output = ImageTo3DOutput,
>(
  options: CreateImageTo3DPipelineOptions,
): ImageTo3DPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createImageTo3DPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
