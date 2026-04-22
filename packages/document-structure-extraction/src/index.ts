import type { TextDocument, TextSpan } from "@moritzbrantner/linguistics-core";
import type { OcrBlock, OcrDocument, OcrPage } from "@moritzbrantner/ocr";

export type BBox = [number, number, number, number];
export type StructuredBlockType =
  | "line"
  | "table-cell"
  | "table-row"
  | "section-heading"
  | "key"
  | "value";

export interface StructuredBlockConfidence {
  ocr?: number;
  structure: number;
  overall: number;
}

export interface StructuredBlock {
  id: string;
  pageIndex: number;
  type: StructuredBlockType;
  text: string;
  bbox?: BBox;
  confidence: StructuredBlockConfidence;
  readingOrder: number;
  metadata?: Record<string, unknown>;
}

export interface TableCell {
  rowIndex: number;
  columnIndex: number;
  text: string;
  bbox?: BBox;
  confidence: number;
  blockId?: string;
}

export interface TableRow {
  rowIndex: number;
  bbox?: BBox;
  cells: TableCell[];
}

export interface TableGrid {
  id: string;
  pageIndex: number;
  bbox?: BBox;
  rows: TableRow[];
  confidence: number;
}

export interface HeaderValuePair {
  id: string;
  pageIndex: number;
  key: string;
  value: string;
  keyBlockId?: string;
  valueBlockId?: string;
  bbox?: BBox;
  confidence: number;
}

export interface SectionNode {
  id: string;
  pageIndex: number;
  level: number;
  title: string;
  blockId?: string;
  bbox?: BBox;
  confidence: number;
  children: SectionNode[];
}

export interface DocumentStructureResult {
  documentId: string;
  sourceType: OcrDocument["sourceType"];
  blocks: StructuredBlock[];
  tables: TableGrid[];
  headerValuePairs: HeaderValuePair[];
  sections: SectionNode[];
  readingOrder: string[];
  metadata?: Record<string, unknown>;
}

export interface CreateStructureExtractorOptions {
  minimumBlockConfidence?: number;
  tableRowTolerance?: number;
  keyValueSeparatorPattern?: RegExp;
}

export interface NormalizedRecord {
  id: string;
  recordType: "table-row" | "form-field";
  tableId?: string;
  pageIndex: number;
  values: Record<string, string>;
  confidence: number;
}

export interface FormFieldRecord {
  id: string;
  key: string;
  value: string;
  pageIndex: number;
  confidence: number;
  keyBlockId?: string;
  valueBlockId?: string;
}

export interface BlockTrace {
  blockId: string;
  pageIndex: number;
  type: StructuredBlockType;
  confidence: StructuredBlockConfidence;
  span: TextSpan;
}

export interface TraceabilityMap {
  traces: BlockTrace[];
  unresolvedBlockIds: string[];
}

const DEFAULT_KEY_VALUE_SEPARATOR = /\s*[:：]\s*/u;

export function extractDocumentStructure(
  document: OcrDocument,
  options: CreateStructureExtractorOptions = {},
): DocumentStructureResult {
  const threshold = options.minimumBlockConfidence ?? 0;
  const flatBlocks = flattenBlocks(document, threshold);
  const readingOrderBlocks = [...flatBlocks].sort(compareByReadingOrder);

  const blocks: StructuredBlock[] = readingOrderBlocks.map((entry, index) => ({
    id: `block-${entry.page.index}-${entry.blockIndex}`,
    pageIndex: entry.page.index,
    type: classifyBlock(entry.block.text),
    text: entry.block.text,
    bbox: entry.block.bbox,
    confidence: makeConfidence(entry.block.confidence, 0.9),
    readingOrder: index,
  }));

  const tables = extractTables(document, blocks, options.tableRowTolerance ?? 12);
  const headerValuePairs = extractHeaderValuePairs(
    blocks,
    options.keyValueSeparatorPattern ?? DEFAULT_KEY_VALUE_SEPARATOR,
  );
  const sections = extractSectionHierarchy(blocks);

  return {
    documentId: document.id,
    sourceType: document.sourceType,
    blocks,
    tables,
    headerValuePairs,
    sections,
    readingOrder: blocks.map((block) => block.id),
    metadata: document.metadata,
  };
}

