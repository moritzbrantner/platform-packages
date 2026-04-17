import { describe, expect, test } from "vitest";

import {
  chunkIngestedDocumentForInference,
  ingestFileDrop,
  ingestHtml,
  ingestJsonFeed,
  ingestPlainText,
} from "@moritzbrantner/source-ingestion";

describe("@moritzbrantner/source-ingestion", () => {
  test("ingests HTML and removes common boilerplate sections", () => {
    const ingested = ingestHtml({
      html: "<html><body><header>Subscribe now</header><article><h1>Headline</h1><p>Body text.</p></article><footer>Privacy policy</footer></body></html>",
      source: {
        url: "https://example.com/post",
        fetchedAt: "2026-04-17T00:00:00.000Z",
        languageHints: ["en"],
      },
    });

    expect(ingested.document.text).toContain("Headline");
    expect(ingested.document.text).toContain("Body text.");
    expect(ingested.document.text.toLowerCase()).not.toContain("privacy policy");
    expect(ingested.document.metadata?.source.url).toBe("https://example.com/post");
    expect(ingested.sourceOffsets.length).toBe(ingested.document.text.length);
  });

  test("ingests JSON feed entries into reproducible documents", () => {
    const documents = ingestJsonFeed({
      feed: {
        items: [
          {
            id: "item-1",
            url: "https://example.com/news/1",
            title: "First item",
            content: "First content paragraph.",
            publishedAt: "2026-04-16T10:00:00.000Z",
          },
          {
            id: "item-2",
            content: "<article><p>Second item body.</p></article>",
          },
        ],
      },
      source: {
        sourceId: "daily-feed",
        fetchedAt: "2026-04-17T00:00:00.000Z",
      },
      defaultLanguage: "en",
    });

    expect(documents).toHaveLength(2);
    expect(documents[0].document.id).toBe("item-1");
    expect(documents[1].document.text).toContain("Second item body");
    expect(documents[0].document.metadata?.source.publishedAt).toBe("2026-04-16T10:00:00.000Z");
  });

  test("chunks with inference presets and emits source offsets", () => {
    const ingested = ingestPlainText({
      text: "Alpha beta gamma. Delta epsilon zeta. Eta theta iota.",
      source: {
        sourceId: "plain-1",
        fetchedAt: "2026-04-17T00:00:00.000Z",
      },
      id: "plain-1",
      language: "en",
    });

    const chunks = chunkIngestedDocumentForInference(ingested, { preset: "compact" });

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].sourceStart).toBeGreaterThanOrEqual(0);
    expect(chunks[0].sourceEnd).toBeGreaterThan(chunks[0].sourceStart);
  });

  test("detects JSON file drops automatically", () => {
    const documents = ingestFileDrop({
      fileId: "drop-1",
      fileName: "feed.json",
      content: JSON.stringify({
        items: [{ id: "a", content: "From file drop" }],
      }),
      source: {
        fetchedAt: "2026-04-17T00:00:00.000Z",
      },
    });

    expect(documents).toHaveLength(1);
    expect(documents[0].metadata.source.fileId).toBe("drop-1");
    expect(documents[0].document.text).toContain("From file drop");
  });
});
