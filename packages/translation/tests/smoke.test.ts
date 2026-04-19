import { describe, expect, test } from "vitest";

import {
  createTranslationPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/translation";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/translation", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("translation");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=translation");
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
    const pipeline = createTranslationPipeline({
      provider,
      model: createModelReference("demo/translation", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "translation" } }),
    ).resolves.toMatchObject({
      task: "translation",
      model: "demo/translation",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "translation",
        },
      },
    });
  });
});
