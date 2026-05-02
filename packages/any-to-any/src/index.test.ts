import { describe, expect, test } from "vitest";

import {
  createAnyToAnyPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/any-to-any";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/any-to-any", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("any-to-any");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=any-to-any");
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
    const pipeline = createAnyToAnyPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/any-to-any", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "any-to-any" } }),
    ).resolves.toMatchObject({
      task: "any-to-any",
      model: "demo/any-to-any",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "any-to-any",
        },
      },
    });
  });
});
