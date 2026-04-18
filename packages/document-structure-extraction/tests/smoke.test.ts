import { createTextDocument } from "@moritzbrantner/linguistics-core";
import { describe, expect, test } from "vitest";

import {
  extractDocumentStructure,
  flattenHeaderValuePairsToFormFields,
  flattenStructureToNormalizedRecords,
  mapStructureToTextDocumentSpans,
  structureToCsvRows,
  type DocumentStructureResult,
} from "@moritzbrantner/document-structure-extraction";
import { collectOcrText, type OcrDocument } from "@moritzbrantner/ocr";

describe("@moritzbrantner/document-structure-extraction", () => {
  test("extracts tables, key/value fields, section hierarchy, and reading order", () => {
    const ocr: OcrDocument = {
      id: "invoice-1",
      sourceType: "pdf",
      pages: [
        {
          index: 0,
          blocks: [
            { text: "INVOICE", bbox: [0, 0, 60, 10], confidence: 0.95 },
            { text: "Invoice No:", bbox: [0, 15, 40, 25], confidence: 0.91 },
            { text: "A-123", bbox: [50, 15, 80, 25], confidence: 0.9 },
            { text: "Item", bbox: [0, 30, 30, 40], confidence: 0.99 },
            { text: "Qty", bbox: [40, 30, 60, 40], confidence: 0.98 },
            { text: "Widget", bbox: [0, 45, 30, 55], confidence: 0.97 },
            { text: "2", bbox: [40, 45, 60, 55], confidence: 0.96 },
          ],
        },
      ],
    };

    const result = extractDocumentStructure(ocr);

    expect(result.readingOrder[0]).toBe("block-0-0");
    expect(result.tables[0]?.rows.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(result.headerValuePairs[0]).toMatchObject({ key: "Invoice No", value: "A-123" });
    expect(result.sections[0]?.title).toBe("INVOICE");
  });

  test("flattens structure into normalized records and form field objects", () => {
    const result: DocumentStructureResult = {
      documentId: "doc-1",
      sourceType: "pdf",
      blocks: [],
      tables: [
        {
          id: "table-0",
          pageIndex: 0,
          confidence: 0.9,
          rows: [
            {
              rowIndex: 0,
              cells: [
                { rowIndex: 0, columnIndex: 0, text: "Field", confidence: 1 },
                { rowIndex: 0, columnIndex: 1, text: "Value", confidence: 1 },
              ],
            },
            {
              rowIndex: 1,
              cells: [
                { rowIndex: 1, columnIndex: 0, text: "City", confidence: 1 },
                { rowIndex: 1, columnIndex: 1, text: "Berlin", confidence: 1 },
              ],
            },
          ],
        },
      ],
      headerValuePairs: [
        {
          id: "kv-1",
          pageIndex: 0,
          key: "Invoice",
          value: "A-123",
          confidence: 0.88,
        },
      ],
      sections: [],
      readingOrder: [],
    };

    expect(flattenStructureToNormalizedRecords(result)).toEqual([
      {
        id: "table-0-row-1",
        recordType: "table-row",
        tableId: "table-0",
        pageIndex: 0,
        values: {
          Field: "City",
          Value: "Berlin",
        },
        confidence: 1,
      },
      {
        id: "kv-1",
        recordType: "form-field",
        pageIndex: 0,
        values: {
          key: "Invoice",
          value: "A-123",
        },
        confidence: 0.88,
      },
    ]);

    expect(flattenHeaderValuePairsToFormFields(result)).toEqual([
      {
        id: "kv-1",
        key: "Invoice",
        value: "A-123",
        pageIndex: 0,
        confidence: 0.88,
        keyBlockId: undefined,
        valueBlockId: undefined,
      },
    ]);

    expect(structureToCsvRows(result)[0]).toContain("\"City\"");
  });

  test("maps structured blocks to text spans for traceability", () => {
    const ocr: OcrDocument = {
      id: "trace-1",
      sourceType: "image",
      pages: [
        {
          index: 0,
          blocks: [
            { text: "Name: Clara", bbox: [0, 0, 40, 10], confidence: 0.9 },
            { text: "Role: Support", bbox: [0, 12, 50, 22], confidence: 0.9 },
          ],
        },
      ],
    };
    const structure = extractDocumentStructure(ocr);
    const text = collectOcrText(ocr);
    const textDocument = createTextDocument({ id: "trace-1", text });

    const mapped = mapStructureToTextDocumentSpans(structure, textDocument);

    expect(mapped.unresolvedBlockIds).toEqual([]);
    expect(mapped.traces).toHaveLength(2);
    expect(mapped.traces[0]?.span.text).toBe("Name: Clara");
  });
});
