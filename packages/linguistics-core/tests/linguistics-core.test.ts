import { describe, expect, test } from "vitest";

import {
  anchorSpan,
  chunkTextDocument,
  createTextDocument,
  extractWordTexts,
  initLinguisticsKernel,
  isLinguisticsKernelReady,
  normalizeText,
  reanchorSpan,
  segmentTextDocument,
} from "@moritzbrantner/linguistics-core";

describe("@moritzbrantner/linguistics-core", () => {
  test("segments mixed Latin, CJK, and Arabic text into word tokens", () => {
    const document = segmentTextDocument(
      createTextDocument({
        id: "mixed",
        language: "und",
        text: "Hello 世界. مرحبا بالعالم.\n\nAnother line.",
      }),
      { granularity: "word", useIntlSegmenter: false },
    );

    expect(document.paragraphs).toHaveLength(2);
    expect(document.sentences.map((sentence) => sentence.text)).toEqual([
      "Hello 世界.",
      "مرحبا بالعالم.",
      "Another line.",
    ]);
    expect(document.tokens.filter((token) => token.isWordLike).map((token) => token.text)).toEqual([
      "Hello",
      "世界",
      "مرحبا",
      "بالعالم",
      "Another",
      "line",
    ]);
  });

  test("normalizes composed and decomposed Unicode consistently", () => {
    const decomposed = "Cafe\u0301";
    const composed = "Caf\u00E9";

    expect(
      normalizeText(decomposed, {
        form: "NFC",
      }),
    ).toBe(composed);
    expect(
      normalizeText(decomposed, {
        form: "NFKC",
        lowercase: true,
        stripDiacritics: true,
      }),
    ).toBe("cafe");
  });

  test("reanchors a span after text is edited earlier in the document", () => {
    const original = createTextDocument({
      id: "anchor",
      text: "First line.\nThe harbor wakes before dawn.\nLast line.",
    });
    const start = original.text.indexOf("harbor");
    const anchor = anchorSpan(original, {
      start,
      end: start + "harbor wakes".length,
    });
    const edited = createTextDocument({
      id: "anchor-edited",
      text: "New intro.\nFirst line.\nThe harbor wakes before dawn.\nLast line.",
    });

    expect(reanchorSpan(edited, anchor)).toEqual({
      start: edited.text.indexOf("harbor"),
      end: edited.text.indexOf("harbor") + "harbor wakes".length,
      text: "harbor wakes",
    });
  });

  test("uses the regex fallback when Intl.Segmenter is disabled", () => {
    const document = segmentTextDocument(
      createTextDocument({
        id: "fallback",
        text: "One sentence. Two more!",
      }),
      { granularity: "word", useIntlSegmenter: false },
    );

    expect(document.sentences).toHaveLength(2);
    expect(document.tokens.filter((token) => token.isWordLike).map((token) => token.text)).toEqual([
      "One",
      "sentence",
      "Two",
      "more",
    ]);
  });

  test("chunks text documents with source spans", () => {
    const document = createTextDocument({
      id: "chunked",
      text: "Alpha one. Beta two. Gamma three.",
      metadata: { source: "fixture" },
    });

    const chunks = chunkTextDocument(document, {
      strategy: "sentence",
      maxCharacters: 16,
    });

    expect(chunks.map((chunk) => chunk.text)).toEqual(["Alpha one.", "Beta two.", "Gamma three."]);
    expect(chunks[1]).toMatchObject({
      documentId: "chunked",
      start: 11,
      end: 20,
      metadata: { source: "fixture" },
    });
  });

  test("handles empty documents and clamps boundary anchors", () => {
    const empty = segmentTextDocument(createTextDocument({ id: "empty", text: "" }), {
      granularity: "word",
      useIntlSegmenter: false,
    });

    expect(empty.paragraphs).toEqual([]);
    expect(empty.sentences).toEqual([]);
    expect(empty.tokens).toEqual([]);

    const document = createTextDocument({ id: "boundary", text: "Short" });

    expect(anchorSpan(document, { start: -10, end: 50 })).toMatchObject({
      start: 0,
      end: 5,
      text: "Short",
    });
  });

  test("reanchors spans after Unicode normalization changes", () => {
    const original = createTextDocument({ id: "unicode", text: "Cafe\u0301 terrace" });
    const anchor = anchorSpan(original, { start: 0, end: "Cafe\u0301".length });
    const edited = createTextDocument({ id: "unicode-edited", text: "Before. Caf\u00E9 terrace" });

    expect(reanchorSpan(edited, anchor)).toEqual({
      start: "Before. ".length,
      end: "Before. Caf\u00E9".length,
      text: "Café",
    });
  });

  test("initializes the Rust text kernel for fallback segmentation helpers", async () => {
    await initLinguisticsKernel();

    expect(isLinguisticsKernelReady()).toBe(true);
    expect(extractWordTexts("Hello café world", { lowercase: true, normalizeUnicode: false })).toEqual(
      ["hello", "café", "world"],
    );
    expect(
      segmentTextDocument(createTextDocument({ id: "kernel", text: "One sentence. Two words!" }), {
        granularity: "word",
        useIntlSegmenter: false,
      }).sentences.map((sentence) => sentence.text),
    ).toEqual(["One sentence.", "Two words!"]);
  });
});
