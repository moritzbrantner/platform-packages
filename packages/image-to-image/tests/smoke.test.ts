import { describe, expect, test } from "vitest";

import {
  createImageToImagePipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/image-to-image";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/image-to-image", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("image-to-image");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=image-to-image");
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
    const pipeline = createImageToImagePipeline<string, unknown>({
      provider,
      model: createModelReference("demo/image-to-image", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "image-to-image" } }),
    ).resolves.toMatchObject({
      task: "image-to-image",
      model: "demo/image-to-image",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "image-to-image",
        },
      },
    });
  });
});
