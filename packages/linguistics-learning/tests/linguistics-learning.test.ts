import { describe, expect, test } from "vitest";

import { createCorpusIndex } from "@moritzbrantner/linguistics-corpus";
import { createTextDocument } from "@moritzbrantner/linguistics-core";
import {
  createInterlinearRows,
  deriveStudyTerms,
  findUnknownTerms,
  rankStudyTerms,
} from "@moritzbrantner/linguistics-learning";

describe("@moritzbrantner/linguistics-learning", () => {
  const document = createTextDocument({
    id: "lesson",
    language: "de",
    text: "Hallo Welt. Hallo Freund.",
  });

  test("builds interlinear rows from token annotations", () => {
    const hallo = document.tokens.find((token) => token.text === "Hallo");

    expect(
      createInterlinearRows(document, [
        {
          tokenId: hallo?.id,
          gloss: "hello",
          lemma: "hallo",
          partOfSpeech: "INTJ",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          surface: "Hallo",
          gloss: "hello",
          lemma: "hallo",
          partOfSpeech: "INTJ",
        }),
      ]),
    );
  });

  test("derives unique study terms from repeated forms", () => {
    expect(deriveStudyTerms(document)).toEqual([
      {
        term: "hallo",
        count: 2,
        surfaceForms: ["Hallo"],
        documentIds: ["lesson"],
      },
      {
        term: "freund",
        count: 1,
        surfaceForms: ["Freund"],
        documentIds: ["lesson"],
      },
      {
        term: "welt",
        count: 1,
        surfaceForms: ["Welt"],
        documentIds: ["lesson"],
      },
    ]);
  });

  test("detects unknown terms against a known-term set", () => {
    expect(findUnknownTerms(document, ["Hallo"])).toEqual([
      {
        term: "freund",
        count: 1,
        surfaceForms: ["Freund"],
        documentIds: ["lesson"],
      },
      {
        term: "welt",
        count: 1,
        surfaceForms: ["Welt"],
        documentIds: ["lesson"],
      },
    ]);
  });

  test("ranks terms differently when corpus frequencies are provided", () => {
    const corpus = createCorpusIndex({
      documents: [
        createTextDocument({
          id: "corpus-1",
          text: "Hallo hallo hallo selten.",
        }),
      ],
    });
    const terms = [
      {
        term: "hallo",
        count: 3,
        surfaceForms: ["Hallo"],
        documentIds: ["study"],
      },
      {
        term: "selten",
        count: 1,
        surfaceForms: ["selten"],
        documentIds: ["study"],
      },
    ];

    expect(rankStudyTerms(terms).map((term) => term.term)).toEqual(["hallo", "selten"]);
    expect(rankStudyTerms(terms, corpus).map((term) => term.term)).toEqual(["selten", "hallo"]);
  });
});
