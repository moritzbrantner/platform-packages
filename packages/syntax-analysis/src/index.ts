import type { TextDocument, TextSentence } from "@moritzbrantner/linguistics-core";
import {
  ensureTextDocument,
  type ChunkTextOptions,
  type HuggingFaceModelReference,
  type TextClassificationProvider,
  type TextInferenceInput,
  type TokenClassificationProvider,
} from "@moritzbrantner/text-inference";

export interface SyntaxTokenAnnotation {
  tokenId: string;
  tokenIndex: number;
  sentenceId: string;
  sentenceIndex: number;
  text: string;
  normalized: string;
  lemma: string;
  posTag: string;
  score: number;
}

export interface SyntaxDependencyArc {
  sentenceId: string;
  sentenceIndex: number;
  dependentTokenId: string;
  dependentTokenIndex: number;
  headTokenId: string | null;
  headTokenIndex: number | null;
  relation: string;
  score: number;
}

export interface SentenceSyntaxAnalysis {
  sentenceId: string;
  sentenceIndex: number;
  text: string;
  tokens: SyntaxTokenAnnotation[];
  lemmas: string[];
  posTags: string[];
  dependencyArcs: SyntaxDependencyArc[];
}

export interface SyntaxDocumentSummary {
  sentenceCount: number;
  tokenCount: number;
  posTagHistogram: Array<{ tag: string; count: number }>;
  relationHistogram: Array<{ relation: string; count: number }>;
  topLemmas: Array<{ lemma: string; count: number }>;
}

export interface SyntaxAnalysisResult<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  document: TextDocument<Metadata>;
  tokens: SyntaxTokenAnnotation[];
  lemmas: string[];
  posTags: string[];
  dependencyArcs: SyntaxDependencyArc[];
  sentences: SentenceSyntaxAnalysis[];
  summary: SyntaxDocumentSummary;
}

export interface CreateSyntaxPipelineOptions<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  posTagger: {
    provider: TokenClassificationProvider;
    model: HuggingFaceModelReference<"token-classification">;
  };
  lemmatizer?: {
    provider: TokenClassificationProvider;
    model: HuggingFaceModelReference<"token-classification">;
  };
  dependencyParser?: {
    provider: TextClassificationProvider;
    model: HuggingFaceModelReference<"text-classification">;
  };
  chunking?: ChunkTextOptions<Metadata>;
  defaultPosTag?: string;
  defaultLemmaStrategy?: "normalized" | "surface";
}

export interface AnalyzeSyntaxOptions<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  chunking?: ChunkTextOptions<Metadata>;
  defaultPosTag?: string;
  defaultLemmaStrategy?: "normalized" | "surface";
}

export interface AnalyzeSentenceSyntaxOptions {
  defaultPosTag?: string;
  defaultLemmaStrategy?: "normalized" | "surface";
}

export interface SyntaxPipeline<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  analyzeSyntax(
    input: TextInferenceInput<Metadata>,
    options?: AnalyzeSyntaxOptions<Metadata>,
  ): Promise<SyntaxAnalysisResult<Metadata>>;
  analyzeSentenceSyntax(
    sentence: TextSentence,
    options?: AnalyzeSentenceSyntaxOptions,
  ): Promise<SentenceSyntaxAnalysis>;
}

export function createSyntaxPipeline<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(
  options: CreateSyntaxPipelineOptions<Metadata>,
): SyntaxPipeline<Metadata> {
  return {
    async analyzeSyntax(input, analysisOptions = {}) {
      const document = ensureTextDocument(input, analysisOptions.chunking ?? options.chunking);
      const sentences = await Promise.all(
        document.sentences.map((sentence) =>
          analyzeSyntaxSentence(sentence, options, {
            defaultPosTag: analysisOptions.defaultPosTag,
            defaultLemmaStrategy: analysisOptions.defaultLemmaStrategy,
          }),
        ),
      );

      const tokens = sentences.flatMap((sentence) => sentence.tokens);
      const dependencyArcs = sentences.flatMap((sentence) => sentence.dependencyArcs);

      return {
        document,
        tokens,
        lemmas: uniqueValues(tokens.map((token) => token.lemma)),
        posTags: uniqueValues(tokens.map((token) => token.posTag)),
        dependencyArcs,
        sentences,
        summary: summarizeSyntaxDocument({
          sentenceCount: sentences.length,
          tokens,
          dependencyArcs,
        }),
      };
    },
    async analyzeSentenceSyntax(sentence, sentenceOptions = {}) {
      return analyzeSyntaxSentence(sentence, options, sentenceOptions);
    },
  };
}

