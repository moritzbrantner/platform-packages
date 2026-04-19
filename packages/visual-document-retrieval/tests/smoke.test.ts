import { describe, expect, test } from "vitest";

import {
  createVisualDocumentRetrievalPipeline,
  createModelReference,
  huggingFaceTaskDescriptor,
} from "@moritzbrantner/visual-document-retrieval";
import type { UniversalHuggingFaceProvider } from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/visual-document-retrieval", () => {
  test("exports the Hugging Face task descriptor", () => {
    expect(huggingFaceTaskDescriptor.task).toBe("visual-document-retrieval");
    expect(huggingFaceTaskDescriptor.modelSearchUrl).toContain("pipeline_tag=visual-document-retrieval");
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
    const pipeline = createVisualDocumentRetrievalPipeline({
      provider,
      model: createModelReference("demo/visual-document-retrieval", {
        parameters: { shared: true },
      }),
    });

    await expect(
      pipeline.run("input", { parameters: { package: "visual-document-retrieval" } }),
    ).resolves.toMatchObject({
      task: "visual-document-retrieval",
      model: "demo/visual-document-retrieval",
      output: {
        input: "input",
        parameters: {
          shared: true,
          package: "visual-document-retrieval",
        },
      },
    });
  });
});
