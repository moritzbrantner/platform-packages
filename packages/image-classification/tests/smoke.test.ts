import { describe, expect, test } from "vitest";

import {
  createImageClassificationPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/image-classification";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/image-classification", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("image-classification");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=image-classification");
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
    const pipeline = createImageClassificationPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/image-classification", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "image-classification" } }),
    ).resolves.toMatchObject({
      task: "image-classification",
      model: "demo/image-classification",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "image-classification",
        },
      },
    });
  });
});
