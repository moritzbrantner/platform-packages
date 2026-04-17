import {
  collectOcrText,
  createOcrPipeline,
  normalizeOcrDocument,
  type OcrBlock,
  type OcrDocument,
  type OcrPage,
} from "@moritzbrantner/ocr";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import type { PDFPageProxy, TextContent, TextItem } from "pdfjs-dist/types/src/display/api";

import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import tesseractWorkerUrl from "tesseract.js/dist/worker.min.js?url";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const HEADER_MARGIN_RATIO = 0.14;
const FOOTER_MARGIN_RATIO = 0.86;
const OCR_RENDER_SCALE = 2;

export type PdfExtractionMode = "ocr" | "smart";

export interface RemovedPdfArtifact {
  pageIndex: number;
  text: string;
  reason: "page-number" | "repeated-margin" | "margin-noise";
}

export interface PdfExtractionProgress {
  stage: "loading" | "text-layer" | "ocr" | "cleaning" | "complete";
  pageIndex: number;
  pageCount: number;
  progress: number;
  detail: string;
}

export interface ExtractPdfTextOptions {
  mode?: PdfExtractionMode;
  signal?: AbortSignal;
  onProgress?: (progress: PdfExtractionProgress) => void;
}

export interface ExtractPdfTextResult {
  text: string;
  document: OcrDocument;
  removedBlocks: RemovedPdfArtifact[];
  extractionMode: "ocr" | "text-layer" | "hybrid";
  ocrPageCount: number;
  textLayerPageCount: number;
}

type TesseractWorker = {
  setParameters: (parameters: Record<string, string>) => Promise<unknown>;
  recognize: (
    image: HTMLCanvasElement,
    options: Record<string, unknown>,
    output: Record<string, boolean>,
  ) => Promise<{
    data: {
      blocks: Array<{
        paragraphs: Array<{
          lines: Array<{
            text: string;
            confidence: number;
            bbox: { x0: number; y0: number; x1: number; y1: number };
            words: Array<{
              text: string;
              confidence: number;
              bbox: { x0: number; y0: number; x1: number; y1: number };
            }>;
          }>;
        }>;
      }> | null;
    };
  }>;
  terminate: () => Promise<unknown>;
};

interface TextLayerFragment {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hasEOL: boolean;
}

