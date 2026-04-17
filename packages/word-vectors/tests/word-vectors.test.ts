import { describe, expect, test } from "vitest";

import { createTextDocument } from "@moritzbrantner/linguistics-core";
import { createCorpusIndex } from "@moritzbrantner/linguistics-corpus";
import {
  createWordVectorBackoffSource,
  createWordVectorModel,
  deserializeWordVectorModel,
  serializeWordVectorModel,
  trainFromCorpus,
  trainWordVectorModel,
} from "@moritzbrantner/word-vectors";
import { trainFromDocuments } from "../src/documents";

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

  test("preserves deterministic similarity after serialization and exposes similar contexts", () => {
    const model = createWordVectorModel({
      texts: [
        "Coffee beans smell rich.",
        "Tea leaves smell fresh.",
        "Coffee cups stay warm.",
      ],
      windowSize: 2,
    });
    const restored = deserializeWordVectorModel(serializeWordVectorModel(model));

    expect(restored.similarity("coffee", "tea")).toBe(model.similarity("coffee", "tea"));
    expect(restored.findSimilarContexts("coffee", { limit: 2 })[0]).toEqual(
      expect.objectContaining({
        word: expect.any(String),
        weight: expect.any(Number),
      }),
    );
  });

  test("trains from text documents the same way as raw text", () => {
    const documents = [
      createTextDocument({
        id: "doc-1",
        text: "Harbor lights glow at night.",
      }),
      createTextDocument({
        id: "doc-2",
        text: "Harbor workers rest at dawn.",
      }),
    ];

    const fromDocuments = trainFromDocuments(documents, {
      windowSize: 2,
    });
    const fromRawText = createWordVectorModel({
      texts: documents.map((document) => document.text),
      windowSize: 2,
    });

    expect(fromDocuments.words()).toEqual(fromRawText.words());
    expect(fromDocuments.similarity("harbor", "night")).toBe(
      fromRawText.similarity("harbor", "night"),
    );
  });

  test("trains from a corpus index without manual document extraction", () => {
    const corpus = createCorpusIndex([
      createTextDocument({
        id: "doc-1",
        text: "Coffee beans smell rich.",
      }),
      createTextDocument({
        id: "doc-2",
        text: "Tea leaves smell fresh.",
      }),
    ]);

    const fromCorpus = trainFromCorpus(corpus, {
      windowSize: 2,
    });
    const fromDocuments = trainFromDocuments(corpus.documents, {
      windowSize: 2,
    });

    expect(fromCorpus.words()).toEqual(fromDocuments.words());
    expect(fromCorpus.similarity("coffee", "tea")).toBe(
      fromDocuments.similarity("coffee", "tea"),
    );
  });

  test("creates optional semantic backoff suggestions for word prediction", () => {
    const model = createWordVectorModel({
      texts: [
        "Coffee is strong.",
        "Tea is calming.",
        "Coffee tastes bold.",
      ],
    });

    const suggestions = createWordVectorBackoffSource(model)(["coffee"]);

    expect(Array.from(suggestions)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          word: expect.any(String),
          score: expect.any(Number),
        }),
      ]),
    );
  });
});
