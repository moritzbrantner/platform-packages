import { describe, expect, test } from "vitest";

import {
  createImageTextToImagePipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/image-text-to-image";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/image-text-to-image", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("image-text-to-image");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=image-text-to-image");
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
    const pipeline = createImageTextToImagePipeline<string, unknown>({
      provider,
      model: createModelReference("demo/image-text-to-image", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "image-text-to-image" } }),
    ).resolves.toMatchObject({
      task: "image-text-to-image",
      model: "demo/image-text-to-image",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "image-text-to-image",
        },
      },
    });
  });
});
