import { describe, expect, test } from "vitest";

import {
  createImageTo3DPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/image-to-3d";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/image-to-3d", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("image-to-3d");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=image-to-3d");
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
    const pipeline = createImageTo3DPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/image-to-3d", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "image-to-3d" } }),
    ).resolves.toMatchObject({
      task: "image-to-3d",
      model: "demo/image-to-3d",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "image-to-3d",
        },
      },
    });
  });
});
