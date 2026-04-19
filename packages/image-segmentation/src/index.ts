import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("image-segmentation");
export const huggingFaceTask = createHuggingFaceTaskPackage("image-segmentation");

export type ImageSegmentationPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "image-segmentation",
  Input,
  Output
>;

export type CreateImageSegmentationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"image-segmentation">,
  "descriptor"
>;

export function createImageSegmentationPipeline<Input = unknown, Output = unknown>(
  options: CreateImageSegmentationPipelineOptions,
): ImageSegmentationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createImageSegmentationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
