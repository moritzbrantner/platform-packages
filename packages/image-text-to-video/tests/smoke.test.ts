import { describe, expect, test } from "vitest";

import {
  createImageTextToVideoPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/image-text-to-video";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/image-text-to-video", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("image-text-to-video");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=image-text-to-video");
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
    const pipeline = createImageTextToVideoPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/image-text-to-video", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "image-text-to-video" } }),
    ).resolves.toMatchObject({
      task: "image-text-to-video",
      model: "demo/image-text-to-video",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "image-text-to-video",
        },
      },
    });
  });
});
