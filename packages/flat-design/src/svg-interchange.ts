import { renderFlatSceneToSvg, type RenderFlatSceneOptions } from "./render-svg";
import { sampleFlatSceneAtTime } from "./sampling";
import type {
  FlatAnimation,
  FlatAnimationTiming,
  FlatDesignScene,
  FlatGradient,
  FlatGradientStop,
  FlatLayer,
  FlatShape,
  FlatTransformAnimation,
} from "./scene-types";

export type FlatSvgImportIssueCode =
  | "invalid-value"
  | "unsupported-animation"
  | "unsupported-element"
  | "unsupported-presentation"
  | "unsupported-resource";

export type FlatSvgImportIssue = {
  code: FlatSvgImportIssueCode;
  message: string;
  element?: string;
  id?: string;
};

export type ImportFlatSceneFromSvgOptions = {
  fallbackWidth?: number;
  fallbackHeight?: number;
};

export type FlatSvgImportResult = {
  scene: FlatDesignScene;
  issues: FlatSvgImportIssue[];
  isLossless: boolean;
};

export class FlatSvgImportError extends Error {
  override readonly name = "FlatSvgImportError";
}

type XmlElement = {
  name: string;
  attributes: Record<string, string>;
  children: XmlElement[];
  text: string[];
};

type SvgImportContext = {
  issues: FlatSvgImportIssue[];
};

const defaultSvgWidth = 300;
const defaultSvgHeight = 150;
const staticFrameAttributeNames = new Set(["opacity"]);
const animationElementNames = new Set(["animate", "animateMotion", "animateTransform", "set"]);
const supportedInlineStyleProperties = new Set([
  "fill",
  "opacity",
  "stroke",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-width",
  "stop-color",
  "stop-opacity",
]);
const unsupportedPresentationAttributes = [
  "clip-path",
  "display",
  "fill-opacity",
  "fill-rule",
  "filter",
  "mask",
  "marker-end",
  "marker-mid",
  "marker-start",
  "paint-order",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-opacity",
  "vector-effect",
  "visibility",
] as const;

/**
 * Parse the editable subset of an SVG document into FlatDesignScene data.
 *
 * The importer is intentionally allow-list based: scripts and unsupported SVG
 * constructs never survive as raw markup. Unsupported visual features are
 * reported in `issues` so callers can distinguish a clean import from a lossy
 * starting point.
 */
export function importFlatSceneFromSvg(
  svgMarkup: string,
  options: ImportFlatSceneFromSvgOptions = {},
): FlatSvgImportResult {
  const root = parseXml(svgMarkup);

  if (localName(root.name) !== "svg") {
    throw new FlatSvgImportError("Expected an <svg> document root.");
  }

  const context: SvgImportContext = { issues: [] };
  const viewBox = parseViewBox(root.attributes.viewBox, root, context);
  const width = parseRootDimension(
    root.attributes.width,
    viewBox?.width,
    options.fallbackWidth ?? defaultSvgWidth,
    "width",
    root,
    context,
  );
  const height = parseRootDimension(
    root.attributes.height,
    viewBox?.height,
    options.fallbackHeight ?? defaultSvgHeight,
    "height",
    root,
    context,
  );

  reportRootAnimations(root, context);
  const gradients = parseGradients(root, context);
  const shapes = parseRenderableChildren(root, context);
  const title = findDirectChild(root, "title");
  const description = findDirectChild(root, "desc");
  const layer = parseRootLayer(root, shapes, context);
  const scene: FlatDesignScene = {
    width,
    height,
    viewBox: viewBox?.source,
    title: title ? collectText(title).trim() || undefined : undefined,
    description: description ? collectText(description).trim() || undefined : undefined,
    gradients: gradients.length > 0 ? gradients : undefined,
    layers: [layer],
  };

  return {
    scene,
    issues: context.issues,
    isLossless: context.issues.length === 0,
  };
}

/** Export the authored scene, including its SVG animation elements. */
export function renderFlatSceneAnimationToSvg(
  scene: FlatDesignScene,
  options: RenderFlatSceneOptions = {},
): string {
  return renderFlatSceneToSvg(scene, options);
}

/** Export one deterministic, animation-free SVG frame at `timeInMs`. */
export function renderFlatSceneFrameToSvg(
  scene: FlatDesignScene,
  timeInMs: number,
  options: RenderFlatSceneOptions = {},
): string {
  return renderFlatSceneToSvg(sampleFlatSceneAtTime(scene, timeInMs), options);
}

