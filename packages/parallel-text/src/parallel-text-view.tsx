"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { CSSProperties, HTMLAttributes } from "react";

import { createTextDocument, segmentTextDocument } from "@moritzbrantner/linguistics-core";
import { Button } from "@moritzbrantner/ui";

import type {
  ParallelTextAlignmentRow,
  ParallelTextModel,
  ParallelTextParagraph,
  ParallelTextSentence,
  ParallelTextToken,
  SentenceAlignmentInput,
  TokenAlignmentInput,
} from "./model";
import { createAlignmentModel, relativeIndex } from "./model";

type ParallelTextSide = "original" | "translated";

export interface ParallelTextTranslationOption {
  id: string;
  label: string;
  translatedText: string;
  translatedLabel?: string;
  sentenceAlignments?: SentenceAlignmentInput[];
  tokenAlignments?: TokenAlignmentInput[];
}

export interface ParallelTextViewProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  originalText: string;
  translatedText?: string;
  sentenceAlignments?: SentenceAlignmentInput[];
  tokenAlignments?: TokenAlignmentInput[];
  translations?: ParallelTextTranslationOption[];
  originalLabel?: string;
  translatedLabel?: string;
  defaultTranslationId?: string;
}

interface ModelIndex {
  tokenById: Map<string, ParallelTextToken>;
  sentenceById: Map<string, ParallelTextSentence>;
  sideByTokenId: Map<string, ParallelTextSide>;
  sideBySentenceId: Map<string, ParallelTextSide>;
  rowByTokenId: Map<string, ParallelTextAlignmentRow>;
  rowBySentenceId: Map<string, ParallelTextAlignmentRow>;
  linkedTokenIdsByTokenId: Map<string, string[]>;
}

interface HoverState {
  activeTokenId: string | null;
  linkedTokenIds: Set<string>;
  phraseSentenceIds: Set<string>;
  sentenceIds: Set<string>;
}

