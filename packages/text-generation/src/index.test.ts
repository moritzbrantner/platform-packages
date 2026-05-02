import { describe, expect, test } from "vitest";

import {
  createTextGenerationPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/text-generation";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/text-generation", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("text-generation");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=text-generation");
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
    const pipeline = createTextGenerationPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/text-generation", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "text-generation" } }),
    ).resolves.toMatchObject({
      task: "text-generation",
      model: "demo/text-generation",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "text-generation",
        },
      },
    });
  });
});
