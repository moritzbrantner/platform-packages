import type { FlatBuiltInFigureAnimationPreset, FlatFigureAnimationOptions } from "./figures";

export type FlatLength = number | string;

export type FlatColorPalette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  accent: string;
  accentAlt: string;
  detail: string;
  shadow: string;
  highlight: string;
};

export type FlatGradientStop = {
  offset: FlatLength;
  color: string;
  opacity?: number;
};

export type FlatGradient = {
  id: string;
  kind: "linear" | "radial";
  stops: FlatGradientStop[];
  x1?: FlatLength;
  y1?: FlatLength;
  x2?: FlatLength;
  y2?: FlatLength;
  cx?: FlatLength;
  cy?: FlatLength;
  r?: FlatLength;
  fx?: FlatLength;
  fy?: FlatLength;
};

/** Low-level SVG animation timing kept as a compatibility/export target. */
export type FlatAnimationTiming = {
  begin?: string;
  dur?: string;
  repeatCount?: string;
  keyTimes?: number[];
  keySplines?: string[];
  calcMode?: "discrete" | "linear" | "paced" | "spline";
  additive?: "replace" | "sum";
  fillMode?: "freeze" | "remove";
};

export type FlatAttributeAnimation = FlatAnimationTiming & {
  kind: "attribute";
  attributeName: string;
  values: Array<number | string>;
};

export type FlatTransformAnimation =
  | (FlatAnimationTiming & {
      kind: "transform";
      transformType: "translate";
      values: Array<{ x: number; y: number }>;
    })
  | (FlatAnimationTiming & {
      kind: "transform";
      transformType: "scale";
      values: Array<number | { x: number; y: number }>;
    })
  | (FlatAnimationTiming & {
      kind: "transform";
      transformType: "rotate";
      values: Array<number | { angle: number; cx: number; cy: number }>;
    });

export type FlatAnimation = FlatAttributeAnimation | FlatTransformAnimation;

export type FlatEditableKeyframe = {
  timeMs: number;
  x?: number;
  y?: number;
  scale?: number | { x: number; y: number };
  rotate?: number | { angle: number; cx?: number; cy?: number };
  opacity?: number;
};

export type FlatMotionDirection = "normal" | "reverse" | "alternate";
export type FlatMotionFillMode = "freeze" | "remove";
export type FlatMotionEasingPreset = "linear" | "ease-in" | "ease-out" | "ease-in-out";

export type FlatMotionCubicBezierEasing = {
  type: "cubic-bezier";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type FlatMotionEasing = FlatMotionEasingPreset | FlatMotionCubicBezierEasing;

export type FlatPresetMotionSpec = {
  kind: "preset";
  preset: FlatBuiltInFigureAnimationPreset;
  options?: FlatFigureAnimationOptions;
};

/**
 * Canonical authored motion contract. Renderer-specific SVG animation arrays are
 * compiler output / compatibility data rather than the preferred authoring API.
 */
export type FlatTimelineMotionSpec = {
  kind: "timeline";
  durationMs: number;
  delayMs?: number;
  repeatCount?: "indefinite" | number;
  direction?: FlatMotionDirection;
  fillMode?: FlatMotionFillMode;
  easing?: FlatMotionEasing;
  keyframes: FlatEditableKeyframe[];
  rotateCenter?: { cx: number; cy: number };
};

export type FlatMotionSpec = FlatPresetMotionSpec | FlatTimelineMotionSpec;

export type FlatNodePath = readonly number[];

export type FlatNodeRef = {
  layerIndex: number;
  path: FlatNodePath;
};

export type FlatNodeSummary = {
  ref: FlatNodeRef;
  id?: string;
  kind: FlatShape["kind"];
  depth: number;
  hasMotion: boolean;
  hasAnimations: boolean;
  label: string;
};

type FlatRenderableBase = {
  id?: string;
  className?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeLinecap?: "butt" | "round" | "square";
  strokeLinejoin?: "bevel" | "miter" | "round";
  opacity?: number;
  transform?: string;
  /** Preferred authored animation model. */
  motion?: FlatMotionSpec;
  /** Low-level SVG animation escape hatch kept for compatibility. */
  animations?: FlatAnimation[];
};

export type FlatGroup = FlatRenderableBase & {
  kind: "group";
  children: FlatShape[];
};

export type FlatRect = FlatRenderableBase & {
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
  ry?: number;
};

export type FlatCircle = FlatRenderableBase & {
  kind: "circle";
  cx: number;
  cy: number;
  r: number;
};

export type FlatEllipse = FlatRenderableBase & {
  kind: "ellipse";
  cx: number;
  cy: number;
  rx: number;
  ry: number;
};

export type FlatPath = FlatRenderableBase & {
  kind: "path";
  d: string;
};

export type FlatPolygon = FlatRenderableBase & {
  kind: "polygon";
  points: string | Array<{ x: number; y: number }>;
};

export type FlatLine = FlatRenderableBase & {
  kind: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type FlatShape =
  | FlatCircle
  | FlatEllipse
  | FlatGroup
  | FlatLine
  | FlatPath
  | FlatPolygon
  | FlatRect;

export type FlatLayer = {
  id?: string;
  className?: string;
  opacity?: number;
  transform?: string;
  shapes: FlatShape[];
};

export type FlatDesignScene = {
  width: number;
  height: number;
  viewBox?: string;
  title?: string;
  description?: string;
  background?: string;
  gradients?: FlatGradient[];
  layers: FlatLayer[];
};
