import { describe, expect, test } from "vitest";

import {
  createZeroShotClassificationPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/zero-shot-classification";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/zero-shot-classification", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("zero-shot-classification");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain(
      "pipeline_tag=zero-shot-classification",
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
    const pipeline = createZeroShotClassificationPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/zero-shot-classification", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "zero-shot-classification" } }),
    ).resolves.toMatchObject({
      task: "zero-shot-classification",
      model: "demo/zero-shot-classification",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "zero-shot-classification",
        },
      },
    });
  });
});
