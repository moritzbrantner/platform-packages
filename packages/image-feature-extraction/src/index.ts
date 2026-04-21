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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("image-feature-extraction");
export const huggingFaceTask = createHuggingFaceTaskPackage("image-feature-extraction");

export type ImageFeatureExtractionInput = UniversalTaskInput<"image-feature-extraction">;
export type ImageFeatureExtractionOutput = UniversalTaskOutput<"image-feature-extraction">;
export type ImageFeatureExtractionRequest<Input = ImageFeatureExtractionInput> = UniversalTaskRequest<
  "image-feature-extraction",
  Input
>;
export type ImageFeatureExtractionResult<Output = ImageFeatureExtractionOutput> = UniversalTaskResult<
  "image-feature-extraction",
  Output
>;
export type ImageFeatureExtractionPipeline<
  Input = ImageFeatureExtractionInput,
  Output = ImageFeatureExtractionOutput,
> = UniversalTaskPipeline<"image-feature-extraction", Input, Output>;

export type CreateImageFeatureExtractionPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"image-feature-extraction">,
  "descriptor"
>;

export function createImageFeatureExtractionPipeline<
  Input = ImageFeatureExtractionInput,
  Output = ImageFeatureExtractionOutput,
>(
  options: CreateImageFeatureExtractionPipelineOptions,
): ImageFeatureExtractionPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createImageFeatureExtractionPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
