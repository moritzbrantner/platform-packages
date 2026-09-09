import {
  FlatDesignDocumentError,
  analyzeFlatDesignDocument as analyzeLegacyFlatDesignDocument,
  type FlatDesignDocumentAnalysis,
  type FlatDesignDocumentIssue,
  type FlatDesignDocumentIssueCode,
  type FlatDesignDocumentIssueSeverity,
  type ParseFlatDesignDocumentOptions,
} from "./document";
import type { FlatDesignScene } from "./scene-types";

/**
 * v2 adds the plain-text shape vocabulary. Existing v1 documents migrate
 * losslessly because every v1 shape remains valid in v2.
 */
export const FLAT_DESIGN_SCHEMA_VERSION = 2 as const;

export type FlatDesignDocument = FlatDesignScene & {
  schemaVersion: typeof FLAT_DESIGN_SCHEMA_VERSION;
};

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
const easingPresets = new Set(["linear", "ease-in", "ease-out", "ease-in-out"]);

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
const gradientKeys = new Set([
  "id",
  "kind",
  "stops",
  "x1",
  "y1",
  "x2",
  "y2",
  "cx",
  "cy",
  "r",
  "fx",
  "fy",
]);
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
  text: new Set([
    ...renderableKeys,
    "kind",
    "x",
    "y",
    "text",
    "fontSize",
    "fontFamily",
    "fontWeight",
    "textAnchor",
  ]),
};
const presetMotionKeys = new Set(["kind", "preset", "options"]);
const timelineMotionKeys = new Set([
  "kind",
  "durationMs",
  "delayMs",
  "repeatCount",
  "direction",
  "fillMode",
  "easing",
  "keyframes",
  "rotateCenter",
]);
const easingKeys = new Set(["type", "x1", "y1", "x2", "y2"]);
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

/**
 * Reuse the mature v1 semantic validator for unchanged vocabulary. Text nodes
 * are represented as zero-size rect proxies only for that internal validation
 * pass; v2-specific text validation below remains authoritative.
 */
function toLegacyValidationShape(shape: unknown): unknown {
  if (!isRecord(shape)) {
    return shape;
  }

  if (shape.kind === "group") {
    return {
      ...shape,
      children: Array.isArray(shape.children)
        ? shape.children.map((child) => toLegacyValidationShape(child))
        : shape.children,
    };
  }

  if (shape.kind !== "text") {
    return shape;
  }

  const {
    text: _text,
    fontSize: _fontSize,
    fontFamily: _fontFamily,
    fontWeight: _fontWeight,
    textAnchor: _textAnchor,
    ...common
  } = shape;

  return {
    ...common,
    kind: "rect",
    x: isFiniteNumber(shape.x) ? shape.x : 0,
    y: isFiniteNumber(shape.y) ? shape.y : 0,
    width: 0,
    height: 0,
  };
}

