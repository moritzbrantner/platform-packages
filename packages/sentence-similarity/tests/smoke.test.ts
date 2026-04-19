import { describe, expect, test } from "vitest";

import {
  createSentenceSimilarityPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/sentence-similarity";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/sentence-similarity", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("sentence-similarity");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=sentence-similarity");
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
    const pipeline = createSentenceSimilarityPipeline({
      provider,
      model: createModelReference("demo/sentence-similarity", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "sentence-similarity" } }),
    ).resolves.toMatchObject({
      task: "sentence-similarity",
      model: "demo/sentence-similarity",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "sentence-similarity",
        },
      },
    });
  });
});
