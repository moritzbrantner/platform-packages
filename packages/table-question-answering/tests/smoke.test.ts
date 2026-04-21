import { describe, expect, test } from "vitest";

import {
  createTableQuestionAnsweringPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/table-question-answering";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/table-question-answering", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("table-question-answering");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=table-question-answering");
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
    const pipeline = createTableQuestionAnsweringPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/table-question-answering", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "table-question-answering" } }),
    ).resolves.toMatchObject({
      task: "table-question-answering",
      model: "demo/table-question-answering",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "table-question-answering",
        },
      },
    });
  });
});