function parseRootLayer(
  root: XmlElement,
  shapes: FlatShape[],
  context: SvgImportContext,
): FlatLayer {
  const styles = parseInlineStyle(root, context);
  const preserveAspectRatio = root.attributes.preserveAspectRatio?.trim();

  if (preserveAspectRatio && preserveAspectRatio !== "xMidYMid meet") {
    addIssue(
      context,
      "unsupported-presentation",
      `Root preserveAspectRatio=${JSON.stringify(preserveAspectRatio)} is not stored in FlatDesignScene and was not imported.`,
      root,
    );
  }

  for (const property of ["fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"]) {
    if (readPresentation(root, styles, property) !== undefined) {
      addIssue(
        context,
        "unsupported-presentation",
        `Root SVG ${property} inheritance is not represented by FlatLayer and was not imported.`,
        root,
      );
    }
  }

  reportUnsupportedPresentation(root, context);

  return {
    id: root.attributes.id,
    className: root.attributes.class,
    opacity: parseOptionalNumber(readPresentation(root, styles, "opacity"), "opacity", root, context),
    transform: root.attributes.transform,
    shapes,
  };
}

function reportRootAnimations(root: XmlElement, context: SvgImportContext) {
  for (const child of root.children) {
    const name = localName(child.name);

    if (!animationElementNames.has(name)) {
      continue;
    }

    addIssue(
      context,
      "unsupported-animation",
      `Root-level <${name}> has no editable FlatShape target and was skipped.`,
      child,
    );
  }
}

function parseRenderableChildren(parent: XmlElement, context: SvgImportContext): FlatShape[] {
  const shapes: FlatShape[] = [];

  for (const child of parent.children) {
    const name = localName(child.name);

    if (["defs", "desc", "metadata", "title"].includes(name) || animationElementNames.has(name)) {
      continue;
    }

    const shape = parseShape(child, context);
    if (shape) {
      shapes.push(shape);
    }
  }

  return shapes;
}

function parseShape(element: XmlElement, context: SvgImportContext): FlatShape | undefined {
  const name = localName(element.name);
  const common = parseRenderableCommon(element, context);
  const animations = parseAnimations(element, context);
  const animationFields = animations.length > 0 ? { animations } : {};

  switch (name) {
    case "g":
      return {
        kind: "group",
        ...common,
        ...animationFields,
        children: parseRenderableChildren(element, context),
      };
    case "rect": {
      const x = parseGeometryNumber(element, "x", context, 0);
      const y = parseGeometryNumber(element, "y", context, 0);
      const width = parseGeometryNumber(element, "width", context);
      const height = parseGeometryNumber(element, "height", context);

      if (width === undefined || height === undefined) {
        return undefined;
      }

      return {
        kind: "rect",
        ...common,
        ...animationFields,
        x: x ?? 0,
        y: y ?? 0,
        width,
        height,
        rx:
          element.attributes.rx === undefined
            ? undefined
            : parseGeometryNumber(element, "rx", context),
        ry:
          element.attributes.ry === undefined
            ? undefined
            : parseGeometryNumber(element, "ry", context),
      };
    }
    case "circle": {
      const cx = parseGeometryNumber(element, "cx", context, 0);
      const cy = parseGeometryNumber(element, "cy", context, 0);
      const r = parseGeometryNumber(element, "r", context);

      if (r === undefined) {
        return undefined;
      }

      return {
        kind: "circle",
        ...common,
        ...animationFields,
        cx: cx ?? 0,
        cy: cy ?? 0,
        r,
      };
    }
    case "ellipse": {
      const cx = parseGeometryNumber(element, "cx", context, 0);
      const cy = parseGeometryNumber(element, "cy", context, 0);
      const rx = parseGeometryNumber(element, "rx", context);
      const ry = parseGeometryNumber(element, "ry", context);

      if (rx === undefined || ry === undefined) {
        return undefined;
      }

      return {
        kind: "ellipse",
        ...common,
        ...animationFields,
        cx: cx ?? 0,
        cy: cy ?? 0,
        rx,
        ry,
      };
    }
    case "line":
      return {
        kind: "line",
        ...common,
        ...animationFields,
        x1: parseGeometryNumber(element, "x1", context, 0) ?? 0,
        y1: parseGeometryNumber(element, "y1", context, 0) ?? 0,
        x2: parseGeometryNumber(element, "x2", context, 0) ?? 0,
        y2: parseGeometryNumber(element, "y2", context, 0) ?? 0,
      };
    case "path": {
      const d = element.attributes.d?.trim();

      if (!d) {
        addIssue(
          context,
          "invalid-value",
          "<path> is missing a non-empty d attribute and was skipped.",
          element,
        );
        return undefined;
      }

      return { kind: "path", ...common, ...animationFields, d };
    }
    case "polygon": {
      const points = element.attributes.points?.trim();

      if (!points) {
        addIssue(
          context,
          "invalid-value",
          "<polygon> is missing a non-empty points attribute and was skipped.",
          element,
        );
        return undefined;
      }

      if (!isValidPointList(points, 3)) {
        addIssue(context, "invalid-value", "<polygon> has invalid points and was skipped.", element);
        return undefined;
      }

      return { kind: "polygon", ...common, ...animationFields, points };
    }
    case "polyline": {
      const path = polylineToPath(element.attributes.points);

      if (!path) {
        addIssue(
          context,
          "invalid-value",
          "<polyline> has invalid or empty points and was skipped.",
          element,
        );
        return undefined;
      }

      return { kind: "path", ...common, ...animationFields, d: path };
    }
    case "script":
    case "foreignObject":
      addIssue(
        context,
        "unsupported-element",
        `<${name}> is intentionally not imported as executable or foreign SVG content.`,
        element,
      );
      return undefined;
    case "style":
      addIssue(
        context,
        "unsupported-presentation",
        "Stylesheet-based SVG presentation is not resolved; use presentation attributes or inline style for editable import.",
        element,
      );
      return undefined;
    case "image":
    case "text":
    case "use":
      addIssue(
        context,
        "unsupported-element",
        `<${name}> is not represented by FlatShape and was skipped.`,
        element,
      );
      return undefined;
    case "clipPath":
    case "filter":
    case "mask":
    case "marker":
    case "pattern":
    case "symbol":
      addIssue(
        context,
        "unsupported-resource",
        `<${name}> resources are not represented by the current scene schema and were skipped.`,
        element,
      );
      return undefined;
    default:
      addIssue(
        context,
        "unsupported-element",
        `<${name}> is not part of the editable flat-design SVG subset and was skipped.`,
        element,
      );
      return undefined;
  }
}

