import { describe, expect, test } from "vitest";

import {
  createImageTextToTextPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/image-text-to-text";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/image-text-to-text", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("image-text-to-text");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=image-text-to-text");
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
    const pipeline = createImageTextToTextPipeline({
      provider,
      model: createModelReference("demo/image-text-to-text", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "image-text-to-text" } }),
    ).resolves.toMatchObject({
      task: "image-text-to-text",
      model: "demo/image-text-to-text",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "image-text-to-text",
        },
      },
    });
  });
});
