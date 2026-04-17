import { createTextDocument, type TextDocument, type TextSpan } from "@moritzbrantner/linguistics-core";
import type { OcrBlock, OcrDocument, OcrPage } from "@moritzbrantner/ocr";

export type BoundingBox = [number, number, number, number];

export interface StructureConfidence {
  overall?: number;
  table?: number;
  headerValue?: number;
  section?: number;
  readingOrder?: number;
}

export interface StructuredBlockMeta {
  pageIndex: number;
  blockIndex: number;
  confidence: StructureConfidence;
}

export interface StructuredTextBlock {
  id: string;
  kind: "text";
  text: string;
  bbox?: BoundingBox;
  meta: StructuredBlockMeta;
}

export interface StructuredHeaderValueBlock {
  id: string;
  kind: "headerValue";
  header: string;
  value: string;
  bbox?: BoundingBox;
  meta: StructuredBlockMeta;
}

export interface StructuredTableCell {
  row: number;
  column: number;
  text: string;
  bbox?: BoundingBox;
  confidence?: number;
}

export interface StructuredTableBlock {
  id: string;
  kind: "table";
  rows: number;
  columns: number;
  cells: StructuredTableCell[];
  bbox?: BoundingBox;
  meta: StructuredBlockMeta;
}

export interface StructuredSectionBlock {
  id: string;
  kind: "section";
  level: number;
  title: string;
  text: string;
  bbox?: BoundingBox;
  meta: StructuredBlockMeta;
}

export type StructuredBlock =
  | StructuredTextBlock
  | StructuredHeaderValueBlock
  | StructuredTableBlock
  | StructuredSectionBlock;

export interface StructuredPage {
  index: number;
  width?: number;
  height?: number;
  readingOrder: string[];
  blocks: StructuredBlock[];
}

export interface StructuredDocument {
  id: string;
  sourceType: OcrDocument["sourceType"];
  language?: string;
  pages: StructuredPage[];
  metadata?: Record<string, unknown>;
}

export interface ExtractDocumentStructureOptions {
  tableDelimiterPattern?: RegExp;
  headerValueDelimiterPattern?: RegExp;
  minimumHeaderLength?: number;
}

export interface FlattenStructureRecord {
  documentId: string;
  pageIndex: number;
  blockId: string;
  kind: StructuredBlock["kind"];
  key?: string;
  value: string;
  row?: number;
  column?: number;
  sectionLevel?: number;
  bbox?: BoundingBox;
  confidence?: number;
}

export interface FormFieldRecord {
  field: string;
  value: string;
  pageIndex: number;
  blockId: string;
  confidence?: number;
}

export interface StructuredBlockSpan {
  blockId: string;
  span: TextSpan;
  pageIndex: number;
  kind: StructuredBlock["kind"];
}

export interface StructureTraceabilityResult<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  document: TextDocument<Metadata>;
  spans: StructuredBlockSpan[];
}

export interface StructureIntegrationHookContext {
  ocr: OcrDocument;
  structured: StructuredDocument;
}

export interface StructureIntegrationHookResult {
  findings?: string[];
  metadata?: Record<string, unknown>;
}

export interface DocumentStructureIntegrationHook {
  id: string;
  run(
    context: StructureIntegrationHookContext,
  ): StructureIntegrationHookResult | Promise<StructureIntegrationHookResult>;
}

export interface RunStructureIntegrationHooksResult {
  findings: string[];
  metadata: Record<string, unknown>;
}

const DEFAULT_TABLE_DELIMITER = /\s{2,}|\t|\|/gu;
const DEFAULT_HEADER_VALUE_DELIMITER = /\s*[:=]\s*/u;
const DEFAULT_MIN_HEADER_LENGTH = 2;

export function extractDocumentStructure(
  document: OcrDocument,
  options: ExtractDocumentStructureOptions = {},
): StructuredDocument {
  const pages = document.pages.map((page) => extractStructuredPage(page, options));

  return {
    id: document.id,
    sourceType: document.sourceType,
    language: document.language,
    pages,
    metadata: document.metadata,
  };
}

export function flattenStructuredDocument(document: StructuredDocument): FlattenStructureRecord[] {
  return document.pages.flatMap((page) =>
    page.blocks.flatMap((block) => flattenStructuredBlock(document.id, page.index, block)),
  );
}

export function toFormFieldRecords(document: StructuredDocument): FormFieldRecord[] {
  return document.pages.flatMap((page) =>
    page.blocks.flatMap((block) => {
      if (block.kind !== "headerValue") {
        return [];
      }

      return {
        field: block.header,
        value: block.value,
        pageIndex: page.index,
        blockId: block.id,
        confidence: block.meta.confidence.overall,
      };
    }),
  );
}

