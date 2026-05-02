import { describe, expect, test } from "vitest";

import {
  createKeypointDetectionPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/keypoint-detection";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/keypoint-detection", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("keypoint-detection");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=keypoint-detection");
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
    const pipeline = createKeypointDetectionPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/keypoint-detection", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "keypoint-detection" } }),
    ).resolves.toMatchObject({
      task: "keypoint-detection",
      model: "demo/keypoint-detection",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "keypoint-detection",
        },
      },
    });
  });
});