function parseRenderableCommon(element: XmlElement, context: SvgImportContext) {
  const styles = parseInlineStyle(element, context);
  const strokeLinecap = readPresentation(element, styles, "stroke-linecap");
  const strokeLinejoin = readPresentation(element, styles, "stroke-linejoin");

  reportUnsupportedPresentation(element, context);

  return {
    id: element.attributes.id,
    className: element.attributes.class,
    fill: readPresentation(element, styles, "fill"),
    stroke: readPresentation(element, styles, "stroke"),
    strokeWidth: parseOptionalNumber(
      readPresentation(element, styles, "stroke-width"),
      "stroke-width",
      element,
      context,
    ),
    strokeLinecap: parseStrokeLinecap(strokeLinecap, element, context),
    strokeLinejoin: parseStrokeLinejoin(strokeLinejoin, element, context),
    opacity: parseOptionalNumber(
      readPresentation(element, styles, "opacity"),
      "opacity",
      element,
      context,
    ),
    transform: element.attributes.transform,
  };
}

function reportUnsupportedPresentation(element: XmlElement, context: SvgImportContext) {
  for (const attribute of unsupportedPresentationAttributes) {
    if (element.attributes[attribute] !== undefined) {
      addIssue(
        context,
        "unsupported-presentation",
        `${attribute} is not represented by the current flat-design scene schema and was not imported.`,
        element,
      );
    }
  }
}

function parseInlineStyle(element: XmlElement, context: SvgImportContext) {
  const style = element.attributes.style;
  const result = new Map<string, string>();

  if (!style) {
    return result;
  }

  for (const declaration of style.split(";")) {
    const separatorIndex = declaration.indexOf(":");

    if (separatorIndex < 0) {
      continue;
    }

    const property = declaration.slice(0, separatorIndex).trim().toLowerCase();
    const value = declaration.slice(separatorIndex + 1).trim();

    if (!property || !value) {
      continue;
    }

    if (!supportedInlineStyleProperties.has(property)) {
      addIssue(
        context,
        "unsupported-presentation",
        `Inline style property ${property} is not represented and was not imported.`,
        element,
      );
      continue;
    }

    result.set(property, value);
  }

  return result;
}

function readPresentation(element: XmlElement, styles: Map<string, string>, name: string) {
  return styles.get(name) ?? element.attributes[name];
}

function parseStrokeLinecap(
  value: string | undefined,
  element: XmlElement,
  context: SvgImportContext,
): "butt" | "round" | "square" | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === "butt" || value === "round" || value === "square") {
    return value;
  }

  addIssue(context, "invalid-value", `Unsupported stroke-linecap value ${value}.`, element);
  return undefined;
}

function parseStrokeLinejoin(
  value: string | undefined,
  element: XmlElement,
  context: SvgImportContext,
): "bevel" | "miter" | "round" | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === "bevel" || value === "miter" || value === "round") {
    return value;
  }

  addIssue(context, "invalid-value", `Unsupported stroke-linejoin value ${value}.`, element);
  return undefined;
}

function parseGeometryNumber(
  element: XmlElement,
  attribute: string,
  context: SvgImportContext,
  fallback?: number,
): number | undefined {
  const value = element.attributes[attribute];

  if (value === undefined || value.trim() === "") {
    if (fallback !== undefined) {
      return fallback;
    }

    addIssue(
      context,
      "invalid-value",
      `<${localName(element.name)}> is missing required numeric ${attribute} and was skipped.`,
      element,
    );
    return undefined;
  }

  const parsed = parseSvgNumber(value);

  if (parsed === undefined) {
    addIssue(
      context,
      "invalid-value",
      `${attribute}=${JSON.stringify(value)} is not a unitless/px numeric value supported by FlatShape.`,
      element,
    );
    return undefined;
  }

  return parsed;
}

