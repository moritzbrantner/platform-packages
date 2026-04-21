import { describe, expect, test } from "vitest";

import {
  createTabularClassificationPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/tabular-classification";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/tabular-classification", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("tabular-classification");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=tabular-classification");
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
    const pipeline = createTabularClassificationPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/tabular-classification", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "tabular-classification" } }),
    ).resolves.toMatchObject({
      task: "tabular-classification",
      model: "demo/tabular-classification",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "tabular-classification",
        },
      },
    });
  });
});
