import type {
  FlatAnimationTiming,
  FlatAttributeAnimation,
  FlatTransformAnimation,
} from "./scene-types";

type Axis = "x" | "y";

type BobbingOptions = FlatAnimationTiming & {
  axis?: Axis;
  distance?: number;
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
    }),
  };
}
