import { describe, expect, test } from "vitest";

import {
  chunkTextForInference,
  collapseFeatureVector,
  createHuggingFaceTextInferenceProvider,
  mergeScoredLabels,
} from "@moritzbrantner/text-inference";

describe("@moritzbrantner/text-inference", () => {
  test("chunks text by sentence while keeping source spans", () => {
    const chunks = chunkTextForInference("Alpha one. Beta two. Gamma three.", {
      maxCharacters: 16,
      strategy: "sentence",
      id: "demo",
    });

    expect(chunks.map((chunk) => chunk.text)).toEqual([
      "Alpha one.",
      "Beta two.",
      "Gamma three.",
    ]);
    expect(chunks[1]).toMatchObject({
      documentId: "demo",
      start: 11,
      end: 20,
    });
  });

  test("collapses nested feature matrices into a single averaged embedding", () => {
    expect(
      collapseFeatureVector([
        [1, 3],
        [3, 5],
      ]),
    ).toEqual([2, 4]);
  });

  test("merges label scores across chunks", () => {
    expect(
      mergeScoredLabels([
        [{ label: "positive", score: 0.9 }],
        [
          { label: "positive", score: 0.7 },
          { label: "neutral", score: 0.2 },
        ],
      ]),
    ).toEqual([
      { label: "positive", score: 0.8 },
      { label: "neutral", score: 0.2 },
    ]);
  });

  test("wraps Hugging Face HTTP inference with normalized outputs", async () => {
    const requests: Array<{ url: string; body: string | undefined; headers: HeadersInit | undefined }> = [];
    const provider = createHuggingFaceTextInferenceProvider({
      apiKey: "hf_test",
      fetch: async (input, init) => {
        requests.push({
          url: String(input),
          body: init?.body ? String(init.body) : undefined,
          headers: init?.headers,
        });

        if (String(input).includes("bart-large-cnn")) {
          return new Response(JSON.stringify([{ summary_text: "Short summary" }]), {
            status: 200,
          });
        }

        return new Response(JSON.stringify([{ label: "POSITIVE", score: 0.98 }]), {
          status: 200,
        });
      },
    });

    const classification = await provider.classifyText({
      model: {
        task: "text-classification",
        model: "distilbert/distilbert-base-uncased-finetuned-sst-2-english",
      },
      input: "I love this.",
    });
    const summary = await provider.summarize({
      model: {
        task: "summarization",
        model: "facebook/bart-large-cnn",
      },
      input: "Long text",
    });

    expect(requests[0]?.url).toBe(
      "https://router.huggingface.co/hf-inference/models/distilbert/distilbert-base-uncased-finetuned-sst-2-english",
    );
    expect(requests[0]?.body).toContain("\"inputs\":\"I love this.\"");
    expect(requests[1]?.url).toBe(
      "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn",
    );
    expect(classification.labels[0]).toEqual({ label: "POSITIVE", score: 0.98 });
    expect(summary.summary).toBe("Short summary");
  });
});
