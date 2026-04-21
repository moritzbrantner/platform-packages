import { describe, expect, test } from "vitest";

import {
  createZeroShotImageClassificationPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/zero-shot-image-classification";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/zero-shot-image-classification", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("zero-shot-image-classification");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=zero-shot-image-classification");
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
    const pipeline = createZeroShotImageClassificationPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/zero-shot-image-classification", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "zero-shot-image-classification" } }),
    ).resolves.toMatchObject({
      task: "zero-shot-image-classification",
      model: "demo/zero-shot-image-classification",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "zero-shot-image-classification",
        },
      },
    });
  });
});