export async function extractTextFromPdf(
  file: File,
  options: ExtractPdfTextOptions = {},
): Promise<ExtractPdfTextResult> {
  const mode = options.mode ?? "ocr";
  const fileBuffer = new Uint8Array(await file.arrayBuffer());
  const loadingTask = getDocument({ data: fileBuffer });
  const pdfDocument = await loadingTask.promise;
  let ocrWorker: TesseractWorker | null = null;
  let ocrPageCount = 0;
  let textLayerPageCount = 0;
  let activeOcrPage = 0;
  let removedBlocks: RemovedPdfArtifact[] = [];

  const pipeline = createOcrPipeline({
    extractor: {
      id: mode === "ocr" ? "playground-pdf-ocr" : "playground-hybrid-pdf-ocr",
      extract: async () => {
        const pages: OcrPage[] = [];

        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
          assertNotAborted(options.signal);

          const pageIndex = pageNumber - 1;
          const page = await pdfDocument.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1 });

          options.onProgress?.({
            stage: "loading",
            pageIndex,
            pageCount: pdfDocument.numPages,
            progress: pageIndex / pdfDocument.numPages,
            detail: `Loading page ${pageNumber} of ${pdfDocument.numPages}`,
          });

          const textLayerPage =
            mode === "smart" ? await extractTextLayerPage(page, pageIndex, viewport) : null;

          if (textLayerPage && pageHasMeaningfulText(textLayerPage)) {
            textLayerPageCount += 1;
            pages.push(textLayerPage);
            options.onProgress?.({
              stage: "text-layer",
              pageIndex,
              pageCount: pdfDocument.numPages,
              progress: (pageIndex + 1) / pdfDocument.numPages,
              detail: `Using embedded text layer for page ${pageNumber}`,
            });
            continue;
          }

          activeOcrPage = pageIndex;
          ocrWorker ??= await createBrowserOcrWorker((message) => {
            const progress = Math.min(
              0.99,
              (activeOcrPage + Math.max(0, Math.min(1, message.progress))) /
                pdfDocument.numPages,
            );

            options.onProgress?.({
              stage: "ocr",
              pageIndex: activeOcrPage,
              pageCount: pdfDocument.numPages,
              progress,
              detail: `OCR ${activeOcrPage + 1}/${pdfDocument.numPages}: ${message.status}`,
            });
          });

          pages.push(await extractOcrPage(page, pageIndex, viewport, ocrWorker, options.signal));
          ocrPageCount += 1;
        }

        return {
          id: `pdf-${file.name}`,
          sourceType: "pdf",
          pages,
          metadata: {
            fileName: file.name,
            pageCount: pdfDocument.numPages,
          },
        };
      },
    },
    postProcessors: [
      {
        id: "normalize",
        run: (document: OcrDocument) =>
          normalizeOcrDocument(document, {
            minimumConfidence: mode === "ocr" ? 0.45 : 0,
          }),
      },
      {
        id: "strip-pdf-artifacts",
        run: (document: OcrDocument) => {
          options.onProgress?.({
            stage: "cleaning",
            pageIndex: 0,
            pageCount: pdfDocument.numPages,
            progress: 0.99,
            detail: "Removing page numbers, repeated headers, and footer noise",
          });

          const filtered = stripPdfArtifacts(document);
          removedBlocks = filtered.removedBlocks;
          return filtered.document;
        },
      },
    ],
  });

  try {
    const result = await pipeline.extract({
      sourceType: "pdf",
      input: fileBuffer,
      signal: options.signal,
      metadata: {
        fileName: file.name,
      },
    });
    const extractionMode =
      ocrPageCount > 0 && textLayerPageCount > 0
        ? "hybrid"
        : ocrPageCount > 0
          ? "ocr"
          : "text-layer";

    options.onProgress?.({
      stage: "complete",
      pageIndex: pdfDocument.numPages - 1,
      pageCount: pdfDocument.numPages,
      progress: 1,
      detail: "PDF extraction complete",
    });

    return {
      text: collectOcrText(result.document),
      document: result.document,
      removedBlocks,
      extractionMode,
      ocrPageCount,
      textLayerPageCount,
    };
  } finally {
    const workerToTerminate = ocrWorker as TesseractWorker | null;

    if (workerToTerminate) {
      await workerToTerminate.terminate();
    }

    await loadingTask.destroy();
  }
}

async function createBrowserOcrWorker(
  logger: (message: { progress: number; status: string }) => void,
): Promise<TesseractWorker> {
  const Tesseract = await import("tesseract.js");
  const worker = (await Tesseract.createWorker("eng", Tesseract.OEM.LSTM_ONLY, {
    workerPath: tesseractWorkerUrl,
    logger,
  })) as TesseractWorker;

  await worker.setParameters({
    preserve_interword_spaces: "1",
    tessedit_pageseg_mode: Tesseract.PSM.AUTO,
  });

  return worker;
}

