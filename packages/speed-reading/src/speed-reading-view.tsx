"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";

import type { SpeedReadingChunk } from "./model";
import { splitSpeedReadingText } from "./model";

export interface SpeedReadingViewProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  text: string;
  wordsPerChunk?: number;
  wordsPerMinute?: number;
  playing?: boolean;
  loop?: boolean;
  initialChunkIndex?: number;
  emptyText?: string;
  onChunkChange?: (chunk: SpeedReadingChunk | null, index: number) => void;
  onComplete?: () => void;
  renderChunk?: (options: {
    chunk: SpeedReadingChunk | null;
    chunkIndex: number;
    chunkCount: number;
    isPlaying: boolean;
  }) => ReactNode;
}

const DEFAULT_WORDS_PER_MINUTE = 300;

export function SpeedReadingView({
  text,
  wordsPerChunk,
  wordsPerMinute = DEFAULT_WORDS_PER_MINUTE,
  playing = true,
  loop = false,
  initialChunkIndex = 0,
  emptyText = "No text available.",
  onChunkChange,
  onComplete,
  renderChunk,
  className,
  style,
  ...divProps
}: SpeedReadingViewProps) {
  const chunks = useMemo(
    () =>
      splitSpeedReadingText(text, {
        wordsPerChunk,
      }),
    [text, wordsPerChunk],
  );
  const [chunkIndex, setChunkIndex] = useState(() =>
    clampChunkIndex(initialChunkIndex, chunks.length),
  );
  const completedIndexRef = useRef<number | null>(null);

  useEffect(() => {
    setChunkIndex(clampChunkIndex(initialChunkIndex, chunks.length));
    completedIndexRef.current = null;
  }, [chunks.length, initialChunkIndex, text, wordsPerChunk]);

  const currentChunk = chunks[chunkIndex] ?? null;

  useEffect(() => {
    onChunkChange?.(currentChunk, chunkIndex);
  }, [chunkIndex, currentChunk, onChunkChange]);

  useEffect(() => {
    if (!playing || chunks.length === 0) {
      return;
    }

    const durationMs = getChunkDurationMs(currentChunk, wordsPerMinute);

    const timeoutId = window.setTimeout(() => {
      const isLastChunk = chunkIndex >= chunks.length - 1;

      if (isLastChunk) {
        if (loop) {
          completedIndexRef.current = null;
          setChunkIndex(0);
          return;
        }

        if (completedIndexRef.current !== chunkIndex) {
          completedIndexRef.current = chunkIndex;
          onComplete?.();
        }

        return;
      }

      completedIndexRef.current = null;
      setChunkIndex((current) => Math.min(current + 1, chunks.length - 1));
    }, durationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [chunkIndex, chunks.length, currentChunk, loop, onComplete, playing, wordsPerMinute]);

  return (
    <div
      {...divProps}
      className={className}
      data-chunk-count={chunks.length}
      data-current-chunk-index={chunkIndex}
      data-playing={playing ? "true" : "false"}
      style={{
        ...styles.container,
        ...style,
      }}
    >
      {renderChunk ? (
        renderChunk({
          chunk: currentChunk,
          chunkIndex,
          chunkCount: chunks.length,
          isPlaying: playing,
        })
      ) : (
        <>
          <div style={styles.chunkText} role="status" aria-live="polite">
            {currentChunk?.text ?? emptyText}
          </div>
          {chunks.length > 0 ? (
            <div style={styles.metaText}>
              {chunkIndex + 1} / {chunks.length}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function clampChunkIndex(index: number, chunkCount: number): number {
  if (chunkCount === 0) {
    return 0;
  }

  if (!Number.isFinite(index)) {
    return 0;
  }

  return Math.max(0, Math.min(chunkCount - 1, Math.floor(index)));
}

function getChunkDurationMs(
  chunk: SpeedReadingChunk | null,
  wordsPerMinute: number,
): number {
  const safeWordsPerMinute =
    Number.isFinite(wordsPerMinute) && wordsPerMinute > 0
      ? wordsPerMinute
      : DEFAULT_WORDS_PER_MINUTE;
  const baseDurationMs = 60000 / safeWordsPerMinute;

  return Math.max(
    50,
    Math.round(baseDurationMs * (chunk?.pauseMultiplier ?? 1)),
  );
}

const styles = {
  container: {
    alignItems: "center",
    border: "1px solid rgba(15, 23, 42, 0.12)",
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    justifyContent: "center",
    minHeight: 160,
    padding: 24,
    textAlign: "center",
  },
  chunkText: {
    fontFamily: `"Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif`,
    fontSize: "clamp(2rem, 6vw, 4rem)",
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
  },
  metaText: {
    color: "rgba(15, 23, 42, 0.62)",
    fontFamily: `"IBM Plex Sans", sans-serif`,
    fontSize: "0.875rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
} satisfies Record<string, React.CSSProperties>;
