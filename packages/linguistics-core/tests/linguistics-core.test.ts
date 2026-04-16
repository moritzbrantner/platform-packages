import { describe, expect, test } from "vitest";

import {
  createTextDocument,
  findTokenAtOffset,
  normalizeLanguageTag,
  normalizeText,
  normalizeToken,
  sliceDocumentText,
} from "@moritzbrantner/linguistics-core";

describe("@moritzbrantner/linguistics-core", () => {
  test("segments multilingual text into paragraphs, sentences, and tokens with stable offsets", () => {
    const text = "Cafe\u0301 mu\u0308de.\nSecond line!\n\nNin\u0303o?";
    const document = createTextDocument({
      id: "sample",
      language: "pt_br",
      text,
    });

    expect(document.language).toBe("pt-BR");
    expect(document.paragraphs).toHaveLength(2);
    expect(document.sentences.map((sentence) => sentence.text)).toEqual([
      "Café müde.",
      "Second line!",
      "Niño?",
    ]);
    expect(document.sentences[0]?.tokens.map((token) => token.text)).toEqual([
      "Café",
      "müde",
      ".",
    ]);
    expect(document.sentences[1]?.tokens.map((token) => token.leadingText)).toEqual([
      "",
      " ",
      "",
    ]);

    const second = document.tokens.find((token) => token.text === "Second");
    expect(second?.range).toEqual({
      start: document.text.indexOf("Second"),
      end: document.text.indexOf("Second") + "Second".length,
    });
  });

  test("normalizes language tags, full text, and token forms consistently", () => {
    expect(normalizeLanguageTag("ZH_hant_tw")).toBe("zh-Hant-TW");
    expect(normalizeText("Cafe\u0301\r\nline")).toBe("Café\nline");
    expect(normalizeToken("Äffin")).toBe("affin");
  });

  test("preserves surface text while exposing normalized token values", () => {
    const document = createTextDocument({
      text: "Grüß Gott, niño.",
    });

    expect(document.tokens.map((token) => [token.text, token.normalized])).toEqual([
      ["Grüß", "gruß"],
      ["Gott", "gott"],
      [",", ","],
      ["niño", "nino"],
      [".", "."],
    ]);
  });

  test("finds tokens by offset and slices raw document text by range", () => {
    const document = createTextDocument({
      text: "Hello there.\nGeneral Kenobi.",
    });

    const generalOffset = document.text.indexOf("General") + 2;
    const general = findTokenAtOffset(document, generalOffset);

    expect(general?.text).toBe("General");
    expect(findTokenAtOffset(document, document.text.indexOf(" ") + 1)?.text).toBe("there");
    expect(
      sliceDocumentText(document, {
        start: document.text.indexOf("there"),
        end: document.text.indexOf("Kenobi") + "Kenobi".length,
      }),
    ).toBe("there.\nGeneral Kenobi");
  });
});
