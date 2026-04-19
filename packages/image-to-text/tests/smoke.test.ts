import { describe, expect, test } from "vitest";

import {
  createImageToTextPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/image-to-text";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/image-to-text", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("image-to-text");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=image-to-text");
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
    const pipeline = createImageToTextPipeline({
      provider,
      model: createModelReference("demo/image-to-text", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "image-to-text" } }),
    ).resolves.toMatchObject({
      task: "image-to-text",
      model: "demo/image-to-text",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "image-to-text",
        },
      },
    });
  });
});
