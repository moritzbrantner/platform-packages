import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("text-ranking");
export const huggingFaceTask = createHuggingFaceTaskPackage("text-ranking");

export type TextRankingPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "text-ranking",
  Input,
  Output
>;

export type CreateTextRankingPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"text-ranking">,
  "descriptor"
>;

export function createTextRankingPipeline<Input = unknown, Output = unknown>(
  options: CreateTextRankingPipelineOptions,
): TextRankingPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTextRankingPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
