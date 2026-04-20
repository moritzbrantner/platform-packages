import {
  createBobbingAnimation,
  createDriftAnimation,
  createFloatAnimation,
  createOpacityPulseAnimation,
  createPopAnimation,
  createPulseAnimation,
  createSpinAnimation,
  createSwayAnimation,
  createTimelineAnimations,
  type FlatMotionKeyframe,
  type FlatTimelineAnimationOptions,
} from "./animation-presets";
import { defaultFlatDesignPalette } from "./palette";
import type {
  FlatAnimation,
  FlatAnimationTiming,
  FlatGroup,
} from "./scene-types";

type Axis = "x" | "y";

export type FlatBuiltInFigureAnimationPreset =
  | "bobbing"
  | "drift"
  | "float"
  | "pulse"
  | "pop"
  | "sway"
  | "spin"
  | "blink";

export type FlatFigureAnimationPreset =
  | FlatBuiltInFigureAnimationPreset
  | "timeline";

export type FlatFigureAnimationOptions = FlatAnimationTiming & {
  axis?: Axis;
  angle?: number;
  cx?: number;
  cy?: number;
  drift?: number;
  distance?: number;
  from?: number;
  to?: number;
  minOpacity?: number;
  maxOpacity?: number;
  keyframes?: FlatMotionKeyframe[];
  rotateCenter?: FlatTimelineAnimationOptions["rotateCenter"];
};

export type FlatFigureMotion =
  | false
  | FlatBuiltInFigureAnimationPreset
  | {
      preset: FlatBuiltInFigureAnimationPreset;
      options?: FlatFigureAnimationOptions;
    }
  | {
      preset: "timeline";
      options: FlatTimelineAnimationOptions;
    };

type FlatFigureBaseOptions = {
  id?: string;
  className?: string;
  opacity?: number;
  x?: number;
  y?: number;
  scale?: number;
  motion?: FlatFigureMotion;
};

export type FlatCloudFigureOptions = FlatFigureBaseOptions & {
  color?: string;
};