function parseOptionalNumber(
  value: string | undefined,
  attribute: string,
  element: XmlElement,
  context: SvgImportContext,
) {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const parsed = parseSvgNumber(value);

  if (parsed === undefined) {
    addIssue(
      context,
      "invalid-value",
      `${attribute}=${JSON.stringify(value)} is not a supported numeric value and was ignored.`,
      element,
    );
  }

  return parsed;
}

function parseSvgNumber(value: string): number | undefined {
  const match = value
    .trim()
    .match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(?:px)?$/i);

  if (!match) {
    return undefined;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseViewBox(
  value: string | undefined,
  root: XmlElement,
  context: SvgImportContext,
): { source: string; width: number; height: number } | undefined {
  if (!value) {
    return undefined;
  }

  const values = splitNumberList(value);

  if (values.length !== 4 || values[2]! <= 0 || values[3]! <= 0) {
    addIssue(context, "invalid-value", `Invalid viewBox ${JSON.stringify(value)} was ignored.`, root);
    return undefined;
  }

  return {
    source: values.join(" "),
    width: values[2]!,
    height: values[3]!,
  };
}

function parseRootDimension(
  value: string | undefined,
  viewBoxDimension: number | undefined,
  fallback: number,
  attribute: "width" | "height",
  root: XmlElement,
  context: SvgImportContext,
) {
  if (value) {
    const parsed = parseSvgNumber(value);

    if (parsed !== undefined && parsed > 0) {
      return parsed;
    }

    addIssue(
      context,
      "invalid-value",
      `Root ${attribute}=${JSON.stringify(value)} cannot be represented numerically; using ${viewBoxDimension ?? fallback}.`,
      root,
    );
  }

  return viewBoxDimension && viewBoxDimension > 0 ? viewBoxDimension : Math.max(1, fallback);
}

function parseGradients(root: XmlElement, context: SvgImportContext): FlatGradient[] {
  const gradients: FlatGradient[] = [];

  visitElements(root, (element) => {
    if (localName(element.name) !== "defs") {
      return;
    }

    for (const resource of element.children) {
      const name = localName(resource.name);

      if (name === "linearGradient" || name === "radialGradient") {
        const gradient = parseGradient(resource, context);
        if (gradient) {
          gradients.push(gradient);
        }
        continue;
      }

      if (["title", "desc", "metadata"].includes(name)) {
        continue;
      }

      addIssue(
        context,
        "unsupported-resource",
        `<${name}> inside <defs> is not represented by the current flat-design resource model and was skipped.`,
        resource,
      );
    }
  });

  return gradients;
}

function parseGradient(element: XmlElement, context: SvgImportContext): FlatGradient | undefined {
  const name = localName(element.name);
  const id = element.attributes.id?.trim();

  if (!id) {
    addIssue(context, "invalid-value", `<${name}> without an id was skipped.`, element);
    return undefined;
  }

  for (const attribute of ["gradientTransform", "gradientUnits", "href", "spreadMethod", "xlink:href"]) {
    if (element.attributes[attribute] !== undefined) {
      addIssue(
        context,
        "unsupported-resource",
        `${attribute} on <${name}> is not represented and was not imported.`,
        element,
      );
    }
  }

  const stops = element.children
    .filter((child) => localName(child.name) === "stop")
    .map((stop) => parseGradientStop(stop, context))
    .filter((stop): stop is FlatGradientStop => Boolean(stop));

  if (name === "linearGradient") {
    return {
      id,
      kind: "linear",
      stops,
      x1: parseFlatLength(element.attributes.x1),
      y1: parseFlatLength(element.attributes.y1),
      x2: parseFlatLength(element.attributes.x2),
      y2: parseFlatLength(element.attributes.y2),
    };
  }

  return {
    id,
    kind: "radial",
    stops,
    cx: parseFlatLength(element.attributes.cx),
    cy: parseFlatLength(element.attributes.cy),
    r: parseFlatLength(element.attributes.r),
    fx: parseFlatLength(element.attributes.fx),
    fy: parseFlatLength(element.attributes.fy),
  };
}

function parseGradientStop(
  element: XmlElement,
  context: SvgImportContext,
): FlatGradientStop | undefined {
  const offset = element.attributes.offset;

  if (!offset) {
    addIssue(context, "invalid-value", "<stop> without offset was skipped.", element);
    return undefined;
  }

  const styles = parseInlineStyle(element, context);
  const color = readPresentation(element, styles, "stop-color") ?? "black";
  const opacity = parseOptionalNumber(
    readPresentation(element, styles, "stop-opacity"),
    "stop-opacity",
    element,
    context,
  );

  return {
    offset: parseFlatLength(offset) ?? offset,
    color,
    opacity,
  };
}

function parseFlatLength(value: string | undefined): number | string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return parseSvgNumber(value) ?? value.trim();
}

