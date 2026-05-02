import { describe, expect, test } from "vitest";

import {
  createAudioToAudioPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/audio-to-audio";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/audio-to-audio", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("audio-to-audio");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=audio-to-audio");
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
    const pipeline = createAudioToAudioPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/audio-to-audio", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "audio-to-audio" } }),
    ).resolves.toMatchObject({
      task: "audio-to-audio",
      model: "demo/audio-to-audio",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "audio-to-audio",
        },
      },
    });
  });
});
