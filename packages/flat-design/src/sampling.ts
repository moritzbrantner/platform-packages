import { compileFlatMotion } from "./motion";
import type {
  FlatAnimation,
  FlatAttributeAnimation,
  FlatDesignScene,
  FlatShape,
  FlatTransformAnimation,
} from "./scene-types";

export type FlatAnimatedTransformValue =
  | number
  | { angle: number; cx?: number; cy?: number }
  | { x: number; y: number };

export type FlatAnimationSample =
  | {
      kind: "attribute";
      attributeName: string;
      value: number | string;
    }
  | {
      additive?: "replace" | "sum";
      kind: "transform";
      transformType: FlatTransformAnimation["transformType"];
      value: FlatAnimatedTransformValue;
    };

/**
 * Deterministically evaluate a scene at a point in time. The returned scene is
 * static: authored motion and low-level SVG animation arrays are removed after
 * their sampled values have been applied.
 */
export function sampleFlatSceneAtTime(scene: FlatDesignScene, timeInMs: number): FlatDesignScene {
  const resolvedTimeInMs = Number.isFinite(timeInMs) ? Math.max(timeInMs, 0) : 0;

  return {
    ...scene,
    layers: scene.layers.map((layer) => ({
      ...layer,
      shapes: layer.shapes.map((shape) => sampleFlatShapeAtTime(shape, resolvedTimeInMs)),
    })),
  };
}

export function sampleFlatShapeAtTime(shape: FlatShape, timeInMs: number): FlatShape {
  const animations = getFlatShapeAnimations(shape);
  let animatedOpacity: number | undefined;
  let animatedTransforms: string[] = [];

  for (const animation of animations) {
    const sample = sampleFlatAnimationAtTime(animation, timeInMs);

    if (!sample) {
      continue;
    }

    if (sample.kind === "attribute") {
      if (sample.attributeName === "opacity" && typeof sample.value === "number") {
        animatedOpacity = sample.value;
      }

      continue;
    }

    const transform = formatTransformSample(sample.transformType, sample.value);

    if (!transform) {
      continue;
    }

    if (sample.additive === "sum") {
      animatedTransforms.push(transform);
    } else {
      animatedTransforms = [transform];
    }
  }

  const nextTransform = joinTransforms(shape.transform, ...animatedTransforms);
  const nextOpacity = animatedOpacity ?? shape.opacity;

  if (shape.kind === "group") {
    return {
      ...shape,
      animations: undefined,
      motion: undefined,
      children: shape.children.map((child) => sampleFlatShapeAtTime(child, timeInMs)),
      opacity: nextOpacity,
      transform: nextTransform,
    };
  }

  return {
    ...shape,
    animations: undefined,
    motion: undefined,
    opacity: nextOpacity,
    transform: nextTransform,
  };
}

export function getFlatShapeAnimations(shape: FlatShape): FlatAnimation[] {
  const motionAnimations = shape.motion ? compileFlatMotion(shape.motion) : [];

  return [...motionAnimations, ...(shape.animations ?? [])];
}

export function sampleFlatAnimationAtTime(
  animation: FlatAnimation,
  timeInMs: number,
): FlatAnimationSample | undefined {
  const resolvedTimeInMs = Number.isFinite(timeInMs) ? Math.max(timeInMs, 0) : 0;

  if (animation.kind === "attribute") {
    const value = sampleFlatAttributeAnimation(animation, resolvedTimeInMs);

    if (value === undefined) {
      return undefined;
    }

    return {
      kind: "attribute",
      attributeName: animation.attributeName,
      value,
    };
  }

  const value = sampleFlatTransformAnimation(animation, resolvedTimeInMs);

  if (value === undefined) {
    return undefined;
  }

  return {
    additive: animation.additive,
    kind: "transform",
    transformType: animation.transformType,
    value,
  };
}

function sampleFlatAttributeAnimation(
  animation: FlatAttributeAnimation,
  timeInMs: number,
): number | string | undefined {
  return sampleAnimationValues(animation.values, animation, timeInMs, (left, right, progress) => {
    if (typeof left === "number" && typeof right === "number") {
      return lerp(left, right, progress);
    }

    return progress < 1 ? left : right;
  });
}

