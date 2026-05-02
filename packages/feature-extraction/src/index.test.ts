import { describe, expect, test } from "vitest";

import {
  createFeatureExtractionPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/feature-extraction";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/feature-extraction", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("feature-extraction");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=feature-extraction");
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
    const pipeline = createFeatureExtractionPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/feature-extraction", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "feature-extraction" } }),
    ).resolves.toMatchObject({
      task: "feature-extraction",
      model: "demo/feature-extraction",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "feature-extraction",
        },
      },
    });
  });
});
