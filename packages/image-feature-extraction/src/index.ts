import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("image-feature-extraction");
export const huggingFaceTask = createHuggingFaceTaskPackage("image-feature-extraction");

export type ImageFeatureExtractionPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "image-feature-extraction",
  Input,
  Output
>;

export type CreateImageFeatureExtractionPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"image-feature-extraction">,
  "descriptor"
>;

export function createImageFeatureExtractionPipeline<Input = unknown, Output = unknown>(
  options: CreateImageFeatureExtractionPipelineOptions,
): ImageFeatureExtractionPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createImageFeatureExtractionPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
