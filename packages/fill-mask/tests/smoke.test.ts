import { describe, expect, test } from "vitest";

import {
  createFillMaskPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/fill-mask";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/fill-mask", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("fill-mask");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=fill-mask");
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
    const pipeline = createFillMaskPipeline({
      provider,
      model: createModelReference("demo/fill-mask", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "fill-mask" } }),
    ).resolves.toMatchObject({
      task: "fill-mask",
      model: "demo/fill-mask",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "fill-mask",
        },
      },
    });
  });
});
