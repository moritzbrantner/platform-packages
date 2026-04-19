import { describe, expect, test } from "vitest";

import {
  createAutomaticSpeechRecognitionPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/automatic-speech-recognition";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/automatic-speech-recognition", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("automatic-speech-recognition");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=automatic-speech-recognition");
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
    const pipeline = createAutomaticSpeechRecognitionPipeline({
      provider,
      model: createModelReference("demo/automatic-speech-recognition", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "automatic-speech-recognition" } }),
    ).resolves.toMatchObject({
      task: "automatic-speech-recognition",
      model: "demo/automatic-speech-recognition",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "automatic-speech-recognition",
        },
      },
    });
  });
});
