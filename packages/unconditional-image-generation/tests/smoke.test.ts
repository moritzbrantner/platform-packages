import { describe, expect, test } from "vitest";

import {
  createUnconditionalImageGenerationPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/unconditional-image-generation";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/unconditional-image-generation", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("unconditional-image-generation");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain(
      "pipeline_tag=unconditional-image-generation",
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
    const pipeline = createUnconditionalImageGenerationPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/unconditional-image-generation", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "unconditional-image-generation" } }),
    ).resolves.toMatchObject({
      task: "unconditional-image-generation",
      model: "demo/unconditional-image-generation",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "unconditional-image-generation",
        },
      },
    });
  });
});