export function mapStructureToTextDocumentSpans<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(
  document: StructuredDocument,
  options: {
    id?: string;
    language?: string;
    metadata?: Metadata;
    pageSeparator?: string;
    blockSeparator?: string;
  } = {},
): StructureTraceabilityResult<Metadata> {
  const pageSeparator = options.pageSeparator ?? "\n\n";
  const blockSeparator = options.blockSeparator ?? "\n";

  const pieces: string[] = [];
  const spans: StructuredBlockSpan[] = [];
  let cursor = 0;

  for (let pageIndex = 0; pageIndex < document.pages.length; pageIndex += 1) {
    const page = document.pages[pageIndex];

    if (pageIndex > 0 && pageSeparator.length > 0) {
      pieces.push(pageSeparator);
      cursor += pageSeparator.length;
    }

    for (let blockIndex = 0; blockIndex < page.blocks.length; blockIndex += 1) {
      const block = page.blocks[blockIndex];

      if (blockIndex > 0 && blockSeparator.length > 0) {
        pieces.push(blockSeparator);
        cursor += blockSeparator.length;
      }

      const text = stringifyBlock(block);
      const span: TextSpan = {
        start: cursor,
        end: cursor + text.length,
        text,
      };

      pieces.push(text);
      spans.push({
        blockId: block.id,
        pageIndex: page.index,
        kind: block.kind,
        span,
      });
      cursor += text.length;
    }
  }

  const joinedText = pieces.join("");
  const textDocument = createTextDocument<Metadata>({
    id: options.id ?? document.id,
    text: joinedText,
    language: options.language ?? document.language,
    metadata: options.metadata,
  });

  return {
    document: textDocument,
    spans,
  };
}

export async function runStructureIntegrationHooks(
  ocr: OcrDocument,
  structured: StructuredDocument,
  hooks: DocumentStructureIntegrationHook[] = [],
): Promise<RunStructureIntegrationHooksResult> {
  const findings: string[] = [];
  const metadata: Record<string, unknown> = {};

  for (const hook of hooks) {
    const result = await hook.run({ ocr, structured });

    if (result.findings) {
      findings.push(...result.findings);
    }

    if (result.metadata) {
      metadata[hook.id] = result.metadata;
    }
  }

  return {
    findings,
    metadata,
  };
}

function extractStructuredPage(
  page: OcrPage,
  options: ExtractDocumentStructureOptions,
): StructuredPage {
  const sortedBlocks = [...page.blocks]
    .map((block, blockIndex) => ({ block, blockIndex }))
    .sort((left, right) => compareReadingOrder(left.block, right.block, left.blockIndex, right.blockIndex));

  const blocks: StructuredBlock[] = [];

  for (let sortedIndex = 0; sortedIndex < sortedBlocks.length; sortedIndex += 1) {
    const { block, blockIndex } = sortedBlocks[sortedIndex];
    const structured = classifyBlock(block, page.index, blockIndex, sortedIndex, options);
    blocks.push(structured);
  }

  return {
    index: page.index,
    width: page.width,
    height: page.height,
    readingOrder: blocks.map((block) => block.id),
    blocks,
  };
}

function classifyBlock(
  block: OcrBlock,
  pageIndex: number,
  blockIndex: number,
  readingOrderIndex: number,
  options: ExtractDocumentStructureOptions,
): StructuredBlock {
  const text = block.text.trim();
  const idBase = `p${pageIndex}-b${blockIndex}-o${readingOrderIndex}`;
  const confidence = toConfidence(block.confidence);
  const headerMatch = parseHeaderValue(text, options);

  if (headerMatch) {
    return {
      id: `${idBase}-header-value`,
      kind: "headerValue",
      header: headerMatch.header,
      value: headerMatch.value,
      bbox: block.bbox,
      meta: {
        pageIndex,
        blockIndex,
        confidence: {
          overall: confidence,
          headerValue: confidence,
          readingOrder: 1,
        },
      },
    };
  }

  const tableRows = parseTableRows(text, options);

  if (tableRows.length >= 2) {
    const columnCount = Math.max(...tableRows.map((row) => row.length));
    const cells: StructuredTableCell[] = [];

    tableRows.forEach((row, rowIndex) => {
      for (let column = 0; column < row.length; column += 1) {
        cells.push({
          row: rowIndex,
          column,
          text: row[column],
          bbox: block.bbox,
          confidence,
        });
      }
    });

    return {
      id: `${idBase}-table`,
      kind: "table",
      rows: tableRows.length,
      columns: columnCount,
      cells,
      bbox: block.bbox,
      meta: {
        pageIndex,
        blockIndex,
        confidence: {
          overall: confidence,
          table: confidence,
          readingOrder: 1,
        },
      },
    };
  }

  const section = parseSection(text);

  if (section) {
    return {
      id: `${idBase}-section`,
      kind: "section",
      level: section.level,
      title: section.title,
      text,
      bbox: block.bbox,
      meta: {
        pageIndex,
        blockIndex,
        confidence: {
          overall: confidence,
          section: confidence,
          readingOrder: 1,
        },
      },
    };
  }

  return {
    id: `${idBase}-text`,
    kind: "text",
    text,
    bbox: block.bbox,
    meta: {
      pageIndex,
      blockIndex,
      confidence: {
        overall: confidence,
        readingOrder: 1,
      },
    },
  };
}

