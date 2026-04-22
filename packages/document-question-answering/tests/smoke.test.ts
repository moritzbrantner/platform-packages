import { describe, expect, test } from "vitest";

import {
  createDocumentQuestionAnsweringPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/document-question-answering";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/document-question-answering", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("document-question-answering");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain(
      "pipeline_tag=document-question-answering",
    );
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
    const pipeline = createDocumentQuestionAnsweringPipeline<string, unknown>({
      provider,
      model: createModelReference("demo/document-question-answering", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "document-question-answering" } }),
    ).resolves.toMatchObject({
      task: "document-question-answering",
      model: "demo/document-question-answering",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "document-question-answering",
        },
      },
    });
  });
});
