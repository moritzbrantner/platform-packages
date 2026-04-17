import { act, render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import {
  SpeedReadingView,
  createSpeedReadingChunks,
  getPivotIndex,
  getSpeedReadingDelay,
} from "@moritzbrantner/speed-reading";

describe("@moritzbrantner/speed-reading", () => {
  test("groups words into reading chunks and keeps a stable pivot character", () => {
    const chunks = createSpeedReadingChunks("One quick brown fox", { chunkSize: 2 });

    expect(chunks.map((chunk) => chunk.text)).toEqual(["One quick", "brown fox"]);
    expect(chunks[0]?.pivot).toBe("u");
    expect(getPivotIndex("reading")).toBe(2);
  });

  test("applies longer pauses at sentence boundaries", () => {
    const fastChunk = createSpeedReadingChunks("Hello there", { chunkSize: 2 })[0];
    const sentenceChunk = createSpeedReadingChunks("Hello there.", { chunkSize: 2 })[0];

    expect(fastChunk).toBeTruthy();
    expect(sentenceChunk).toBeTruthy();
    expect(
      getSpeedReadingDelay(sentenceChunk ?? { text: "", wordCount: 0, index: 0, pivotIndex: 0, prefix: "", pivot: "", suffix: "" }, {
        wordsPerMinute: 300,
      }),
    ).toBeGreaterThan(
      getSpeedReadingDelay(fastChunk ?? { text: "", wordCount: 0, index: 0, pivotIndex: 0, prefix: "", pivot: "", suffix: "" }, {
        wordsPerMinute: 300,
      }),
    );
  });

  test("advances through chunks while playing", () => {
    vi.useFakeTimers();

    const { container } = render(
      <SpeedReadingView text="Alpha beta gamma" wordsPerMinute={60_000} defaultPlaying />,
    );

    expect((container.firstChild as HTMLElement | null)?.getAttribute("data-current-text")).toBe(
      "Alpha",
    );

    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect((container.firstChild as HTMLElement | null)?.getAttribute("data-current-text")).toBe(
      "beta",
    );

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect((container.firstChild as HTMLElement | null)?.getAttribute("data-current-text")).toBe(
      "gamma",
    );

    vi.useRealTimers();
  });
});