function parseAnimations(element: XmlElement, context: SvgImportContext): FlatAnimation[] {
  const animations: FlatAnimation[] = [];

  for (const child of element.children) {
    const name = localName(child.name);

    if (name === "animate") {
      const animation = parseAttributeAnimation(child, context);
      if (animation) {
        animations.push(animation);
      }
      continue;
    }

    if (name === "animateTransform") {
      const animation = parseTransformAnimation(child, context);
      if (animation) {
        animations.push(animation);
      }
      continue;
    }

    if (name === "animateMotion" || name === "set") {
      addIssue(
        context,
        "unsupported-animation",
        `<${name}> is not represented by the current FlatAnimation model and was skipped.`,
        child,
      );
    }
  }

  return animations;
}

function parseAttributeAnimation(
  element: XmlElement,
  context: SvgImportContext,
): FlatAnimation | undefined {
  const attributeName = element.attributes.attributeName?.trim();

  if (!attributeName) {
    addIssue(context, "invalid-value", "<animate> without attributeName was skipped.", element);
    return undefined;
  }

  if (!staticFrameAttributeNames.has(attributeName)) {
    addIssue(
      context,
      "unsupported-animation",
      `<animate attributeName=${JSON.stringify(attributeName)}> cannot currently be sampled into a static FlatShape frame and was skipped.`,
      element,
    );
    return undefined;
  }

  const rawValues = readAnimationValues(element, context);
  if (!rawValues) {
    return undefined;
  }

  const values = rawValues.map((value) => Number(value));
  if (values.some((value) => !Number.isFinite(value))) {
    addIssue(
      context,
      "invalid-value",
      `<animate attributeName=${JSON.stringify(attributeName)}> requires numeric values for deterministic frame export.`,
      element,
    );
    return undefined;
  }

  const timing = parseAnimationTiming(element, context);
  if (!validateAnimationTiming(timing, values.length, element, context)) {
    return undefined;
  }

  if (timing.additive === "sum") {
    addIssue(
      context,
      "unsupported-animation",
      "Additive attribute animation cannot currently be sampled into a static FlatShape frame and was skipped.",
      element,
    );
    return undefined;
  }

  return {
    kind: "attribute",
    attributeName,
    values,
    ...timing,
  };
}

function parseTransformAnimation(
  element: XmlElement,
  context: SvgImportContext,
): FlatTransformAnimation | undefined {
  const attributeName = element.attributes.attributeName?.trim();
  const transformType = element.attributes.type?.trim();

  if (attributeName !== "transform") {
    addIssue(
      context,
      "invalid-value",
      `<animateTransform> must target attributeName="transform"; ${JSON.stringify(attributeName)} was skipped.`,
      element,
    );
    return undefined;
  }

  if (transformType !== "translate" && transformType !== "scale" && transformType !== "rotate") {
    addIssue(
      context,
      "unsupported-animation",
      `<animateTransform type=${JSON.stringify(transformType)}> is not supported; use translate, scale, or rotate.`,
      element,
    );
    return undefined;
  }

  const rawValues = readAnimationValues(element, context);
  if (!rawValues) {
    return undefined;
  }

  const timing = parseAnimationTiming(element, context);
  if (!validateAnimationTiming(timing, rawValues.length, element, context)) {
    return undefined;
  }

  if (transformType === "translate") {
    const values: Array<{ x: number; y: number }> = [];

    for (const value of rawValues) {
      const numbers = splitNumberList(value);
      if (numbers.length < 1 || numbers.length > 2) {
        addIssue(
          context,
          "invalid-value",
          `Invalid translate animation value ${JSON.stringify(value)}.`,
          element,
        );
        return undefined;
      }
      values.push({ x: numbers[0]!, y: numbers[1] ?? 0 });
    }

    return { kind: "transform", transformType: "translate", values, ...timing };
  }

  if (transformType === "scale") {
    const values: Array<number | { x: number; y: number }> = [];

    for (const value of rawValues) {
      const numbers = splitNumberList(value);
      if (numbers.length < 1 || numbers.length > 2) {
        addIssue(
          context,
          "invalid-value",
          `Invalid scale animation value ${JSON.stringify(value)}.`,
          element,
        );
        return undefined;
      }
      values.push(numbers.length === 1 ? numbers[0]! : { x: numbers[0]!, y: numbers[1]! });
    }

    return { kind: "transform", transformType: "scale", values, ...timing };
  }

  const values: Array<number | { angle: number; cx: number; cy: number }> = [];
  for (const value of rawValues) {
    const numbers = splitNumberList(value);
    if (numbers.length !== 1 && numbers.length !== 3) {
      addIssue(
        context,
        "invalid-value",
        `Invalid rotate animation value ${JSON.stringify(value)}.`,
        element,
      );
      return undefined;
    }
    values.push(
      numbers.length === 1
        ? numbers[0]!
        : { angle: numbers[0]!, cx: numbers[1]!, cy: numbers[2]! },
    );
  }

  return { kind: "transform", transformType: "rotate", values, ...timing };
}

