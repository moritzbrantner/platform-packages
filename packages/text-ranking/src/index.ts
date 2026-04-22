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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("text-ranking");
export const huggingFaceTask = createHuggingFaceTaskPackage("text-ranking");

export type TextRankingInput = UniversalTaskInput<"text-ranking">;
export type TextRankingOutput = UniversalTaskOutput<"text-ranking">;
export type TextRankingRequest<Input = TextRankingInput> = UniversalTaskRequest<
  "text-ranking",
  Input
>;
export type TextRankingResult<Output = TextRankingOutput> = UniversalTaskResult<
  "text-ranking",
  Output
>;
export type TextRankingPipeline<
  Input = TextRankingInput,
  Output = TextRankingOutput,
> = UniversalTaskPipeline<"text-ranking", Input, Output>;

export type CreateTextRankingPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"text-ranking">,
  "descriptor"
>;

export function createTextRankingPipeline<Input = TextRankingInput, Output = TextRankingOutput>(
  options: CreateTextRankingPipelineOptions,
): TextRankingPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createTextRankingPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
