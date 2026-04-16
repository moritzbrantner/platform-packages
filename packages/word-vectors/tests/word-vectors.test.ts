import { describe, expect, test } from "vitest";

import {
  createWordVectorModel,
  trainWordVectorModel,
} from "@moritzbrantner/word-vectors";

describe("@moritzbrantner/word-vectors", () => {
  test("learns nearby meaning from repeated contexts", () => {
    const model = trainWordVectorModel(
      [
        "The king ruled the kingdom.",
        "The queen ruled the kingdom.",
        "A king and queen governed the realm together.",
        "The prince greeted the king.",
        "The princess greeted the queen.",
        "Fresh apples and oranges were sold at the market.",
      ],
      { windowSize: 2 },
    );

    const similarToKing = model.findSimilarWords("king", { limit: 5 });

    expect(similarToKing.map((entry) => entry.word)).toContain("queen");
    expect(model.similarity("king", "queen")).toBeGreaterThan(0.3);
    expect(model.similarity("king", "queen")).toBeGreaterThan(model.similarity("king", "apples"));
  });

  test("returns sparse vector entries with contextual weights", () => {
    const model = createWordVectorModel({
      texts: [
        "Cats chase mice.",
        "Dogs chase balls.",
        "Cats and dogs chase things.",
      ],
      windowSize: 2,
    });

    const vector = model.getVector("cats", { limit: 4 });

    expect(vector).toBeDefined();
    expect(vector?.word).toBe("cats");
    expect(vector?.dimensions).toBe(model.vocabularySize);
    expect(vector?.magnitude).toBeGreaterThan(0);
    expect(vector?.entries.some((entry) => entry.word === "chase")).toBe(true);
  });

  test("supports incremental training and vocabulary filtering", () => {
    const model = createWordVectorModel({
      texts: "Red apples are sweet.",
      minWordCount: 2,
    });

    expect(model.hasWord("apples")).toBe(false);

    model.train([
      "Green apples are crisp.",
      "Apples and pears are fruit.",
      "Pears and apples are fruit.",
    ]);

    expect(model.hasWord("apples")).toBe(true);
    expect(model.words()).toContain("apples");
    expect(model.findSimilarWords("apples").map((entry) => entry.word)).toContain("pears");
  });
});
