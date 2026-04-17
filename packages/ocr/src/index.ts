import {
  createTextDocument,
  segmentTextDocument,
  type CreateTextDocumentOptions,
  type SegmentTextDocumentOptions,
  type TextDocument,
} from "@moritzbrantner/linguistics-core";

export type OcrSourceType = "image" | "pdf" | "video";

export interface OcrRequest {
  sourceType: OcrSourceType;
  input: Blob | ArrayBuffer | Uint8Array | string;
  languageHints?: string[];
  signal?: AbortSignal;
  metadata?: Record<string, unknown>;
}

export interface OcrWord {
  text: string;
  confidence?: number;
  bbox?: [number, number, number, number];
}

export interface OcrBlock {
  text: string;
  confidence?: number;
  bbox?: [number, number, number, number];
  words?: OcrWord[];
}

export interface OcrPage {
  index: number;
  width?: number;
  height?: number;
  startTimeMs?: number;
  endTimeMs?: number;
  blocks: OcrBlock[];
}

export interface OcrDocument {
  id: string;
  sourceType: OcrSourceType;
  language?: string;
  pages: OcrPage[];
  metadata?: Record<string, unknown>;
}

export interface OcrExtractor {
  id: string;
  extract(request: OcrRequest): Promise<OcrDocument>;
}

export interface NormalizeOcrDocumentOptions {
  minimumConfidence?: number;
  collapseWhitespace?: boolean;
  removeEmptyBlocks?: boolean;
  trimBlocks?: boolean;
}

export interface CollectOcrTextOptions {
  pageSeparator?: string;
  blockSeparator?: string;
}

export interface OcrPipelineResult {
  provider: string;
  document: OcrDocument;
  text: string;
}

export interface OcrPostProcessor {
  id: string;
  run(document: OcrDocument): OcrDocument | Promise<OcrDocument>;
}

export interface CreateOcrPipelineOptions {
  extractor: OcrExtractor;
  postProcessors?: OcrPostProcessor[];
  collectTextOptions?: CollectOcrTextOptions;
}

export interface OcrToTextDocumentOptions<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  id?: string;
  language?: string;
  metadata?: Metadata;
  granularity?: SegmentTextDocumentOptions["granularity"];
  useIntlSegmenter?: boolean;
  createDocument?: (
    options: CreateTextDocumentOptions<Metadata>,
  ) => TextDocument<Metadata>;
}

export function normalizeOcrDocument(
  document: OcrDocument,
  options: NormalizeOcrDocumentOptions = {},
): OcrDocument {
  const minimumConfidence = options.minimumConfidence ?? 0;
  const collapseWhitespace = options.collapseWhitespace !== false;
  const removeEmptyBlocks = options.removeEmptyBlocks !== false;
  const trimBlocks = options.trimBlocks !== false;

  const pages = document.pages
    .map((page) => {
      const blocks = page.blocks
        .map((block) => {
          const nextText = normalizeBlockText(block.text, {
            collapseWhitespace,
            trimBlocks,
          });

          const words = block.words
            ?.filter((word) =>
              (word.confidence ?? 1) >= minimumConfidence &&
              normalizeBlockText(word.text, { collapseWhitespace, trimBlocks }).length > 0,
            )
            .map((word) => ({
              ...word,
              text: normalizeBlockText(word.text, { collapseWhitespace, trimBlocks }),
            }));

          return {
            ...block,
            text: nextText,
            words,
          };
        })
        .filter((block) => (block.confidence ?? 1) >= minimumConfidence)
        .filter((block) => !removeEmptyBlocks || block.text.length > 0);

      return {
        ...page,
        blocks,
      };
    })
    .filter((page) => page.blocks.length > 0);

  return {
    ...document,
    pages,
  };
}

export function collectOcrText(
  document: OcrDocument,
  options: CollectOcrTextOptions = {},
): string {
  const pageSeparator = options.pageSeparator ?? "\n\n";
  const blockSeparator = options.blockSeparator ?? "\n";

  return document.pages
    .map((page) => page.blocks.map((block) => block.text).filter(Boolean).join(blockSeparator))
    .filter(Boolean)
    .join(pageSeparator);
}

export function ocrToTextDocument<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(
  document: OcrDocument,
  options: OcrToTextDocumentOptions<Metadata> = {},
): TextDocument<Metadata> {
  const createDocument = options.createDocument ?? createTextDocument;
  const text = collectOcrText(document);

  const baseDocument = createDocument({
    id: options.id ?? document.id,
    text,
    language: options.language ?? document.language,
    metadata: options.metadata,
  });

  return segmentTextDocument(baseDocument, {
    granularity: options.granularity ?? "word",
    useIntlSegmenter: options.useIntlSegmenter,
  });
}

export function createOcrPipeline(options: CreateOcrPipelineOptions) {
  return {
    async extract(request: OcrRequest): Promise<OcrPipelineResult> {
      let document = await options.extractor.extract(request);

      for (const postProcessor of options.postProcessors ?? []) {
        document = await postProcessor.run(document);
      }

      return {
        provider: options.extractor.id,
        document,
        text: collectOcrText(document, options.collectTextOptions),
      };
    },
  };
}

export interface VideoFramePlan {
  timestampsMs: number[];
  frameCount: number;
}

export interface CreateVideoFramePlanOptions {
  durationMs: number;
  fps?: number;
  maxFrames?: number;
  trimStartMs?: number;
  trimEndMs?: number;
}

export function createVideoFramePlan(options: CreateVideoFramePlanOptions): VideoFramePlan {
  const fps = Math.max(0.1, options.fps ?? 1);
  const maxFrames = Math.max(1, options.maxFrames ?? 120);
  const trimStartMs = Math.max(0, options.trimStartMs ?? 0);
  const trimEndMs = Math.max(0, options.trimEndMs ?? 0);
  const start = trimStartMs;
  const end = Math.max(start, options.durationMs - trimEndMs);

  if (end === start) {
    return {
      timestampsMs: [start],
      frameCount: 1,
    };
  }

  const intervalMs = 1000 / fps;
  const timestampsMs: number[] = [];

  for (let timestamp = start; timestamp <= end; timestamp += intervalMs) {
    timestampsMs.push(Math.round(timestamp));

    if (timestampsMs.length >= maxFrames) {
      break;
    }
  }

  if (timestampsMs.at(-1) !== Math.round(end) && timestampsMs.length < maxFrames) {
    timestampsMs.push(Math.round(end));
  }

  return {
    timestampsMs,
    frameCount: timestampsMs.length,
  };
}

function normalizeBlockText(
  text: string,
  options: {
    collapseWhitespace: boolean;
    trimBlocks: boolean;
  },
): string {
  let next = options.trimBlocks ? text.trim() : text;

  if (options.collapseWhitespace) {
    next = next.replace(/\s+/gu, " ").trim();
  }

  return next;
}
