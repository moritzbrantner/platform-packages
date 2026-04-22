import { describe, expect, test } from "vitest";

import {
  createZeroShotObjectDetectionPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/zero-shot-object-detection";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/zero-shot-object-detection", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("zero-shot-object-detection");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain(
      "pipeline_tag=zero-shot-object-detection",
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
    const pipeline = createZeroShotObjectDetectionPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/zero-shot-object-detection", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "zero-shot-object-detection" } }),
    ).resolves.toMatchObject({
      task: "zero-shot-object-detection",
      model: "demo/zero-shot-object-detection",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "zero-shot-object-detection",
        },
      },
    });
  });
});
