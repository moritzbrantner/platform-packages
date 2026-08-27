"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { HTMLAttributes, KeyboardEvent as ReactKeyboardEvent } from "react";

import { createTextDocument, segmentTextDocument } from "@moritzbrantner/linguistics-core";
import { Button } from "@moritzbrantner/ui";

import type {
  ParallelTextAlignmentRow,
  ParallelTextAlignmentSource,
  ParallelTextModel,
  ParallelTextParagraph,
  ParallelTextSentence,
  ParallelTextToken,
  ParallelTextTokenLink,
  SentenceAlignmentInput,
  TokenAlignmentInput,
} from "./model";
import { createAlignmentModel, relativeIndex } from "./model";

type ParallelTextSide = "original" | "translated";
type TextDirection = HTMLAttributes<HTMLElement>["dir"];

export type ParallelTextLayout = "aligned" | "flow";

export type ParallelTextTranslationOption = {
  id: string;
  label: string;
  translatedText: string;
  translatedLabel?: string;
  language?: string;
  languageCode?: string;
  direction?: TextDirection;
  sentenceAlignments?: SentenceAlignmentInput[];
  tokenAlignments?: TokenAlignmentInput[];
};

export type ParallelTextViewProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  originalText: string;
  translatedText?: string;
  sentenceAlignments?: SentenceAlignmentInput[];
  tokenAlignments?: TokenAlignmentInput[];
  translations?: ParallelTextTranslationOption[];
  originalLabel?: string;
  translatedLabel?: string;
  originalLanguage?: string;
  originalLanguageCode?: string;
  originalDirection?: TextDirection;
  translationLanguage?: string;
  translationLanguageCode?: string;
  translationDirection?: TextDirection;
  defaultTranslationId?: string;
  layout?: ParallelTextLayout;
};

type ModelIndex = {
  tokenById: Map<string, ParallelTextToken>;
  sentenceById: Map<string, ParallelTextSentence>;
  sideByTokenId: Map<string, ParallelTextSide>;
  sideBySentenceId: Map<string, ParallelTextSide>;
  rowByTokenId: Map<string, ParallelTextAlignmentRow>;
  rowBySentenceId: Map<string, ParallelTextAlignmentRow>;
  linksByTokenId: Map<string, ParallelTextTokenLink[]>;
};

type HoverState = {
  activeTokenId: string | null;
  linkedTokenSources: Map<string, ParallelTextAlignmentSource>;
  phraseSentenceIds: Set<string>;
  sentenceIds: Set<string>;
};

type ReadingSideProps = {
  label: string;
  language?: string;
  languageCode?: string;
  direction?: TextDirection;
};

