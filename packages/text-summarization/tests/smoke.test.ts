import { describe, expect, test } from "vitest";

import { createTextSummarizationPipeline } from "@moritzbrantner/text-summarization";

describe("@moritzbrantner/text-summarization", () => {
  test("summarizes chunked text with an optional reduction pass", async () => {
    const pipeline = createTextSummarizationPipeline({
      provider: {
        id: "summarizer",
        async summarize({ input }) {
          return {
            model: "summarizer",
            summary: input.split(/\s+/u).slice(0, 3).join(" "),
            raw: null,
          };
        },
      },
      model: {
        task: "summarization",
        model: "facebook/bart-large-cnn",
      },
      chunking: {
        strategy: "sentence",
        maxCharacters: 28,
      },
    });

    const result = await pipeline.summarize(
      "Alpha teams shipped quickly. Beta teams documented clearly. Gamma teams monitored reliably.",
    );

    expect(result.summary).toContain("Alpha teams shipped");
    expect(result.chunks.length).toBeGreaterThanOrEqual(2);
    expect(result.passes).toBeGreaterThanOrEqual(1);
  });
});