function sampleFlatTransformAnimation(
  animation: FlatTransformAnimation,
  timeInMs: number,
): FlatAnimatedTransformValue | undefined {
  switch (animation.transformType) {
    case "translate":
      return sampleAnimationValues(
        animation.values,
        animation,
        timeInMs,
        (left, right, progress) => ({
          x: lerp(left.x, right.x, progress),
          y: lerp(left.y, right.y, progress),
        }),
      );
    case "scale":
      return sampleAnimationValues(
        animation.values,
        animation,
        timeInMs,
        (left, right, progress) => {
          if (typeof left === "number" && typeof right === "number") {
            return lerp(left, right, progress);
          }

          const leftScale = toScaleValue(left);
          const rightScale = toScaleValue(right);

          return {
            x: lerp(leftScale.x, rightScale.x, progress),
            y: lerp(leftScale.y, rightScale.y, progress),
          };
        },
      );
    case "rotate":
      return sampleAnimationValues(
        animation.values,
        animation,
        timeInMs,
        (left, right, progress) => {
          const leftRotate = toRotateValue(left);
          const rightRotate = toRotateValue(right);

          return {
            angle: lerp(leftRotate.angle, rightRotate.angle, progress),
            cx: lerp(leftRotate.cx, rightRotate.cx, progress),
            cy: lerp(leftRotate.cy, rightRotate.cy, progress),
          };
        },
      );
  }
}

function sampleAnimationValues<TValue>(
  values: TValue[],
  animation: FlatAnimation,
  timeInMs: number,
  interpolateValue: (left: TValue, right: TValue, progress: number) => TValue,
): TValue | undefined {
  if (values.length === 0) {
    return undefined;
  }

  if (values.length === 1) {
    return values[0];
  }

  const progress = getFlatAnimationProgress(animation, timeInMs);

  if (progress === undefined) {
    return undefined;
  }

  const keyTimes = getAnimationKeyTimes(animation, values.length);

  if (progress <= keyTimes[0]!) {
    return values[0];
  }

  for (let index = 0; index < values.length - 1; index += 1) {
    const segmentStart = keyTimes[index]!;
    const segmentEnd = keyTimes[index + 1]!;

    if (progress > segmentEnd) {
      continue;
    }

    if (animation.calcMode === "discrete") {
      return values[index];
    }

    const segmentDuration = segmentEnd - segmentStart;
    const rawSegmentProgress =
      segmentDuration <= 0 ? 1 : clamp((progress - segmentStart) / segmentDuration, 0, 1);
    const easedSegmentProgress =
      animation.calcMode === "spline"
        ? applyCubicBezier(rawSegmentProgress, animation.keySplines?.[index])
        : rawSegmentProgress;

    return interpolateValue(values[index]!, values[index + 1]!, easedSegmentProgress);
  }

  return values[values.length - 1];
}

export function getFlatAnimationProgress(
  animation: FlatAnimation,
  timeInMs: number,
): number | undefined {
  const beginInMs = parseClockValue(animation.begin, 0);

  if (timeInMs < beginInMs) {
    return undefined;
  }

  const durationInMs = Math.max(parseClockValue(animation.dur, 6_000), 0);

  if (durationInMs === 0) {
    return 1;
  }

  const repeatCount = parseRepeatCount(animation.repeatCount);
  const elapsed = timeInMs - beginInMs;

  if (repeatCount !== "indefinite") {
    const totalDurationInMs = durationInMs * repeatCount;

    if (elapsed > totalDurationInMs) {
      return animation.fillMode === "freeze" ? 1 : undefined;
    }

    if (elapsed === totalDurationInMs) {
      return 1;
    }
  }

  const iterationElapsed = modulo(elapsed, durationInMs);

  return clamp(iterationElapsed / durationInMs, 0, 1);
}

function getAnimationKeyTimes(animation: FlatAnimation, valueCount: number) {
  if (animation.keyTimes?.length === valueCount) {
    return animation.keyTimes.map((value) => clamp(value, 0, 1));
  }

  const lastIndex = valueCount - 1;

  return Array.from({ length: valueCount }, (_, index) =>
    lastIndex === 0 ? 0 : index / lastIndex,
  );
}

