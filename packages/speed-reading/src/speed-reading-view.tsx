"use client";

import { useEffect, useEffectEvent, useMemo, useState, type CSSProperties, type HTMLAttributes } from "react";

import { countSpeedReadingWords, createSpeedReadingChunks, getSpeedReadingDelay } from "./core";

export interface SpeedReadingViewProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  text: string;
  wordsPerMinute?: number;
  chunkSize?: number;
  isPlaying?: boolean;
  defaultPlaying?: boolean;
  currentChunkIndex?: number;
  showContext?: boolean;
  onPlayingChange?: (nextValue: boolean) => void;
  onCurrentChunkIndexChange?: (nextIndex: number) => void;
  onComplete?: () => void;
}

export function SpeedReadingView({
  text,
  wordsPerMinute = 320,
  chunkSize = 1,
  isPlaying,
  defaultPlaying = false,
  currentChunkIndex,
  showContext = true,
  onPlayingChange,
  onCurrentChunkIndexChange,
  onComplete,
  className,
  style,
  ...divProps
}: SpeedReadingViewProps) {
  const chunks = useMemo(() => createSpeedReadingChunks(text, { chunkSize }), [chunkSize, text]);
  const [internalChunkIndex, setInternalChunkIndex] = useState(0);
  const [internalIsPlaying, setInternalIsPlaying] = useState(defaultPlaying);
  const resolvedChunkIndex = clampChunkIndex(
    currentChunkIndex ?? internalChunkIndex,
    chunks.length,
  );
  const resolvedIsPlaying = isPlaying ?? internalIsPlaying;
  const currentChunk = chunks[resolvedChunkIndex] ?? null;
  const previousChunk = resolvedChunkIndex > 0 ? chunks[resolvedChunkIndex - 1] ?? null : null;
  const nextChunk =
    resolvedChunkIndex < chunks.length - 1 ? chunks[resolvedChunkIndex + 1] ?? null : null;
  const words = useMemo(() => countSpeedReadingWords(text), [text]);

  const emitPlayingChange = useEffectEvent((nextValue: boolean) => {
    if (isPlaying === undefined) {
      setInternalIsPlaying(nextValue);
    }

    onPlayingChange?.(nextValue);
  });
  const emitChunkIndexChange = useEffectEvent((nextIndex: number) => {
    if (currentChunkIndex === undefined) {
      setInternalChunkIndex(nextIndex);
    }

    onCurrentChunkIndexChange?.(nextIndex);
  });
  const emitComplete = useEffectEvent(() => {
    emitPlayingChange(false);
    onComplete?.();
  });

  useEffect(() => {
    if (currentChunkIndex === undefined) {
      setInternalChunkIndex(0);
    }

    if (isPlaying === undefined) {
      setInternalIsPlaying(defaultPlaying && chunks.length > 0);
    }
  }, [chunks.length, currentChunkIndex, defaultPlaying, isPlaying, text]);

  useEffect(() => {
    if (!resolvedIsPlaying || !currentChunk || chunks.length === 0) {
      return undefined;
    }

    if (resolvedChunkIndex >= chunks.length - 1) {
      emitComplete();
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      emitChunkIndexChange(resolvedChunkIndex + 1);
    }, getSpeedReadingDelay(currentChunk, { wordsPerMinute }));

    return () => window.clearTimeout(timeoutId);
  }, [
    chunks.length,
    currentChunk,
    emitChunkIndexChange,
    emitComplete,
    resolvedChunkIndex,
    resolvedIsPlaying,
    wordsPerMinute,
  ]);

  return (
    <div
      {...divProps}
      className={className}
      data-current-text={currentChunk?.text ?? ""}
      data-current-chunk-index={resolvedChunkIndex}
      data-total-chunks={chunks.length}
      style={{
        ...styles.container,
        ...style,
      }}
    >
      <div style={styles.metaRow}>
        <span>{words} words</span>
        <span>{chunks.length} chunks</span>
        <span>{wordsPerMinute} WPM</span>
      </div>

      <div style={styles.readerFrame} aria-live="polite" aria-atomic="true">
        <div style={styles.guideRail} aria-hidden="true" />
        {currentChunk ? (
          <div style={styles.wordLine}>
            <span style={styles.wordPrefix}>{currentChunk.prefix}</span>
            <span style={styles.wordPivot}>{currentChunk.pivot || " "}</span>
            <span style={styles.wordSuffix}>{currentChunk.suffix}</span>
          </div>
        ) : (
          <p style={styles.emptyState}>Paste text or extract it from a PDF to start reading.</p>
        )}
      </div>

      {showContext ? (
        <div style={styles.contextRow}>
          <span style={styles.contextText}>{previousChunk?.text ?? "\u00a0"}</span>
          <span style={styles.contextDivider} aria-hidden="true" />
          <span style={styles.contextText}>{nextChunk?.text ?? "\u00a0"}</span>
        </div>
      ) : null}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: "grid",
    gap: "1rem",
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    fontSize: "0.8rem",
    letterSpacing: "0.08em",
    opacity: 0.7,
    textTransform: "uppercase",
  },
  readerFrame: {
    position: "relative",
    display: "grid",
    placeItems: "center",
    minHeight: "15rem",
    overflow: "hidden",
    borderRadius: "1.75rem",
    border: "1px solid color-mix(in srgb, currentColor 14%, transparent)",
    background:
      "linear-gradient(160deg, color-mix(in srgb, currentColor 6%, transparent), transparent 55%), color-mix(in srgb, Canvas 88%, transparent)",
    padding: "2rem",
  },
  guideRail: {
    position: "absolute",
    top: "14%",
    bottom: "14%",
    left: "50%",
    width: "2px",
    transform: "translateX(-50%)",
    background:
      "linear-gradient(180deg, transparent, color-mix(in srgb, currentColor 24%, transparent) 20%, color-mix(in srgb, currentColor 24%, transparent) 80%, transparent)",
  },
  wordLine: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "baseline",
    justifyContent: "center",
    fontSize: "clamp(2.1rem, 7vw, 4.8rem)",
    fontWeight: 700,
    letterSpacing: "0.02em",
    lineHeight: 1,
    fontVariantLigatures: "none",
  },
  wordPrefix: {
    opacity: 0.75,
  },
  wordPivot: {
    color: "rgb(216 68 55)",
    textShadow: "0 0 22px color-mix(in srgb, rgb(216 68 55) 30%, transparent)",
  },
  wordSuffix: {
    opacity: 0.9,
  },
  emptyState: {
    margin: 0,
    maxWidth: "28rem",
    textAlign: "center",
    fontSize: "1rem",
    lineHeight: 1.7,
    opacity: 0.72,
  },
  contextRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: "0.75rem",
  },
  contextText: {
    minHeight: "1.5rem",
    fontSize: "0.95rem",
    lineHeight: 1.6,
    opacity: 0.45,
  },
  contextDivider: {
    width: "0.4rem",
    height: "0.4rem",
    borderRadius: "999px",
    background: "currentColor",
    opacity: 0.18,
  },
};

function clampChunkIndex(index: number, chunkCount: number): number {
  if (chunkCount <= 0) {
    return 0;
  }

  if (!Number.isFinite(index)) {
    return 0;
  }

  return Math.min(Math.max(0, Math.round(index)), chunkCount - 1);
}