function readAnimationValues(
  element: XmlElement,
  context: SvgImportContext,
): string[] | undefined {
  const values = element.attributes.values
    ?.split(";")
    .map((value) => value.trim())
    .filter(Boolean);

  if (values && values.length > 0) {
    return values;
  }

  const from = element.attributes.from?.trim();
  const to = element.attributes.to?.trim();

  if (from && to) {
    return [from, to];
  }

  addIssue(
    context,
    "unsupported-animation",
    `<${localName(element.name)}> needs values or both from/to to enter the FlatAnimation model.`,
    element,
  );
  return undefined;
}

function parseAnimationTiming(
  element: XmlElement,
  context: SvgImportContext,
): FlatAnimationTiming {
  const calcMode = element.attributes.calcMode;
  const additive = element.attributes.additive;
  const fill = element.attributes.fill;
  const keySplines = parseKeySplines(element.attributes.keySplines, element, context);
  const timing: FlatAnimationTiming = {
    begin: element.attributes.begin,
    dur: element.attributes.dur,
    // SVG repeats once by default. FlatAnimation's historical serializer defaults
    // an omitted repeatCount to indefinite, so imported SVG must make "1" explicit.
    repeatCount: element.attributes.repeatCount ?? "1",
    keyTimes: parseNumberSequence(element.attributes.keyTimes, "keyTimes", element, context),
    keySplines,
  };

  if (calcMode !== undefined) {
    if (calcMode === "discrete" || calcMode === "linear" || calcMode === "paced" || calcMode === "spline") {
      timing.calcMode = calcMode;
    } else {
      addIssue(context, "invalid-value", `Unsupported calcMode ${JSON.stringify(calcMode)} was ignored.`, element);
    }
  }

  if (additive !== undefined) {
    if (additive === "replace" || additive === "sum") {
      timing.additive = additive;
    } else {
      addIssue(context, "invalid-value", `Unsupported additive ${JSON.stringify(additive)} was ignored.`, element);
    }
  }

  if (fill !== undefined) {
    if (fill === "freeze" || fill === "remove") {
      timing.fillMode = fill;
    } else {
      addIssue(
        context,
        "invalid-value",
        `Unsupported animation fill ${JSON.stringify(fill)} was ignored.`,
        element,
      );
    }
  }

  return timing;
}

function validateAnimationTiming(
  timing: FlatAnimationTiming,
  valueCount: number,
  element: XmlElement,
  context: SvgImportContext,
) {
  if (hasUnsupportedAnimationAttributes(element, context)) {
    return false;
  }

  if (timing.begin !== undefined && parseSimpleClockValue(timing.begin) === undefined) {
    addIssue(
      context,
      "unsupported-animation",
      `begin=${JSON.stringify(timing.begin)} uses event/sync timing that deterministic frame export does not support.`,
      element,
    );
    return false;
  }

  const durationMs = timing.dur === undefined ? undefined : parseSimpleClockValue(timing.dur);
  if (durationMs === undefined || durationMs <= 0) {
    addIssue(
      context,
      "unsupported-animation",
      `dur=${JSON.stringify(timing.dur)} must be a positive clock value such as "800ms" or "1.5s".`,
      element,
    );
    return false;
  }

  if (!isSupportedRepeatCount(timing.repeatCount)) {
    addIssue(
      context,
      "unsupported-animation",
      `repeatCount=${JSON.stringify(timing.repeatCount)} cannot be sampled deterministically.`,
      element,
    );
    return false;
  }

  if (timing.calcMode === "paced") {
    addIssue(
      context,
      "unsupported-animation",
      "calcMode=" + JSON.stringify("paced") + " is preserved by SVG but is not yet reproduced by the deterministic sampler, so this animation was skipped.",
      element,
    );
    return false;
  }

  if (timing.keyTimes && !isValidKeyTimes(timing.keyTimes, valueCount)) {
    addIssue(
      context,
      "invalid-value",
      `keyTimes must contain ${valueCount} ordered values from 0 through 1.`,
      element,
    );
    return false;
  }

  if (timing.calcMode === "spline") {
    if (!timing.keySplines || timing.keySplines.length !== Math.max(0, valueCount - 1)) {
      addIssue(
        context,
        "invalid-value",
        `Spline animation requires ${Math.max(0, valueCount - 1)} valid keySplines segments.`,
        element,
      );
      return false;
    }
  }

  return true;
}

