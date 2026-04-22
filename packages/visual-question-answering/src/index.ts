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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("visual-question-answering");
export const huggingFaceTask = createHuggingFaceTaskPackage("visual-question-answering");

export type VisualQuestionAnsweringInput = UniversalTaskInput<"visual-question-answering">;
export type VisualQuestionAnsweringOutput = UniversalTaskOutput<"visual-question-answering">;
export type VisualQuestionAnsweringRequest<Input = VisualQuestionAnsweringInput> =
  UniversalTaskRequest<"visual-question-answering", Input>;
export type VisualQuestionAnsweringResult<Output = VisualQuestionAnsweringOutput> =
  UniversalTaskResult<"visual-question-answering", Output>;
export type VisualQuestionAnsweringPipeline<
  Input = VisualQuestionAnsweringInput,
  Output = VisualQuestionAnsweringOutput,
> = UniversalTaskPipeline<"visual-question-answering", Input, Output>;

export type CreateVisualQuestionAnsweringPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"visual-question-answering">,
  "descriptor"
>;

export function createVisualQuestionAnsweringPipeline<
  Input = VisualQuestionAnsweringInput,
  Output = VisualQuestionAnsweringOutput,
>(
  options: CreateVisualQuestionAnsweringPipelineOptions,
): VisualQuestionAnsweringPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createVisualQuestionAnsweringPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
