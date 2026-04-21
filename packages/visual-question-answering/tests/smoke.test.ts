import { describe, expect, test } from "vitest";

import {
  createVisualQuestionAnsweringPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/visual-question-answering";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/visual-question-answering", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("visual-question-answering");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=visual-question-answering");
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
    const pipeline = createVisualQuestionAnsweringPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/visual-question-answering", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "visual-question-answering" } }),
    ).resolves.toMatchObject({
      task: "visual-question-answering",
      model: "demo/visual-question-answering",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "visual-question-answering",
        },
      },
    });
  });
});