export function flattenStructureToNormalizedRecords(
  result: DocumentStructureResult,
): NormalizedRecord[] {
  const tableRows = result.tables.flatMap((table) => {
    const headers = table.rows[0]?.cells.map((cell) => cell.text.trim()) ?? [];

    return table.rows.slice(1).map((row) => {
      const values: Record<string, string> = {};
      for (const cell of row.cells) {
        const key = headers[cell.columnIndex] || `column_${cell.columnIndex + 1}`;
        values[key] = cell.text;
      }

      return {
        id: `${table.id}-row-${row.rowIndex}`,
        recordType: "table-row" as const,
        tableId: table.id,
        pageIndex: table.pageIndex,
        values,
        confidence: average(row.cells.map((cell) => cell.confidence)),
      };
    });
  });

  const formFields = result.headerValuePairs.map((pair) => ({
    id: pair.id,
    recordType: "form-field" as const,
    pageIndex: pair.pageIndex,
    values: {
      key: pair.key,
      value: pair.value,
    },
    confidence: pair.confidence,
  }));

  return [...tableRows, ...formFields];
}

export function flattenHeaderValuePairsToFormFields(
  result: DocumentStructureResult,
): FormFieldRecord[] {
  return result.headerValuePairs.map((pair) => ({
    id: pair.id,
    key: pair.key,
    value: pair.value,
    pageIndex: pair.pageIndex,
    confidence: pair.confidence,
    keyBlockId: pair.keyBlockId,
    valueBlockId: pair.valueBlockId,
  }));
}

export function structureToCsvRows(result: DocumentStructureResult): string[] {
  return flattenStructureToNormalizedRecords(result).map((record) => JSON.stringify(record.values));
}

export function mapStructureToTextDocumentSpans(
  result: DocumentStructureResult,
  document: TextDocument,
): TraceabilityMap {
  const traces: BlockTrace[] = [];
  const unresolved: string[] = [];
  let searchFrom = 0;

  for (const block of result.blocks.sort((a, b) => a.readingOrder - b.readingOrder)) {
    const normalized = block.text.trim();
    if (!normalized) {
      unresolved.push(block.id);
      continue;
    }

    const found = findWithFallback(document.text, normalized, searchFrom);
    if (!found) {
      unresolved.push(block.id);
      continue;
    }

    traces.push({
      blockId: block.id,
      pageIndex: block.pageIndex,
      type: block.type,
      confidence: block.confidence,
      span: {
        start: found.start,
        end: found.end,
        text: document.text.slice(found.start, found.end),
      },
    });

    searchFrom = found.end;
  }

  return {
    traces,
    unresolvedBlockIds: unresolved,
  };
}

function flattenBlocks(document: OcrDocument, minimumConfidence: number) {
  return document.pages.flatMap((page) =>
    page.blocks
      .map((block, blockIndex) => ({ page, block, blockIndex }))
      .filter(
        ({ block }) => (block.confidence ?? 1) >= minimumConfidence && block.text.trim().length > 0,
      ),
  );
}

function classifyBlock(text: string): StructuredBlockType {
  if (/^[A-Z\d\s]{4,}$/u.test(text.trim())) {
    return "section-heading";
  }

  if (/\S+\s*[:：]\s*\S+/u.test(text)) {
    return "key";
  }

  return "line";
}

function makeConfidence(
  ocrConfidence: number | undefined,
  structuralConfidence: number,
): StructuredBlockConfidence {
  const ocr = ocrConfidence ?? 1;
  return {
    ocr,
    structure: structuralConfidence,
    overall: average([ocr, structuralConfidence]),
  };
}