function toLegacyValidationInput(input: unknown): unknown {
  if (!isRecord(input)) {
    return input;
  }

  return {
    ...input,
    schemaVersion: 1,
    layers: Array.isArray(input.layers)
      ? input.layers.map((layer) =>
          isRecord(layer)
            ? {
                ...layer,
                shapes: Array.isArray(layer.shapes)
                  ? layer.shapes.map((shape) => toLegacyValidationShape(shape))
                  : layer.shapes,
              }
            : layer,
        )
      : input.layers,
  };
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

function inspectEasing(easing: unknown, issues: FlatDesignDocumentIssue[], path: string) {
  if (typeof easing === "string") {
    if (!easingPresets.has(easing)) {
      pushIssue(issues, "invalid-motion", path, `Unknown flat-design easing "${easing}".`);
    }
    return;
  }

  if (!isRecord(easing)) {
    pushIssue(
      issues,
      "invalid-motion",
      path,
      "Motion easing must be a named easing or cubic-bezier object.",
    );
    return;
  }

  rejectUnknownKeys(easing, easingKeys, issues, path);
  if (
    easing.type !== "cubic-bezier" ||
    !isFiniteNumber(easing.x1) ||
    easing.x1 < 0 ||
    easing.x1 > 1 ||
    !isFiniteNumber(easing.x2) ||
    easing.x2 < 0 ||
    easing.x2 > 1 ||
    !isFiniteNumber(easing.y1) ||
    !isFiniteNumber(easing.y2)
  ) {
    pushIssue(
      issues,
      "invalid-motion",
      path,
      "Cubic-bezier easing requires finite x1/y1/x2/y2 values with x controls between 0 and 1.",
    );
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

  if (motion.delayMs !== undefined && (!isFiniteNumber(motion.delayMs) || motion.delayMs < 0)) {
    pushIssue(
      issues,
      "invalid-motion",
      `${path}.delayMs`,
      "Motion delayMs must be a finite number greater than or equal to zero.",
    );
  }
  if (
    motion.fillMode !== undefined &&
    motion.fillMode !== "freeze" &&
    motion.fillMode !== "remove"
  ) {
    pushIssue(
      issues,
      "invalid-motion",
      `${path}.fillMode`,
      'Motion fillMode must be "freeze" or "remove".',
    );
  }
  if (motion.easing !== undefined) {
    inspectEasing(motion.easing, issues, `${path}.easing`);
  }

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

function inspectTextShape(
  shape: Record<string, unknown>,
  issues: FlatDesignDocumentIssue[],
  path: string,
) {
  if (!isFiniteNumber(shape.x)) {
    pushIssue(issues, "invalid-geometry", `${path}.x`, "Text x must be a finite number.");
  }
  if (!isFiniteNumber(shape.y)) {
    pushIssue(issues, "invalid-geometry", `${path}.y`, "Text y must be a finite number.");
  }
  if (typeof shape.text !== "string") {
    pushIssue(issues, "invalid-geometry", `${path}.text`, "Text content must be a string.");
  }
  if (
    shape.fontSize !== undefined &&
    (!isFiniteNumber(shape.fontSize) || shape.fontSize <= 0)
  ) {
    pushIssue(
      issues,
      "invalid-geometry",
      `${path}.fontSize`,
      "Text fontSize must be a finite number greater than zero.",
    );
  }
  if (
    shape.fontFamily !== undefined &&
    (typeof shape.fontFamily !== "string" || !shape.fontFamily.trim())
  ) {
    pushIssue(
      issues,
      "invalid-document",
      `${path}.fontFamily`,
      "Text fontFamily must be a non-blank string when provided.",
    );
  }
  if (
    shape.fontWeight !== undefined &&
    !(
      (isFiniteNumber(shape.fontWeight) && shape.fontWeight >= 1 && shape.fontWeight <= 1_000) ||
      (typeof shape.fontWeight === "string" && Boolean(shape.fontWeight.trim()))
    )
  ) {
    pushIssue(
      issues,
      "invalid-document",
      `${path}.fontWeight`,
      "Text fontWeight must be a non-blank string or a finite number from 1 to 1000.",
    );
  }
  if (
    shape.textAnchor !== undefined &&
    shape.textAnchor !== "start" &&
    shape.textAnchor !== "middle" &&
    shape.textAnchor !== "end"
  ) {
    pushIssue(
      issues,
      "invalid-document",
      `${path}.textAnchor`,
      'Text textAnchor must be "start", "middle", or "end".',
    );
  }
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

  if (shape.kind === "text") {
    inspectTextShape(shape, issues, path);
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
  if (input.schemaVersion !== FLAT_DESIGN_SCHEMA_VERSION) {
    pushIssue(
      issues,
      "unsupported-schema-version",
      "$.schemaVersion",
      `schemaVersion must be ${FLAT_DESIGN_SCHEMA_VERSION}.`,
    );
  }

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
  const base = analyzeLegacyFlatDesignDocument(toLegacyValidationInput(input));
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

export function migrateFlatDesignDocument(input: unknown): unknown {
  if (!isRecord(input)) {
    return input;
  }

  if (input.schemaVersion === undefined || input.schemaVersion === 1) {
    return {
      ...input,
      schemaVersion: FLAT_DESIGN_SCHEMA_VERSION,
    };
  }

  return input;
}

export function defineFlatDesignDocument(
  scene: FlatDesignScene | FlatDesignDocument,
): FlatDesignDocument {
  const document = migrateFlatDesignDocument(scene);
  assertFlatDesignDocument(document);
  return document;
}

export function parseFlatDesignDocument(
  serialized: string,
  options: ParseFlatDesignDocumentOptions = {},
): FlatDesignDocument {
  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch (error) {
    throw new FlatDesignDocumentError([
      {
        code: "invalid-document",
        message: error instanceof Error ? error.message : "Document JSON could not be parsed.",
        path: "$",
        severity: "error",
      },
    ]);
  }

  const candidate = options.acceptLegacyScene === false ? parsed : migrateFlatDesignDocument(parsed);
  assertFlatDesignDocument(candidate);
  return candidate;
}

export function serializeFlatDesignDocument(
  scene: FlatDesignScene | FlatDesignDocument,
  space?: number,
): string {
  return JSON.stringify(defineFlatDesignDocument(scene), null, space);
}

export { FlatDesignDocumentError };
export type {
  FlatDesignDocumentAnalysis,
  FlatDesignDocumentIssue,
  FlatDesignDocumentIssueCode,
  FlatDesignDocumentIssueSeverity,
  ParseFlatDesignDocumentOptions,
};
