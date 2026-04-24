import { compileFlatMotion } from "./core";
import {
  formatAnimationValues,
  formatKeySplines,
  formatKeyTimes,
  formatPointList,
  getSceneViewBox,
} from "./scene-utils";
import type {
  FlatAnimation,
  FlatDesignScene,
  FlatGradient,
  FlatLayer,
  FlatShape,
} from "./scene-types";

export type RenderFlatSceneOptions = {
  width?: number | string;
  height?: number | string;
  includeXmlns?: boolean;
  preserveAspectRatio?: string;
};

function escapeAttribute(value: number | string): string {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function escapeText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function serializeAttributes(attributes: Record<string, number | string | undefined>): string {
  return Object.entries(attributes)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}="${escapeAttribute(value!)}"`)
    .join(" ");
}

function serializeAnimation(animation: FlatAnimation): string {
  const timing = {
    begin: animation.begin ?? "0s",
    dur: animation.dur ?? "6s",
    repeatCount: animation.repeatCount ?? "indefinite",
    calcMode: animation.calcMode,
    keyTimes: formatKeyTimes(animation.keyTimes),
    keySplines: formatKeySplines(animation.keySplines),
    additive: animation.kind === "transform" ? animation.additive : undefined,
    fill: animation.fillMode,
    values: formatAnimationValues(animation),
  };

  if (animation.kind === "attribute") {
    return `<animate ${serializeAttributes({
      attributeName: animation.attributeName,
      ...timing,
    })} />`;
  }

  return `<animateTransform ${serializeAttributes({
    attributeName: "transform",
    type: animation.transformType,
    ...timing,
  })} />`;
}

function serializeGradient(gradient: FlatGradient): string {
  const stops = gradient.stops
    .map(
      (stop) =>
        `<stop ${serializeAttributes({
          offset: stop.offset,
          "stop-color": stop.color,
          "stop-opacity": stop.opacity,
        })} />`,
    )
    .join("");

  if (gradient.kind === "linear") {
    return `<linearGradient ${serializeAttributes({
      id: gradient.id,
      x1: gradient.x1,
      y1: gradient.y1,
      x2: gradient.x2,
      y2: gradient.y2,
    })}>${stops}</linearGradient>`;
  }

  return `<radialGradient ${serializeAttributes({
    id: gradient.id,
    cx: gradient.cx,
    cy: gradient.cy,
    r: gradient.r,
    fx: gradient.fx,
    fy: gradient.fy,
  })}>${stops}</radialGradient>`;
}

function serializeAnimations(animations?: FlatAnimation[]): string {
  return animations?.map(serializeAnimation).join("") ?? "";
}

function getShapeAnimations(shape: FlatShape): FlatAnimation[] | undefined {
  const motionAnimations = shape.motion ? compileFlatMotion(shape.motion) : [];
  const animations = [...motionAnimations, ...(shape.animations ?? [])];

  return animations.length > 0 ? animations : undefined;
}

function serializeShape(shape: FlatShape): string {
  const common = {
    id: shape.id,
    class: shape.className,
    fill: shape.fill,
    stroke: shape.stroke,
    "stroke-width": shape.strokeWidth,
    "stroke-linecap": shape.strokeLinecap,
    "stroke-linejoin": shape.strokeLinejoin,
    opacity: shape.opacity,
    transform: shape.transform,
  };
  const animations = serializeAnimations(getShapeAnimations(shape));

  switch (shape.kind) {
    case "group":
      return `<g ${serializeAttributes(common)}>${shape.children
        .map(serializeShape)
        .join("")}${animations}</g>`;
    case "rect":
      return `<rect ${serializeAttributes({
        ...common,
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        rx: shape.rx,
        ry: shape.ry,
      })}>${animations}</rect>`;
    case "circle":
      return `<circle ${serializeAttributes({
        ...common,
        cx: shape.cx,
        cy: shape.cy,
        r: shape.r,
      })}>${animations}</circle>`;
    case "ellipse":
      return `<ellipse ${serializeAttributes({
        ...common,
        cx: shape.cx,
        cy: shape.cy,
        rx: shape.rx,
        ry: shape.ry,
      })}>${animations}</ellipse>`;
    case "path":
      return `<path ${serializeAttributes({
        ...common,
        d: shape.d,
      })}>${animations}</path>`;
    case "polygon":
      return `<polygon ${serializeAttributes({
        ...common,
        points: formatPointList(shape.points),
      })}>${animations}</polygon>`;
    case "line":
      return `<line ${serializeAttributes({
        ...common,
        x1: shape.x1,
        y1: shape.y1,
        x2: shape.x2,
        y2: shape.y2,
      })}>${animations}</line>`;
  }
}

function serializeLayer(layer: FlatLayer): string {
  return `<g ${serializeAttributes({
    id: layer.id,
    class: layer.className,
    opacity: layer.opacity,
    transform: layer.transform,
  })}>${layer.shapes.map(serializeShape).join("")}</g>`;
}

export function renderFlatSceneToSvg(
  scene: FlatDesignScene,
  options: RenderFlatSceneOptions = {},
): string {
  const gradients = scene.gradients?.length
    ? `<defs>${scene.gradients.map(serializeGradient).join("")}</defs>`
    : "";
  const width = options.width ?? scene.width;
  const height = options.height ?? scene.height;
  const xmlns = options.includeXmlns === false ? undefined : "http://www.w3.org/2000/svg";
  const background = scene.background
    ? `<rect width="100%" height="100%" fill="${escapeAttribute(scene.background)}" />`
    : "";

  return `<svg ${serializeAttributes({
    xmlns,
    viewBox: getSceneViewBox(scene),
    width,
    height,
    preserveAspectRatio: options.preserveAspectRatio ?? "xMidYMid meet",
    role: "img",
  })}>${scene.title ? `<title>${escapeText(scene.title)}</title>` : ""}${
    scene.description ? `<desc>${escapeText(scene.description)}</desc>` : ""
  }${gradients}${background}${scene.layers.map(serializeLayer).join("")}</svg>`;
}
