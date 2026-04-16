import type { TextDocument, TextToken } from "./document";
import type { TextRange } from "./segmentation";

export function findTokenAtOffset(document: TextDocument, offset: number): TextToken | undefined {
  if (!Number.isFinite(offset)) {
    return undefined;
  }

  const target = Math.floor(offset);
  let low = 0;
  let high = document.tokens.length - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const token = document.tokens[middle];

    if (target < token.range.start) {
      high = middle - 1;
      continue;
    }

    if (target >= token.range.end) {
      low = middle + 1;
      continue;
    }

    return token;
  }

  return undefined;
}

export function sliceDocumentText(document: TextDocument, range: TextRange): string {
  const start = clampOffset(range.start, document.text.length);
  const end = clampOffset(range.end, document.text.length);

  if (end <= start) {
    return "";
  }

  return document.text.slice(start, end);
}

function clampOffset(offset: number, max: number): number {
  if (!Number.isFinite(offset)) {
    return 0;
  }

  return Math.max(0, Math.min(max, Math.floor(offset)));
}
