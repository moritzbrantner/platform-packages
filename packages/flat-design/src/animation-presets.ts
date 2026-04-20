import type {
  FlatAnimation,
  FlatAnimationTiming,
  FlatAttributeAnimation,
  FlatTransformAnimation,
} from "./scene-types";

type Axis = "x" | "y";

type BobbingOptions = FlatAnimationTiming & {
  axis?: Axis;
  distance?: number;
};

type FloatOptions = FlatAnimationTiming & {
  distance?: number;
  drift?: number;
};

type PulseOptions = FlatAnimationTiming & {
  from?: number;
  to?: number;
};

type SpinOptions = FlatAnimationTiming & {
  angle?: number;
  cx?: number;
  cy?: number;
};

type OpacityPulseOptions = FlatAnimationTiming & {
  minOpacity?: number;
  maxOpacity?: number;
};

export type FlatMotionKeyframe = {
  time: number;
  x?: number;
  y?: number;
  scale?: number | { x: number; y: number };
  rotate?: number | { angle: number; cx?: number; cy?: number };
  opacity?: number;
};

export type FlatTimelineAnimationOptions = FlatAnimationTiming & {
  keyframes: FlatMotionKeyframe[];
  rotateCenter?: { cx: number; cy: number };
};

function withDefaults<T extends FlatAnimationTiming>(
  timing: T,
  defaults: Partial<FlatAnimationTiming> = {},
): T {
  return {
    ...timing,
    begin: timing.begin ?? defaults.begin ?? "0s",
    dur: timing.dur ?? defaults.dur ?? "6s",
    repeatCount: timing.repeatCount ?? defaults.repeatCount ?? "indefinite",
    calcMode: timing.calcMode ?? defaults.calcMode,
    keyTimes: timing.keyTimes ?? defaults.keyTimes,
    keySplines: timing.keySplines ?? defaults.keySplines,
    additive: timing.additive ?? defaults.additive,
    fillMode: timing.fillMode ?? defaults.fillMode,
  };
}

export function createBobbingAnimation(
  options: BobbingOptions = {},
): FlatTransformAnimation {
  const { axis = "y", distance = 12, ...timing } = options;

  return {
    kind: "transform",
    transformType: "translate",
    values: [
      { x: 0, y: 0 },
      axis === "x" ? { x: distance, y: 0 } : { x: 0, y: -distance },
      { x: 0, y: 0 },
    ],
    ...withDefaults(timing, {
      dur: "4.6s",
      calcMode: "spline",
      keyTimes: [0, 0.5, 1],
      keySplines: ["0.42 0 0.58 1", "0.42 0 0.58 1"],
      additive: "sum",
    }),
  };
}

export function createDriftAnimation(
  options: BobbingOptions = {},
): FlatTransformAnimation {
  const { axis = "x", distance = 18, ...timing } = options;

  return {
    kind: "transform",
    transformType: "translate",
    values: [
      { x: 0, y: 0 },
      axis === "x" ? { x: distance, y: 0 } : { x: 0, y: distance },
      { x: 0, y: 0 },
    ],
    ...withDefaults(timing, {
      dur: "9s",
      calcMode: "spline",
      keyTimes: [0, 0.5, 1],
      keySplines: ["0.42 0 0.58 1", "0.42 0 0.58 1"],
      additive: "sum",
    }),
  };
}

export function createFloatAnimation(
  options: FloatOptions = {},
): FlatTransformAnimation {
  const { distance = 16, drift = 8, ...timing } = options;

  return {
    kind: "transform",
    transformType: "translate",
    values: [
      { x: 0, y: 0 },
      { x: drift, y: -distance },
      { x: -drift * 0.5, y: -distance * 0.35 },
      { x: 0, y: 0 },
    ],
    ...withDefaults(timing, {
      dur: "7.5s",
      calcMode: "spline",
      keyTimes: [0, 0.38, 0.72, 1],
      keySplines: [
        "0.42 0 0.58 1",
        "0.42 0 0.58 1",
        "0.42 0 0.58 1",
      ],
      additive: "sum",
    }),
  };
}

export function createOpacityPulseAnimation(
  options: OpacityPulseOptions = {},
): FlatAttributeAnimation {
  const { maxOpacity = 1, minOpacity = 0.72, ...timing } = options;

  return {
    kind: "attribute",
    attributeName: "opacity",
    values: [maxOpacity, minOpacity, maxOpacity],
    ...withDefaults(timing, {
      dur: "3.8s",
      calcMode: "spline",
      keyTimes: [0, 0.5, 1],
      keySplines: ["0.42 0 0.58 1", "0.42 0 0.58 1"],
    }),
  };
}

