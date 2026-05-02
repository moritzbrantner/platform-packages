import { describe, expect, test } from "vitest";

import {
  createImageSegmentationPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/image-segmentation";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/image-segmentation", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("image-segmentation");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=image-segmentation");
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
    const pipeline = createImageSegmentationPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/image-segmentation", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "image-segmentation" } }),
    ).resolves.toMatchObject({
      task: "image-segmentation",
      model: "demo/image-segmentation",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "image-segmentation",
        },
      },
    });
  });
});
