import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("visual-question-answering");
export const huggingFaceTask = createHuggingFaceTaskPackage("visual-question-answering");

export type VisualQuestionAnsweringPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "visual-question-answering",
  Input,
  Output
>;

export type CreateVisualQuestionAnsweringPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"visual-question-answering">,
  "descriptor"
>;

export function createVisualQuestionAnsweringPipeline<Input = unknown, Output = unknown>(
  options: CreateVisualQuestionAnsweringPipelineOptions,
): VisualQuestionAnsweringPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createVisualQuestionAnsweringPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
