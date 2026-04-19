import { describe, expect, test } from "vitest";

import {
  createVideoToVideoPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/video-to-video";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/video-to-video", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("video-to-video");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=video-to-video");
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
    const pipeline = createVideoToVideoPipeline({
      provider,
      model: createModelReference("demo/video-to-video", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "video-to-video" } }),
    ).resolves.toMatchObject({
      task: "video-to-video",
      model: "demo/video-to-video",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "video-to-video",
        },
      },
    });
  });
});
