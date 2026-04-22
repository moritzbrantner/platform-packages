import { describe, expect, test } from "vitest";

import {
  collectOcrText,
  createOcrPipeline,
  createVideoFramePlan,
  normalizeOcrDocument,
  ocrToTextDocument,
  type OcrDocument,
} from "@moritzbrantner/ocr";

describe("@moritzbrantner/ocr", () => {
  test("normalizes OCR pages and removes low-confidence noise", () => {
    const source: OcrDocument = {
      id: "invoice-01",
      sourceType: "pdf",
      pages: [
        {
          index: 0,
          blocks: [
            { text: "   Rechnung   ", confidence: 0.99 },
            { text: "  ", confidence: 0.95 },
            { text: "bad", confidence: 0.1 },
          ],
        },
      ],
    };

    const normalized = normalizeOcrDocument(source, { minimumConfidence: 0.7 });

    expect(normalized.pages).toEqual([
      {
        index: 0,
        blocks: [{ text: "Rechnung", confidence: 0.99, words: undefined }],
      },
    ]);
  });

  test("collects text and converts OCR output into linguistics-aware documents", () => {
    const document: OcrDocument = {
      id: "scan-42",
      sourceType: "image",
      language: "en",
      pages: [
        {
          index: 0,
          blocks: [{ text: "Hello world." }, { text: "How are you?" }],
        },
      ],
    };

    expect(collectOcrText(document)).toBe("Hello world.\nHow are you?");

    const textDocument = ocrToTextDocument(document, { granularity: "word" });

    expect(textDocument.sentences.map((sentence) => sentence.text)).toEqual([
      "Hello world.",
      "How are you?",
    ]);
    expect(
      textDocument.tokens.filter((token) => token.isWordLike).map((token) => token.text),
    ).toEqual(["Hello", "world", "How", "are", "you"]);
  });

  test("runs OCR extractors through a provider-agnostic pipeline", async () => {
    const pipeline = createOcrPipeline({
      extractor: {
        id: "fake-vision",
        async extract() {
          return {
            id: "video-1",
            sourceType: "video",
            pages: [
              {
                index: 0,
                startTimeMs: 0,
                endTimeMs: 1000,
                blocks: [{ text: "First frame" }],
              },
              {
                index: 1,
                startTimeMs: 1000,
                endTimeMs: 2000,
                blocks: [{ text: "Second frame" }],
              },
            ],
          };
        },
      },
      postProcessors: [
        {
          id: "normalize",
          run: (document) => normalizeOcrDocument(document),
        },
      ],
    });

    const result = await pipeline.extract({
      sourceType: "video",
      input: "https://example.com/video.mp4",
    });

    expect(result.provider).toBe("fake-vision");
    expect(result.text).toBe("First frame\n\nSecond frame");
    expect(result.document.pages).toHaveLength(2);
  });

  test("creates stable video frame plans with caps", () => {
    expect(
      createVideoFramePlan({
        durationMs: 5_000,
        fps: 2,
        maxFrames: 6,
      }),
    ).toEqual({
      timestampsMs: [0, 500, 1000, 1500, 2000, 2500],
      frameCount: 6,
    });

    expect(
      createVideoFramePlan({
        durationMs: 800,
        fps: 1,
      }),
    ).toEqual({ timestampsMs: [0, 800], frameCount: 2 });
  });
});