export async function analyzeSyntax<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(
  input: TextInferenceInput<Metadata>,
  options: CreateSyntaxPipelineOptions<Metadata>,
  analysisOptions?: AnalyzeSyntaxOptions<Metadata>,
): Promise<SyntaxAnalysisResult<Metadata>> {
  return createSyntaxPipeline(options).analyzeSyntax(input, analysisOptions);
}

export function summarizeSyntaxDocument(input: {
  sentenceCount: number;
  tokens: readonly SyntaxTokenAnnotation[];
  dependencyArcs: readonly SyntaxDependencyArc[];
}): SyntaxDocumentSummary {
  const lemmaCounts = tally(input.tokens.map((token) => token.lemma));
  const posCounts = tally(input.tokens.map((token) => token.posTag));
  const relationCounts = tally(input.dependencyArcs.map((arc) => arc.relation));

  return {
    sentenceCount: input.sentenceCount,
    tokenCount: input.tokens.length,
    posTagHistogram: toSortedHistogram(posCounts),
    relationHistogram: toSortedHistogram(relationCounts).map(({ tag, count }) => ({
      relation: tag,
      count,
    })),
    topLemmas: toSortedHistogram(lemmaCounts).slice(0, 10).map(({ tag, count }) => ({
      lemma: tag,
      count,
    })),
  };
}

async function analyzeSyntaxSentence<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(
  sentence: TextSentence,
  options: CreateSyntaxPipelineOptions<Metadata>,
  sentenceOptions: AnalyzeSentenceSyntaxOptions = {},
): Promise<SentenceSyntaxAnalysis> {
  const defaultPosTag = sentenceOptions.defaultPosTag ?? options.defaultPosTag ?? "X";
  const defaultLemmaStrategy =
    sentenceOptions.defaultLemmaStrategy ?? options.defaultLemmaStrategy ?? "normalized";
  const [posClassification, lemmaClassification, dependencyClassification] = await Promise.all([
    options.posTagger.provider.classifyTokens({
      model: options.posTagger.model,
      input: sentence.text,
    }),
    options.lemmatizer
      ? options.lemmatizer.provider.classifyTokens({
          model: options.lemmatizer.model,
          input: sentence.text,
        })
      : Promise.resolve(undefined),
    options.dependencyParser
      ? options.dependencyParser.provider.classifyText({
          model: options.dependencyParser.model,
          input: sentence.text,
        })
      : Promise.resolve(undefined),
  ]);

  const posHints = normalizeTokenHints(posClassification.entities);
  const lemmaHints = normalizeTokenHints(lemmaClassification?.entities ?? []);

  const tokens = sentence.tokens.map((token) => {
    const tokenKey = token.normalized;
    const posHint = posHints.get(tokenKey);
    const lemmaHint = lemmaHints.get(tokenKey);

    return {
      tokenId: token.id,
      tokenIndex: token.wordIndex ?? token.index,
      sentenceId: sentence.id,
      sentenceIndex: sentence.index,
      text: token.text,
      normalized: token.normalized,
      lemma: normalizeLemma(
        lemmaHint?.label,
        defaultLemmaStrategy === "surface" ? token.text : token.normalized,
      ),
      posTag: normalizeTag(posHint?.label, defaultPosTag),
      score: weightedAverage(posHint?.score, lemmaHint?.score),
    } satisfies SyntaxTokenAnnotation;
  });

  const dependencyArcs = buildDependencyArcs(
    sentence,
    dependencyClassification?.labels.map((label) => ({
      label: label.label,
      score: label.score,
    })) ?? [],
  );

  return {
    sentenceId: sentence.id,
    sentenceIndex: sentence.index,
    text: sentence.text,
    tokens,
    lemmas: uniqueValues(tokens.map((token) => token.lemma)),
    posTags: uniqueValues(tokens.map((token) => token.posTag)),
    dependencyArcs,
  };
}

function normalizeTag(value: string | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }

  return value
    .replace(/^(?:B-|I-|L-|U-|S-)/u, "")
    .replace(/[^A-Za-z0-9$_.:-]+/gu, "")
    .toUpperCase();
}