async function extractOcrPage(
  page: PDFPageProxy,
  pageIndex: number,
  viewport: { width: number; height: number },
  worker: TesseractWorker,
  signal?: AbortSignal,
): Promise<OcrPage> {
  assertNotAborted(signal);

  const canvas = document.createElement("canvas");
  const renderViewport = page.getViewport({ scale: OCR_RENDER_SCALE });

  canvas.width = Math.ceil(renderViewport.width);
  canvas.height = Math.ceil(renderViewport.height);

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Could not create a canvas context for PDF OCR.");
  }

  await page.render({
    canvas,
    canvasContext: context,
    viewport: renderViewport,
  }).promise;
  assertNotAborted(signal);

  const result = await worker.recognize(
    canvas,
    {
      rotateAuto: true,
    },
    {
      blocks: true,
      text: true,
    },
  );

  canvas.width = 0;
  canvas.height = 0;

  return {
    index: pageIndex,
    width: viewport.width,
    height: viewport.height,
    blocks: (result.data.blocks ?? [])
      .flatMap((block) => block.paragraphs)
      .flatMap((paragraph) => paragraph.lines)
      .map((line) => ({
        text: line.text,
        confidence: normalizeConfidence(line.confidence),
        bbox: scaleBbox(line.bbox, OCR_RENDER_SCALE),
        words: line.words.map((word) => ({
          text: word.text,
          confidence: normalizeConfidence(word.confidence),
          bbox: scaleBbox(word.bbox, OCR_RENDER_SCALE),
        })),
      })),
  };
}

async function extractTextLayerPage(
  page: PDFPageProxy,
  pageIndex: number,
  viewport: { width: number; height: number },
): Promise<OcrPage> {
  const textContent = await page.getTextContent();
  const fragments = textContent.items.flatMap((item) => {
    if (!isTextItem(item) || !item.str || !item.transform) {
      return [];
    }

    const text = item.str.replace(/\s+/gu, " ").trim();

    if (!text) {
      return [];
    }

    return [
      {
        text,
        x: item.transform[4] ?? 0,
        y: item.transform[5] ?? 0,
        width: item.width ?? text.length * 6,
        height: Math.abs(item.height ?? item.transform[0] ?? 10),
        hasEOL: item.hasEOL ?? false,
      } satisfies TextLayerFragment,
    ];
  });
  const lines = groupTextLayerFragments(fragments);

  return {
    index: pageIndex,
    width: viewport.width,
    height: viewport.height,
    blocks: lines.map((line) => {
      const bbox = buildLineBbox(line);
      return {
        text: line.map((fragment) => fragment.text).join(" "),
        confidence: 1,
        bbox,
      };
    }),
  };
}

function groupTextLayerFragments(fragments: TextLayerFragment[]): TextLayerFragment[][] {
  if (fragments.length === 0) {
    return [];
  }

  const lines: TextLayerFragment[][] = [];
  let currentLine: TextLayerFragment[] = [];

  for (const fragment of fragments) {
    const previous = currentLine.at(-1);
    const shouldBreak =
      !previous ||
      previous.hasEOL ||
      Math.abs(previous.y - fragment.y) > Math.max(previous.height, fragment.height) * 0.7;

    if (shouldBreak && currentLine.length > 0) {
      lines.push(currentLine.sort((left, right) => left.x - right.x));
      currentLine = [];
    }

    currentLine.push(fragment);
  }

  if (currentLine.length > 0) {
    lines.push(currentLine.sort((left, right) => left.x - right.x));
  }

  return lines;
}

function isTextItem(item: TextContent["items"][number]): item is TextItem {
  return "str" in item;
}

function buildLineBbox(line: TextLayerFragment[]): [number, number, number, number] {
  const minX = Math.min(...line.map((fragment) => fragment.x));
  const maxX = Math.max(...line.map((fragment) => fragment.x + fragment.width));
  const top = Math.min(...line.map((fragment) => fragment.y - fragment.height));
  const bottom = Math.max(...line.map((fragment) => fragment.y));

  return [minX, top, maxX, bottom];
}

function pageHasMeaningfulText(page: OcrPage): boolean {
  const text = page.blocks.map((block) => block.text).join(" ");
  const letters = text.match(/\p{L}/gu)?.length ?? 0;

  return letters >= 80 || page.blocks.length >= 8;
}

