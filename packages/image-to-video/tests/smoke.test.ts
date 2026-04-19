import { describe, expect, test } from "vitest";

import {
  createImageToVideoPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/image-to-video";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/image-to-video", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("image-to-video");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=image-to-video");
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
    const pipeline = createImageToVideoPipeline({
      provider,
      model: createModelReference("demo/image-to-video", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "image-to-video" } }),
    ).resolves.toMatchObject({
      task: "image-to-video",
      model: "demo/image-to-video",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "image-to-video",
        },
      },
    });
  });
});
