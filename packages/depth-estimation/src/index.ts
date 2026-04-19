import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("depth-estimation");
export const huggingFaceTask = createHuggingFaceTaskPackage("depth-estimation");

export type DepthEstimationPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "depth-estimation",
  Input,
  Output
>;

export type CreateDepthEstimationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"depth-estimation">,
  "descriptor"
>;

export function createDepthEstimationPipeline<Input = unknown, Output = unknown>(
  options: CreateDepthEstimationPipelineOptions,
): DepthEstimationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createDepthEstimationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