function normalizeLemma(value: string | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }

  return value
    .replace(/^LEMMA[:=_-]*/iu, "")
    .replace(/^lemma[:=_-]*/u, "")
    .replace(/^B-|^I-/u, "")
    .trim()
    .toLocaleLowerCase();
}

function normalizeTokenHints(
  entities: Array<{
    text: string;
    label: string;
    score: number;
  }>,
): Map<string, { label: string; score: number }> {
  const hints = new Map<string, { label: string; score: number }>();

  for (const entity of entities) {
    const key = entity.text.toLocaleLowerCase();
    const current = hints.get(key);

    if (!current || entity.score > current.score) {
      hints.set(key, {
        label: entity.label,
        score: entity.score,
      });
    }
  }

  return hints;
}

function buildDependencyArcs(
  sentence: TextSentence,
  labels: Array<{ label: string; score: number }>,
): SyntaxDependencyArc[] {
  const tokenList = sentence.tokens.filter((token) => token.isWordLike);

  if (tokenList.length === 0) {
    return [];
  }

  const explicitArcs = labels
    .map((label) => parseDependencyLabel(label.label, label.score, tokenList))
    .filter((arc): arc is SyntaxDependencyArc => arc !== null);

  if (explicitArcs.length > 0) {
    return dedupeArcs(explicitArcs);
  }

  return tokenList.map((token, index) => ({
    sentenceId: sentence.id,
    sentenceIndex: sentence.index,
    dependentTokenId: token.id,
    dependentTokenIndex: token.wordIndex ?? token.index,
    headTokenId: index > 0 ? tokenList[index - 1].id : null,
    headTokenIndex: index > 0 ? (tokenList[index - 1].wordIndex ?? tokenList[index - 1].index) : null,
    relation: index === 0 ? "root" : "dep",
    score: 0,
  }));
}

function parseDependencyLabel(
  label: string,
  score: number,
  tokens: TextSentence["tokens"],
): SyntaxDependencyArc | null {
  const match = label.match(/^(\d+|root)\s*[-:>\s]\s*(\d+)\s*(?:\|\s*|\s+)([A-Za-z0-9_.:-]+)$/u);

  if (!match) {
    return null;
  }

  const headValue = match[1];
  const dependentValue = Number.parseInt(match[2], 10);
  const relation = match[3].toLocaleLowerCase();
  const dependentToken = tokens[dependentValue - 1];

  if (!dependentToken) {
    return null;
  }

  const headToken =
    headValue.toLocaleLowerCase() === "root" ? null : tokens[Number.parseInt(headValue, 10) - 1] ?? null;

  return {
    sentenceId: dependentToken.sentenceId,
    sentenceIndex: dependentToken.sentenceIndex,
    dependentTokenId: dependentToken.id,
    dependentTokenIndex: dependentToken.wordIndex ?? dependentToken.index,
    headTokenId: headToken?.id ?? null,
    headTokenIndex: headToken ? (headToken.wordIndex ?? headToken.index) : null,
    relation,
    score,
  };
}

function dedupeArcs(arcs: SyntaxDependencyArc[]): SyntaxDependencyArc[] {
  const deduped = new Map<string, SyntaxDependencyArc>();

  for (const arc of arcs) {
    const key = `${arc.dependentTokenId}::${arc.relation}`;
    const current = deduped.get(key);

    if (!current || arc.score > current.score) {
      deduped.set(key, arc);
    }
  }

  return Array.from(deduped.values()).sort(
    (left, right) =>
      left.dependentTokenIndex - right.dependentTokenIndex ||
      left.relation.localeCompare(right.relation) ||
      right.score - left.score,
  );
}

function weightedAverage(left?: number, right?: number): number {
  if (left === undefined && right === undefined) {
    return 0;
  }

  if (left === undefined) {
    return right ?? 0;
  }

  if (right === undefined) {
    return left;
  }

  return (left + right) / 2;
}

function tally(values: Iterable<string>): Map<string, number> {
  const counts = new Map<string, number>();

  for (const value of values) {
    if (!value) {
      continue;
    }

    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return counts;
}

function toSortedHistogram(counts: Map<string, number>): Array<{ tag: string; count: number }> {
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag));
}

function uniqueValues(values: Iterable<string>): string[] {
  return Array.from(new Set(values));
}
