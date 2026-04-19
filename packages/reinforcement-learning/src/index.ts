import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("reinforcement-learning");
export const huggingFaceTask = createHuggingFaceTaskPackage("reinforcement-learning");

export type ReinforcementLearningPipeline<Input = unknown, Output = unknown> = UniversalTaskPipeline<
  "reinforcement-learning",
  Input,
  Output
>;

export type CreateReinforcementLearningPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"reinforcement-learning">,
  "descriptor"
>;

export function createReinforcementLearningPipeline<Input = unknown, Output = unknown>(
  options: CreateReinforcementLearningPipelineOptions,
): ReinforcementLearningPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createReinforcementLearningPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