export function ParallelTextView({
  originalText,
  translatedText,
  sentenceAlignments,
  tokenAlignments,
  translations,
  originalLabel = "Original",
  translatedLabel = "Translation",
  originalLanguage,
  originalLanguageCode,
  originalDirection,
  translationLanguage,
  translationLanguageCode,
  translationDirection,
  defaultTranslationId,
  layout = "aligned",
  className,
  ...divProps
}: ParallelTextViewProps) {
  const translationOptions = useMemo(
    () =>
      resolveTranslationOptions({
        translatedText,
        translatedLabel,
        translationLanguage,
        translationLanguageCode,
        translationDirection,
        sentenceAlignments,
        tokenAlignments,
        translations,
      }),
    [
      sentenceAlignments,
      tokenAlignments,
      translatedLabel,
      translatedText,
      translationDirection,
      translationLanguage,
      translationLanguageCode,
      translations,
    ],
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

  const originalSide: ReadingSideProps = {
    label: originalLabel,
    language: originalLanguage,
    languageCode: originalLanguageCode,
    direction: originalDirection,
  };
  const translatedSide: ReadingSideProps = {
    label: selectedTranslation?.translatedLabel ?? translatedLabel,
    language: selectedTranslation?.language ?? translationLanguage,
    languageCode: selectedTranslation?.languageCode ?? translationLanguageCode,
    direction: selectedTranslation?.direction ?? translationDirection,
  };

  return (
    <div
      {...divProps}
      data-slot="parallel-text-view"
      data-layout={layout}
      className={joinClassNames(
        "grid min-w-0 gap-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4 text-[color:var(--card-foreground)] shadow-sm",
        className,
      )}
    >
      <div
        data-slot="parallel-text-header"
        className="grid min-w-0 gap-3 border-b border-b-[color:var(--border)] pb-3 md:grid-cols-2"
      >
        <ColumnHeader {...originalSide} />
        <div className="grid min-w-0 gap-2">
          <ColumnHeader {...translatedSide} />
          {translationOptions.length > 1 ? (
            <div
              role="tablist"
              aria-label="Available translations"
              className="flex min-w-0 flex-wrap gap-1.5"
            >
              {translationOptions.map((translation) => {
                const isSelected = translation.id === selectedTranslation?.id;

                return (
                  <Button
                    key={translation.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    size="sm"
                    variant={isSelected ? "secondary" : "ghost"}
                    className="h-8 px-2.5 text-xs"
                    onClick={() => setSelectedTranslationId(translation.id)}
                  >
                    {translation.label}
                  </Button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {layout === "aligned" ? (
        <AlignedTextLayout
          model={model}
          originalSide={originalSide}
          translatedSide={translatedSide}
          hoverState={hoverState}
          onSentenceHover={setHoveredSentenceId}
          onTokenHover={setHoveredTokenId}
        />
      ) : (
        <FlowTextLayout
          model={model}
          originalSide={originalSide}
          translatedSide={translatedSide}
          hoverState={hoverState}
          onSentenceHover={setHoveredSentenceId}
          onTokenHover={setHoveredTokenId}
        />
      )}
    </div>
  );
}

type TextLayoutProps = {
  model: ParallelTextModel;
  originalSide: ReadingSideProps;
  translatedSide: ReadingSideProps;
  hoverState: HoverState | null;
  onSentenceHover: (sentenceId: string | null) => void;
  onTokenHover: (tokenId: string | null) => void;
};

function AlignedTextLayout({
  model,
  originalSide,
  translatedSide,
  hoverState,
  onSentenceHover,
  onTokenHover,
}: TextLayoutProps) {
  return (
    <div
      data-slot="parallel-text-aligned-rows"
      className="grid min-w-0 overflow-hidden rounded-md border border-[color:var(--border)]"
    >
      {model.rows.length ? (
        model.rows.map((row) => (
          <div
            key={row.id}
            data-alignment-row={row.id}
            data-alignment-source={row.source}
            className="grid min-w-0 border-b border-b-[color:var(--border)] last:border-b-0 md:grid-cols-2"
          >
            <AlignmentCell
              {...originalSide}
              side="original"
              sentences={row.originalSentences}
              hoverState={hoverState}
              onSentenceHover={onSentenceHover}
              onTokenHover={onTokenHover}
            />
            <AlignmentCell
              {...translatedSide}
              side="translated"
              sentences={row.translatedSentences}
              hoverState={hoverState}
              onSentenceHover={onSentenceHover}
              onTokenHover={onTokenHover}
              className="border-t border-t-[color:var(--border)] md:border-t-0 md:border-l md:border-l-[color:var(--border)]"
            />
          </div>
        ))
      ) : (
        <p className="p-4 text-sm italic text-[color:var(--muted-foreground)]">No text available.</p>
      )}
    </div>
  );
}

function FlowTextLayout({
  model,
  originalSide,
  translatedSide,
  hoverState,
  onSentenceHover,
  onTokenHover,
}: TextLayoutProps) {
  return (
    <div data-slot="parallel-text-flow" className="grid min-w-0 gap-4 md:grid-cols-2">
      <TextPanel
        {...originalSide}
        side="original"
        paragraphs={model.originalParagraphs}
        hoverState={hoverState}
        onSentenceHover={onSentenceHover}
        onTokenHover={onTokenHover}
      />
      <TextPanel
        {...translatedSide}
        side="translated"
        paragraphs={model.translatedParagraphs}
        hoverState={hoverState}
        onSentenceHover={onSentenceHover}
        onTokenHover={onTokenHover}
        className="md:border-l md:border-l-[color:var(--border)] md:pl-5"
      />
    </div>
  );
}

type AlignmentCellProps = ReadingSideProps & {
  side: ParallelTextSide;
  sentences: ParallelTextSentence[];
  hoverState: HoverState | null;
  onSentenceHover: (sentenceId: string | null) => void;
  onTokenHover: (tokenId: string | null) => void;
  className?: string;
};

function AlignmentCell({
  label,
  language,
  languageCode,
  direction,
  side,
  sentences,
  hoverState,
  onSentenceHover,
  onTokenHover,
  className,
}: AlignmentCellProps) {
  return (
    <section
      aria-label={label}
      data-side={side}
      lang={languageCode}
      dir={direction}
      className={joinClassNames("min-w-0 p-4 text-start", className)}
    >
      <div className="mb-2 md:hidden">
        <ColumnHeader
          label={label}
          language={language}
          languageCode={languageCode}
          direction={direction}
          compact
        />
      </div>
      <SentenceParagraphs
        sentences={sentences}
        hoverState={hoverState}
        onSentenceHover={onSentenceHover}
        onTokenHover={onTokenHover}
      />
    </section>
  );
}

type TextPanelProps = ReadingSideProps & {
  side: ParallelTextSide;
  paragraphs: ParallelTextParagraph[];
  hoverState: HoverState | null;
  onSentenceHover: (sentenceId: string | null) => void;
  onTokenHover: (tokenId: string | null) => void;
  className?: string;
};

function TextPanel({
  label,
  languageCode,
  direction,
  side,
  paragraphs,
  hoverState,
  onSentenceHover,
  onTokenHover,
  className,
}: TextPanelProps) {
  return (
    <section
      aria-label={label}
      data-side={side}
      lang={languageCode}
      dir={direction}
      className={joinClassNames("grid min-w-0 content-start gap-4 text-start", className)}
    >
      {paragraphs.length ? (
        paragraphs.map((paragraph) => (
          <SentenceParagraph
            key={paragraph.id}
            sentences={paragraph.sentences}
            hoverState={hoverState}
            onSentenceHover={onSentenceHover}
            onTokenHover={onTokenHover}
          />
        ))
      ) : (
        <p className="m-0 text-sm italic text-[color:var(--muted-foreground)]">No text available.</p>
      )}
    </section>
  );
}

type SentenceParagraphsProps = {
  sentences: ParallelTextSentence[];
  hoverState: HoverState | null;
  onSentenceHover: (sentenceId: string | null) => void;
  onTokenHover: (tokenId: string | null) => void;
};

function SentenceParagraphs(props: SentenceParagraphsProps) {
  const groups = groupSentencesByParagraph(props.sentences);

  if (!groups.length) {
    return <p className="m-0 text-sm italic text-[color:var(--muted-foreground)]">No text.</p>;
  }

  return (
    <div className="grid gap-3">
      {groups.map((sentences) => (
        <SentenceParagraph key={sentences[0]?.paragraphId ?? "empty"} {...props} sentences={sentences} />
      ))}
    </div>
  );
}

function SentenceParagraph({
  sentences,
  hoverState,
  onSentenceHover,
  onTokenHover,
}: SentenceParagraphsProps) {
  return (
    <p className="m-0 whitespace-pre-wrap text-base leading-8">
      {sentences.map((sentence, sentenceIndex) => (
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
  );
}

type SentenceInlineProps = {
  sentence: ParallelTextSentence;
  hoverState: HoverState | null;
  onSentenceHover: (sentenceId: string | null) => void;
  onTokenHover: (tokenId: string | null) => void;
};

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
      tabIndex={0}
      onFocus={() => {
        onSentenceHover(sentence.id);
        onTokenHover(null);
      }}
      onBlur={() => {
        onSentenceHover(null);
        onTokenHover(null);
      }}
      onKeyDown={(event: ReactKeyboardEvent<HTMLSpanElement>) =>
        handleSentenceKeyDown(event, sentence, hoverState?.activeTokenId ?? null, onTokenHover)
      }
      onMouseEnter={() => onSentenceHover(sentence.id)}
      onMouseLeave={() => {
        onSentenceHover(null);
        onTokenHover(null);
      }}
      className={getSentenceClassName(isPhraseActive, isSentenceActive)}
    >
      {sentence.tokens.map((token) => {
        const isActive = hoverState?.activeTokenId === token.id;
        const linkedSource = hoverState?.linkedTokenSources.get(token.id);

        return (
          <Fragment key={token.id}>
            {token.leadingText}
            {token.isWord ? (
              <span
                data-token-id={token.id}
                data-highlighted={isActive || linkedSource ? "true" : "false"}
                data-alignment-source={linkedSource}
                onMouseEnter={() => onTokenHover(token.id)}
                onMouseLeave={() => onTokenHover(null)}
                className={getTokenClassName(isActive, linkedSource)}
              >
                {token.text}
              </span>
            ) : (
              <span>{token.text}</span>
            )}
          </Fragment>
        );
      })}
      {sentence.trailingText}
    </span>
  );
}

function ColumnHeader({
  label,
  language,
  languageCode,
  direction,
  compact = false,
}: ReadingSideProps & { compact?: boolean }) {
  return (
    <div
      data-slot="parallel-text-column-header"
      className={joinClassNames("flex min-w-0 flex-wrap items-baseline justify-between gap-2", compact && "gap-1")}
      lang={languageCode}
      dir={direction}
    >
      <span className="text-xs font-semibold tracking-wide text-[color:var(--muted-foreground)] uppercase">
        {label}
      </span>
      {language ? (
        <span className="text-xs text-[color:var(--muted-foreground)]">{language}</span>
      ) : null}
    </div>
  );
}

function resolveTranslationOptions({
  translatedText,
  translatedLabel,
  translationLanguage,
  translationLanguageCode,
  translationDirection,
  sentenceAlignments,
  tokenAlignments,
  translations,
}: {
  translatedText?: string;
  translatedLabel: string;
  translationLanguage?: string;
  translationLanguageCode?: string;
  translationDirection?: TextDirection;
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
        language: translationLanguage,
        languageCode: translationLanguageCode,
        direction: translationDirection,
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
  const linksByTokenId = new Map<string, ParallelTextTokenLink[]>();

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
      appendTokenLink(linksByTokenId, link.originalTokenId, link);
      appendTokenLink(linksByTokenId, link.translatedTokenId, link);
    }
  }

  return {
    tokenById,
    sentenceById,
    sideByTokenId,
    sideBySentenceId,
    rowByTokenId,
    rowBySentenceId,
    linksByTokenId,
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

  const linkedTokenSources = new Map<string, ParallelTextAlignmentSource>();

  for (const link of modelIndex.linksByTokenId.get(sourceToken.id) ?? []) {
    const linkedTokenId =
      link.originalTokenId === sourceToken.id ? link.translatedTokenId : link.originalTokenId;
    const previousSource = linkedTokenSources.get(linkedTokenId);
    linkedTokenSources.set(linkedTokenId, pickStrongerSource(previousSource, link.source));
  }

  const linkedTokens = Array.from(linkedTokenSources.keys())
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
    linkedTokenSources,
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
    linkedTokenSources: new Map<string, ParallelTextAlignmentSource>(),
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

function appendTokenLink(
  linksByTokenId: Map<string, ParallelTextTokenLink[]>,
  tokenId: string,
  link: ParallelTextTokenLink,
) {
  const current = linksByTokenId.get(tokenId);

  if (current) {
    current.push(link);
    return;
  }

  linksByTokenId.set(tokenId, [link]);
}

function pickStrongerSource(
  current: ParallelTextAlignmentSource | undefined,
  candidate: ParallelTextAlignmentSource,
) {
  if (!current) {
    return candidate;
  }

  return alignmentSourceRank(candidate) > alignmentSourceRank(current) ? candidate : current;
}

function alignmentSourceRank(source: ParallelTextAlignmentSource) {
  switch (source) {
    case "manual":
      return 4;
    case "model":
      return 3;
    case "heuristic":
      return 2;
    case "unverified":
      return 1;
  }
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

function handleSentenceKeyDown(
  event: ReactKeyboardEvent<HTMLSpanElement>,
  sentence: ParallelTextSentence,
  activeTokenId: string | null,
  onTokenHover: (tokenId: string | null) => void,
) {
  const wordTokens = sentence.tokens.filter((token) => token.isWord);

  if (!wordTokens.length) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    onTokenHover(null);
    return;
  }

  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
    return;
  }

  event.preventDefault();
  const currentIndex = wordTokens.findIndex((token) => token.id === activeTokenId);
  let nextIndex = currentIndex;

  if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = wordTokens.length - 1;
  } else if (event.key === "ArrowRight") {
    nextIndex = currentIndex < 0 ? 0 : Math.min(currentIndex + 1, wordTokens.length - 1);
  } else if (event.key === "ArrowLeft") {
    nextIndex = currentIndex < 0 ? wordTokens.length - 1 : Math.max(currentIndex - 1, 0);
  }

  onTokenHover(wordTokens[nextIndex]?.id ?? null);
}

function groupSentencesByParagraph(sentences: ParallelTextSentence[]) {
  const groups: ParallelTextSentence[][] = [];

  for (const sentence of sentences) {
    const current = groups.at(-1);

    if (current?.[0]?.paragraphId === sentence.paragraphId) {
      current.push(sentence);
    } else {
      groups.push([sentence]);
    }
  }

  return groups;
}

function getSentenceClassName(isPhraseActive: boolean, isSentenceActive: boolean) {
  return joinClassNames(
    "rounded-sm box-decoration-clone px-0.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]",
    isPhraseActive && "bg-[color:var(--muted)]",
    isSentenceActive && "ring-1 ring-inset ring-[color:var(--border)]",
  );
}

function getTokenClassName(
  isActive: boolean,
  linkedSource: ParallelTextAlignmentSource | undefined,
) {
  return joinClassNames(
    "rounded-sm px-0.5 transition-colors",
    isActive && "bg-[color:var(--accent)] text-[color:var(--accent-foreground)]",
    linkedSource === "manual" &&
      "bg-[color:var(--accent)] text-[color:var(--accent-foreground)]",
    linkedSource === "model" &&
      "bg-[color:var(--accent)] text-[color:var(--accent-foreground)] ring-1 ring-inset ring-[color:var(--ring)]",
    linkedSource === "heuristic" &&
      "bg-[color:var(--muted)] underline decoration-dotted decoration-1 decoration-[color:var(--muted-foreground)] underline-offset-2",
    linkedSource === "unverified" &&
      "underline decoration-dotted decoration-[color:var(--muted-foreground)] underline-offset-2",
  );
}

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
