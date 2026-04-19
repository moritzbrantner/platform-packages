import { describe, expect, test } from "vitest";

import {
  createImageFeatureExtractionPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/image-feature-extraction";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/image-feature-extraction", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("image-feature-extraction");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=image-feature-extraction");
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
    const pipeline = createImageFeatureExtractionPipeline({
      provider,
      model: createModelReference("demo/image-feature-extraction", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "image-feature-extraction" } }),
    ).resolves.toMatchObject({
      task: "image-feature-extraction",
      model: "demo/image-feature-extraction",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "image-feature-extraction",
        },
      },
    });
  });
});
