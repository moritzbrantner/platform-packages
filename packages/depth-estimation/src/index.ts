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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("depth-estimation");
export const huggingFaceTask = createHuggingFaceTaskPackage("depth-estimation");

export type DepthEstimationInput = UniversalTaskInput<"depth-estimation">;
export type DepthEstimationOutput = UniversalTaskOutput<"depth-estimation">;
export type DepthEstimationRequest<Input = DepthEstimationInput> = UniversalTaskRequest<
  "depth-estimation",
  Input
>;
export type DepthEstimationResult<Output = DepthEstimationOutput> = UniversalTaskResult<
  "depth-estimation",
  Output
>;
export type DepthEstimationPipeline<
  Input = DepthEstimationInput,
  Output = DepthEstimationOutput,
> = UniversalTaskPipeline<"depth-estimation", Input, Output>;

export type CreateDepthEstimationPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"depth-estimation">,
  "descriptor"
>;

export function createDepthEstimationPipeline<
  Input = DepthEstimationInput,
  Output = DepthEstimationOutput,
>(
  options: CreateDepthEstimationPipelineOptions,
): DepthEstimationPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createDepthEstimationPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
