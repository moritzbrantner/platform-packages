import { describe, expect, test } from "vitest";

import {
  createTextTo3DPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/text-to-3d";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/text-to-3d", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("text-to-3d");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=text-to-3d");
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
    const pipeline = createTextTo3DPipeline({
      provider,
      model: createModelReference("demo/text-to-3d", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "text-to-3d" } }),
    ).resolves.toMatchObject({
      task: "text-to-3d",
      model: "demo/text-to-3d",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "text-to-3d",
        },
      },
    });
  });
});
