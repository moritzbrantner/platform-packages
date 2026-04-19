import { describe, expect, test } from "vitest";

import {
  createVideoTextToTextPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/video-text-to-text";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/video-text-to-text", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("video-text-to-text");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=video-text-to-text");
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
    const pipeline = createVideoTextToTextPipeline({
      provider,
      model: createModelReference("demo/video-text-to-text", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "video-text-to-text" } }),
    ).resolves.toMatchObject({
      task: "video-text-to-text",
      model: "demo/video-text-to-text",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "video-text-to-text",
        },
      },
    });
  });
});
