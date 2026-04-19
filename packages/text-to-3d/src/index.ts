import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("text-to-3d");
export const huggingFaceTask = createHuggingFaceTaskPackage("text-to-3d");

export type TextTo3DPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "text-to-3d",
  Input,
  Output
>;

export type CreateTextTo3DPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"text-to-3d">,
  "descriptor"
>;

export function createTextTo3DPipeline<Input = unknown, Output = unknown>(
  options: CreateTextTo3DPipelineOptions,
): TextTo3DPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTextTo3DPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
