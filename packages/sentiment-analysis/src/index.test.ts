import { describe, expect, test } from "vitest";

import { createSentimentAnalysisPipeline } from "@moritzbrantner/sentiment-analysis";

describe("@moritzbrantner/sentiment-analysis", () => {
  test("normalizes model labels into canonical sentiment scores", async () => {
    const pipeline = createSentimentAnalysisPipeline({
      provider: {
        id: "classifier",
        async classifyText({ input }) {
          return {
            model: "classifier",
            labels: input.includes("late")
              ? [
                  { label: "NEGATIVE", score: 0.9 },
                  { label: "NEUTRAL", score: 0.1 },
                ]
              : [
                  { label: "POSITIVE", score: 0.88 },
                  { label: "NEUTRAL", score: 0.12 },
                ],
            raw: null,
          };
        },
      },
      model: {
        task: "text-classification",
        model: "distilbert/distilbert-base-uncased-finetuned-sst-2-english",
      },
      chunking: {
        strategy: "sentence",
        maxCharacters: 30,
      },
    });

    const result = await pipeline.analyze("Delivery was great. Support reply was late.");

    expect(result.sentiment).toBe("mixed");
    expect(result.chunks.map((chunk) => chunk.sentiment)).toEqual(["positive", "negative"]);
    expect(result.scores.positive).toBeGreaterThan(0.4);
    expect(result.scores.negative).toBeGreaterThan(0.4);
  });
});