function stripPdfArtifacts(document: OcrDocument): {
  document: OcrDocument;
  removedBlocks: RemovedPdfArtifact[];
} {
  const repeatedMarginTextCounts = new Map<string, number>();

  for (const page of document.pages) {
    for (const block of page.blocks) {
      if (!isMarginBlock(block, page)) {
        continue;
      }

      const key = normalizeRepeatedMarginKey(block.text);

      if (!key) {
        continue;
      }

      repeatedMarginTextCounts.set(key, (repeatedMarginTextCounts.get(key) ?? 0) + 1);
    }
  }

  const repeatedMarginKeys = new Set(
    Array.from(repeatedMarginTextCounts.entries())
      .filter(([, count]) => count >= Math.max(2, Math.ceil(document.pages.length * 0.35)))
      .map(([key]) => key),
  );
  const removedBlocks: RemovedPdfArtifact[] = [];

  const pages = document.pages
    .map((page) => {
      const blocks = page.blocks.filter((block) => {
        const removalReason = getRemovalReason(block, page, repeatedMarginKeys);

        if (!removalReason) {
          return true;
        }

        removedBlocks.push({
          pageIndex: page.index,
          text: block.text,
          reason: removalReason,
        });
        return false;
      });

      return {
        ...page,
        blocks,
      };
    })
    .filter((page) => page.blocks.length > 0);

  return {
    document: {
      ...document,
      pages,
    },
    removedBlocks,
  };
}

function getRemovalReason(
  block: OcrBlock,
  page: OcrPage,
  repeatedMarginKeys: Set<string>,
): RemovedPdfArtifact["reason"] | null {
  if (!isMarginBlock(block, page)) {
    return null;
  }

  if (looksLikePageNumber(block.text)) {
    return "page-number";
  }

  const repeatedKey = normalizeRepeatedMarginKey(block.text);

  if (repeatedKey && repeatedMarginKeys.has(repeatedKey)) {
    return "repeated-margin";
  }

  if (looksLikeMarginNoise(block.text)) {
    return "margin-noise";
  }

  return null;
}

function isMarginBlock(block: OcrBlock, page: OcrPage): boolean {
  if (!block.bbox || !page.height) {
    return false;
  }

  const [, top, , bottom] = block.bbox;
  const centerY = (top + bottom) / 2;
  const ratio = centerY / page.height;

  return ratio <= HEADER_MARGIN_RATIO || ratio >= FOOTER_MARGIN_RATIO;
}

function looksLikePageNumber(text: string): boolean {
  const normalized = text.toLowerCase().replace(/\s+/gu, " ").trim();

  if (normalized.length === 0 || normalized.length > 24) {
    return false;
  }

  return (
    /^(page|p\.)?\s*\d+([/-]\d+)?$/u.test(normalized) ||
    /^[-–—]?\s*\d+\s*[-–—]?$/u.test(normalized) ||
    /^(page|p\.)\s+[ivxlcdm]+$/iu.test(normalized) ||
    /^[ivxlcdm]{1,8}$/iu.test(normalized)
  );
}

function normalizeRepeatedMarginKey(text: string): string {
  const normalized = text
    .toLowerCase()
    .replace(/\d+/gu, " ")
    .replace(/[^\p{L}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();

  return normalized.length >= 5 ? normalized : "";
}

function looksLikeMarginNoise(text: string): boolean {
  const normalized = text.replace(/\s+/gu, " ").trim();
  const letters = normalized.match(/\p{L}/gu)?.length ?? 0;
  const digits = normalized.match(/\d/gu)?.length ?? 0;

  if (normalized.length <= 3 && digits > 0) {
    return true;
  }

  return normalized.length <= 16 && letters <= 1 && digits > 0;
}

function scaleBbox(
  bbox: { x0: number; y0: number; x1: number; y1: number },
  divisor: number,
): [number, number, number, number] {
  return [bbox.x0 / divisor, bbox.y0 / divisor, bbox.x1 / divisor, bbox.y1 / divisor];
}

function normalizeConfidence(confidence: number): number {
  return Math.max(0, Math.min(1, confidence / 100));
}

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("The PDF extraction was cancelled.", "AbortError");
  }
}
