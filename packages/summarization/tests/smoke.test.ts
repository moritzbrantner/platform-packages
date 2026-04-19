import { describe, expect, test } from "vitest";

import {
  createSummarizationPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/summarization";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/summarization", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("summarization");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=summarization");
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
    const pipeline = createSummarizationPipeline({
      provider,
      model: createModelReference("demo/summarization", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "summarization" } }),
    ).resolves.toMatchObject({
      task: "summarization",
      model: "demo/summarization",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "summarization",
        },
      },
    });
  });
});
