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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("image-segmentation");
export const huggingFaceTask = createHuggingFaceTaskPackage("image-segmentation");

export type ImageSegmentationInput = UniversalTaskInput<"image-segmentation">;
export type ImageSegmentationOutput = UniversalTaskOutput<"image-segmentation">;
export type ImageSegmentationRequest<Input = ImageSegmentationInput> = UniversalTaskRequest<
  "image-segmentation",
  Input
>;
export type ImageSegmentationResult<Output = ImageSegmentationOutput> = UniversalTaskResult<
  "image-segmentation",
  Output
>;
export type ImageSegmentationPipeline<
  Input = ImageSegmentationInput,
  Output = ImageSegmentationOutput,
> = UniversalTaskPipeline<"image-segmentation", Input, Output>;

export type CreateImageSegmentationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"image-segmentation">,
  "descriptor"
>;

export function createImageSegmentationPipeline<
  Input = ImageSegmentationInput,
  Output = ImageSegmentationOutput,
>(
  options: CreateImageSegmentationPipelineOptions,
): ImageSegmentationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createImageSegmentationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
