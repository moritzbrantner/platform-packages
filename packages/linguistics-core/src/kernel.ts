import initTextCoreWasm, {
  extractWordTexts as extractWordTextsKernel,
  segmentTextDocument as segmentTextDocumentKernel,
  splitSentences as splitSentencesKernel,
} from "@mb-rust/text-core-wasm";

export interface RawKernelSpan {
  end: number;
  start: number;
  text: string;
}

export interface RawKernelToken extends RawKernelSpan {
  kind: string;
}

export interface RawKernelSegmentedDocument {
  paragraphs: RawKernelSpan[];
  sentences: RawKernelSpan[];
  tokens: RawKernelToken[];
}

let kernelReady = false;
let kernelInitPromise: Promise<void> | null = null;

export async function initLinguisticsKernel(input?: unknown): Promise<void> {
  if (kernelReady) {
    return;
  }

  if (!kernelInitPromise) {
    kernelInitPromise = (async () => {
      await initTextCoreWasm(input as never);
      kernelReady = true;
    })().catch((error) => {
      kernelInitPromise = null;
      throw error;
    });
  }

  await kernelInitPromise;
}

export function isLinguisticsKernelReady(): boolean {
  return kernelReady;
}

export function extractWordTextsWithKernel(text: string): string[] | null {
  if (!kernelReady) {
    return null;
  }

  return extractWordTextsKernel(text) as string[];
}

export function splitTextSentencesWithKernel(text: string): string[] | null {
  if (!kernelReady) {
    return null;
  }

  return splitSentencesKernel(text) as string[];
}

export function segmentTextDocumentWithKernel(
  text: string,
  options: {
    includePunctuation: boolean;
    includeTokens: boolean;
    keepApostrophes: boolean;
  },
): RawKernelSegmentedDocument | null {
  if (!kernelReady) {
    return null;
  }

  return segmentTextDocumentKernel(
    text,
    options.keepApostrophes,
    options.includePunctuation,
    options.includeTokens,
  ) as RawKernelSegmentedDocument;
}
