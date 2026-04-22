import { describe, expect, test } from "vitest";

import {
  createReinforcementLearningPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/reinforcement-learning";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/reinforcement-learning", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("reinforcement-learning");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain(
      "pipeline_tag=reinforcement-learning",
    );
  });

  test("creates a universal pipeline for the task", async () => {
    const provider: UniversalHuggingFaceProvider = {
      id: "fake",
      async run(request) {
        return {
          task: request.task,
          model: request.model.model,
          output: { input: request.input, parameters: request.parameters },
          raw: null,
        };
      },
    };
    const pipeline = createReinforcementLearningPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/reinforcement-learning", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "reinforcement-learning" } }),
    ).resolves.toMatchObject({
      task: "reinforcement-learning",
      model: "demo/reinforcement-learning",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "reinforcement-learning",
        },
      },
    });
  });
});
