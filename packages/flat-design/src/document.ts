import type {
  FlatAnimation,
  FlatDesignScene,
  FlatGradient,
  FlatShape,
  FlatTimelineMotionSpec,
} from "./scene-types";

export const FLAT_DESIGN_SCHEMA_VERSION = 1 as const;

export type FlatDesignDocument = FlatDesignScene & {
  schemaVersion: typeof FLAT_DESIGN_SCHEMA_VERSION;
};

export type FlatDesignDocumentIssueSeverity = "error" | "warning";

export type FlatDesignDocumentIssueCode =
  | "duplicate-gradient-id"
  | "duplicate-node-id"
  | "invalid-animation"
  | "invalid-dimension"
  | "invalid-document"
  | "invalid-geometry"
  | "invalid-gradient"
  | "invalid-motion"
  | "invalid-opacity"
  | "invalid-stroke-width"
  | "invalid-keyframe-order"
  | "invalid-keyframe-value"
  | "nonportable-class-name"
  | "nonportable-transform"
  | "nonserializable-value"
  | "unknown-gradient"
  | "unsupported-schema-version";

export type FlatDesignDocumentIssue = {
  code: FlatDesignDocumentIssueCode;
  message: string;
  path: string;
  severity: FlatDesignDocumentIssueSeverity;
};

export type FlatDesignDocumentAnalysis = {
  issues: FlatDesignDocumentIssue[];
  valid: boolean;
};

export type ParseFlatDesignDocumentOptions = {
  acceptLegacyScene?: boolean;
};

export class FlatDesignDocumentError extends Error {
  readonly issues: FlatDesignDocumentIssue[];

  constructor(issues: FlatDesignDocumentIssue[]) {
    super(
      issues.length === 1
        ? `Invalid flat-design document: ${issues[0]!.message}`
        : `Invalid flat-design document with ${issues.length} errors.`,
    );
    this.name = "FlatDesignDocumentError";
    this.issues = issues;
  }
}