function parseClockValue(value: string | undefined, fallbackInMs: number) {
  if (!value) {
    return fallbackInMs;
  }

  const trimmedValue = value.trim();

  if (trimmedValue.endsWith("ms")) {
    const parsedValue = Number.parseFloat(trimmedValue.slice(0, -2));

    return Number.isFinite(parsedValue) ? parsedValue : fallbackInMs;
  }

  if (trimmedValue.endsWith("s")) {
    const parsedValue = Number.parseFloat(trimmedValue.slice(0, -1));

    return Number.isFinite(parsedValue) ? parsedValue * 1_000 : fallbackInMs;
  }

  const parsedValue = Number.parseFloat(trimmedValue);

  return Number.isFinite(parsedValue) ? parsedValue * 1_000 : fallbackInMs;
}

function parseRepeatCount(value: string | undefined) {
  if (!value || value === "indefinite") {
    return "indefinite" as const;
  }

  const parsedValue = Number.parseFloat(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

function toScaleValue(value: number | { x: number; y: number }) {
  return typeof value === "number" ? { x: value, y: value } : value;
}

function toRotateValue(value: number | { angle: number; cx?: number; cy?: number }) {
  if (typeof value === "number") {
    return {
      angle: value,
      cx: 0,
      cy: 0,
    };
  }

  return {
    angle: value.angle,
    cx: value.cx ?? 0,
    cy: value.cy ?? 0,
  };
}

function formatTransformSample(
  transformType: FlatTransformAnimation["transformType"],
  value: FlatAnimatedTransformValue,
) {
  switch (transformType) {
    case "translate": {
      if (typeof value === "number" || "angle" in value) {
        return undefined;
      }

      return `translate(${formatNumber(value.x)} ${formatNumber(value.y)})`;
    }
    case "scale": {
      if (typeof value === "number") {
        return `scale(${formatNumber(value)})`;
      }

      if ("angle" in value) {
        return undefined;
      }

      return `scale(${formatNumber(value.x)} ${formatNumber(value.y)})`;
    }
    case "rotate": {
      const rotation = toRotateValue(value as number | { angle: number; cx?: number; cy?: number });

      return `rotate(${formatNumber(rotation.angle)} ${formatNumber(rotation.cx)} ${formatNumber(rotation.cy)})`;
    }
  }
}

function joinTransforms(...transforms: Array<string | undefined>) {
  return transforms.filter(Boolean).join(" ") || undefined;
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const roundedValue = Number(value.toFixed(4));

  return Object.is(roundedValue, -0) ? "0" : String(roundedValue);
}

function applyCubicBezier(progress: number, spline?: string) {
  if (!spline) {
    return progress;
  }

  const values = spline
    .trim()
    .split(/\s+/)
    .map((segment) => Number.parseFloat(segment));

  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
    return progress;
  }

  return solveCubicBezier(progress, values[0]!, values[1]!, values[2]!, values[3]!);
}

function solveCubicBezier(x: number, x1: number, y1: number, x2: number, y2: number) {
  if (x <= 0) {
    return 0;
  }

  if (x >= 1) {
    return 1;
  }

  let t = x;

  for (let index = 0; index < 8; index += 1) {
    const currentX = sampleBezier(t, x1, x2) - x;

    if (Math.abs(currentX) < 1e-6) {
      return sampleBezier(t, y1, y2);
    }

    const derivative = sampleBezierDerivative(t, x1, x2);

    if (Math.abs(derivative) < 1e-6) {
      break;
    }

    t -= currentX / derivative;
  }

  let lowerBound = 0;
  let upperBound = 1;
  t = x;

  for (let index = 0; index < 12; index += 1) {
    const currentX = sampleBezier(t, x1, x2);

    if (Math.abs(currentX - x) < 1e-6) {
      break;
    }

    if (currentX < x) {
      lowerBound = t;
    } else {
      upperBound = t;
    }

    t = (lowerBound + upperBound) / 2;
  }

  return sampleBezier(t, y1, y2);
}

function sampleBezier(t: number, p1: number, p2: number) {
  const inverseT = 1 - t;

  return 3 * inverseT * inverseT * t * p1 + 3 * inverseT * t * t * p2 + t * t * t;
}

function sampleBezierDerivative(t: number, p1: number, p2: number) {
  const inverseT = 1 - t;

  return 3 * inverseT * inverseT * p1 + 6 * inverseT * t * (p2 - p1) + 3 * t * t * (1 - p2);
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function modulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}
