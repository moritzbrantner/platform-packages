import { describe, expect, test } from "vitest";

import {
  createTokenClassificationPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/token-classification";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/token-classification", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("token-classification");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=token-classification");
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
    const pipeline = createTokenClassificationPipeline({
      provider,
      model: createModelReference("demo/token-classification", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "token-classification" } }),
    ).resolves.toMatchObject({
      task: "token-classification",
      model: "demo/token-classification",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "token-classification",
        },
      },
    });
  });
});
