import { describe, expect, test } from "vitest";

import {
  createTabularRegressionPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/tabular-regression";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/tabular-regression", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("tabular-regression");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=tabular-regression");
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
    const pipeline = createTabularRegressionPipeline({
      provider,
      model: createModelReference("demo/tabular-regression", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "tabular-regression" } }),
    ).resolves.toMatchObject({
      task: "tabular-regression",
      model: "demo/tabular-regression",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "tabular-regression",
        },
      },
    });
  });
});