type MutableAnalysis = {
  gradientIds: Set<string>;
  issues: FlatDesignDocumentIssue[];
  nodeIds: Set<string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function addIssue(
  analysis: MutableAnalysis,
  code: FlatDesignDocumentIssueCode,
  path: string,
  message: string,
  severity: FlatDesignDocumentIssueSeverity = "error",
) {
  analysis.issues.push({ code, message, path, severity });
}

function validateOptionalFiniteNumber(
  analysis: MutableAnalysis,
  value: unknown,
  path: string,
  label: string,
  options: { min?: number; max?: number } = {},
) {
  if (value === undefined) {
    return;
  }

  if (!isFiniteNumber(value)) {
    addIssue(analysis, "invalid-geometry", path, `${label} must be a finite number.`);
    return;
  }

  if (options.min !== undefined && value < options.min) {
    addIssue(analysis, "invalid-geometry", path, `${label} must be at least ${options.min}.`);
  }

  if (options.max !== undefined && value > options.max) {
    addIssue(analysis, "invalid-geometry", path, `${label} must be at most ${options.max}.`);
  }
}

function validateRequiredFiniteNumber(
  analysis: MutableAnalysis,
  value: unknown,
  path: string,
  label: string,
  options: { min?: number; max?: number } = {},
) {
  if (!isFiniteNumber(value)) {
    addIssue(analysis, "invalid-geometry", path, `${label} must be a finite number.`);
    return;
  }

  if (options.min !== undefined && value < options.min) {
    addIssue(analysis, "invalid-geometry", path, `${label} must be at least ${options.min}.`);
  }

  if (options.max !== undefined && value > options.max) {
    addIssue(analysis, "invalid-geometry", path, `${label} must be at most ${options.max}.`);
  }
}

function validateSerializable(value: unknown, analysis: MutableAnalysis) {
  const seen = new WeakSet<object>();

  function visit(current: unknown, path: string) {
    if (
      current === null ||
      current === undefined ||
      typeof current === "string" ||
      typeof current === "boolean"
    ) {
      return;
    }

    if (typeof current === "number") {
      if (!Number.isFinite(current)) {
        addIssue(
          analysis,
          "nonserializable-value",
          path,
          "Numbers in flat-design documents must be finite.",
        );
      }
      return;
    }

    if (typeof current !== "object") {
      addIssue(
        analysis,
        "nonserializable-value",
        path,
        `Flat-design documents cannot contain ${typeof current} values.`,
      );
      return;
    }

    if (seen.has(current)) {
      addIssue(
        analysis,
        "nonserializable-value",
        path,
        "Flat-design documents cannot contain cyclic references.",
      );
      return;
    }

    seen.add(current);

    if (Array.isArray(current)) {
      current.forEach((entry, index) => visit(entry, `${path}[${index}]`));
    } else {
      Object.entries(current).forEach(([key, entry]) => visit(entry, `${path}.${key}`));
    }

    seen.delete(current);
  }

  visit(value, "$.");
}

function validateDocumentMetadata(value: Record<string, unknown>, analysis: MutableAnalysis) {
  if (value.schemaVersion !== FLAT_DESIGN_SCHEMA_VERSION) {
    addIssue(
      analysis,
      "unsupported-schema-version",
      "$.schemaVersion",
      `schemaVersion must be ${FLAT_DESIGN_SCHEMA_VERSION}.`,
    );
  }

  if (!isFiniteNumber(value.width) || value.width <= 0) {
    addIssue(
      analysis,
      "invalid-dimension",
      "$.width",
      "Document width must be a finite number greater than zero.",
    );
  }

  if (!isFiniteNumber(value.height) || value.height <= 0) {
    addIssue(
      analysis,
      "invalid-dimension",
      "$.height",
      "Document height must be a finite number greater than zero.",
    );
  }

  for (const field of ["title", "description", "viewBox", "background"] as const) {
    const fieldValue = value[field];
    if (fieldValue !== undefined && typeof fieldValue !== "string") {
      addIssue(
        analysis,
        "invalid-document",
        `$.${field}`,
        `${field} must be a string when provided.`,
      );
    }
  }
}

function validateGradientStop(
  stop: unknown,
  analysis: MutableAnalysis,
  path: string,
) {
  if (!isRecord(stop)) {
    addIssue(analysis, "invalid-gradient", path, "Gradient stops must be objects.");
    return;
  }

  const offset = stop.offset;
  const validOffset =
    (isFiniteNumber(offset) && offset >= 0 && offset <= 1) ||
    (typeof offset === "string" && /^(?:100|\d{1,2})(?:\.\d+)?%$/.test(offset.trim()));

  if (!validOffset) {
    addIssue(
      analysis,
      "invalid-gradient",
      `${path}.offset`,
      "Gradient stop offsets must be between 0 and 1 or percentage strings between 0% and 100%.",
    );
  }

  if (!isNonBlankString(stop.color)) {
    addIssue(analysis, "invalid-gradient", `${path}.color`, "Gradient stop color is required.");
  }

  if (stop.opacity !== undefined && (!isFiniteNumber(stop.opacity) || stop.opacity < 0 || stop.opacity > 1)) {
    addIssue(
      analysis,
      "invalid-gradient",
      `${path}.opacity`,
      "Gradient stop opacity must be between 0 and 1.",
    );
  }
}

function validateGradient(gradient: unknown, analysis: MutableAnalysis, path: string) {
  if (!isRecord(gradient)) {
    addIssue(analysis, "invalid-gradient", path, "Gradients must be objects.");
    return;
  }

  if (!isNonBlankString(gradient.id)) {
    addIssue(analysis, "invalid-gradient", `${path}.id`, "Gradient id is required.");
  } else if (analysis.gradientIds.has(gradient.id)) {
    addIssue(
      analysis,
      "duplicate-gradient-id",
      `${path}.id`,
      `Gradient id "${gradient.id}" is duplicated.`,
    );
  } else {
    analysis.gradientIds.add(gradient.id);
  }

  if (gradient.kind !== "linear" && gradient.kind !== "radial") {
    addIssue(
      analysis,
      "invalid-gradient",
      `${path}.kind`,
      'Gradient kind must be "linear" or "radial".',
    );
  }

  if (!Array.isArray(gradient.stops) || gradient.stops.length === 0) {
    addIssue(
      analysis,
      "invalid-gradient",
      `${path}.stops`,
      "A gradient must contain at least one stop.",
    );
  } else {
    gradient.stops.forEach((stop, index) => validateGradientStop(stop, analysis, `${path}.stops[${index}]`));
  }

  for (const field of ["x1", "y1", "x2", "y2", "cx", "cy", "r", "fx", "fy"] as const) {
    const coordinate = gradient[field];
    if (coordinate !== undefined && typeof coordinate !== "string" && !isFiniteNumber(coordinate)) {
      addIssue(
        analysis,
        "invalid-gradient",
        `${path}.${field}`,
        `${field} must be a finite number or SVG length string.`,
      );
    }
  }
}

function validateGradientReference(
  analysis: MutableAnalysis,
  value: unknown,
  path: string,
) {
  if (typeof value !== "string") {
    return;
  }

  const match = /^url\(#([^)]*)\)$/.exec(value.trim());
  if (match && !analysis.gradientIds.has(match[1]!)) {
    addIssue(
      analysis,
      "unknown-gradient",
      path,
      `Gradient reference "${match[1]}" does not exist in document.gradients.`,
    );
  }
}

function validateMotionKeyframe(
  keyframe: unknown,
  motion: FlatTimelineMotionSpec | Record<string, unknown>,
  analysis: MutableAnalysis,
  path: string,
  previousTimeMs: number | undefined,
): number | undefined {
  if (!isRecord(keyframe)) {
    addIssue(analysis, "invalid-keyframe-value", path, "Motion keyframes must be objects.");
    return previousTimeMs;
  }

  if (!isFiniteNumber(keyframe.timeMs)) {
    addIssue(
      analysis,
      "invalid-keyframe-value",
      `${path}.timeMs`,
      "Keyframe timeMs must be a finite number.",
    );
    return previousTimeMs;
  }

  const durationMs = isFiniteNumber(motion.durationMs) ? motion.durationMs : 0;
  if (keyframe.timeMs < 0 || keyframe.timeMs > durationMs) {
    addIssue(
      analysis,
      "invalid-keyframe-value",
      `${path}.timeMs`,
      "Keyframe timeMs must fall within the motion duration.",
    );
  }

  if (previousTimeMs !== undefined && keyframe.timeMs < previousTimeMs) {
    addIssue(
      analysis,
      "invalid-keyframe-order",
      `${path}.timeMs`,
      "Motion keyframes must be ordered by timeMs.",
    );
  }

  for (const field of ["x", "y"] as const) {
    if (keyframe[field] !== undefined && !isFiniteNumber(keyframe[field])) {
      addIssue(
        analysis,
        "invalid-keyframe-value",
        `${path}.${field}`,
        `${field} must be a finite number.`,
      );
    }
  }

  if (
    keyframe.opacity !== undefined &&
    (!isFiniteNumber(keyframe.opacity) || keyframe.opacity < 0 || keyframe.opacity > 1)
  ) {
    addIssue(
      analysis,
      "invalid-keyframe-value",
      `${path}.opacity`,
      "Keyframe opacity must be between 0 and 1.",
    );
  }

  if (keyframe.scale !== undefined) {
    if (isFiniteNumber(keyframe.scale)) {
      if (keyframe.scale <= 0) {
        addIssue(
          analysis,
          "invalid-keyframe-value",
          `${path}.scale`,
          "Keyframe scale must be greater than zero.",
        );
      }
    } else if (
      !isRecord(keyframe.scale) ||
      !isFiniteNumber(keyframe.scale.x) ||
      !isFiniteNumber(keyframe.scale.y) ||
      keyframe.scale.x <= 0 ||
      keyframe.scale.y <= 0
    ) {
      addIssue(
        analysis,
        "invalid-keyframe-value",
        `${path}.scale`,
        "Keyframe scale must be a positive number or positive {x, y} pair.",
      );
    }
  }

  if (keyframe.rotate !== undefined) {
    if (!isFiniteNumber(keyframe.rotate)) {
      if (!isRecord(keyframe.rotate) || !isFiniteNumber(keyframe.rotate.angle)) {
        addIssue(
          analysis,
          "invalid-keyframe-value",
          `${path}.rotate`,
          "Keyframe rotate must be a finite angle or an angle object.",
        );
      } else {
        validateOptionalFiniteNumber(analysis, keyframe.rotate.cx, `${path}.rotate.cx`, "Rotation center x");
        validateOptionalFiniteNumber(analysis, keyframe.rotate.cy, `${path}.rotate.cy`, "Rotation center y");
      }
    }
  }

  return keyframe.timeMs;
}

function validateMotion(motion: unknown, analysis: MutableAnalysis, path: string) {
  if (!isRecord(motion)) {
    addIssue(analysis, "invalid-motion", path, "Motion must be an object.");
    return;
  }

  if (motion.kind === "preset") {
    if (!isNonBlankString(motion.preset)) {
      addIssue(analysis, "invalid-motion", `${path}.preset`, "Motion preset is required.");
    }
    if (motion.options !== undefined && !isRecord(motion.options)) {
      addIssue(analysis, "invalid-motion", `${path}.options`, "Preset options must be an object.");
    }
    return;
  }

  if (motion.kind !== "timeline") {
    addIssue(
      analysis,
      "invalid-motion",
      `${path}.kind`,
      'Motion kind must be "preset" or "timeline".',
    );
    return;
  }

  if (!isFiniteNumber(motion.durationMs) || motion.durationMs <= 0) {
    addIssue(
      analysis,
      "invalid-motion",
      `${path}.durationMs`,
      "Timeline motion durationMs must be a finite number greater than zero.",
    );
  }

  if (
    motion.repeatCount !== undefined &&
    motion.repeatCount !== "indefinite" &&
    (!isFiniteNumber(motion.repeatCount) || motion.repeatCount <= 0)
  ) {
    addIssue(
      analysis,
      "invalid-motion",
      `${path}.repeatCount`,
      'repeatCount must be "indefinite" or a finite number greater than zero.',
    );
  }

  if (
    motion.direction !== undefined &&
    motion.direction !== "normal" &&
    motion.direction !== "reverse" &&
    motion.direction !== "alternate"
  ) {
    addIssue(
      analysis,
      "invalid-motion",
      `${path}.direction`,
      'direction must be "normal", "reverse", or "alternate".',
    );
  }

  if (!Array.isArray(motion.keyframes) || motion.keyframes.length < 2) {
    addIssue(
      analysis,
      "invalid-motion",
      `${path}.keyframes`,
      "Timeline motion requires at least two keyframes.",
    );
    return;
  }

  let previousTimeMs: number | undefined;
  motion.keyframes.forEach((keyframe, index) => {
    previousTimeMs = validateMotionKeyframe(
      keyframe,
      motion,
      analysis,
      `${path}.keyframes[${index}]`,
      previousTimeMs,
    );
  });
}

function parseClockValue(value: unknown) {
  if (value === undefined) {
    return true;
  }
  if (typeof value !== "string") {
    return false;
  }
  return /^\d+(?:\.\d+)?(?:ms|s)$/.test(value.trim());
}

function validateAnimation(animation: unknown, analysis: MutableAnalysis, path: string) {
  if (!isRecord(animation)) {
    addIssue(analysis, "invalid-animation", path, "Low-level animations must be objects.");
    return;
  }

  if (animation.kind !== "attribute" && animation.kind !== "transform") {
    addIssue(
      analysis,
      "invalid-animation",
      `${path}.kind`,
      'Animation kind must be "attribute" or "transform".',
    );
  }

  if (!Array.isArray(animation.values) || animation.values.length === 0) {
    addIssue(
      analysis,
      "invalid-animation",
      `${path}.values`,
      "Animation values must contain at least one value.",
    );
  }

  if (!parseClockValue(animation.begin)) {
    addIssue(analysis, "invalid-animation", `${path}.begin`, "Animation begin must use ms or s units.");
  }
  if (!parseClockValue(animation.dur)) {
    addIssue(analysis, "invalid-animation", `${path}.dur`, "Animation duration must use ms or s units.");
  }

  if (
    animation.repeatCount !== undefined &&
    animation.repeatCount !== "indefinite" &&
    !/^\d+(?:\.\d+)?$/.test(String(animation.repeatCount))
  ) {
    addIssue(
      analysis,
      "invalid-animation",
      `${path}.repeatCount`,
      'Animation repeatCount must be "indefinite" or a positive number string.',
    );
  }

  if (animation.keyTimes !== undefined) {
    if (
      !Array.isArray(animation.keyTimes) ||
      animation.keyTimes.some((value) => !isFiniteNumber(value) || value < 0 || value > 1)
    ) {
      addIssue(
        analysis,
        "invalid-animation",
        `${path}.keyTimes`,
        "Animation keyTimes must be finite values between 0 and 1.",
      );
    }
  }

  if (animation.kind === "attribute" && !isNonBlankString(animation.attributeName)) {
    addIssue(
      analysis,
      "invalid-animation",
      `${path}.attributeName`,
      "Attribute animations require an attributeName.",
    );
  }

  if (
    animation.kind === "transform" &&
    animation.transformType !== "translate" &&
    animation.transformType !== "scale" &&
    animation.transformType !== "rotate"
  ) {
    addIssue(
      analysis,
      "invalid-animation",
      `${path}.transformType`,
      'Transform animations must target "translate", "scale", or "rotate".',
    );
  }
}

function validateCommonShapeFields(shape: Record<string, unknown>, analysis: MutableAnalysis, path: string) {
  if (shape.id !== undefined) {
    if (!isNonBlankString(shape.id)) {
      addIssue(analysis, "invalid-document", `${path}.id`, "Node ids must be non-blank strings.");
    } else if (analysis.nodeIds.has(shape.id)) {
      addIssue(
        analysis,
        "duplicate-node-id",
        `${path}.id`,
        `Node id "${shape.id}" is duplicated.`,
      );
    } else {
      analysis.nodeIds.add(shape.id);
    }
  }

  if (shape.className !== undefined) {
    if (typeof shape.className !== "string") {
      addIssue(analysis, "invalid-document", `${path}.className`, "className must be a string.");
    } else {
      addIssue(
        analysis,
        "nonportable-class-name",
        `${path}.className`,
        "className is renderer-specific and should not be relied on for durable artwork semantics.",
        "warning",
      );
    }
  }

  if (shape.transform !== undefined) {
    if (typeof shape.transform !== "string") {
      addIssue(analysis, "invalid-document", `${path}.transform`, "transform must be a string.");
    } else {
      addIssue(
        analysis,
        "nonportable-transform",
        `${path}.transform`,
        "Raw SVG transform strings are supported for compatibility but are renderer-specific.",
        "warning",
      );
    }
  }

  if (shape.opacity !== undefined && (!isFiniteNumber(shape.opacity) || shape.opacity < 0 || shape.opacity > 1)) {
    addIssue(
      analysis,
      "invalid-opacity",
      `${path}.opacity`,
      "Node opacity must be a finite number between 0 and 1.",
    );
  }

  if (shape.strokeWidth !== undefined && (!isFiniteNumber(shape.strokeWidth) || shape.strokeWidth < 0)) {
    addIssue(
      analysis,
      "invalid-stroke-width",
      `${path}.strokeWidth`,
      "strokeWidth must be a finite number greater than or equal to zero.",
    );
  }

  if (shape.motion !== undefined) {
    validateMotion(shape.motion, analysis, `${path}.motion`);
  }

  if (shape.animations !== undefined) {
    if (!Array.isArray(shape.animations)) {
      addIssue(analysis, "invalid-animation", `${path}.animations`, "animations must be an array.");
    } else {
      shape.animations.forEach((animation, index) =>
        validateAnimation(animation, analysis, `${path}.animations[${index}]`),
      );
    }
  }
}

function validateShapeGeometry(shape: Record<string, unknown>, analysis: MutableAnalysis, path: string) {
  switch (shape.kind) {
    case "group":
      return;
    case "rect":
      validateRequiredFiniteNumber(analysis, shape.x, `${path}.x`, "Rectangle x");
      validateRequiredFiniteNumber(analysis, shape.y, `${path}.y`, "Rectangle y");
      validateRequiredFiniteNumber(analysis, shape.width, `${path}.width`, "Rectangle width", { min: 0 });
      validateRequiredFiniteNumber(analysis, shape.height, `${path}.height`, "Rectangle height", { min: 0 });
      validateOptionalFiniteNumber(analysis, shape.rx, `${path}.rx`, "Rectangle rx", { min: 0 });
      validateOptionalFiniteNumber(analysis, shape.ry, `${path}.ry`, "Rectangle ry", { min: 0 });
      return;
    case "circle":
      validateRequiredFiniteNumber(analysis, shape.cx, `${path}.cx`, "Circle cx");
      validateRequiredFiniteNumber(analysis, shape.cy, `${path}.cy`, "Circle cy");
      validateRequiredFiniteNumber(analysis, shape.r, `${path}.r`, "Circle radius", { min: 0 });
      return;
    case "ellipse":
      validateRequiredFiniteNumber(analysis, shape.cx, `${path}.cx`, "Ellipse cx");
      validateRequiredFiniteNumber(analysis, shape.cy, `${path}.cy`, "Ellipse cy");
      validateRequiredFiniteNumber(analysis, shape.rx, `${path}.rx`, "Ellipse rx", { min: 0 });
      validateRequiredFiniteNumber(analysis, shape.ry, `${path}.ry`, "Ellipse ry", { min: 0 });
      return;
    case "path":
      if (!isNonBlankString(shape.d)) {
        addIssue(analysis, "invalid-geometry", `${path}.d`, "Path data d must be a non-blank string.");
      }
      return;
    case "polygon":
      if (typeof shape.points === "string") {
        if (!shape.points.trim()) {
          addIssue(analysis, "invalid-geometry", `${path}.points`, "Polygon points cannot be blank.");
        }
        return;
      }
      if (!Array.isArray(shape.points) || shape.points.length < 3) {
        addIssue(
          analysis,
          "invalid-geometry",
          `${path}.points`,
          "Polygon points must be an SVG point string or at least three {x, y} points.",
        );
        return;
      }
      shape.points.forEach((point, index) => {
        if (!isRecord(point) || !isFiniteNumber(point.x) || !isFiniteNumber(point.y)) {
          addIssue(
            analysis,
            "invalid-geometry",
            `${path}.points[${index}]`,
            "Polygon points must contain finite x and y coordinates.",
          );
        }
      });
      return;
    case "line":
      validateRequiredFiniteNumber(analysis, shape.x1, `${path}.x1`, "Line x1");
      validateRequiredFiniteNumber(analysis, shape.y1, `${path}.y1`, "Line y1");
      validateRequiredFiniteNumber(analysis, shape.x2, `${path}.x2`, "Line x2");
      validateRequiredFiniteNumber(analysis, shape.y2, `${path}.y2`, "Line y2");
      return;
    default:
      addIssue(
        analysis,
        "invalid-geometry",
        `${path}.kind`,
        "Shape kind must be group, rect, circle, ellipse, path, polygon, or line.",
      );
  }
}

function validateShape(shape: unknown, analysis: MutableAnalysis, path: string) {
  if (!isRecord(shape)) {
    addIssue(analysis, "invalid-geometry", path, "Shapes must be objects.");
    return;
  }

  validateCommonShapeFields(shape, analysis, path);
  validateShapeGeometry(shape, analysis, path);
  validateGradientReference(analysis, shape.fill, `${path}.fill`);
  validateGradientReference(analysis, shape.stroke, `${path}.stroke`);

  if (shape.kind === "group") {
    if (!Array.isArray(shape.children)) {
      addIssue(analysis, "invalid-geometry", `${path}.children`, "Groups must contain a children array.");
    } else {
      shape.children.forEach((child, index) => validateShape(child, analysis, `${path}.children[${index}]`));
    }
  }
}

function validateLayer(layer: unknown, analysis: MutableAnalysis, path: string) {
  if (!isRecord(layer)) {
    addIssue(analysis, "invalid-document", path, "Layers must be objects.");
    return;
  }

  if (layer.id !== undefined && !isNonBlankString(layer.id)) {
    addIssue(analysis, "invalid-document", `${path}.id`, "Layer ids must be non-blank strings.");
  }

  if (layer.className !== undefined) {
    if (typeof layer.className !== "string") {
      addIssue(analysis, "invalid-document", `${path}.className`, "className must be a string.");
    } else {
      addIssue(
        analysis,
        "nonportable-class-name",
        `${path}.className`,
        "Layer className is renderer-specific and should not carry durable artwork semantics.",
        "warning",
      );
    }
  }

  if (layer.transform !== undefined) {
    if (typeof layer.transform !== "string") {
      addIssue(analysis, "invalid-document", `${path}.transform`, "transform must be a string.");
    } else {
      addIssue(
        analysis,
        "nonportable-transform",
        `${path}.transform`,
        "Raw layer transform strings are supported for compatibility but are renderer-specific.",
        "warning",
      );
    }
  }

  if (layer.opacity !== undefined && (!isFiniteNumber(layer.opacity) || layer.opacity < 0 || layer.opacity > 1)) {
    addIssue(
      analysis,
      "invalid-opacity",
      `${path}.opacity`,
      "Layer opacity must be between 0 and 1.",
    );
  }

  if (!Array.isArray(layer.shapes)) {
    addIssue(analysis, "invalid-document", `${path}.shapes`, "Layers must contain a shapes array.");
  } else {
    layer.shapes.forEach((shape, index) => validateShape(shape, analysis, `${path}.shapes[${index}]`));
  }
}

export function analyzeFlatDesignDocument(input: unknown): FlatDesignDocumentAnalysis {
  const analysis: MutableAnalysis = {
    gradientIds: new Set<string>(),
    issues: [],
    nodeIds: new Set<string>(),
  };

  validateSerializable(input, analysis);

  if (!isRecord(input)) {
    addIssue(analysis, "invalid-document", "$", "A flat-design document must be an object.");
    return { valid: false, issues: analysis.issues };
  }

  validateDocumentMetadata(input, analysis);

  if (input.gradients !== undefined) {
    if (!Array.isArray(input.gradients)) {
      addIssue(analysis, "invalid-gradient", "$.gradients", "gradients must be an array.");
    } else {
      input.gradients.forEach((gradient, index) =>
        validateGradient(gradient, analysis, `$.gradients[${index}]`),
      );
    }
  }

  if (!Array.isArray(input.layers)) {
    addIssue(analysis, "invalid-document", "$.layers", "Document layers must be an array.");
  } else {
    input.layers.forEach((layer, index) => validateLayer(layer, analysis, `$.layers[${index}]`));
  }

  const valid = !analysis.issues.some((issue) => issue.severity === "error");
  return { valid, issues: analysis.issues };
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
  if (!isRecord(input) || input.schemaVersion !== undefined) {
    return input;
  }

  return {
    ...input,
    schemaVersion: FLAT_DESIGN_SCHEMA_VERSION,
  };
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

export type {
  FlatAnimation,
  FlatDesignScene,
  FlatGradient,
  FlatShape,
};
