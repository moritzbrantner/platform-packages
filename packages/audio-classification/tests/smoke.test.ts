import { describe, expect, test } from "vitest";

import {
  createAudioClassificationPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/audio-classification";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/audio-classification", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("audio-classification");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=audio-classification");
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
    const pipeline = createAudioClassificationPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/audio-classification", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "audio-classification" } }),
    ).resolves.toMatchObject({
      task: "audio-classification",
      model: "demo/audio-classification",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "audio-classification",
        },
      },
    });
  });
});
