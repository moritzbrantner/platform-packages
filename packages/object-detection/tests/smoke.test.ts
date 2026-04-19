import { describe, expect, test } from "vitest";

import {
  createObjectDetectionPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/object-detection";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/object-detection", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("object-detection");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=object-detection");
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
    const pipeline = createObjectDetectionPipeline({
      provider,
      model: createModelReference("demo/object-detection", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "object-detection" } }),
    ).resolves.toMatchObject({
      task: "object-detection",
      model: "demo/object-detection",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "object-detection",
        },
      },
    });
  });
});
