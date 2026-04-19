import { describe, expect, test } from "vitest";

import {
  createAudioTextToTextPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/audio-text-to-text";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/audio-text-to-text", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("audio-text-to-text");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=audio-text-to-text");
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
    const pipeline = createAudioTextToTextPipeline({
      provider,
      model: createModelReference("demo/audio-text-to-text", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "audio-text-to-text" } }),
    ).resolves.toMatchObject({
      task: "audio-text-to-text",
      model: "demo/audio-text-to-text",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "audio-text-to-text",
        },
      },
    });
  });
});
