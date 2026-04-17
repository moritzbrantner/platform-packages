import { describe, expect, test } from "vitest";

import {
  extractDocumentStructure,
  flattenStructuredDocument,
  mapStructureToTextDocumentSpans,
  runStructureIntegrationHooks,
  toFormFieldRecords,
  type StructuredDocument,
} from "@moritzbrantner/document-structure-extraction";
import type { OcrDocument } from "@moritzbrantner/ocr";

describe("@moritzbrantner/document-structure-extraction", () => {
  test("extracts reading order, table grids, header/value pairs, and sections", () => {
    const ocr: OcrDocument = {
      id: "doc-001",
      sourceType: "pdf",
      pages: [
        {
          index: 0,
          blocks: [
            { text: "Date: 2026-04-17", confidence: 0.95, bbox: [40, 20, 220, 40] },
            { text: "1. Overview", confidence: 0.9, bbox: [20, 60, 260, 82] },
            { text: "Item  Qty  Price\nPen  2  3.50", confidence: 0.93, bbox: [20, 100, 320, 170] },
          ],
        },
      ],
    };

    const structured = extractDocumentStructure(ocr);

    expect(structured.pages[0].blocks.map((block) => block.kind)).toEqual([
      "headerValue",
      "section",
      "table",
    ]);
    expect(structured.pages[0].readingOrder).toHaveLength(3);

    const flattened = flattenStructuredDocument(structured);
    expect(flattened.filter((record) => record.kind === "table")).toHaveLength(6);

    const fields = toFormFieldRecords(structured);
    expect(fields).toEqual([
      {
        field: "Date",
        value: "2026-04-17",
        pageIndex: 0,
        blockId: structured.pages[0].blocks[0]!.id,
        confidence: 0.95,
      },
    ]);
  });

  test("maps structured content into TextDocument spans for traceability", () => {
    const structured: StructuredDocument = {
      id: "doc-002",
      sourceType: "image",
      pages: [
        {
          index: 0,
          readingOrder: ["a", "b"],
          blocks: [
            {
              id: "a",
              kind: "text",
              text: "Hello world",
              meta: { pageIndex: 0, blockIndex: 0, confidence: { overall: 0.9 } },
            },
            {
              id: "b",
              kind: "headerValue",
              header: "Invoice",
              value: "INV-01",
              meta: { pageIndex: 0, blockIndex: 1, confidence: { overall: 0.88, headerValue: 0.88 } },
            },
          ],
        },
      ],
    };

    const mapped = mapStructureToTextDocumentSpans(structured);

    expect(mapped.document.text).toBe("Hello world\nInvoice: INV-01");
    expect(mapped.spans[0]?.span).toEqual({
      start: 0,
      end: 11,
      text: "Hello world",
    });
    expect(mapped.spans[1]?.span.text).toBe("Invoice: INV-01");
  });

  test("runs optional integration hooks", async () => {
    const ocr: OcrDocument = {
      id: "doc-003",
      sourceType: "image",
      pages: [{ index: 0, blocks: [{ text: "Amount: 42" }] }],
    };

    const structured = extractDocumentStructure(ocr);
    const result = await runStructureIntegrationHooks(ocr, structured, [
      {
        id: "form-detector",
        run: ({ structured: doc }) => ({
          findings: [`fields=${toFormFieldRecords(doc).length}`],
          metadata: { pages: doc.pages.length },
        }),
      },
    ]);

    expect(result.findings).toEqual(["fields=1"]);
    expect(result.metadata).toEqual({
      "form-detector": { pages: 1 },
    });
  });
});
