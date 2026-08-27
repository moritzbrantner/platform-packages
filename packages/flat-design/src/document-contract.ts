import {
  FLAT_DESIGN_SCHEMA_VERSION,
  FlatDesignDocumentError,
  analyzeFlatDesignDocument as analyzeLegacyFlatDesignDocument,
  defineFlatDesignDocument as defineLegacyFlatDesignDocument,
  migrateFlatDesignDocument,
  parseFlatDesignDocument as parseLegacyFlatDesignDocument,
  type FlatDesignDocument,
  type FlatDesignDocumentAnalysis,
  type FlatDesignDocumentIssue,
  type FlatDesignDocumentIssueCode,
  type FlatDesignDocumentIssueSeverity,
  type ParseFlatDesignDocumentOptions,
} from "./document";
import type { FlatDesignScene } from "./scene-types";

const builtInPresets = new Set([
  "bobbing",
  "drift",
  "float",
  "pulse",
  "pop",
  "sway",
  "spin",
  "blink",
]);

const rootKeys = new Set([
  "schemaVersion",
  "width",
  "height",
  "viewBox",
  "title",
  "description",
  "background",
  "gradients",
  "layers",
]);
const gradientKeys = new Set(["id", "kind", "stops", "x1", "y1", "x2", "y2", "cx", "cy", "r", "fx", "fy"]);
const gradientStopKeys = new Set(["offset", "color", "opacity"]);
const layerKeys = new Set(["id", "className", "opacity", "transform", "shapes"]);
const renderableKeys = [
  "id",
  "className",
  "fill",
  "stroke",
  "strokeWidth",
  "strokeLinecap",
  "strokeLinejoin",
  "opacity",
  "transform",
  "motion",
  "animations",
] as const;
const shapeKeys: Record<string, ReadonlySet<string>> = {
  group: new Set([...renderableKeys, "kind", "children"]),
  rect: new Set([...renderableKeys, "kind", "x", "y", "width", "height", "rx", "ry"]),
  circle: new Set([...renderableKeys, "kind", "cx", "cy", "r"]),
  ellipse: new Set([...renderableKeys, "kind", "cx", "cy", "rx", "ry"]),
  path: new Set([...renderableKeys, "kind", "d"]),
  polygon: new Set([...renderableKeys, "kind", "points"]),
  line: new Set([...renderableKeys, "kind", "x1", "y1", "x2", "y2"]),
};
const presetMotionKeys = new Set(["kind", "preset", "options"]);
const timelineMotionKeys = new Set([
  "kind",
  "durationMs",
  "repeatCount",
  "direction",
  "keyframes",
  "rotateCenter",
]);
const keyframeKeys = new Set(["timeMs", "x", "y", "scale", "rotate", "opacity"]);
const rotateKeys = new Set(["angle", "cx", "cy"]);
const scaleKeys = new Set(["x", "y"]);
const rotateCenterKeys = new Set(["cx", "cy"]);
const animationTimingKeys = [
  "begin",
  "dur",
  "repeatCount",
  "keyTimes",
  "keySplines",
  "calcMode",
  "additive",
  "fillMode",
] as const;
const attributeAnimationKeys = new Set([
  "kind",
  "attributeName",
  "values",
  ...animationTimingKeys,
]);
const transformAnimationKeys = new Set([
  "kind",
  "transformType",
  "values",
  ...animationTimingKeys,
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function pushIssue(
  issues: FlatDesignDocumentIssue[],
  code: FlatDesignDocumentIssueCode,
  path: string,
  message: string,
  severity: FlatDesignDocumentIssueSeverity = "error",
) {
  if (issues.some((issue) => issue.code === code && issue.path === path && issue.message === message)) {
    return;
  }

  issues.push({ code, message, path, severity });
}

function rejectUnknownKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  issues: FlatDesignDocumentIssue[],
  path: string,
) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      pushIssue(
        issues,
        "invalid-document",
        `${path}.${key}`,
        `Unknown flat-design document property "${key}".`,
      );
    }
  }
}

