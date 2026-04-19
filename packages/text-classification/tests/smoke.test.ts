import { describe, expect, test } from "vitest";

import {
  createTextClassificationPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/text-classification";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/text-classification", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("text-classification");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=text-classification");
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
    const pipeline = createTextClassificationPipeline({
      provider,
      model: createModelReference("demo/text-classification", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "text-classification" } }),
    ).resolves.toMatchObject({
      task: "text-classification",
      model: "demo/text-classification",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "text-classification",
        },
      },
    });
  });
});