export type FlatSparkleFigureOptions = FlatFigureBaseOptions & {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

export type FlatBadgeFigureOptions = FlatFigureBaseOptions & {
  color?: string;
  highlight?: string;
  checkColor?: string;
};

export type FlatCardFigureOptions = FlatFigureBaseOptions & {
  surface?: string;
  accent?: string;
  detail?: string;
  width?: number;
  height?: number;
};

export type FlatSunFigureOptions = FlatFigureBaseOptions & {
  color?: string;
  haloColor?: string;
  rayColor?: string;
  radius?: number;
};

export function createFlatFigureAnimations(
  motion?: FlatFigureMotion,
): FlatAnimation[] | undefined {
  if (!motion) {
    return undefined;
  }

  if (typeof motion !== "string" && motion.preset === "timeline") {
    return createTimelineAnimations(motion.options);
  }

  const preset = typeof motion === "string" ? motion : motion.preset;
  const options: FlatFigureAnimationOptions =
    typeof motion === "string" ? {} : motion.options ?? {};

  switch (preset) {
    case "bobbing":
      return [
        createBobbingAnimation({
          axis: options.axis,
          distance: options.distance,
          begin: options.begin,
          dur: options.dur,
          repeatCount: options.repeatCount,
          keyTimes: options.keyTimes,
          keySplines: options.keySplines,
          calcMode: options.calcMode,
          additive: options.additive,
          fillMode: options.fillMode,
        }),
      ];
    case "drift":
      return [
        createDriftAnimation({
          axis: options.axis,
          distance: options.distance,
          begin: options.begin,
          dur: options.dur,
          repeatCount: options.repeatCount,
          keyTimes: options.keyTimes,
          keySplines: options.keySplines,
          calcMode: options.calcMode,
          additive: options.additive,
          fillMode: options.fillMode,
        }),
      ];
    case "float":
      return [
        createFloatAnimation({
          distance: options.distance,
          drift: options.drift,
          begin: options.begin,
          dur: options.dur,
          repeatCount: options.repeatCount,
          keyTimes: options.keyTimes,
          keySplines: options.keySplines,
          calcMode: options.calcMode,
          additive: options.additive,
          fillMode: options.fillMode,
        }),
      ];
    case "pulse":
      return [
        createPulseAnimation({
          from: options.from,
          to: options.to,
          begin: options.begin,
          dur: options.dur,
          repeatCount: options.repeatCount,
          keyTimes: options.keyTimes,
          keySplines: options.keySplines,
          calcMode: options.calcMode,
          additive: options.additive,
          fillMode: options.fillMode,
        }),
        createOpacityPulseAnimation({
          minOpacity: options.minOpacity,
          maxOpacity: options.maxOpacity,
          begin: options.begin,
          dur: options.dur,
          repeatCount: options.repeatCount,
          keyTimes: options.keyTimes,
          keySplines: options.keySplines,
          calcMode: options.calcMode,
          fillMode: options.fillMode,
        }),
      ];
    case "pop":
      return [
        createPopAnimation({
          from: options.from,
          to: options.to,
          begin: options.begin,
          dur: options.dur,
          repeatCount: options.repeatCount,
          keyTimes: options.keyTimes,
          keySplines: options.keySplines,
          calcMode: options.calcMode,
          additive: options.additive,
          fillMode: options.fillMode,
        }),
      ];
    case "sway":
      return [
        createSwayAnimation({
          angle: options.angle,
          cx: options.cx,
          cy: options.cy,
          begin: options.begin,
          dur: options.dur,
          repeatCount: options.repeatCount,
          keyTimes: options.keyTimes,
          keySplines: options.keySplines,
          calcMode: options.calcMode,
          additive: options.additive,
          fillMode: options.fillMode,
        }),
      ];
    case "spin":
      return [
        createSpinAnimation({
          angle: options.angle,
          cx: options.cx,
          cy: options.cy,
          begin: options.begin,
          dur: options.dur,
          repeatCount: options.repeatCount,
          keyTimes: options.keyTimes,
          keySplines: options.keySplines,
          calcMode: options.calcMode,
          additive: options.additive,
          fillMode: options.fillMode,
        }),
      ];
    case "blink":
      return [
        createOpacityPulseAnimation({
          minOpacity: options.minOpacity,
          maxOpacity: options.maxOpacity,
          begin: options.begin,
          dur: options.dur,
          repeatCount: options.repeatCount,
          keyTimes: options.keyTimes,
          keySplines: options.keySplines,
          calcMode: options.calcMode,
          fillMode: options.fillMode,
        }),
      ];
  }
}

function createFigureTransform(x = 0, y = 0, scale = 1): string | undefined {
  const transforms: string[] = [];

  if (x !== 0 || y !== 0) {
    transforms.push(`translate(${x} ${y})`);
  }

  if (scale !== 1) {
    transforms.push(`scale(${scale})`);
  }

  return transforms.length > 0 ? transforms.join(" ") : undefined;
}

function createGroupBase(options: FlatFigureBaseOptions) {
  return {
    id: options.id,
    className: options.className,
    opacity: options.opacity,
    transform: createFigureTransform(options.x, options.y, options.scale),
    animations: createFlatFigureAnimations(options.motion),
  };
}

export function createFlatCloudFigure(
  options: FlatCloudFigureOptions = {},
): FlatGroup {
  const { color = defaultFlatDesignPalette.highlight } = options;

  return {
    kind: "group",
    ...createGroupBase(options),
    children: [
      { kind: "ellipse", cx: -26, cy: 3, rx: 28, ry: 18, fill: color },
      { kind: "ellipse", cx: 2, cy: -8, rx: 34, ry: 24, fill: color },
      { kind: "ellipse", cx: 34, cy: 5, rx: 24, ry: 16, fill: color },
      { kind: "rect", x: -40, y: 0, width: 88, height: 24, rx: 12, fill: color },
    ],
  };
}

export function createFlatSparkleFigure(
  options: FlatSparkleFigureOptions = {},
): FlatGroup {
  const {
    color = defaultFlatDesignPalette.highlight,
    size = 12,
    strokeWidth = 4,
  } = options;

  return {
    kind: "group",
    ...createGroupBase(options),
    children: [
      {
        kind: "line",
        x1: 0,
        y1: -size,
        x2: 0,
        y2: size,
        stroke: color,
        strokeWidth,
        strokeLinecap: "round",
      },
      {
        kind: "line",
        x1: -size,
        y1: 0,
        x2: size,
        y2: 0,
        stroke: color,
        strokeWidth,
        strokeLinecap: "round",
      },
    ],
  };
}

export function createFlatBadgeFigure(
  options: FlatBadgeFigureOptions = {},
): FlatGroup {
  const {
    color = defaultFlatDesignPalette.accentAlt,
    highlight = defaultFlatDesignPalette.highlight,
    checkColor = color,
  } = options;

  return {
    kind: "group",
    ...createGroupBase(options),
    children: [
      { kind: "circle", cx: 0, cy: 0, r: 52, fill: color },
      { kind: "circle", cx: 0, cy: 0, r: 26, fill: highlight, opacity: 0.92 },
      {
        kind: "path",
        fill: checkColor,
        d: "M-9 -1l8 8L16 -12l7 7L-1 20-16 5z",
        transform: "scale(0.8)",
      },
      createFlatSparkleFigure({
        x: -48,
        y: -40,
        scale: 0.72,
        color: highlight,
      }),
      createFlatSparkleFigure({
        x: 46,
        y: 36,
        scale: 0.58,
        color: highlight,
      }),
    ],
  };
}

export function createFlatCardFigure(
  options: FlatCardFigureOptions = {},
): FlatGroup {
  const {
    surface = defaultFlatDesignPalette.highlight,
    accent = defaultFlatDesignPalette.accent,
    detail = defaultFlatDesignPalette.surfaceAlt,
    width = 118,
    height = 74,
  } = options;
  const left = -width / 2;
  const top = -height / 2;

  return {
    kind: "group",
    ...createGroupBase(options),
    children: [
      {
        kind: "rect",
        x: left,
        y: top,
        width,
        height,
        rx: 24,
        fill: surface,
        opacity: 0.96,
      },
      {
        kind: "rect",
        x: left + width * 0.15,
        y: top + height * 0.24,
        width: width * 0.69,
        height: 12,
        rx: 6,
        fill: detail,
      },
      {
        kind: "rect",
        x: left + width * 0.15,
        y: top + height * 0.54,
        width: width * 0.44,
        height: 16,
        rx: 8,
        fill: accent,
      },
    ],
  };
}

export function createFlatSunFigure(
  options: FlatSunFigureOptions = {},
): FlatGroup {
  const {
    color = defaultFlatDesignPalette.accent,
    haloColor = defaultFlatDesignPalette.accent,
    rayColor = color,
    radius = 42,
  } = options;
  const haloRadius = radius + 20;
  const rayInset = radius + 14;
  const rayTip = haloRadius + 16;
  const rayHalfWidth = Math.max(6, radius * 0.19);

  return {
    kind: "group",
    ...createGroupBase(options),
    children: [
      {
        kind: "circle",
        cx: 0,
        cy: 0,
        r: haloRadius,
        fill: haloColor,
        opacity: 0.18,
      },
      {
        kind: "circle",
        cx: 0,
        cy: 0,
        r: radius,
        fill: color,
      },
      {
        kind: "polygon",
        points: [
          { x: 0, y: -rayTip },
          { x: rayHalfWidth, y: -rayInset },
          { x: -rayHalfWidth, y: -rayInset },
        ],
        fill: rayColor,
        opacity: 0.8,
      },
      {
        kind: "polygon",
        points: [
          { x: rayTip, y: 0 },
          { x: rayInset, y: rayHalfWidth },
          { x: rayInset, y: -rayHalfWidth },
        ],
        fill: rayColor,
        opacity: 0.8,
      },
      {
        kind: "polygon",
        points: [
          { x: 0, y: rayTip },
          { x: rayHalfWidth, y: rayInset },
          { x: -rayHalfWidth, y: rayInset },
        ],
        fill: rayColor,
        opacity: 0.8,
      },
      {
        kind: "polygon",
        points: [
          { x: -rayTip, y: 0 },
          { x: -rayInset, y: rayHalfWidth },
          { x: -rayInset, y: -rayHalfWidth },
        ],
        fill: rayColor,
        opacity: 0.8,
      },
    ],
  };
}
