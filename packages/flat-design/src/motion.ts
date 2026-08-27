import { createTimelineAnimations, type FlatMotionKeyframe } from "./animation-presets";
import { createEditableMotionFromPreset, normalizeEditableMotion } from "./core";
import type { FlatBuiltInFigureAnimationPreset, FlatFigureAnimationOptions } from "./figures";
import type {
  FlatAnimation,
  FlatEditableKeyframe,
  FlatMotionEasing,
  FlatMotionSpec,
  FlatTimelineMotionSpec,
} from "./scene-types";

const defaultPresetEasing: Record<FlatBuiltInFigureAnimationPreset, FlatMotionEasing> = {
  blink: "ease-in-out",
  bobbing: "ease-in-out",
  drift: "ease-in-out",
  float: "ease-in-out",
  pop: { type: "cubic-bezier", x1: 0.22, y1: 1, x2: 0.36, y2: 1 },
  pulse: "ease-in-out",
  spin: "linear",
  sway: "ease-in-out",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseClockValue(value: string | undefined, fallbackMs = 0) {
  if (!value) {
    return fallbackMs;
  }

  const trimmed = value.trim();
  if (trimmed.endsWith("ms")) {
    const parsed = Number.parseFloat(trimmed.slice(0, -2));
    return Number.isFinite(parsed) ? Math.max(parsed, 0) : fallbackMs;
  }
  if (trimmed.endsWith("s")) {
    const parsed = Number.parseFloat(trimmed.slice(0, -1));
    return Number.isFinite(parsed) ? Math.max(parsed * 1_000, 0) : fallbackMs;
  }

  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? Math.max(parsed * 1_000, 0) : fallbackMs;
}

function formatSeconds(durationMs: number) {
  const seconds = Number((Math.max(durationMs, 0) / 1_000).toFixed(3));
  return `${seconds}s`;
}

function cloneKeyframe(keyframe: FlatEditableKeyframe): FlatEditableKeyframe {
  return {
    ...keyframe,
    rotate:
      typeof keyframe.rotate === "number"
        ? keyframe.rotate
        : keyframe.rotate
          ? { ...keyframe.rotate }
          : undefined,
    scale:
      typeof keyframe.scale === "number"
        ? keyframe.scale
        : keyframe.scale
          ? { ...keyframe.scale }
          : undefined,
  };
}

function normalizeCubicBezier(easing: FlatMotionEasing): FlatMotionEasing {
  if (typeof easing === "string") {
    return easing;
  }

  return {
    type: "cubic-bezier",
    x1: clamp(easing.x1, 0, 1),
    y1: easing.y1,
    x2: clamp(easing.x2, 0, 1),
    y2: easing.y2,
  };
}

function inferLegacyPresetEasing(
  preset: FlatBuiltInFigureAnimationPreset,
  options?: FlatFigureAnimationOptions,
): FlatMotionEasing {
  const firstSpline = options?.keySplines?.[0];

  if (options?.calcMode === "linear") {
    return "linear";
  }

  if (options?.calcMode === "spline" && firstSpline) {
    const values = firstSpline
      .trim()
      .split(/\s+/)
      .map((value) => Number.parseFloat(value));

    if (values.length === 4 && values.every(Number.isFinite)) {
      return normalizeCubicBezier({
        type: "cubic-bezier",
        x1: values[0]!,
        y1: values[1]!,
        x2: values[2]!,
        y2: values[3]!,
      });
    }
  }

  return defaultPresetEasing[preset];
}

function normalizeTimelineMotion(motion: FlatTimelineMotionSpec): FlatTimelineMotionSpec {
  const normalized = normalizeEditableMotion(motion);

  return {
    ...normalized,
    delayMs: Math.max(0, normalized.delayMs ?? 0),
    easing: normalizeCubicBezier(normalized.easing ?? "linear"),
    fillMode: normalized.fillMode ?? "remove",
  };
}

function retimePresetMotion(
  motion: FlatTimelineMotionSpec,
  durationValue: string | undefined,
): FlatTimelineMotionSpec {
  const durationMs = parseClockValue(durationValue, motion.durationMs);

  if (durationMs === motion.durationMs || motion.durationMs <= 0) {
    return motion;
  }

  const timeScale = durationMs / motion.durationMs;

  return {
    ...motion,
    durationMs,
    keyframes: motion.keyframes.map((keyframe) => ({
      ...cloneKeyframe(keyframe),
      timeMs: keyframe.timeMs * timeScale,
    })),
  };
}

export function resolveFlatMotion(motion: FlatMotionSpec): FlatTimelineMotionSpec {
  if (motion.kind === "timeline") {
    return normalizeTimelineMotion(motion);
  }

  const timeline = retimePresetMotion(
    createEditableMotionFromPreset(motion.preset, motion.options),
    motion.options?.dur,
  );

  return normalizeTimelineMotion({
    ...timeline,
    delayMs: parseClockValue(motion.options?.begin),
    easing: inferLegacyPresetEasing(motion.preset, motion.options),
    fillMode: motion.options?.fillMode ?? "remove",
  });
}

function expandMotionDirection(motion: FlatTimelineMotionSpec): FlatEditableKeyframe[] {
  if (motion.direction === "reverse") {
    return motion.keyframes
      .map((keyframe) => ({
        ...cloneKeyframe(keyframe),
        timeMs: motion.durationMs - keyframe.timeMs,
      }))
      .sort((left, right) => left.timeMs - right.timeMs);
  }

  if (motion.direction !== "alternate") {
    return motion.keyframes.map(cloneKeyframe);
  }

  const forward = motion.keyframes.map((keyframe) => ({
    keyframe: cloneKeyframe(keyframe),
    ratio: motion.durationMs <= 0 ? 0 : keyframe.timeMs / motion.durationMs,
  }));
  const backward = [...forward].reverse().slice(1);

  return [
    ...forward.map(({ keyframe, ratio }) => ({
      ...keyframe,
      timeMs: ratio * motion.durationMs * 0.5,
    })),
    ...backward.map(({ keyframe, ratio }) => ({
      ...keyframe,
      timeMs: motion.durationMs * 0.5 + (1 - ratio) * motion.durationMs * 0.5,
    })),
  ];
}

function toAnimationKeyframes(motion: FlatTimelineMotionSpec): FlatMotionKeyframe[] {
  return expandMotionDirection(motion).map((keyframe) => ({
    time: motion.durationMs <= 0 ? 0 : keyframe.timeMs / motion.durationMs,
    opacity: keyframe.opacity,
    rotate: keyframe.rotate,
    scale: keyframe.scale,
    x: keyframe.x,
    y: keyframe.y,
  }));
}

function formatCubicBezier(easing: Exclude<FlatMotionEasing, string>) {
  return `${easing.x1} ${easing.y1} ${easing.x2} ${easing.y2}`;
}

function getSvgEasing(
  easing: FlatMotionEasing,
  segmentCount: number,
): Pick<FlatAnimation, "calcMode" | "keySplines"> {
  if (easing === "linear") {
    return { calcMode: "linear", keySplines: undefined };
  }

  const spline =
    easing === "ease-in"
      ? "0.42 0 1 1"
      : easing === "ease-out"
        ? "0 0 0.58 1"
        : easing === "ease-in-out"
          ? "0.42 0 0.58 1"
          : formatCubicBezier(easing);

  return {
    calcMode: "spline",
    keySplines: Array.from({ length: Math.max(segmentCount, 0) }, () => spline),
  };
}

/**
 * Compile the canonical authored motion model to SVG animation primitives.
 * Raw `shape.animations` are intentionally outside this function and are
 * appended by renderers as a compatibility escape hatch.
 */
export function compileFlatMotion(motion: FlatMotionSpec): FlatAnimation[] {
  const resolved = resolveFlatMotion(motion);
  const keyframes = toAnimationKeyframes(resolved);
  const easing = getSvgEasing(resolved.easing ?? "linear", keyframes.length - 1);

  return createTimelineAnimations({
    begin: formatSeconds(resolved.delayMs ?? 0),
    calcMode: easing.calcMode,
    dur: formatSeconds(resolved.durationMs),
    fillMode: resolved.fillMode,
    keySplines: easing.keySplines,
    keyframes,
    repeatCount:
      resolved.repeatCount === undefined
        ? undefined
        : typeof resolved.repeatCount === "number"
          ? String(resolved.repeatCount)
          : resolved.repeatCount,
    rotateCenter: resolved.rotateCenter,
  });
}
