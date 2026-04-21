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

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("reinforcement-learning");
export const huggingFaceTask = createHuggingFaceTaskPackage("reinforcement-learning");

export type ReinforcementLearningInput = UniversalTaskInput<"reinforcement-learning">;
export type ReinforcementLearningOutput = UniversalTaskOutput<"reinforcement-learning">;
export type ReinforcementLearningRequest<Input = ReinforcementLearningInput> = UniversalTaskRequest<
  "reinforcement-learning",
  Input
>;
export type ReinforcementLearningResult<Output = ReinforcementLearningOutput> = UniversalTaskResult<
  "reinforcement-learning",
  Output
>;
export type ReinforcementLearningPipeline<
  Input = ReinforcementLearningInput,
  Output = ReinforcementLearningOutput,
> = UniversalTaskPipeline<"reinforcement-learning", Input, Output>;

export type CreateReinforcementLearningPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"reinforcement-learning">,
  "descriptor"
>;

export function createReinforcementLearningPipeline<
  Input = ReinforcementLearningInput,
  Output = ReinforcementLearningOutput,
>(
  options: CreateReinforcementLearningPipelineOptions,
): ReinforcementLearningPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

export const createPipeline = createReinforcementLearningPipeline;
export const createModelReference = huggingFaceTask.createModelReference;
