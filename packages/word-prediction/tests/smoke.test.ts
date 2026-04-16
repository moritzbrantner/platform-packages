import { describe, expect, test } from "vitest";

import { createTextDocument } from "@moritzbrantner/linguistics-core";
import {
  DEFAULT_WORD_PREDICTION_TEXTS,
  createDefaultWordPredictionModel,
  createWordPredictionModel,
  trainWordPredictionModel,
} from "@moritzbrantner/word-prediction";

function words(predictions: Array<{ word: string }>) {
  return predictions.map((prediction) => prediction.word);
}

describe("@moritzbrantner/word-prediction", () => {
  test("returns no predictions from an empty model", () => {
    const model = createWordPredictionModel();

    expect(model.vocabularySize).toBe(0);
    expect(model.tokenCount).toBe(0);
    expect(model.predictNextWords("See you")).toEqual([]);
    expect(model.predictForInput("See yo")).toEqual([]);
  });

  test("predicts likely next words from repeated context", () => {
    const model = createWordPredictionModel({
      texts: [
        "Are you coming home tonight?",
        "Are you coming home now?",
        "Are you coming back soon?",
        "Are you free tonight?",
      ],
    });

    const predictions = model.predictNextWords("Are you coming");

    expect(predictions.slice(0, 2).map((prediction) => prediction.word)).toEqual(["home", "back"]);
    expect(predictions[0]).toMatchObject({
      word: "home",
      contextSize: 3,
    });
  });

  test("backs off to a shorter context when the full phrase is unseen", () => {
    const model = createWordPredictionModel({
      texts: [
        "Please call me later.",
        "Please call me tomorrow.",
        "Can you call me later?",
      ],
    });

    const predictions = model.predictNextWords("They call me");

    expect(predictions[0]).toMatchObject({
      word: "later",
      contextSize: 2,
    });
    expect(predictions[1]?.word).toBe("tomorrow");
  });

  test("treats a trailing token as a prefix until whitespace completes it", () => {
    const model = trainWordPredictionModel([
      "On my way now.",
      "On my way home.",
      "On my wall art.",
    ]);

    expect(model.predictForInput("On my wa")[0]).toMatchObject({
      word: "way",
      contextSize: 2,
    });
    expect(words(model.predictForInput("On my way ", { limit: 2 }))).toEqual([
      "home",
      "now",
    ]);
  });

  test("resets context at sentence and newline boundaries", () => {
    const model = createWordPredictionModel({
      texts: "Red blue.\nGreen yellow.",
    });

    expect(model.predictNextWords("blue", { minScore: 1 })).toEqual([]);
    expect(model.predictNextWords("green", { minScore: 1 })[0]).toMatchObject({
      word: "yellow",
      contextSize: 1,
    });
  });

  test("keeps contractions together while tokenizing", () => {
    const model = createWordPredictionModel({
      texts: ["I'll see you later.", "I'll see you tomorrow."],
      lowercase: false,
    });

    expect(model.predictNextWords("I'll see")[0]).toMatchObject({
      word: "you",
      contextSize: 2,
    });
  });

  test("returns the most common surface form for lowercase-matched words", () => {
    const model = createWordPredictionModel({
      texts: [
        "NASA launch now.",
        "nasa landing soon.",
        "NASA mission ready.",
      ],
    });

    expect(model.predictForInput("na")[0]).toMatchObject({
      word: "NASA",
      matches: 3,
      contextSize: 0,
    });
  });

  test("preserves case distinctions when lowercase normalization is disabled", () => {
    const model = createWordPredictionModel({
      texts: ["Hello there.", "hello again."],
      lowercase: false,
    });

    expect(model.predictForInput("Hel")[0]?.word).toBe("Hello");
    expect(model.predictForInput("hel")[0]?.word).toBe("hello");
  });

  test("floors and clamps the configured context window", () => {
    expect(createWordPredictionModel({ maxContextSize: 2.9 }).maxContextSize).toBe(2);
    expect(createWordPredictionModel({ maxContextSize: Number.POSITIVE_INFINITY }).maxContextSize)
      .toBe(1);
    expect(createWordPredictionModel({ maxContextSize: 0 }).maxContextSize).toBe(1);
  });

  test("applies prediction limits and minimum score filtering", () => {
    const model = createWordPredictionModel({
      texts: [
        "Call me tomorrow.",
        "Call me tomorrow.",
        "Call me tomorrow.",
        "Call me tonight.",
        "Text me tomorrow.",
      ],
    });

    expect(model.predictNextWords("Call me", { limit: 0 })).toHaveLength(1);
    expect(words(model.predictNextWords("Call me", { minScore: 5 }))).toEqual([
      "tomorrow",
    ]);
  });

  test("loads the built-in default corpus", () => {
    const model = createDefaultWordPredictionModel();

    expect(DEFAULT_WORD_PREDICTION_TEXTS.length).toBeGreaterThan(0);
    expect(model.tokenCount).toBeGreaterThan(0);
    expect(model.predictNextWords("See you")[0]).toMatchObject({
      word: "soon",
      contextSize: 2,
    });
  });

  test("adjusts the default corpus with additional training text", () => {
    const model = createDefaultWordPredictionModel();

    model.train(Array.from({ length: 8 }, () => "See you tomorrow.").join("\n"));

    expect(model.predictNextWords("See you")[0]).toMatchObject({
      word: "tomorrow",
      contextSize: 2,
    });
  });

  test("trains in place and updates token and vocabulary counts", () => {
    const model = createWordPredictionModel({
      texts: ["Alpha beta beta.", "Gamma beta."],
    });
    const returnedModel = model.train(["Alpha delta.", "gamma epsilon."]);

    expect(returnedModel).toBe(model);
    expect(model.tokenCount).toBe(9);
    expect(model.vocabularySize).toBe(5);
    expect(model.predictNextWords("Alpha")[0]).toMatchObject({
      word: "beta",
      contextSize: 1,
    });
  });

  test("can train directly from text documents", () => {
    const model = createWordPredictionModel({
      documents: [
        createTextDocument({
          id: "doc-1",
          text: "Shared context helps prediction.",
        }),
        createTextDocument({
          id: "doc-2",
          text: "Shared context helps recall.",
        }),
      ],
    });

    expect(model.predictNextWords("Shared context")[0]).toMatchObject({
      word: "helps",
      contextSize: 2,
    });
  });
});
