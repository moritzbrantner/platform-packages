import { describe, expect, test } from "vitest";

import {
  advanceFlatPlayback,
  createFlatPlaybackState,
  restartFlatPlayback,
  seekFlatPlayback,
  setFlatPlaybackPlaying,
} from "./playback";

describe("flat-design headless playback", () => {
  test("seeks and advances deterministic playback state", () => {
    const initial = createFlatPlaybackState({ durationMs: 2_000 });
    const playing = setFlatPlaybackPlaying(initial, true);
    const advanced = advanceFlatPlayback(playing, 750);
    const sought = seekFlatPlayback(advanced, 1_500);

    expect(initial).toEqual({
      currentTimeMs: 0,
      durationMs: 2_000,
      loop: false,
      playing: false,
    });
    expect(advanced.currentTimeMs).toBe(750);
    expect(sought.currentTimeMs).toBe(1_500);
  });

  test("stops at the end when looping is disabled", () => {
    const state = createFlatPlaybackState({
      currentTimeMs: 900,
      durationMs: 1_000,
      playing: true,
    });

    expect(advanceFlatPlayback(state, 200)).toEqual({
      currentTimeMs: 1_000,
      durationMs: 1_000,
      loop: false,
      playing: false,
    });
  });

  test("wraps elapsed time in loop mode", () => {
    const state = createFlatPlaybackState({
      currentTimeMs: 900,
      durationMs: 1_000,
      loop: true,
      playing: true,
    });

    expect(advanceFlatPlayback(state, 250).currentTimeMs).toBe(150);
  });

  test("restarts without coupling playback to a browser clock", () => {
    const state = createFlatPlaybackState({
      currentTimeMs: 800,
      durationMs: 1_000,
      playing: false,
    });

    expect(restartFlatPlayback(state, { playing: true })).toMatchObject({
      currentTimeMs: 0,
      playing: true,
    });
  });
});
