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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("feature-extraction");
export const huggingFaceTask = createHuggingFaceTaskPackage("feature-extraction");

export type FeatureExtractionInput = UniversalTaskInput<"feature-extraction">;
export type FeatureExtractionOutput = UniversalTaskOutput<"feature-extraction">;
export type FeatureExtractionRequest<Input = FeatureExtractionInput> = UniversalTaskRequest<
  "feature-extraction",
  Input
>;
export type FeatureExtractionResult<Output = FeatureExtractionOutput> = UniversalTaskResult<
  "feature-extraction",
  Output
>;
export type FeatureExtractionPipeline<
  Input = FeatureExtractionInput,
  Output = FeatureExtractionOutput,
> = UniversalTaskPipeline<"feature-extraction", Input, Output>;

export type CreateFeatureExtractionPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"feature-extraction">,
  "descriptor"
>;

export function createFeatureExtractionPipeline<
  Input = FeatureExtractionInput,
  Output = FeatureExtractionOutput,
>(
  options: CreateFeatureExtractionPipelineOptions,
): FeatureExtractionPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createFeatureExtractionPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