function validateTransformValue(
  transformType: unknown,
  value: unknown,
  issues: FlatDesignDocumentIssue[],
  path: string,
) {
  if (transformType === "translate") {
    if (!isRecord(value) || !isFiniteNumber(value.x) || !isFiniteNumber(value.y)) {
      pushIssue(
        issues,
        "invalid-animation",
        path,
        "Translate animation values must contain finite x and y numbers.",
      );
    }
    return;
  }

  if (transformType === "scale") {
    if (isFiniteNumber(value)) {
      return;
    }
    if (!isRecord(value) || !isFiniteNumber(value.x) || !isFiniteNumber(value.y)) {
      pushIssue(
        issues,
        "invalid-animation",
        path,
        "Scale animation values must be finite numbers or finite {x, y} pairs.",
      );
    }
    return;
  }

  if (transformType === "rotate") {
    if (isFiniteNumber(value)) {
      return;
    }
    if (
      !isRecord(value) ||
      !isFiniteNumber(value.angle) ||
      (value.cx !== undefined && !isFiniteNumber(value.cx)) ||
      (value.cy !== undefined && !isFiniteNumber(value.cy))
    ) {
      pushIssue(
        issues,
        "invalid-animation",
        path,
        "Rotate animation values must be finite angles or angle objects with finite centers.",
      );
    }
  }
}

function inspectAnimation(
  animation: unknown,
  issues: FlatDesignDocumentIssue[],
  path: string,
) {
  if (!isRecord(animation)) {
    return;
  }

  rejectUnknownKeys(
    animation,
    animation.kind === "attribute" ? attributeAnimationKeys : transformAnimationKeys,
    issues,
    path,
  );

  if (!Array.isArray(animation.values)) {
    return;
  }

  if (Array.isArray(animation.keyTimes) && animation.keyTimes.length !== animation.values.length) {
    pushIssue(
      issues,
      "invalid-animation",
      `${path}.keyTimes`,
      "Animation keyTimes must contain one entry for each animation value.",
    );
  }

  if (animation.kind === "attribute") {
    animation.values.forEach((value, index) => {
      if (typeof value !== "string" && !isFiniteNumber(value)) {
        pushIssue(
          issues,
          "invalid-animation",
          `${path}.values[${index}]`,
          "Attribute animation values must be strings or finite numbers.",
        );
      }
    });
    return;
  }

  if (animation.kind === "transform") {
    animation.values.forEach((value, index) =>
      validateTransformValue(animation.transformType, value, issues, `${path}.values[${index}]`),
    );
  }
}

function inspectKeyframe(
  keyframe: unknown,
  issues: FlatDesignDocumentIssue[],
  path: string,
) {
  if (!isRecord(keyframe)) {
    return;
  }

  rejectUnknownKeys(keyframe, keyframeKeys, issues, path);

  if (isRecord(keyframe.scale)) {
    rejectUnknownKeys(keyframe.scale, scaleKeys, issues, `${path}.scale`);
  }
  if (isRecord(keyframe.rotate)) {
    rejectUnknownKeys(keyframe.rotate, rotateKeys, issues, `${path}.rotate`);
  }
}

function inspectMotion(motion: unknown, issues: FlatDesignDocumentIssue[], path: string) {
  if (!isRecord(motion)) {
    return;
  }

  if (motion.kind === "preset") {
    rejectUnknownKeys(motion, presetMotionKeys, issues, path);
    if (typeof motion.preset === "string" && !builtInPresets.has(motion.preset)) {
      pushIssue(
        issues,
        "invalid-motion",
        `${path}.preset`,
        `Unknown flat-design motion preset "${motion.preset}".`,
      );
    }
    return;
  }

  if (motion.kind !== "timeline") {
    return;
  }

  rejectUnknownKeys(motion, timelineMotionKeys, issues, path);
  if (Array.isArray(motion.keyframes)) {
    motion.keyframes.forEach((keyframe, index) =>
      inspectKeyframe(keyframe, issues, `${path}.keyframes[${index}]`),
    );
  }
  if (isRecord(motion.rotateCenter)) {
    rejectUnknownKeys(motion.rotateCenter, rotateCenterKeys, issues, `${path}.rotateCenter`);
  }
}

type RenderedIdOwner = "gradient" | "layer" | "shape";

function registerRenderedId(
  ids: Map<string, RenderedIdOwner>,
  id: unknown,
  owner: RenderedIdOwner,
  issues: FlatDesignDocumentIssue[],
  path: string,
) {
  if (typeof id !== "string" || !id.trim()) {
    return;
  }

  const previousOwner = ids.get(id);
  if (previousOwner && (previousOwner !== owner || owner === "layer")) {
    pushIssue(
      issues,
      owner === "gradient" ? "duplicate-gradient-id" : "duplicate-node-id",
      path,
      `Rendered id "${id}" is already used by a ${previousOwner}; SVG ids are document-wide.`,
    );
    return;
  }

  ids.set(id, owner);
}

