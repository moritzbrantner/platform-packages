import { describe, expect, test } from "vitest";

import {
  createTextRankingPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/text-ranking";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/text-ranking", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("text-ranking");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=text-ranking");
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
    const pipeline = createTextRankingPipeline({
      provider,
      model: createModelReference("demo/text-ranking", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "text-ranking" } }),
    ).resolves.toMatchObject({
      task: "text-ranking",
      model: "demo/text-ranking",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "text-ranking",
        },
      },
    });
  });
});
