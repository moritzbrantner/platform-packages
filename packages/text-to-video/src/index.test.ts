import { describe, expect, test } from "vitest";

import {
  createTextToVideoPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/text-to-video";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/text-to-video", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("text-to-video");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=text-to-video");
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
    const pipeline = createTextToVideoPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/text-to-video", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "text-to-video" } }),
    ).resolves.toMatchObject({
      task: "text-to-video",
      model: "demo/text-to-video",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "text-to-video",
        },
      },
    });
  });
});
