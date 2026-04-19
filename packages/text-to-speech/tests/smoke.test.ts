import { describe, expect, test } from "vitest";

import {
  createTextToSpeechPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/text-to-speech";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/text-to-speech", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("text-to-speech");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=text-to-speech");
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
    const pipeline = createTextToSpeechPipeline({
      provider,
      model: createModelReference("demo/text-to-speech", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "text-to-speech" } }),
    ).resolves.toMatchObject({
      task: "text-to-speech",
      model: "demo/text-to-speech",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "text-to-speech",
        },
      },
    });
  });
});
