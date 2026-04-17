import { describe, expect, test } from "vitest";

import { createDocumentAnalysisPipeline } from "@moritzbrantner/document-analysis";

describe("@moritzbrantner/document-analysis", () => {
  test("orchestrates summary, sentiment, text analysis, QA, and structure hooks", async () => {
    const pipeline = createDocumentAnalysisPipeline({
      defaultQuestions: ["Where?"],
      structureHooks: [
        {
          id: "structure-auditor",
          run: ({ structured }) => ({
            findings: [`blocks=${structured.pages[0]?.blocks.length ?? 0}`],
            metadata: { pageCount: structured.pages.length },
          }),
        },
      ],
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

    const report = await pipeline.analyze({
      id: "ocr-1",
      sourceType: "pdf",
      pages: [{ index: 0, blocks: [{ text: "Where: Berlin" }] }],
    });

    expect(report.summary?.summary).toBe("Clara runs support from Berlin.");
    expect(report.sentiment?.sentiment).toBe("positive");
    expect(report.analysis?.entities[0]?.text).toBe("Berlin");
    expect(report.answers[0]?.answer?.answer).toBe("Berlin");
    expect(report.structureFindings).toEqual(["blocks=1"]);
    expect(report.structureMetadata).toEqual({
      "structure-auditor": { pageCount: 1 },
    });
    expect(report.structured?.pages[0]?.blocks[0]?.kind).toBe("headerValue");
  });
});
