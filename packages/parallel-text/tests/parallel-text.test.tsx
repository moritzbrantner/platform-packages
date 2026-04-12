import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ParallelTextView, createParallelTextModel } from "@moritzbrantner/parallel-text";

describe("@moritzbrantner/parallel-text", () => {
  test("creates paragraph-aware automatic rows and token links", () => {
    const model = createParallelTextModel({
      originalText: "Hello world.\n\nGood night.",
      translatedText: "Hola mundo.\n\nBuenas noches.",
    });

    expect(model.originalParagraphs).toHaveLength(2);
    expect(model.translatedParagraphs).toHaveLength(2);
    expect(model.rows).toHaveLength(2);
    expect(model.rows[0].originalSentences[0]?.text).toBe("Hello world.");
    expect(model.rows[0].translatedSentences[0]?.text).toBe("Hola mundo.");
    expect(model.rows[0].tokenLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "auto",
        }),
      ]),
    );
  });

  test("respects explicit sentence and token alignments", () => {
    const model = createParallelTextModel({
      originalText: "I love apples. She runs fast.",
      translatedText: "Sie rennt schnell. Ich liebe Aepfel.",
      sentenceAlignments: [
        { original: 1, translated: 0 },
        { original: 0, translated: 1 },
      ],
      tokenAlignments: [
        {
          originalSentence: 0,
          translatedSentence: 1,
          originalToken: 1,
          translatedToken: 1,
          confidence: 1,
        },
      ],
    });

    expect(model.rows[0].originalSentenceIndices).toEqual([1]);
    expect(model.rows[0].translatedSentenceIndices).toEqual([0]);
    expect(model.rows[1].originalSentenceIndices).toEqual([0]);
    expect(model.rows[1].translatedSentenceIndices).toEqual([1]);
    expect(model.rows[1].tokenLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "manual",
          confidence: 1,
        }),
      ]),
    );
  });

  test("supports multiple translations and shows hover word, phrase, and sentence context", () => {
    const { container } = render(
      <ParallelTextView
        originalText="Hello world."
        originalLabel="English"
        translatedLabel="Translation"
        translations={[
          {
            id: "es",
            label: "Spanish",
            translatedLabel: "Spanish",
            translatedText: "Hola mundo.",
          },
          {
            id: "fr",
            label: "French",
            translatedLabel: "French",
            translatedText: "Bonjour monde.",
          },
        ]}
      />,
    );

    expect(screen.getByLabelText("English")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Spanish" }).getAttribute("aria-selected")).toBe(
      "true",
    );

    const hello = screen.getByRole("button", { name: "Hello" });
    const hola = screen.getByRole("button", { name: "Hola" });
    const englishSentence = container.querySelector(
      '[data-sentence-id="original-sentence-0"]',
    ) as HTMLElement;
    const spanishSentence = container.querySelector(
      '[data-sentence-id="translated-sentence-0"]',
    ) as HTMLElement;

    fireEvent.mouseEnter(hello);
    expect(hola.getAttribute("data-highlighted")).toBe("true");
    expect(englishSentence.getAttribute("data-phrase-highlighted")).toBe("true");
    expect(englishSentence.getAttribute("data-sentence-highlighted")).toBe("true");
    expect(spanishSentence.getAttribute("data-phrase-highlighted")).toBe("true");
    expect(spanishSentence.getAttribute("data-sentence-highlighted")).toBe("true");

    fireEvent.click(screen.getByRole("tab", { name: "French" }));
    expect(screen.getByRole("tab", { name: "French" }).getAttribute("aria-selected")).toBe(
      "true",
    );

    const bonjour = screen.getByRole("button", { name: "Bonjour" });
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Hello" }));
    expect(bonjour.getAttribute("data-highlighted")).toBe("true");

    fireEvent.mouseLeave(screen.getByRole("button", { name: "Hello" }));
    const frenchSentence = container.querySelector(
      '[data-sentence-id="translated-sentence-0"]',
    ) as HTMLElement;
    fireEvent.mouseEnter(englishSentence);
    expect(englishSentence.getAttribute("data-phrase-highlighted")).toBe("true");
    expect(englishSentence.getAttribute("data-sentence-highlighted")).toBe("true");
    expect(frenchSentence.getAttribute("data-phrase-highlighted")).toBe("true");
    expect(frenchSentence.getAttribute("data-sentence-highlighted")).toBe("true");
    expect(bonjour.getAttribute("data-highlighted")).toBe("false");
  });
});
