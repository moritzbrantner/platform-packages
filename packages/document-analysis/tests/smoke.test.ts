import { describe, expect, test } from "vitest";

import { createDocumentAnalysisPipeline } from "@moritzbrantner/document-analysis";

describe("@moritzbrantner/document-analysis", () => {
  test("orchestrates summary, sentiment, text analysis, syntax analysis, and QA", async () => {
    const pipeline = createDocumentAnalysisPipeline({
      defaultQuestions: ["Where?"],
      summarization: {
        summarize: async () => ({
          model: "sum",
          summary: "Clara runs support from Berlin.",
          chunks: [],
          passes: 1,
        }),
      },
      sentimentAnalysis: {
        analyze: async () => ({
          sentiment: "positive",
          scores: {
            positive: 0.9,
            negative: 0.05,
            neutral: 0.05,
            mixed: 0,
          },
          labels: [{ label: "POSITIVE", score: 0.9 }],
          chunks: [],
        }),
      },
      textAnalysis: {
        analyze: async (input) => ({
          document: typeof input === "string" ? (null as never) : input,
          categories: [{ label: "support", score: 0.8 }],
          entities: [{ text: "Berlin", label: "LOC", score: 0.9, count: 1 }],
          keywords: [{ text: "Berlin", weight: 0.9, source: "entity" }],
          chunks: [],
        }),
      },
      syntaxAnalysis: {
        analyzeSyntax: async (input) => ({
          document: typeof input === "string" ? (null as never) : input,
          tokens: [
            {
              tokenId: "token-0",
              tokenIndex: 0,
              sentenceId: "sentence-0",
              sentenceIndex: 0,
              text: "Clara",
              normalized: "clara",
              lemma: "clara",
              posTag: "NOUN",
              score: 0.9,
            },
          ],
          lemmas: ["clara"],
          posTags: ["NOUN"],
          dependencyArcs: [],
          sentences: [],
          summary: {
            sentenceCount: 1,
            tokenCount: 1,
            posTagHistogram: [{ tag: "NOUN", count: 1 }],
            relationHistogram: [],
            topLemmas: [{ lemma: "clara", count: 1 }],
          },
        }),
        analyzeSentenceSyntax: async () => ({
          sentenceId: "sentence-0",
          sentenceIndex: 0,
          text: "Clara runs support from Berlin.",
          tokens: [],
          lemmas: [],
          posTags: [],
          dependencyArcs: [],
        }),
      },
      questionAnswering: {
        answer: async () => [],
        answerMany: async () => ({}),
        findBestAnswer: async () => ({
          question: "Where?",
          answer: "Berlin",
          score: 0.94,
          chunkId: "chunk-0",
          chunkIndex: 0,
          context: "Clara runs support from Berlin.",
        }),
        answerDocument: async () => [],
      },
    });

    const report = await pipeline.analyze("Clara runs support from Berlin.");

    expect(report.summary?.summary).toBe("Clara runs support from Berlin.");
    expect(report.sentiment?.sentiment).toBe("positive");
    expect(report.analysis?.entities[0]?.text).toBe("Berlin");
    expect(report.syntaxSummary?.topLemmas[0]?.lemma).toBe("clara");
    expect(report.answers[0]?.answer?.answer).toBe("Berlin");
  });
});
