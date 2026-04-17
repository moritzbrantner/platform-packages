import { describe, expect, test } from "vitest";

import { createTextAnalysisPipeline } from "@moritzbrantner/text-analysis";

describe("@moritzbrantner/text-analysis", () => {
  test("combines categories, entities, embeddings, and keywords", async () => {
    const pipeline = createTextAnalysisPipeline({
      classifier: {
        provider: {
          id: "classifier",
          async classifyText() {
            return {
              model: "classifier",
              labels: [
                { label: "support", score: 0.8 },
                { label: "billing", score: 0.2 },
              ],
              raw: null,
            };
          },
        },
        model: {
          task: "text-classification",
          model: "facebook/bart-large-mnli",
        },
      },
      entityRecognizer: {
        provider: {
          id: "ner",
          async classifyTokens({ input }) {
            if (input.includes("Berlin")) {
              return {
                model: "ner",
                entities: [{ text: "Berlin", label: "LOC", score: 0.9 }],
                raw: null,
              };
            }

            return {
              model: "ner",
              entities: [{ text: "Clara", label: "PER", score: 0.95 }],
              raw: null,
            };
          },
        },
        model: {
          task: "token-classification",
          model: "dslim/bert-base-NER",
        },
      },
      embedder: {
        provider: {
          id: "embedder",
          async extractFeatures({ input }) {
            return {
              model: "embedder",
              value: [[input.length, 2]],
              vector: [input.length, 2],
              raw: null,
            };
          },
        },
        model: {
          task: "feature-extraction",
          model: "sentence-transformers/all-MiniLM-L6-v2",
        },
      },
      chunking: {
        strategy: "sentence",
        maxCharacters: 24,
      },
    });

    const result = await pipeline.analyze("Clara runs support. Clara works from Berlin.");

    expect(result.categories[0]).toEqual({ label: "support", score: 0.8 });
    expect(result.entities.map((entity) => entity.text)).toEqual(["Clara", "Berlin"]);
    expect(result.embedding).toHaveLength(2);
    expect(result.keywords[0]?.text).toBe("Clara");
    expect(result.chunks).toHaveLength(2);
  });
});
