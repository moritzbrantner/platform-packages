import { describe, expect, test } from "vitest";

import { createTextDocument } from "@moritzbrantner/linguistics-core";
import {
  concordance,
  createCorpusIndex,
  searchCorpus,
  termFrequencies,
} from "@moritzbrantner/linguistics-corpus";

const documents = [
  createTextDocument({
    id: "en-market",
    language: "en",
    metadata: { genre: "travel", region: "harbor" },
    text: "The harbor market wakes early. Coffee traders greet the harbor workers.",
  }),
  createTextDocument({
    id: "de-markt",
    language: "de",
    metadata: { genre: "travel", region: "hafen" },
    text: "Der Hafenmarkt wacht frueh auf. Kaffeehaendler gruessen die Arbeiter.",
  }),
  createTextDocument({
    id: "en-poem",
    language: "en",
    metadata: { genre: "poetry", region: "harbor" },
    text: "Harbor bells echo softly at night.",
  }),
];

describe("@moritzbrantner/linguistics-corpus", () => {
  test("supports metadata-filtered, deterministic corpus search", () => {
    const index = createCorpusIndex(documents);

    expect(
      index.searchCorpus("harbor market", {
        metadataFilters: { genre: "travel" },
      }),
    ).toEqual([
      expect.objectContaining({
        documentId: "en-market",
        matches: 3,
        fields: ["text"],
      }),
    ]);
    expect(
      searchCorpus(index, "harbor", {
        languages: ["en"],
      }).map((result) => result.documentId),
    ).toEqual(["en-market", "en-poem"]);
  });

  test("extracts concordance windows for matching tokens", () => {
    const index = createCorpusIndex(documents);

    expect(
      concordance(index, "harbor", {
        windowTokens: 2,
      }),
    ).toEqual([
      {
        documentId: "en-market",
        sentenceId: "en-market-sentence-0",
        keyword: "harbor",
        leftContext: "The",
        rightContext: "market wakes",
      },
      {
        documentId: "en-market",
        sentenceId: "en-market-sentence-1",
        keyword: "harbor",
        leftContext: "greet the",
        rightContext: "workers",
      },
      {
        documentId: "en-poem",
        sentenceId: "en-poem-sentence-0",
        keyword: "Harbor",
        leftContext: "",
        rightContext: "bells echo",
      },
    ]);
  });

  test("returns multilingual term frequencies", () => {
    const index = createCorpusIndex(documents);

    expect(
      termFrequencies(index, {
        byLanguage: true,
        minCount: 2,
      }),
    ).toEqual([
      {
        term: "harbor",
        count: 3,
        language: "en",
      },
      {
        term: "the",
        count: 2,
        language: "en",
      },
    ]);
  });

  test("handles a large in-memory corpus without dropping results", () => {
    const largeCorpus = createCorpusIndex(
      Array.from({ length: 250 }, (_, index) =>
        createTextDocument({
          id: `doc-${index}`,
          language: index % 2 === 0 ? "en" : "de",
          metadata: { bucket: index % 5 },
          text: `Shared corpus smoke term ${index}. Shared corpus smoke term.`,
        }),
      ),
    );

    const results = largeCorpus.searchCorpus("shared smoke", {
      limit: 20,
    });

    expect(results).toHaveLength(20);
    expect(results[0]?.score).toBe(results[1]?.score);
    expect(results[0]?.documentId).toBe("doc-0");
  });
});