function inspectShape(
  shape: unknown,
  issues: FlatDesignDocumentIssue[],
  ids: Map<string, RenderedIdOwner>,
  path: string,
) {
  if (!isRecord(shape)) {
    return;
  }

  const allowed = typeof shape.kind === "string" ? shapeKeys[shape.kind] : undefined;
  if (allowed) {
    rejectUnknownKeys(shape, allowed, issues, path);
  }

  registerRenderedId(ids, shape.id, "shape", issues, `${path}.id`);
  inspectMotion(shape.motion, issues, `${path}.motion`);

  if (Array.isArray(shape.animations)) {
    shape.animations.forEach((animation, index) =>
      inspectAnimation(animation, issues, `${path}.animations[${index}]`),
    );
  }

  if (shape.kind === "group" && Array.isArray(shape.children)) {
    shape.children.forEach((child, index) =>
      inspectShape(child, issues, ids, `${path}.children[${index}]`),
    );
  }
}

function inspectStrictContract(input: unknown, issues: FlatDesignDocumentIssue[]) {
  if (!isRecord(input)) {
    return;
  }

  rejectUnknownKeys(input, rootKeys, issues, "$");
  const ids = new Map<string, RenderedIdOwner>();

  if (Array.isArray(input.gradients)) {
    input.gradients.forEach((gradient, gradientIndex) => {
      if (!isRecord(gradient)) {
        return;
      }
      const gradientPath = `$.gradients[${gradientIndex}]`;
      rejectUnknownKeys(gradient, gradientKeys, issues, gradientPath);
      registerRenderedId(ids, gradient.id, "gradient", issues, `${gradientPath}.id`);
      if (Array.isArray(gradient.stops)) {
        gradient.stops.forEach((stop, stopIndex) => {
          if (isRecord(stop)) {
            rejectUnknownKeys(stop, gradientStopKeys, issues, `${gradientPath}.stops[${stopIndex}]`);
          }
        });
      }
    });
  }

  if (Array.isArray(input.layers)) {
    input.layers.forEach((layer, layerIndex) => {
      if (!isRecord(layer)) {
        return;
      }
      const layerPath = `$.layers[${layerIndex}]`;
      rejectUnknownKeys(layer, layerKeys, issues, layerPath);
      registerRenderedId(ids, layer.id, "layer", issues, `${layerPath}.id`);
      if (Array.isArray(layer.shapes)) {
        layer.shapes.forEach((shape, shapeIndex) =>
          inspectShape(shape, issues, ids, `${layerPath}.shapes[${shapeIndex}]`),
        );
      }
    });
  }
}

export function analyzeFlatDesignDocument(input: unknown): FlatDesignDocumentAnalysis {
  const base = analyzeLegacyFlatDesignDocument(input);
  const issues = [...base.issues];
  inspectStrictContract(input, issues);

  return {
    issues,
    valid: !issues.some((issue) => issue.severity === "error"),
  };
}

export function validateFlatDesignDocument(input: unknown): FlatDesignDocumentIssue[] {
  return analyzeFlatDesignDocument(input).issues.filter((issue) => issue.severity === "error");
}

export function isFlatDesignDocument(input: unknown): input is FlatDesignDocument {
  return validateFlatDesignDocument(input).length === 0;
}

export function assertFlatDesignDocument(input: unknown): asserts input is FlatDesignDocument {
  const issues = validateFlatDesignDocument(input);
  if (issues.length > 0) {
    throw new FlatDesignDocumentError(issues);
  }
}

export function defineFlatDesignDocument(
  scene: FlatDesignScene | FlatDesignDocument,
): FlatDesignDocument {
  const document = defineLegacyFlatDesignDocument(scene);
  assertFlatDesignDocument(document);
  return document;
}

export function parseFlatDesignDocument(
  serialized: string,
  options: ParseFlatDesignDocumentOptions = {},
): FlatDesignDocument {
  const document = parseLegacyFlatDesignDocument(serialized, options);
  assertFlatDesignDocument(document);
  return document;
}

export function serializeFlatDesignDocument(
  scene: FlatDesignScene | FlatDesignDocument,
  space?: number,
): string {
  return JSON.stringify(defineFlatDesignDocument(scene), null, space);
}

export {
  FLAT_DESIGN_SCHEMA_VERSION,
  FlatDesignDocumentError,
  migrateFlatDesignDocument,
};
export type {
  FlatDesignDocument,
  FlatDesignDocumentAnalysis,
  FlatDesignDocumentIssue,
  FlatDesignDocumentIssueCode,
  FlatDesignDocumentIssueSeverity,
  ParseFlatDesignDocumentOptions,
};
