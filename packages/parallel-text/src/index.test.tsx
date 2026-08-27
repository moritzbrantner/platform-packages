import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { createTextDocument, segmentTextDocument } from "@moritzbrantner/linguistics-core";
import {
  ParallelTextView,
  createAlignmentModel,
  createParallelTextModel,
  parseAlignment,
  serializeAlignment,
} from "@moritzbrantner/parallel-text";

describe("@moritzbrantner/parallel-text", () => {
  test("creates heuristic sentence rows without inventing positional token links", () => {
    const model = createParallelTextModel({
      originalText: "Hello world.\n\nGood night.",
      translatedText: "Hola mundo.\n\nBuenas noches.",
    });

    expect(model.originalParagraphs).toHaveLength(2);
    expect(model.translatedParagraphs).toHaveLength(2);
    expect(model.rows).toHaveLength(2);
    expect(model.rows[0].originalSentences[0]?.text).toBe("Hello world.");
    expect(model.rows[0].translatedSentences[0]?.text).toBe("Hola mundo.");
    expect(model.rows[0].source).toBe("heuristic");
    expect(model.rows[0].tokenLinks).toEqual([]);
  });

  test("keeps explicit alignment provenance and durable model links", () => {
    const model = createParallelTextModel({
      originalText: "I love apples. She runs fast.",
      translatedText: "Sie rennt schnell. Ich liebe Aepfel.",
      sentenceAlignments: [
        { original: 1, translated: 0, source: "model", confidence: 0.94 },
        { original: 0, translated: 1, source: "manual", confidence: 1 },
      ],
      tokenAlignments: [
        {
          originalSentence: 0,
          translatedSentence: 1,
          originalToken: 1,
          translatedToken: 1,
          source: "manual",
          confidence: 1,
        },
      ],
    });

    expect(model.rows[0].originalSentenceIndices).toEqual([1]);
    expect(model.rows[0].translatedSentenceIndices).toEqual([0]);
    expect(model.rows[0].source).toBe("model");
    expect(model.rows[1].source).toBe("manual");
    expect(model.rows[1].tokenLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "manual",
          confidence: 1,
        }),
      ]),
    );

    const parsed = parseAlignment(serializeAlignment(model));
    expect(parsed.sentenceAlignments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "model", confidence: 0.94 }),
        expect.objectContaining({ source: "manual", confidence: 1 }),
      ]),
    );
    expect(parsed.tokenAlignments).toEqual(
      expect.arrayContaining([expect.objectContaining({ source: "manual", confidence: 1 })]),
    );
  });

  test("renders actual alignment rows by default", () => {
    const { container } = render(
      <ParallelTextView
        originalText="First source sentence. Second source sentence."
        translatedText="Zweiter Zielsatz. Erster Zielsatz."
        sentenceAlignments={[
          { original: 1, translated: 0 },
          { original: 0, translated: 1 },
        ]}
      />,
    );

    expect(container.querySelector('[data-slot="parallel-text-view"]')?.getAttribute("data-layout")).toBe(
      "aligned",
    );

    const firstRow = container.querySelector('[data-alignment-row="row-0"]');
    const secondRow = container.querySelector('[data-alignment-row="row-1"]');

    expect(firstRow?.textContent).toContain("Second source sentence");
    expect(firstRow?.textContent).toContain("Zweiter Zielsatz");
    expect(secondRow?.textContent).toContain("First source sentence");
    expect(secondRow?.textContent).toContain("Erster Zielsatz");
  });

  test("keeps flow layout available for continuous reading", () => {
    const { container } = render(
      <ParallelTextView
        originalText="One paragraph."
        translatedText="Ein Absatz."
        layout="flow"
      />,
    );

    expect(container.querySelector('[data-slot="parallel-text-flow"]')).toBeTruthy();
  });

  test("uses sentence-level keyboard navigation instead of a button per word", () => {
    const { container } = render(
      <ParallelTextView
        originalText="Hello world."
        translatedText="Hola mundo."
        tokenAlignments={[
          {
            originalSentence: 0,
            translatedSentence: 0,
            originalToken: 0,
            translatedToken: 0,
            source: "model",
            confidence: 0.97,
          },
        ]}
      />,
    );

    expect(container.querySelector('button[data-token-id]')).toBeNull();
    expect(screen.queryByRole("button", { name: "Hello" })).toBeNull();

    const sourceSentence = container.querySelector(
      '[data-sentence-id="original-sentence-0"]',
    ) as HTMLElement;
    const hello = screen.getByText("Hello");
    const hola = screen.getByText("Hola");

    expect(sourceSentence.tabIndex).toBe(0);
    fireEvent.focus(sourceSentence);
    fireEvent.keyDown(sourceSentence, { key: "ArrowRight" });

    expect(hello.getAttribute("data-highlighted")).toBe("true");
    expect(hola.getAttribute("data-highlighted")).toBe("true");
    expect(hola.getAttribute("data-alignment-source")).toBe("model");

    fireEvent.blur(sourceSentence);
    expect(hello.getAttribute("data-highlighted")).toBe("false");
    expect(hola.getAttribute("data-highlighted")).toBe("false");
  });

  test("keeps heuristic sentence context without claiming an exact token translation", () => {
    const { container } = render(
      <ParallelTextView originalText="Cat sleeps." translatedText="Hund schläft." />,
    );

    const cat = screen.getByText("Cat");
    const hund = screen.getByText("Hund");
    const translatedSentence = container.querySelector(
      '[data-sentence-id="translated-sentence-0"]',
    ) as HTMLElement;

    fireEvent.mouseEnter(cat);

    expect(hund.getAttribute("data-highlighted")).toBe("false");
    expect(translatedSentence.getAttribute("data-sentence-highlighted")).toBe("true");
    expect(container.querySelector('[data-alignment-row="row-0"]')?.getAttribute("data-alignment-source")).toBe(
      "heuristic",
    );
  });

  test("marks unique identical-token links as heuristic rather than verified", () => {
    const model = createParallelTextModel({
      originalText: "Paris remains.",
      translatedText: "Paris bleibt.",
    });

    expect(model.rows[0].tokenLinks).toEqual([
      expect.objectContaining({ source: "heuristic", confidence: 0.5 }),
    ]);
  });

  test("applies language and direction metadata to both reading sides", () => {
    const { container } = render(
      <ParallelTextView
        originalText="مرحبا بالعالم."
        originalLabel="Arabic source"
        originalLanguage="Arabic"
        originalLanguageCode="ar"
        originalDirection="rtl"
        translations={[
          {
            id: "en",
            label: "English",
            translatedLabel: "English translation",
            translatedText: "Hello world.",
            language: "English",
            languageCode: "en",
            direction: "ltr",
          },
        ]}
      />,
    );

    const originalPanel = container.querySelector('section[data-side="original"]');
    const translatedPanel = container.querySelector('section[data-side="translated"]');

    expect(originalPanel?.getAttribute("lang")).toBe("ar");
    expect(originalPanel?.getAttribute("dir")).toBe("rtl");
    expect(translatedPanel?.getAttribute("lang")).toBe("en");
    expect(translatedPanel?.getAttribute("dir")).toBe("ltr");
  });

  test("reuses the same source segmentation across alignment models", () => {
    const original = segmentTextDocument(
      createTextDocument({
        id: "original",
        text: "One sentence. Another sentence.",
      }),
      { granularity: "word", useIntlSegmenter: false },
    );
    const german = createAlignmentModel({
      original,
      translated: "Ein Satz. Noch ein Satz.",
    });
    const french = createAlignmentModel({
      original,
      translated: "Une phrase. Encore une phrase.",
    });

    expect(german.originalSentences.map((sentence) => sentence.id)).toEqual(
      french.originalSentences.map((sentence) => sentence.id),
    );
    expect(german.originalSentences[0]?.tokens[0]?.text).toBe("One");
  });

  test("serializes and parses manual alignments without losing mappings or provenance", () => {
    const model = createParallelTextModel({
      originalText: "I fold the letter carefully. Then I place it under the blue cup.",
      translatedText: "Dann lege ich ihn unter die blaue Tasse. Ich falte den Brief sorgfaeltig.",
      sentenceAlignments: [
        { original: 1, translated: 0, confidence: 0.9 },
        { original: 0, translated: 1, confidence: 1 },
      ],
      tokenAlignments: [
        {
          originalSentence: 0,
          translatedSentence: 1,
          originalToken: 2,
          translatedToken: 2,
          confidence: 1,
        },
      ],
    });

    const parsed = parseAlignment(serializeAlignment(model));

    expect(parsed).toEqual({
      version: 1,
      sentenceAlignments: [
        { original: [1], translated: [0], confidence: 0.9, source: "manual" },
        { original: [0], translated: [1], confidence: 1, source: "manual" },
      ],
      tokenAlignments: [
        {
          originalSentence: 0,
          translatedSentence: 1,
          originalToken: 2,
          translatedToken: 2,
          confidence: 1,
          source: "manual",
        },
      ],
    });
  });
});
