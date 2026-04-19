import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("feature-extraction");
export const huggingFaceTask = createHuggingFaceTaskPackage("feature-extraction");

export type FeatureExtractionPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "feature-extraction",
  Input,
  Output
>;

export type CreateFeatureExtractionPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"feature-extraction">,
  "descriptor"
>;

export function createFeatureExtractionPipeline<Input = unknown, Output = unknown>(
  options: CreateFeatureExtractionPipelineOptions,
): FeatureExtractionPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createFeatureExtractionPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
