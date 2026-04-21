import { describe, expect, test } from "vitest";

import {
  createTextToImagePipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/text-to-image";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/text-to-image", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("text-to-image");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=text-to-image");
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
    const pipeline = createTextToImagePipeline<string, unknown>({
      provider,
      model: createModelReference("demo/text-to-image", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "text-to-image" } }),
    ).resolves.toMatchObject({
      task: "text-to-image",
      model: "demo/text-to-image",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "text-to-image",
        },
      },
    });
  });
});
