import { describe, expect, test } from "vitest";

import { createTextDocument } from "@moritzbrantner/linguistics-core";
import {
  countTerms,
  createConcordance,
  createCorpusIndex,
  listDocumentsByLanguage,
  searchCorpus,
} from "@moritzbrantner/linguistics-corpus";

describe("@moritzbrantner/linguistics-corpus", () => {
  const english = createTextDocument({
    id: "doc-en",
    language: "en",
    metadata: {
      source: "news",
    },
    text: "Hello world. Hello friend.",
  });
  const spanish = createTextDocument({
    id: "doc-es",
    language: "es",
    metadata: {
      source: "lesson",
    },
    text: "Hola mundo. Hola amigo.",
  });
  const index = createCorpusIndex({
    documents: [english, spanish],
  });

  test("searches normalized terms and phrases across indexed documents", () => {
    const termMatches = searchCorpus("HELLO", {
      index,
    });
    const phraseMatches = searchCorpus("hola mundo", {
      index,
      language: "es",
    });

    expect(termMatches).toHaveLength(2);
    expect(termMatches.map((match) => match.sentence.text)).toEqual([
      "Hello world.",
      "Hello friend.",
    ]);
    expect(phraseMatches).toHaveLength(1);
    expect(phraseMatches[0]?.matchedText).toBe("Hola mundo");
  });

  test("filters search results by metadata and language", () => {
    expect(
      searchCorpus("hola", {
        index,
        metadata: {
          source: "lesson",
        },
      }),
    ).toHaveLength(2);
    expect(
      searchCorpus("hola", {
        index,
        metadata: {
          source: "news",
        },
      }),
    ).toHaveLength(0);
  });

  test("builds concordance windows around matches", () => {
    expect(
      createConcordance("hello", {
        index,
        window: 1,
      }),
    ).toEqual([
      expect.objectContaining({
        leftContext: "",
        matchText: "Hello",
        rightContext: "world",
      }),
      expect.objectContaining({
        leftContext: "",
        matchText: "Hello",
        rightContext: "friend",
      }),
    ]);
  });

  test("lists documents by language and computes deterministic term counts", () => {
    expect(listDocumentsByLanguage("es", { index }).map((document) => document.id)).toEqual([
      "doc-es",
    ]);
    expect(countTerms({ index }).slice(0, 4)).toEqual([
      {
        term: "hello",
        count: 2,
        documentCount: 1,
      },
      {
        term: "hola",
        count: 2,
        documentCount: 1,
      },
      {
        term: "amigo",
        count: 1,
        documentCount: 1,
      },
      {
        term: "friend",
        count: 1,
        documentCount: 1,
      },
    ]);
  });
});
