export interface TextRange {
  start: number;
  end: number;
}

export interface TextSegmenter {
  segmentParagraphs(text: string): TextRange[];
  segmentSentences(text: string, paragraph: TextRange): TextRange[];
}

export type TextTokenizer = (text: string, sentence: TextRange) => TextRange[];

const SENTENCE_PATTERN = /[^.!?…。！？\n]+[.!?…。！？]*|[^\n]+/gu;
const TOKEN_PATTERN =
  /\p{L}[\p{L}\p{M}\p{N}]*(?:['’-][\p{L}\p{M}\p{N}]+)*|\p{N}+|[^\s]/gu;

export const defaultTextSegmenter: TextSegmenter = {
  segmentParagraphs(text) {
    const ranges: TextRange[] = [];
    let cursor = 0;

    for (const match of text.matchAll(/\n\s*\n+/gu)) {
      const boundaryStart = match.index ?? 0;
      pushTrimmedRange(ranges, text, cursor, boundaryStart);
      cursor = boundaryStart + match[0].length;
    }

    pushTrimmedRange(ranges, text, cursor, text.length);
    return ranges;
  },

  segmentSentences(text, paragraph) {
    const paragraphText = text.slice(paragraph.start, paragraph.end);
    const ranges = Array.from(paragraphText.matchAll(SENTENCE_PATTERN), (match) => {
      const start = paragraph.start + (match.index ?? 0);
      const end = start + match[0].length;
      return trimRange(text, start, end);
    }).filter(isNonEmptyRange);

    if (ranges.length > 0) {
      return ranges;
    }

    const fallbackRange = trimRange(text, paragraph.start, paragraph.end);
    return isNonEmptyRange(fallbackRange) ? [fallbackRange] : [];
  },
};

export const defaultTextTokenizer: TextTokenizer = (text, sentence) =>
  Array.from(text.slice(sentence.start, sentence.end).matchAll(TOKEN_PATTERN), (match) => {
    const start = sentence.start + (match.index ?? 0);
    return {
      start,
      end: start + match[0].length,
    };
  });

export function trimRange(text: string, start: number, end: number): TextRange {
  let nextStart = Math.max(0, start);
  let nextEnd = Math.max(nextStart, Math.min(end, text.length));

  while (nextStart < nextEnd && /\s/u.test(text[nextStart] ?? "")) {
    nextStart += 1;
  }

  while (nextEnd > nextStart && /\s/u.test(text[nextEnd - 1] ?? "")) {
    nextEnd -= 1;
  }

  return {
    start: nextStart,
    end: nextEnd,
  };
}

function pushTrimmedRange(ranges: TextRange[], text: string, start: number, end: number) {
  const range = trimRange(text, start, end);

  if (isNonEmptyRange(range)) {
    ranges.push(range);
  }
}

function isNonEmptyRange(range: TextRange) {
  return range.end > range.start;
}
