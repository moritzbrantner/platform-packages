export type FlatPlaybackState = {
  currentTimeMs: number;
  durationMs: number;
  loop: boolean;
  playing: boolean;
};

export type CreateFlatPlaybackStateOptions = {
  currentTimeMs?: number;
  durationMs: number;
  loop?: boolean;
  playing?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeDuration(durationMs: number) {
  return Number.isFinite(durationMs) ? Math.max(durationMs, 0) : 0;
}

function normalizeTime(currentTimeMs: number, durationMs: number) {
  if (!Number.isFinite(currentTimeMs) || durationMs <= 0) {
    return 0;
  }

  return clamp(currentTimeMs, 0, durationMs);
}

function modulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

export function createFlatPlaybackState({
  currentTimeMs = 0,
  durationMs,
  loop = false,
  playing = false,
}: CreateFlatPlaybackStateOptions): FlatPlaybackState {
  const resolvedDurationMs = normalizeDuration(durationMs);

  return {
    currentTimeMs: normalizeTime(currentTimeMs, resolvedDurationMs),
    durationMs: resolvedDurationMs,
    loop,
    playing: playing && resolvedDurationMs > 0,
  };
}

export function seekFlatPlayback(
  state: FlatPlaybackState,
  currentTimeMs: number,
): FlatPlaybackState {
  return {
    ...state,
    currentTimeMs: normalizeTime(currentTimeMs, state.durationMs),
  };
}

export function setFlatPlaybackPlaying(
  state: FlatPlaybackState,
  playing: boolean,
): FlatPlaybackState {
  return {
    ...state,
    playing: playing && state.durationMs > 0,
  };
}

export function restartFlatPlayback(
  state: FlatPlaybackState,
  options: { playing?: boolean } = {},
): FlatPlaybackState {
  return {
    ...state,
    currentTimeMs: 0,
    playing: (options.playing ?? state.playing) && state.durationMs > 0,
  };
}

/**
 * Advance playback by an elapsed duration. This function is deliberately clock
 * agnostic so browsers, editors, stories, and tests can drive the same state.
 */
export function advanceFlatPlayback(
  state: FlatPlaybackState,
  elapsedMs: number,
): FlatPlaybackState {
  if (!state.playing || !Number.isFinite(elapsedMs) || elapsedMs === 0) {
    return state;
  }

  if (state.durationMs <= 0) {
    return {
      ...state,
      currentTimeMs: 0,
      playing: false,
    };
  }

  const nextTimeMs = state.currentTimeMs + elapsedMs;

  if (state.loop) {
    return {
      ...state,
      currentTimeMs:
        nextTimeMs === state.durationMs ? state.durationMs : modulo(nextTimeMs, state.durationMs),
    };
  }

  const currentTimeMs = clamp(nextTimeMs, 0, state.durationMs);
  const reachedBoundary = nextTimeMs >= state.durationMs || nextTimeMs <= 0;

  return {
    ...state,
    currentTimeMs,
    playing: reachedBoundary ? false : state.playing,
  };
}
