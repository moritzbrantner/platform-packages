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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("text-to-3d");
export const huggingFaceTask = createHuggingFaceTaskPackage("text-to-3d");

export type TextTo3DInput = UniversalTaskInput<"text-to-3d">;
export type TextTo3DOutput = UniversalTaskOutput<"text-to-3d">;
export type TextTo3DRequest<Input = TextTo3DInput> = UniversalTaskRequest<
  "text-to-3d",
  Input
>;
export type TextTo3DResult<Output = TextTo3DOutput> = UniversalTaskResult<
  "text-to-3d",
  Output
>;
export type TextTo3DPipeline<
  Input = TextTo3DInput,
  Output = TextTo3DOutput,
> = UniversalTaskPipeline<"text-to-3d", Input, Output>;

export type CreateTextTo3DPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"text-to-3d">,
  "descriptor"
>;

export function createTextTo3DPipeline<
  Input = TextTo3DInput,
  Output = TextTo3DOutput,
>(
  options: CreateTextTo3DPipelineOptions,
): TextTo3DPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTextTo3DPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