function extractTables(
  document: OcrDocument,
  blocks: StructuredBlock[],
  rowTolerance: number,
): TableGrid[] {
  const byPage = new Map<number, StructuredBlock[]>();
  for (const block of blocks) {
    if (!block.bbox) {
      continue;
    }

    const bucket = byPage.get(block.pageIndex) ?? [];
    bucket.push(block);
    byPage.set(block.pageIndex, bucket);
  }

  const tables: TableGrid[] = [];

  for (const page of document.pages) {
    const pageBlocks = (byPage.get(page.index) ?? []).sort(
      (a, b) => (a.bbox?.[1] ?? 0) - (b.bbox?.[1] ?? 0),
    );
    const rows = groupIntoRows(pageBlocks, rowTolerance);

    if (rows.length < 2 || rows.every((row) => row.cells.length < 2)) {
      continue;
    }

    const tableRows: TableRow[] = rows.map((row, rowIndex) => ({
      rowIndex,
      bbox: mergeBBoxes(row.cells.map((cell) => cell.bbox).filter(Boolean) as BBox[]),
      cells: row.cells.map((cell, columnIndex) => ({
        rowIndex,
        columnIndex,
        text: cell.text,
        bbox: cell.bbox,
        confidence: cell.confidence.overall,
        blockId: cell.id,
      })),
    }));

    tables.push({
      id: `table-${page.index}-${tables.length}`,
      pageIndex: page.index,
      rows: tableRows,
      bbox: mergeBBoxes(tableRows.map((row) => row.bbox).filter(Boolean) as BBox[]),
      confidence: average(tableRows.flatMap((row) => row.cells.map((cell) => cell.confidence))),
    });
  }

  return tables;
}

function groupIntoRows(
  blocks: StructuredBlock[],
  tolerance: number,
): Array<{ cells: StructuredBlock[] }> {
  const rows: Array<{ anchorY: number; cells: StructuredBlock[] }> = [];

  for (const block of blocks) {
    const y = block.bbox?.[1] ?? 0;
    const existing = rows.find((row) => Math.abs(row.anchorY - y) <= tolerance);

    if (existing) {
      existing.cells.push(block);
      continue;
    }

    rows.push({
      anchorY: y,
      cells: [block],
    });
  }

  return rows
    .map((row) => ({
      cells: row.cells.sort((a, b) => (a.bbox?.[0] ?? 0) - (b.bbox?.[0] ?? 0)),
    }))
    .filter((row) => row.cells.length >= 2);
}

function extractHeaderValuePairs(blocks: StructuredBlock[], separator: RegExp): HeaderValuePair[] {
  const pairs: HeaderValuePair[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const inlineMatch = splitKeyValue(block.text, separator);

    if (inlineMatch) {
      pairs.push({
        id: `kv-${pairs.length}`,
        pageIndex: block.pageIndex,
        key: inlineMatch.key,
        value: inlineMatch.value,
        keyBlockId: block.id,
        valueBlockId: block.id,
        bbox: block.bbox,
        confidence: block.confidence.overall,
      });
      continue;
    }

    const next = blocks[index + 1];
    if (!next || next.pageIndex !== block.pageIndex) {
      continue;
    }

    if (looksLikeKey(block.text) && looksLikeValue(next.text)) {
      pairs.push({
        id: `kv-${pairs.length}`,
        pageIndex: block.pageIndex,
        key: block.text.replace(/[:：]\s*$/u, "").trim(),
        value: next.text.trim(),
        keyBlockId: block.id,
        valueBlockId: next.id,
        bbox: mergeBBoxes([block.bbox, next.bbox].filter(Boolean) as BBox[]),
        confidence: average([block.confidence.overall, next.confidence.overall]),
      });
    }
  }

  return dedupePairs(pairs);
}

function splitKeyValue(text: string, separator: RegExp): { key: string; value: string } | null {
  const segments = text.split(separator).map((segment) => segment.trim());
  if (segments.length < 2) {
    return null;
  }

  const [key, ...rest] = segments;
  const value = rest.join(": ").trim();

  if (!key || !value) {
    return null;
  }

  return { key, value };
}

