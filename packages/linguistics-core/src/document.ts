import {
  normalizeLanguageTag,
  normalizeText,
  normalizeToken as defaultNormalizeToken,
  type LanguageTag,
  type TextNormalizer,
} from "./normalization";
import {
  defaultTextSegmenter,
  defaultTextTokenizer,
  type TextRange,
  type TextSegmenter,
  type TextTokenizer,
} from "./segmentation";

export interface TextToken {
  id: string;
  index: number;
  sentenceId: string;
  sentenceIndex: number;
  paragraphId: string;
  paragraphIndex: number;
  wordIndex: number | null;
  text: string;
  normalized: string;
  range: TextRange;
  leadingText: string;
  isWord: boolean;
  kind: "word" | "punctuation";
}

export interface TextSentence {
  id: string;
  index: number;
  paragraphId: string;
  paragraphIndex: number;
  text: string;
  range: TextRange;
  tokens: TextToken[];
  trailingText: string;
}

export interface TextParagraph {
  id: string;
  index: number;
  text: string;
  range: TextRange;
  sentences: TextSentence[];
}

export interface TextDocument {
  id: string;
  text: string;
  language?: LanguageTag;
  metadata?: Record<string, unknown>;
  paragraphs: TextParagraph[];
  sentences: TextSentence[];
  tokens: TextToken[];
}

export interface CreateTextDocumentOptions {
  id?: string;
  text: string;
  language?: string;
  metadata?: Record<string, unknown>;
  segmenter?: TextSegmenter;
  tokenizer?: TextTokenizer;
  normalizer?: TextNormalizer;
  tokenNormalizer?: TextNormalizer;
}

export function createTextDocument(options: CreateTextDocumentOptions): TextDocument {
  const segmenter = options.segmenter ?? defaultTextSegmenter;
  const tokenizer = options.tokenizer ?? defaultTextTokenizer;
  const text = (options.normalizer ?? normalizeText)(options.text);
  const id = options.id?.trim() || "document";
  const language = normalizeLanguageTag(options.language);
  const tokenNormalizer = options.tokenNormalizer ?? defaultNormalizeToken;
  const paragraphs: TextParagraph[] = [];
  const sentences: TextSentence[] = [];
  const tokens: TextToken[] = [];

  for (const [paragraphIndex, paragraphRange] of segmenter.segmentParagraphs(text).entries()) {
    const paragraphId = `${id}-paragraph-${paragraphIndex}`;
    const paragraphSentences: TextSentence[] = [];

    for (const sentenceRange of segmenter.segmentSentences(text, paragraphRange)) {
      const sentenceIndex = sentences.length;
      const sentenceId = `${id}-sentence-${sentenceIndex}`;
      const sentenceText = text.slice(sentenceRange.start, sentenceRange.end);
      const sentenceTokens: TextToken[] = [];
      let lastTokenEnd = sentenceRange.start;
      let wordIndex = 0;

      for (const tokenRange of tokenizer(text, sentenceRange)) {
        const tokenText = text.slice(tokenRange.start, tokenRange.end);
        const isWord = /[\p{L}\p{N}]/u.test(tokenText);
        const token = {
          id: `${sentenceId}-token-${sentenceTokens.length}`,
          index: tokens.length,
          sentenceId,
          sentenceIndex,
          paragraphId,
          paragraphIndex,
          wordIndex: isWord ? wordIndex++ : null,
          text: tokenText,
          normalized: tokenNormalizer(tokenText),
          range: tokenRange,
          leadingText: text.slice(lastTokenEnd, tokenRange.start),
          isWord,
          kind: isWord ? "word" : "punctuation",
        } satisfies TextToken;

        sentenceTokens.push(token);
        tokens.push(token);
        lastTokenEnd = tokenRange.end;
      }

      const sentence = {
        id: sentenceId,
        index: sentenceIndex,
        paragraphId,
        paragraphIndex,
        text: sentenceText,
        range: sentenceRange,
        tokens: sentenceTokens,
        trailingText: text.slice(lastTokenEnd, sentenceRange.end),
      } satisfies TextSentence;

      paragraphSentences.push(sentence);
      sentences.push(sentence);
    }

    paragraphs.push({
      id: paragraphId,
      index: paragraphIndex,
      text: text.slice(paragraphRange.start, paragraphRange.end),
      range: paragraphRange,
      sentences: paragraphSentences,
    });
  }

  return {
    id,
    text,
    language,
    metadata: options.metadata ? { ...options.metadata } : undefined,
    paragraphs,
    sentences,
    tokens,
  };
}