export function ParallelTextView({
  originalText,
  translatedText,
  sentenceAlignments,
  tokenAlignments,
  translations,
  originalLabel = "Original",
  translatedLabel = "Translation",
  defaultTranslationId,
  className,
  style,
  ...divProps
}: ParallelTextViewProps) {
  const translationOptions = useMemo(
    () =>
      resolveTranslationOptions({
        translatedText,
        translatedLabel,
        sentenceAlignments,
        tokenAlignments,
        translations,
      }),
    [translatedLabel, translatedText, sentenceAlignments, tokenAlignments, translations],
  );
  const [selectedTranslationId, setSelectedTranslationId] = useState<string | null>(() =>
    resolveTranslationId(translationOptions, defaultTranslationId),
  );
  const [hoveredTokenId, setHoveredTokenId] = useState<string | null>(null);
  const [hoveredSentenceId, setHoveredSentenceId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedTranslationId((current) => {
      if (current && translationOptions.some((translation) => translation.id === current)) {
        return current;
      }

      return resolveTranslationId(translationOptions, defaultTranslationId);
    });
  }, [defaultTranslationId, translationOptions]);

  useEffect(() => {
    setHoveredTokenId(null);
    setHoveredSentenceId(null);
  }, [selectedTranslationId]);

  const selectedTranslation =
    translationOptions.find((translation) => translation.id === selectedTranslationId) ??
    translationOptions[0] ??
    null;
  const originalDocument = useMemo(
    () =>
      segmentTextDocument(
        createTextDocument({
          id: "original",
          text: originalText,
        }),
        { granularity: "word" },
      ),
    [originalText],
  );
  const model = useMemo<ParallelTextModel>(
    () =>
      createAlignmentModel({
        original: originalDocument,
        translated: segmentTextDocument(
          createTextDocument({
            id: "translated",
            text: selectedTranslation?.translatedText ?? "",
          }),
          { granularity: "word" },
        ),
        sentenceAlignments: selectedTranslation?.sentenceAlignments,
        tokenAlignments: selectedTranslation?.tokenAlignments,
      }),
    [originalDocument, selectedTranslation],
  );
  const modelIndex = useMemo(() => createModelIndex(model), [model]);
  const hoverState = useMemo(
    () => createHoverState(modelIndex, hoveredTokenId, hoveredSentenceId),
    [hoveredSentenceId, hoveredTokenId, modelIndex],
  );
  const currentTranslatedLabel = selectedTranslation?.translatedLabel ?? translatedLabel;

  return (
    <div
      {...divProps}
      className={className}
      style={{
        ...styles.container,
        ...style,
      }}
    >
      <div style={styles.headerRow}>
        <div style={styles.headerBlock}>
          <ColumnLabel>{originalLabel}</ColumnLabel>
        </div>
        <div style={styles.headerBlock}>
          <ColumnLabel>{currentTranslatedLabel}</ColumnLabel>
          {translationOptions.length > 1 ? (
            <div role="tablist" aria-label="Available translations" style={styles.translationTabs}>
              {translationOptions.map((translation) => {
                const isSelected = translation.id === selectedTranslation?.id;

                return (
                  <Button
                    key={translation.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedTranslationId(translation.id)}
                    style={{
                      ...styles.translationTab,
                      ...(isSelected ? styles.translationTabActive : null),
                    }}
                  >
                    {translation.label}
                  </Button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div style={styles.columns}>
        <TextPanel
          label={originalLabel}
          paragraphs={model.originalParagraphs}
          hoverState={hoverState}
          onSentenceHover={setHoveredSentenceId}
          onTokenHover={setHoveredTokenId}
        />
        <TextPanel
          label={currentTranslatedLabel}
          paragraphs={model.translatedParagraphs}
          hoverState={hoverState}
          onSentenceHover={setHoveredSentenceId}
          onTokenHover={setHoveredTokenId}
        />
      </div>
    </div>
  );
}

interface TextPanelProps {
  label: string;
  paragraphs: ParallelTextParagraph[];
  hoverState: HoverState | null;
  onSentenceHover: (sentenceId: string | null) => void;
  onTokenHover: (tokenId: string | null) => void;
}

function TextPanel({
  label,
  paragraphs,
  hoverState,
  onSentenceHover,
  onTokenHover,
}: TextPanelProps) {
  return (
    <section aria-label={label} style={styles.panel}>
      {paragraphs.length ? (
        paragraphs.map((paragraph) => (
          <p key={paragraph.id} style={styles.paragraph}>
            {paragraph.sentences.map((sentence, sentenceIndex) => (
              <Fragment key={sentence.id}>
                {sentenceIndex > 0 ? " " : null}
                <SentenceInline
                  sentence={sentence}
                  hoverState={hoverState}
                  onSentenceHover={onSentenceHover}
                  onTokenHover={onTokenHover}
                />
              </Fragment>
            ))}
          </p>
        ))
      ) : (
        <p style={styles.emptyState}>No text available.</p>
      )}
    </section>
  );
}

interface SentenceInlineProps {
  sentence: ParallelTextSentence;
  hoverState: HoverState | null;
  onSentenceHover: (sentenceId: string | null) => void;
  onTokenHover: (tokenId: string | null) => void;
}

function SentenceInline({
  sentence,
  hoverState,
  onSentenceHover,
  onTokenHover,
}: SentenceInlineProps) {
  const isPhraseActive = hoverState?.phraseSentenceIds.has(sentence.id) ?? false;
  const isSentenceActive = hoverState?.sentenceIds.has(sentence.id) ?? false;

  return (
    <span
      data-sentence-id={sentence.id}
      data-phrase-highlighted={isPhraseActive ? "true" : "false"}
      data-sentence-highlighted={isSentenceActive ? "true" : "false"}
      onMouseEnter={() => onSentenceHover(sentence.id)}
      onMouseLeave={() => onSentenceHover(null)}
      style={getSentenceStyle(isPhraseActive, isSentenceActive)}
    >
      {sentence.tokens.map((token) => {
        const isActive = hoverState?.activeTokenId === token.id;
        const isLinked = hoverState?.linkedTokenIds.has(token.id) ?? false;

        return (
          <Fragment key={token.id}>
            {token.leadingText}
            {token.isWord ? (
              <Button
                type="button"
                data-token-id={token.id}
                data-highlighted={isActive || isLinked ? "true" : "false"}
                onFocus={() => {
                  onSentenceHover(sentence.id);
                  onTokenHover(token.id);
                }}
                onBlur={() => onTokenHover(null)}
                onMouseEnter={() => {
                  onSentenceHover(sentence.id);
                  onTokenHover(token.id);
                }}
                onMouseLeave={() => onTokenHover(null)}
                style={{
                  ...styles.token,
                  ...(isActive || isLinked ? styles.tokenActive : null),
                }}
              >
                {token.text}
              </Button>
            ) : (
              <span style={styles.punctuation}>{token.text}</span>
            )}
          </Fragment>
        );
      })}
      {sentence.trailingText}
    </span>
  );
}

function ColumnLabel({ children }: { children: string }) {
  return <div style={styles.columnLabel}>{children}</div>;
}

function resolveTranslationOptions({
  translatedText,
  translatedLabel,
  sentenceAlignments,
  tokenAlignments,
  translations,
}: {
  translatedText?: string;
  translatedLabel: string;
  sentenceAlignments?: SentenceAlignmentInput[];
  tokenAlignments?: TokenAlignmentInput[];
  translations?: ParallelTextTranslationOption[];
}) {
  if (translations?.length) {
    return translations;
  }

  if (typeof translatedText === "string") {
    return [
      {
        id: "translation-0",
        label: translatedLabel,
        translatedText,
        translatedLabel,
        sentenceAlignments,
        tokenAlignments,
      },
    ];
  }

  return [];
}

function resolveTranslationId(
  translations: ParallelTextTranslationOption[],
  defaultTranslationId?: string,
) {
  if (
    defaultTranslationId &&
    translations.some((translation) => translation.id === defaultTranslationId)
  ) {
    return defaultTranslationId;
  }

  return translations[0]?.id ?? null;
}

function createModelIndex(model: ParallelTextModel): ModelIndex {
  const tokenById = new Map<string, ParallelTextToken>();
  const sentenceById = new Map<string, ParallelTextSentence>();
  const sideByTokenId = new Map<string, ParallelTextSide>();
  const sideBySentenceId = new Map<string, ParallelTextSide>();
  const rowByTokenId = new Map<string, ParallelTextAlignmentRow>();
  const rowBySentenceId = new Map<string, ParallelTextAlignmentRow>();
  const linkedTokenIdsByTokenId = new Map<string, string[]>();

  for (const sentence of model.originalSentences) {
    sentenceById.set(sentence.id, sentence);
    sideBySentenceId.set(sentence.id, "original");

    for (const token of sentence.tokens) {
      tokenById.set(token.id, token);
      sideByTokenId.set(token.id, "original");
    }
  }

  for (const sentence of model.translatedSentences) {
    sentenceById.set(sentence.id, sentence);
    sideBySentenceId.set(sentence.id, "translated");

    for (const token of sentence.tokens) {
      tokenById.set(token.id, token);
      sideByTokenId.set(token.id, "translated");
    }
  }

  for (const row of model.rows) {
    for (const sentence of [...row.originalSentences, ...row.translatedSentences]) {
      rowBySentenceId.set(sentence.id, row);

      for (const token of sentence.tokens) {
        rowByTokenId.set(token.id, row);
      }
    }

    for (const link of row.tokenLinks) {
      appendLinkedTokenId(linkedTokenIdsByTokenId, link.originalTokenId, link.translatedTokenId);
      appendLinkedTokenId(linkedTokenIdsByTokenId, link.translatedTokenId, link.originalTokenId);
    }
  }

  return {
    tokenById,
    sentenceById,
    sideByTokenId,
    sideBySentenceId,
    rowByTokenId,
    rowBySentenceId,
    linkedTokenIdsByTokenId,
  };
}

function createHoverState(
  modelIndex: ModelIndex,
  hoveredTokenId: string | null,
  hoveredSentenceId: string | null,
): HoverState | null {
  if (hoveredTokenId) {
    return createTokenHoverState(modelIndex, hoveredTokenId);
  }

  if (hoveredSentenceId) {
    return createSentenceHoverState(modelIndex, hoveredSentenceId);
  }

  return null;
}

function createTokenHoverState(modelIndex: ModelIndex, tokenId: string) {
  const sourceToken = modelIndex.tokenById.get(tokenId);
  const sourceSentence = sourceToken
    ? modelIndex.sentenceById.get(sourceToken.sentenceId)
    : undefined;
  const sourceSide = sourceToken ? modelIndex.sideByTokenId.get(sourceToken.id) : undefined;
  const row = sourceToken ? modelIndex.rowByTokenId.get(sourceToken.id) : undefined;

  if (!sourceToken || !sourceSentence || !sourceSide || !row) {
    return null;
  }

  const linkedTokenIds = new Set(modelIndex.linkedTokenIdsByTokenId.get(sourceToken.id) ?? []);
  const linkedTokens = Array.from(linkedTokenIds)
    .map((linkedTokenId) => modelIndex.tokenById.get(linkedTokenId))
    .filter((token): token is ParallelTextToken => Boolean(token));
  const sourceRowSentences =
    sourceSide === "original" ? row.originalSentences : row.translatedSentences;
  const targetRowSentences =
    sourceSide === "original" ? row.translatedSentences : row.originalSentences;
  const sentenceIds = new Set(
    [
      sourceSentence,
      ...(linkedTokens.length
        ? uniqueSentencesFromTokens(linkedTokens, modelIndex.sentenceById)
        : selectFallbackTargetSentences(sourceSentence, sourceRowSentences, targetRowSentences)),
    ].map((sentence) => sentence.id),
  );

  return {
    activeTokenId: sourceToken.id,
    linkedTokenIds,
    phraseSentenceIds: new Set(
      [...row.originalSentences, ...row.translatedSentences].map((sentence) => sentence.id),
    ),
    sentenceIds,
  } satisfies HoverState;
}

function createSentenceHoverState(modelIndex: ModelIndex, sentenceId: string) {
  const sourceSentence = modelIndex.sentenceById.get(sentenceId);
  const sourceSide = sourceSentence
    ? modelIndex.sideBySentenceId.get(sourceSentence.id)
    : undefined;
  const row = sourceSentence ? modelIndex.rowBySentenceId.get(sourceSentence.id) : undefined;

  if (!sourceSentence || !sourceSide || !row) {
    return null;
  }

  const sourceRowSentences =
    sourceSide === "original" ? row.originalSentences : row.translatedSentences;
  const targetRowSentences =
    sourceSide === "original" ? row.translatedSentences : row.originalSentences;

  return {
    activeTokenId: null,
    linkedTokenIds: new Set<string>(),
    phraseSentenceIds: new Set(
      [...row.originalSentences, ...row.translatedSentences].map((sentence) => sentence.id),
    ),
    sentenceIds: new Set(
      [
        sourceSentence,
        ...selectFallbackTargetSentences(sourceSentence, sourceRowSentences, targetRowSentences),
      ].map((sentence) => sentence.id),
    ),
  } satisfies HoverState;
}

function appendLinkedTokenId(
  linksByTokenId: Map<string, string[]>,
  sourceTokenId: string,
  linkedTokenId: string,
) {
  const next = linksByTokenId.get(sourceTokenId);

  if (next) {
    next.push(linkedTokenId);
    return;
  }

  linksByTokenId.set(sourceTokenId, [linkedTokenId]);
}

function uniqueSentencesFromTokens(
  tokens: ParallelTextToken[],
  sentenceById: Map<string, ParallelTextSentence>,
) {
  const sentenceIds = new Set(tokens.map((token) => token.sentenceId));

  return Array.from(sentenceIds)
    .map((nextSentenceId) => sentenceById.get(nextSentenceId))
    .filter((sentence): sentence is ParallelTextSentence => Boolean(sentence));
}

function selectFallbackTargetSentences(
  sourceSentence: ParallelTextSentence,
  sourceRowSentences: ParallelTextSentence[],
  targetRowSentences: ParallelTextSentence[],
) {
  if (!targetRowSentences.length) {
    return [];
  }

  const sourceSentencePosition = Math.max(
    sourceRowSentences.findIndex((sentence) => sentence.id === sourceSentence.id),
    0,
  );
  const targetSentenceIndex = relativeIndex(
    sourceSentencePosition,
    sourceRowSentences.length,
    targetRowSentences.length,
  );

  return [targetRowSentences[targetSentenceIndex]];
}

function getSentenceStyle(isPhraseActive: boolean, isSentenceActive: boolean): CSSProperties {
  return {
    ...styles.sentence,
    ...(isPhraseActive ? styles.sentencePhraseActive : null),
    ...(isPhraseActive || isSentenceActive
      ? {
          boxShadow: [
            isPhraseActive ? "0 0 0 1px rgba(37, 99, 235, 0.42)" : null,
            isSentenceActive ? "0 0 0 3px rgba(245, 158, 11, 0.28)" : null,
          ]
            .filter(Boolean)
            .join(", "),
        }
      : null),
    ...(isSentenceActive ? styles.sentenceActive : null),
  };
}

const styles: Record<string, CSSProperties> = {
  container: {
    border: "1px solid #d4d4d8",
    borderRadius: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    padding: 18,
    background:
      "linear-gradient(180deg, rgba(250,250,249,1) 0%, rgba(244,244,245,1) 100%)",
    color: "#18181b",
  },
  headerRow: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    alignItems: "start",
  },
  headerBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#52525b",
  },
  translationTabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  translationTab: {
    backgroundColor: "#ffffff",
    border: "1px solid #d4d4d8",
    borderRadius: 999,
    color: "#3f3f46",
    cursor: "pointer",
    font: "inherit",
    fontSize: 13,
    fontWeight: 600,
    padding: "6px 12px",
  },
  translationTabActive: {
    backgroundColor: "#18181b",
    borderColor: "#18181b",
    color: "#fafafa",
  },
  columns: {
    display: "grid",
    gap: 14,
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  },
  panel: {
    border: "1px solid #e4e4e7",
    borderRadius: 20,
    backgroundColor: "#ffffff",
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.05)",
    minHeight: 180,
    padding: 18,
  },
  paragraph: {
    margin: 0,
    marginTop: 16,
    lineHeight: 1.95,
    whiteSpace: "pre-wrap",
  },
  sentence: {
    borderRadius: 10,
    boxDecorationBreak: "clone",
    WebkitBoxDecorationBreak: "clone",
    padding: "2px 3px",
    transition: "background-color 120ms ease, box-shadow 120ms ease",
  },
  sentencePhraseActive: {
    backgroundColor: "rgba(191, 219, 254, 0.24)",
  },
  sentenceActive: {
    backgroundColor: "rgba(254, 240, 138, 0.5)",
  },
  token: {
    backgroundColor: "transparent",
    border: "none",
    borderRadius: 8,
    color: "inherit",
    cursor: "pointer",
    display: "inline",
    font: "inherit",
    margin: 0,
    padding: "0 2px",
  },
  tokenActive: {
    backgroundColor: "#fde68a",
    color: "#713f12",
  },
  punctuation: {
    display: "inline",
  },
  emptyState: {
    color: "#71717a",
    fontStyle: "italic",
    margin: 0,
  },
};
