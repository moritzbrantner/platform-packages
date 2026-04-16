import { act, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import {
  SpeedReadingView,
  createSpeedReadingModel,
  splitSpeedReadingText,
  tokenizeSpeedReadingText,
} from "@moritzbrantner/speed-reading";

describe("@moritzbrantner/speed-reading", () => {
  test("splits text into readable chunks while preserving quotes, contractions, and abbreviations", () => {
    const chunks = splitSpeedReadingText(
      `She whispered, "Don't be late for the 7:30 p.m. train."`,
    );

    expect(chunks.map((chunk) => chunk.text)).toEqual([
      "She",
      "whispered,",
      `"Don't`,
      "be",
      "late",
      "for",
      "the",
      "7:30",
      "p.m.",
      'train."',
    ]);
  });

  test("keeps hyphenated compounds and mixed punctuation attached to the display chunk", () => {
    const tokens = tokenizeSpeedReadingText(
      "A state-of-the-art U.S.A.-based project landed.",
    );

    expect(tokens.map((token) => token.text)).toEqual([
      "A",
      "state-of-the-art",
      "U.S.A.-based",
      "project",
      "landed.",
    ]);
  });

  test("supports grouping multiple words into a single chunk", () => {
    const model = createSpeedReadingModel({
      text: "Read this text two words at a time.",
      wordsPerChunk: 2,
    });

    expect(model.chunks.map((chunk) => chunk.text)).toEqual([
      "Read this",
      "text two",
      "words at",
      "a time.",
    ]);
  });

  test("advances through chunks over time and reports completion", () => {
    vi.useFakeTimers();

    const onComplete = vi.fn();

    render(
      <SpeedReadingView
        text="One. Two."
        wordsPerMinute={600}
        onComplete={onComplete}
      />,
    );

    expect(screen.getByRole("status").textContent).toBe("One.");

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByRole("status").textContent).toBe("One.");

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(screen.getByRole("status").textContent).toBe("Two.");

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  test("renders an empty state when there is no displayable text", () => {
    render(<SpeedReadingView text="   " playing={false} emptyText="Nothing queued" />);

    expect(screen.getByRole("status").textContent).toBe("Nothing queued");
  });
});
