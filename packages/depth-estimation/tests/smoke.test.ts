import { describe, expect, test } from "vitest";

import {
  createDepthEstimationPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/depth-estimation";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/depth-estimation", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("depth-estimation");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=depth-estimation");
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
    const pipeline = createDepthEstimationPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/depth-estimation", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "depth-estimation" } }),
    ).resolves.toMatchObject({
      task: "depth-estimation",
      model: "demo/depth-estimation",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "depth-estimation",
        },
      },
    });
  });
});