export function createPulseAnimation(
  options: PulseOptions = {},
): FlatTransformAnimation {
  const { from = 1, to = 1.05, ...timing } = options;

  return {
    kind: "transform",
    transformType: "scale",
    values: [from, to, from],
    ...withDefaults(timing, {
      dur: "6.4s",
      calcMode: "spline",
      keyTimes: [0, 0.5, 1],
      keySplines: ["0.42 0 0.58 1", "0.42 0 0.58 1"],
      additive: "sum",
    }),
  };
}

export function createPopAnimation(
  options: PulseOptions = {},
): FlatTransformAnimation {
  const { from = 1, to = 1.12, ...timing } = options;

  return {
    kind: "transform",
    transformType: "scale",
    values: [from, to, 0.98, from],
    ...withDefaults(timing, {
      dur: "3.2s",
      calcMode: "spline",
      keyTimes: [0, 0.35, 0.68, 1],
      keySplines: [
        "0.22 1 0.36 1",
        "0.22 1 0.36 1",
        "0.22 1 0.36 1",
      ],
      additive: "sum",
    }),
  };
}

export function createSwayAnimation(
  options: SpinOptions = {},
): FlatTransformAnimation {
  const { angle = 5, cx = 0, cy = 0, ...timing } = options;

  return {
    kind: "transform",
    transformType: "rotate",
    values: [
      { angle: -angle, cx, cy },
      { angle, cx, cy },
      { angle: -angle, cx, cy },
    ],
    ...withDefaults(timing, {
      dur: "5.8s",
      calcMode: "spline",
      keyTimes: [0, 0.5, 1],
      keySplines: ["0.42 0 0.58 1", "0.42 0 0.58 1"],
      additive: "sum",
    }),
  };
}

export function createSpinAnimation(
  options: SpinOptions = {},
): FlatTransformAnimation {
  const { angle = 360, cx = 0, cy = 0, ...timing } = options;

  return {
    kind: "transform",
    transformType: "rotate",
    values: [
      { angle: 0, cx, cy },
      { angle, cx, cy },
    ],
    ...withDefaults(timing, {
      dur: "18s",
      calcMode: "linear",
      additive: "sum",
    }),
  };
}

function normalizeTimelineKeyframes(
  keyframes: FlatMotionKeyframe[],
): FlatMotionKeyframe[] {
  if (keyframes.length === 0) {
    return [
      { time: 0 },
      { time: 1 },
    ];
  }

  return [...keyframes]
    .map((keyframe) => ({
      ...keyframe,
      time: Math.min(1, Math.max(0, keyframe.time)),
    }))
    .sort((a, b) => a.time - b.time);
}

function hasTimelineValue(
  keyframes: FlatMotionKeyframe[],
  keys: Array<keyof FlatMotionKeyframe>,
): boolean {
  return keyframes.some((keyframe) =>
    keys.some((key) => keyframe[key] !== undefined),
  );
}

export function createTimelineAnimations(
  options: FlatTimelineAnimationOptions,
): FlatAnimation[] {
  const { keyframes, rotateCenter = { cx: 0, cy: 0 }, ...timing } = options;
  const frames = normalizeTimelineKeyframes(keyframes);
  const baseTiming = withDefaults(
    {
      ...timing,
      keyTimes: timing.keyTimes ?? frames.map((keyframe) => keyframe.time),
    },
    {
      dur: "6s",
      calcMode: "linear",
      additive: "sum",
    },
  );
  const animations: FlatAnimation[] = [];

  if (hasTimelineValue(frames, ["x", "y"])) {
    animations.push({
      kind: "transform",
      transformType: "translate",
      values: frames.map((keyframe) => ({
        x: keyframe.x ?? 0,
        y: keyframe.y ?? 0,
      })),
      ...baseTiming,
    });
  }

  if (hasTimelineValue(frames, ["scale"])) {
    animations.push({
      kind: "transform",
      transformType: "scale",
      values: frames.map((keyframe) => keyframe.scale ?? 1),
      ...baseTiming,
    });
  }

  if (hasTimelineValue(frames, ["rotate"])) {
    animations.push({
      kind: "transform",
      transformType: "rotate",
      values: frames.map((keyframe) => {
        if (typeof keyframe.rotate === "number") {
          return {
            angle: keyframe.rotate,
            cx: rotateCenter.cx,
            cy: rotateCenter.cy,
          };
        }

        return {
          angle: keyframe.rotate?.angle ?? 0,
          cx: keyframe.rotate?.cx ?? rotateCenter.cx,
          cy: keyframe.rotate?.cy ?? rotateCenter.cy,
        };
      }),
      ...baseTiming,
    });
  }

  if (hasTimelineValue(frames, ["opacity"])) {
    animations.push({
      kind: "attribute",
      attributeName: "opacity",
      values: frames.map((keyframe) => keyframe.opacity ?? 1),
      ...baseTiming,
      additive: undefined,
    });
  }

  return animations;
}
