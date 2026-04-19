import { describe, expect, test } from "vitest";

import {
  createMaskGenerationPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/mask-generation";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/mask-generation", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("mask-generation");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=mask-generation");
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
    const pipeline = createMaskGenerationPipeline({
      provider,
      model: createModelReference("demo/mask-generation", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "mask-generation" } }),
    ).resolves.toMatchObject({
      task: "mask-generation",
      model: "demo/mask-generation",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "mask-generation",
        },
      },
    });
  });
});