function dedupePairs(pairs: HeaderValuePair[]): HeaderValuePair[] {
  const seen = new Set<string>();
  return pairs.filter((pair) => {
    const fingerprint = `${pair.pageIndex}:${pair.key.toLowerCase()}:${pair.value.toLowerCase()}`;
    if (seen.has(fingerprint)) {
      return false;
    }

    seen.add(fingerprint);
    return true;
  });
}

function extractSectionHierarchy(blocks: StructuredBlock[]): SectionNode[] {
  const headings = blocks.filter((block) => {
    const trimmed = block.text.trim();
    return block.type === "section-heading" || /^\d+(?:\.\d+)*\s+\S+/u.test(trimmed);
  });

  const root: SectionNode = {
    id: "root",
    pageIndex: 0,
    level: 0,
    title: "root",
    confidence: 1,
    children: [],
  };
  const stack: SectionNode[] = [root];

  for (const heading of headings) {
    const level = inferSectionLevel(heading.text);
    const node: SectionNode = {
      id: `section-${heading.id}`,
      pageIndex: heading.pageIndex,
      level,
      title: heading.text.trim(),
      blockId: heading.id,
      bbox: heading.bbox,
      confidence: heading.confidence.overall,
      children: [],
    };

    while (stack.length > 1 && (stack.at(-1)?.level ?? 0) >= level) {
      stack.pop();
    }

    (stack.at(-1) ?? root).children.push(node);
    stack.push(node);
  }

  return root.children;
}

function inferSectionLevel(text: string): number {
  const numberedMatch = text.trim().match(/^(\d+(?:\.\d+)*)\s+/u);
  if (numberedMatch) {
    return numberedMatch[1].split(".").length;
  }

  if (/^[A-Z\d\s]{4,}$/u.test(text.trim())) {
    return 1;
  }

  return 2;
}

function compareByReadingOrder(
  left: { page: OcrPage; block: OcrBlock; blockIndex: number },
  right: { page: OcrPage; block: OcrBlock; blockIndex: number },
): number {
  return (
    left.page.index - right.page.index ||
    (left.block.bbox?.[1] ?? Number.POSITIVE_INFINITY) -
      (right.block.bbox?.[1] ?? Number.POSITIVE_INFINITY) ||
    (left.block.bbox?.[0] ?? Number.POSITIVE_INFINITY) -
      (right.block.bbox?.[0] ?? Number.POSITIVE_INFINITY) ||
    left.blockIndex - right.blockIndex
  );
}

function looksLikeKey(text: string): boolean {
  const trimmed = text.trim();

  if (/^[A-Z\d\s]{4,}$/u.test(trimmed)) {
    return false;
  }

  return (
    /[:：]$/u.test(trimmed) || (/^[A-Z][A-Za-z\s]{1,40}$/u.test(trimmed) && trimmed.length <= 30)
  );
}

function looksLikeValue(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && !/[:：]$/u.test(trimmed);
}

function findWithFallback(
  haystack: string,
  needle: string,
  offset: number,
): { start: number; end: number } | null {
  const direct = haystack.indexOf(needle, offset);
  if (direct !== -1) {
    return { start: direct, end: direct + needle.length };
  }

  const normalizedHaystack = normalizeWhitespace(haystack);
  const normalizedNeedle = normalizeWhitespace(needle);
  if (!normalizedNeedle) {
    return null;
  }

  const normalizedIndex = normalizedHaystack.indexOf(normalizedNeedle, offset);
  if (normalizedIndex === -1) {
    return null;
  }

  return {
    start: normalizedIndex,
    end: normalizedIndex + normalizedNeedle.length,
  };
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/gu, " ").trim();
}

function mergeBBoxes(boxes: BBox[]): BBox | undefined {
  if (boxes.length === 0) {
    return undefined;
  }

  const minX = Math.min(...boxes.map((box) => box[0]));
  const minY = Math.min(...boxes.map((box) => box[1]));
  const maxX = Math.max(...boxes.map((box) => box[2]));
  const maxY = Math.max(...boxes.map((box) => box[3]));
  return [minX, minY, maxX, maxY];
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
