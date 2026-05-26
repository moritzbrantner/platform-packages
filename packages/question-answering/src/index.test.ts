import { describe, expect, test } from "vitest";

import { createQuestionAnsweringPipeline } from "@moritzbrantner/question-answering";

describe("@moritzbrantner/question-answering", () => {
  test("answers across chunks and keeps the best results", async () => {
    const pipeline = createQuestionAnsweringPipeline({
      provider: {
        id: "fake-qa",
        async answerQuestion({ context, question }) {
          if (question === "Where?" && context.includes("Berlin")) {
            return { model: "qa", answer: "Berlin", score: 0.96, raw: null };
          }

          if (question === "Who?" && context.includes("Clara")) {
            return { model: "qa", answer: "Clara", score: 0.91, raw: null };
          }

          return { model: "qa", answer: "", score: 0, raw: null };
        },
      },
      model: {
        task: "question-answering",
        model: "deepset/roberta-base-squad2",
      },
      chunking: {
        strategy: "sentence",
        maxCharacters: 32,
      },
    });

    const text = "Clara runs the studio. The studio is in Berlin.";
    const answers = await pipeline.answer("Where?", text);
    const many = await pipeline.answerMany(["Who?", "Where?"], text);

    expect(answers[0]).toMatchObject({
      answer: "Berlin",
      score: 0.96,
    });
    expect(many["Who?"]?.[0]?.answer).toBe("Clara");
    expect(many["Where?"]?.[0]?.chunkId).toContain("chunk");
  });

  test("returns null when no answer passes filtering", async () => {
    const pipeline = createQuestionAnsweringPipeline({
      provider: {
        id: "fake-qa",
        async answerQuestion() {
          return { model: "qa", answer: "Maybe", score: 0.2, raw: null };
        },
      },
      model: {
        task: "question-answering",
        model: "deepset/roberta-base-squad2",
      },
      minimumScore: 0.5,
    });

    expect(await pipeline.findBestAnswer("What?", "Noisy context")).toBeNull();
  });
});