function hasUnsupportedAnimationAttributes(element: XmlElement, context: SvgImportContext) {
  const unsupported: string[] = [];

  if (element.attributes.href !== undefined || element.attributes["xlink:href"] !== undefined) {
    unsupported.push("href");
  }
  if (element.attributes.accumulate !== undefined && element.attributes.accumulate !== "none") {
    unsupported.push("accumulate");
  }
  if (element.attributes.restart !== undefined && element.attributes.restart !== "always") {
    unsupported.push("restart");
  }
  if (element.attributes.min !== undefined) {
    unsupported.push("min");
  }
  if (element.attributes.max !== undefined) {
    unsupported.push("max");
  }

  if (unsupported.length === 0) {
    return false;
  }

  addIssue(
    context,
    "unsupported-animation",
    `Animation attributes ${unsupported.join(", ")} are not represented by FlatAnimation and the animation was skipped.`,
    element,
  );
  return true;
}

function parseSimpleClockValue(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^([+-]?(?:\d+\.?\d*|\.\d+))(ms|s)?$/i);

  if (!match) {
    return undefined;
  }

  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) {
    return undefined;
  }

  return match[2]?.toLowerCase() === "ms" ? amount : amount * 1_000;
}

function isSupportedRepeatCount(value: string | undefined) {
  if (value === "indefinite") {
    return true;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

function isValidKeyTimes(values: number[], valueCount: number) {
  if (values.length !== valueCount || values.length === 0) {
    return false;
  }

  if (values[0] !== 0 || values.at(-1) !== 1) {
    return false;
  }

  return values.every(
    (value, index) =>
      value >= 0 &&
      value <= 1 &&
      (index === 0 || value >= values[index - 1]!),
  );
}

function parseKeySplines(
  value: string | undefined,
  element: XmlElement,
  context: SvgImportContext,
) {
  if (!value) {
    return undefined;
  }

  const segments = value
    .split(";")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (
    segments.some((segment) => {
      const numbers = splitNumberList(segment);
      return numbers.length !== 4 || numbers.some((number) => number < 0 || number > 1);
    })
  ) {
    addIssue(
      context,
      "invalid-value",
      `Invalid keySplines sequence ${JSON.stringify(value)} was ignored.`,
      element,
    );
    return undefined;
  }

  return segments.map((segment) => splitNumberList(segment).join(" "));
}

function parseNumberSequence(
  value: string | undefined,
  attribute: string,
  element: XmlElement,
  context: SvgImportContext,
) {
  if (!value) {
    return undefined;
  }

  const segments = value.split(";").map((segment) => segment.trim());
  if (segments.some((segment) => segment.length === 0)) {
    addIssue(
      context,
      "invalid-value",
      `Invalid ${attribute} sequence ${JSON.stringify(value)} was ignored.`,
      element,
    );
    return undefined;
  }

  const values = segments.map(Number);
  if (values.some((number) => !Number.isFinite(number))) {
    addIssue(
      context,
      "invalid-value",
      `Invalid ${attribute} sequence ${JSON.stringify(value)} was ignored.`,
      element,
    );
    return undefined;
  }

  return values;
}

function polylineToPath(points: string | undefined) {
  if (!points) {
    return undefined;
  }

  const numbers = splitNumberList(points);
  if (numbers.length < 4 || numbers.length % 2 !== 0) {
    return undefined;
  }

  const commands: string[] = [];
  for (let index = 0; index < numbers.length; index += 2) {
    commands.push(`${index === 0 ? "M" : "L"} ${numbers[index]} ${numbers[index + 1]}`);
  }

  return commands.join(" ");
}

function isValidPointList(points: string, minimumPointCount: number) {
  const numbers = splitNumberList(points);
  return numbers.length >= minimumPointCount * 2 && numbers.length % 2 === 0;
}

function splitNumberList(value: string) {
  const segments = value
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
  const numbers = segments.map(Number);

  return numbers.some((number) => !Number.isFinite(number)) ? [] : numbers;
}

function visitElements(element: XmlElement, visitor: (element: XmlElement) => void) {
  visitor(element);
  element.children.forEach((child) => visitElements(child, visitor));
}

function findDirectChild(parent: XmlElement, name: string) {
  return parent.children.find((child) => localName(child.name) === name);
}

function collectText(element: XmlElement): string {
  return [element.text.join(""), ...element.children.map(collectText)].join("");
}

function addIssue(
  context: SvgImportContext,
  code: FlatSvgImportIssueCode,
  message: string,
  element?: XmlElement,
) {
  context.issues.push({
    code,
    message,
    element: element ? localName(element.name) : undefined,
    id: element?.attributes.id,
  });
}

function localName(name: string) {
  return name.split(":").at(-1) ?? name;
}

function parseXml(markup: string): XmlElement {
  if (!markup.trim()) {
    throw new FlatSvgImportError("SVG markup is empty.");
  }

  const documentRoot: XmlElement = {
    name: "#document",
    attributes: {},
    children: [],
    text: [],
  };
  const stack: XmlElement[] = [documentRoot];
  let index = 0;

  while (index < markup.length) {
    if (markup[index] !== "<") {
      const nextTag = markup.indexOf("<", index);
      const end = nextTag < 0 ? markup.length : nextTag;
      stack.at(-1)!.text.push(decodeXmlEntities(markup.slice(index, end)));
      index = end;
      continue;
    }

    if (markup.startsWith("<!--", index)) {
      const end = markup.indexOf("-->", index + 4);
      if (end < 0) {
        throw new FlatSvgImportError("Unterminated SVG comment.");
      }
      index = end + 3;
      continue;
    }

    if (markup.startsWith("<?", index)) {
      const end = markup.indexOf("?>", index + 2);
      if (end < 0) {
        throw new FlatSvgImportError("Unterminated XML processing instruction.");
      }
      index = end + 2;
      continue;
    }

    if (markup.startsWith("<![CDATA[", index)) {
      const end = markup.indexOf("]]>", index + 9);
      if (end < 0) {
        throw new FlatSvgImportError("Unterminated CDATA section.");
      }
      stack.at(-1)!.text.push(markup.slice(index + 9, end));
      index = end + 3;
      continue;
    }

    if (markup.startsWith("<!", index)) {
      throw new FlatSvgImportError(
        "DOCTYPE and other XML declarations are not accepted by the SVG importer.",
      );
    }

    const tagEnd = findTagEnd(markup, index + 1);
    if (tagEnd < 0) {
      throw new FlatSvgImportError("Unterminated SVG tag.");
    }

    const rawTag = markup.slice(index + 1, tagEnd).trim();
    index = tagEnd + 1;

    if (!rawTag) {
      continue;
    }

    if (rawTag.startsWith("/")) {
      const closingName = rawTag.slice(1).trim();
      const current = stack.at(-1);

      if (!current || current === documentRoot || current.name !== closingName) {
        throw new FlatSvgImportError(`Unexpected closing tag </${closingName}>.`);
      }

      stack.pop();
      continue;
    }

    const selfClosing = rawTag.endsWith("/");
    const tagBody = selfClosing ? rawTag.slice(0, -1).trimEnd() : rawTag;
    const nameMatch = tagBody.match(/^([^\s/>]+)/);

    if (!nameMatch) {
      throw new FlatSvgImportError(`Invalid SVG tag <${rawTag}>.`);
    }

    const name = nameMatch[1]!;
    const element: XmlElement = {
      name,
      attributes: parseXmlAttributes(tagBody.slice(name.length)),
      children: [],
      text: [],
    };

    stack.at(-1)!.children.push(element);
    if (!selfClosing) {
      stack.push(element);
    }
  }

  if (stack.length !== 1) {
    throw new FlatSvgImportError(`Unclosed SVG tag <${stack.at(-1)!.name}>.`);
  }

  if (documentRoot.children.length !== 1) {
    throw new FlatSvgImportError("Expected exactly one SVG document element.");
  }

  return documentRoot.children[0]!;
}

function findTagEnd(markup: string, startIndex: number) {
  let quote: '"' | "'" | undefined;

  for (let index = startIndex; index < markup.length; index += 1) {
    const character = markup[index];

    if (quote) {
      if (character === quote) {
        quote = undefined;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }

    if (character === ">") {
      return index;
    }
  }

  return -1;
}

function parseXmlAttributes(source: string) {
  const attributes: Record<string, string> = {};
  let index = 0;

  while (index < source.length) {
    while (/\s/.test(source[index] ?? "")) {
      index += 1;
    }

    if (index >= source.length) {
      break;
    }

    const nameStart = index;
    while (index < source.length && !/[\s=]/.test(source[index]!)) {
      index += 1;
    }
    const name = source.slice(nameStart, index);

    while (/\s/.test(source[index] ?? "")) {
      index += 1;
    }

    if (source[index] !== "=") {
      throw new FlatSvgImportError(`Attribute ${name} is missing '='.`);
    }
    index += 1;

    while (/\s/.test(source[index] ?? "")) {
      index += 1;
    }

    const quote = source[index];
    if (quote !== '"' && quote !== "'") {
      throw new FlatSvgImportError(`Attribute ${name} must use quoted XML syntax.`);
    }
    index += 1;

    const valueStart = index;
    const valueEnd = source.indexOf(quote, valueStart);
    if (valueEnd < 0) {
      throw new FlatSvgImportError(`Attribute ${name} has an unterminated value.`);
    }

    attributes[name] = decodeXmlEntities(source.slice(valueStart, valueEnd));
    index = valueEnd + 1;
  }

  return attributes;
}

function decodeXmlEntities(value: string) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|apos|gt|lt|quot);/gi, (match, entity: string) => {
    switch (entity.toLowerCase()) {
      case "amp":
        return "&";
      case "apos":
        return "'";
      case "gt":
        return ">";
      case "lt":
        return "<";
      case "quot":
        return '"';
      default: {
        const codePoint = entity.toLowerCase().startsWith("#x")
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10);

        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
      }
    }
  });
}
