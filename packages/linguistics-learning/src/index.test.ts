import { describe, expect, test } from "vitest";

import { createTextDocument } from "@moritzbrantner/linguistics-core";
import { createCorpusIndex } from "@moritzbrantner/linguistics-corpus";
import {
  createFlashcardSet,
  createInterlinearBlock,
  deriveCorpusStudyTerms,
  deriveStudyTerms,
  gradeRecall,
} from "@moritzbrantner/linguistics-learning";

describe("@moritzbrantner/linguistics-learning", () => {
  test("creates interlinear blocks that preserve alignment input", () => {
    const document = createTextDocument({
      id: "gloss",
      language: "es",
      text: "Buenos dias amigo.",
    });

    const block = createInterlinearBlock(document, [
      { sourceTokenIndex: 0, gloss: "good", targetText: "good" },
      { sourceTokenIndex: 1, gloss: "day", targetText: "day" },
      { sourceTokenIndex: 2, gloss: "friend", targetText: "friend" },
    ]);

    expect(block.tokens.map((token) => token.text)).toEqual(["Buenos", "dias", "amigo"]);
    expect(block.alignments).toEqual([
      { sourceTokenIndex: 0, gloss: "good", targetText: "good" },
      { sourceTokenIndex: 1, gloss: "day", targetText: "day" },
      { sourceTokenIndex: 2, gloss: "friend", targetText: "friend" },
    ]);
  });

  test("derives study terms and dedupes repeated inflections", () => {
    const document = createTextDocument({
      id: "terms",
      language: "en",
      text: "Students study nightly. A student studied last night while studying grammar.",
    });

    const terms = deriveStudyTerms(document, {
      minFrequency: 1,
      includeNamedEntities: true,
      includeMultiwordTerms: true,
    });

    expect(terms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lemma: "study",
          count: 3,
          kind: "word",
        }),
        expect.objectContaining({
          lemma: "last night",
          kind: "multiword",
          count: 1,
        }),
      ]),
    );
  });

  test("creates flashcards from derived terms", () => {
    const terms = deriveStudyTerms(
      createTextDocument({
        id: "cards",
        language: "en",
        text: "Harbor lights glow. Harbor workers rest.",
      }),
      { minFrequency: 2, includeNamedEntities: true },
    );

    expect(
      createFlashcardSet(terms, {
        sourceLanguage: "en",
        targetLanguage: "de",
      }),
    ).toEqual({
      sourceLanguage: "en",
      targetLanguage: "de",
      cards: [
        {
          id: "card-word:harbor",
          front: "Harbor",
          back: "harbor",
          termId: "word:harbor",
        },
      ],
    });
  });

  test("aggregates study terms across a corpus", () => {
    const corpus = createCorpusIndex([
      createTextDocument({
        id: "lesson-1",
        language: "en",
        text: "Harbor lights glow. Harbor workers rest.",
      }),
      createTextDocument({
        id: "lesson-2",
        language: "en",
        text: "Harbor stories travel. Harbor bells ring.",
      }),
    ]);

    const terms = deriveCorpusStudyTerms(corpus, {
      minFrequency: 2,
      includeNamedEntities: true,
    });

    expect(terms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lemma: "harbor",
          count: 4,
          documentCount: 2,
          documentIds: ["lesson-1", "lesson-2"],
        }),
      ]),
    );
    expect(
      createFlashcardSet(terms, {
        sourceLanguage: "en",
        targetLanguage: "de",
      }).cards[0],
    ).toEqual({
      id: "card-en:word:harbor",
      front: "Harbor",
      back: "harbor",
      termId: "en:word:harbor",
    });
  });

  test("updates spaced-repetition intervals with SM-2 style grading", () => {
    const first = gradeRecall({ quality: 5, reviewedAt: "2026-04-16T00:00:00.000Z" }, []);
    const second = gradeRecall({ quality: 4, reviewedAt: "2026-04-17T00:00:00.000Z" }, [first]);
    const lapse = gradeRecall({ quality: 1, reviewedAt: "2026-04-23T00:00:00.000Z" }, [
      first,
      second,
    ]);

    expect(first.intervalDays).toBe(1);
    expect(second.intervalDays).toBe(6);
    expect(second.repetitions).toBe(2);
    expect(lapse.intervalDays).toBe(1);
    expect(lapse.repetitions).toBe(0);
  });
});