function flattenStructuredBlock(
  documentId: string,
  pageIndex: number,
  block: StructuredBlock,
): FlattenStructureRecord[] {
  if (block.kind === "headerValue") {
    return [
      {
        documentId,
        pageIndex,
        blockId: block.id,
        kind: block.kind,
        key: block.header,
        value: block.value,
        bbox: block.bbox,
        confidence: block.meta.confidence.headerValue ?? block.meta.confidence.overall,
      },
    ];
  }

  if (block.kind === "table") {
    return block.cells.map((cell) => ({
      documentId,
      pageIndex,
      blockId: block.id,
      kind: block.kind,
      value: cell.text,
      row: cell.row,
      column: cell.column,
      bbox: cell.bbox,
      confidence: cell.confidence,
    }));
  }

  if (block.kind === "section") {
    return [
      {
        documentId,
        pageIndex,
        blockId: block.id,
        kind: block.kind,
        key: block.title,
        value: block.text,
        sectionLevel: block.level,
        bbox: block.bbox,
        confidence: block.meta.confidence.section ?? block.meta.confidence.overall,
      },
    ];
  }

  return [
    {
      documentId,
      pageIndex,
      blockId: block.id,
      kind: block.kind,
      value: block.text,
      bbox: block.bbox,
      confidence: block.meta.confidence.overall,
    },
  ];
}

function stringifyBlock(block: StructuredBlock): string {
  if (block.kind === "headerValue") {
    return `${block.header}: ${block.value}`;
  }

  if (block.kind === "table") {
    return block.cells
      .reduce<string[][]>((rows, cell) => {
        rows[cell.row] ??= [];
        rows[cell.row][cell.column] = cell.text;
        return rows;
      }, [])
      .map((row) => row.join(","))
      .join("\n");
  }

  if (block.kind === "section") {
    return `${"#".repeat(Math.max(1, block.level))} ${block.title}\n${block.text}`;
  }

  return block.text;
}

function parseHeaderValue(
  text: string,
  options: ExtractDocumentStructureOptions,
): { header: string; value: string } | null {
  const delimiter = options.headerValueDelimiterPattern ?? DEFAULT_HEADER_VALUE_DELIMITER;
  const minimumHeaderLength = options.minimumHeaderLength ?? DEFAULT_MIN_HEADER_LENGTH;
  const parts = text.split(delimiter);

  if (parts.length < 2) {
    return null;
  }

  const header = parts[0]?.trim() ?? "";
  const value = parts.slice(1).join(":").trim();

  if (header.length < minimumHeaderLength || value.length === 0) {
    return null;
  }

  return { header, value };
}

function parseTableRows(text: string, options: ExtractDocumentStructureOptions): string[][] {
  const delimiter = options.tableDelimiterPattern ?? DEFAULT_TABLE_DELIMITER;
  const rows = text
    .split(/\n+/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(delimiter).map((cell) => cell.trim()).filter(Boolean));

  if (rows.length < 2 || rows.some((row) => row.length < 2)) {
    return [];
  }

  const uniqueColumnCounts = new Set(rows.map((row) => row.length));
  return uniqueColumnCounts.size <= 2 ? rows : [];
}

function parseSection(text: string): { level: number; title: string } | null {
  const markdownMatch = text.match(/^(#{1,6})\s+(.+)$/u);

  if (markdownMatch) {
    return {
      level: markdownMatch[1].length,
      title: markdownMatch[2].trim(),
    };
  }

  const numberedMatch = text.match(/^(\d+(?:\.\d+)*)\s+(.+)$/u);

  if (numberedMatch) {
    return {
      level: numberedMatch[1].split(".").length,
      title: numberedMatch[2].trim(),
    };
  }

  return null;
}

function compareReadingOrder(
  left: OcrBlock,
  right: OcrBlock,
  leftIndex: number,
  rightIndex: number,
): number {
  if (!left.bbox || !right.bbox) {
    return leftIndex - rightIndex;
  }

  const [, leftTop, leftRight, leftBottom] = left.bbox;
  const [rightLeft, rightTop, rightRight, rightBottom] = right.bbox;

  const leftCenterY = (leftTop + leftBottom) / 2;
  const rightCenterY = (rightTop + rightBottom) / 2;

  if (Math.abs(leftCenterY - rightCenterY) > 8) {
    return leftCenterY - rightCenterY;
  }

  const [leftLeft] = left.bbox;
  const rightCenterX = (rightLeft + rightRight) / 2;
  const leftCenterX = (leftLeft + leftRight) / 2;

  if (Math.abs(leftCenterX - rightCenterX) > 4) {
    return leftCenterX - rightCenterX;
  }

  return leftIndex - rightIndex;
}

function toConfidence(value: number | undefined): number {
  if (typeof value !== "number") {
    return 1;
  }

  return Math.max(0, Math.min(1, value));
}
