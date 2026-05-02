import { describe, expect, test } from "vitest";

import { createSyntaxPipeline } from "./index";

describe("@moritzbrantner/syntax-analysis", () => {
  test("builds sentence and document syntax analyses", async () => {
    const pipeline = createSyntaxPipeline({
      posTagger: {
        provider: {
          id: "pos",
          async classifyTokens({ input }) {
            const entities = input
              .split(/\s+/u)
              .filter(Boolean)
              .map((token, index) => ({
                text: token.replace(/[^\p{L}\p{N}]/gu, ""),
                label: index === 0 ? "NOUN" : index === 1 ? "VERB" : "NOUN",
                score: 0.85,
              }));

            return {
              model: "pos",
              entities,
              raw: null,
            };
          },
        },
        model: {
          task: "token-classification",
          model: "vblagoje/bert-english-uncased-finetuned-pos",
        },
      },
      lemmatizer: {
        provider: {
          id: "lemma",
          async classifyTokens({ input }) {
            const entities = input
              .split(/\s+/u)
              .filter(Boolean)
              .map((token) => ({
                text: token.replace(/[^\p{L}\p{N}]/gu, ""),
                label: `lemma:${token.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, "")}`,
                score: 0.81,
              }));

            return {
              model: "lemma",
              entities,
              raw: null,
            };
          },
        },
        model: {
          task: "token-classification",
          model: "custom/lemma-tagger",
        },
      },
      dependencyParser: {
        provider: {
          id: "deps",
          async classifyText() {
            return {
              model: "deps",
              labels: [
                { label: "root>2 root", score: 0.9 },
                { label: "2>1 nsubj", score: 0.88 },
                { label: "2>3 obj", score: 0.84 },
              ],
              raw: null,
            };
          },
        },
        model: {
          task: "text-classification",
          model: "custom/dependency-parser",
        },
      },
    });

    const result = await pipeline.analyzeSyntax("Clara migrated services.");

    expect(result.tokens.map((token) => token.lemma)).toContain("clara");
    expect(result.posTags).toContain("NOUN");
    expect(result.dependencyArcs).toHaveLength(3);
    expect(result.sentences).toHaveLength(1);
    expect(result.summary.relationHistogram[0]?.relation).toBe("nsubj");
  });
});
