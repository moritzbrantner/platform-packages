import { useId, type CSSProperties, type ReactNode } from "react";

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

export type FlatSceneProps = {
  scene: FlatDesignScene;
  className?: string;
  style?: CSSProperties;
  width?: number | string;
  height?: number | string;
  preserveAspectRatio?: string;
};

function renderAnimation(animation: FlatAnimation, key: string) {
  const commonProps = {
    begin: animation.begin ?? "0s",
    dur: animation.dur ?? "6s",
    repeatCount: animation.repeatCount ?? "indefinite",
    calcMode: animation.calcMode,
    keyTimes: formatKeyTimes(animation.keyTimes),
    keySplines: formatKeySplines(animation.keySplines),
    fill: animation.fillMode,
    values: formatAnimationValues(animation),
  };

  if (animation.kind === "attribute") {
    return (
      <animate
        key={key}
        attributeName={animation.attributeName}
        {...commonProps}
      />
    );
  }

  return (
    <animateTransform
      key={key}
      attributeName="transform"
      additive={animation.additive}
      type={animation.transformType}
      {...commonProps}
    />
  );
}

function renderAnimations(animations?: FlatAnimation[]) {
  return animations?.map((animation, index) =>
    renderAnimation(animation, `animation-${index}`),
  );
}

function renderGradient(gradient: FlatGradient, key: string) {
  const stops = gradient.stops.map((stop, index) => (
    <stop
      key={`${key}-stop-${index}`}
      offset={stop.offset}
      stopColor={stop.color}
      stopOpacity={stop.opacity}
    />
  ));

  if (gradient.kind === "linear") {
    return (
      <linearGradient
        key={key}
        id={gradient.id}
        x1={gradient.x1}
        y1={gradient.y1}
        x2={gradient.x2}
        y2={gradient.y2}
      >
        {stops}
      </linearGradient>
    );
  }

  return (
    <radialGradient
      key={key}
      id={gradient.id}
      cx={gradient.cx}
      cy={gradient.cy}
      r={gradient.r}
      fx={gradient.fx}
      fy={gradient.fy}
    >
      {stops}
    </radialGradient>
  );
}

function getCommonShapeProps(shape: FlatShape) {
  return {
    id: shape.id,
    className: shape.className,
    fill: shape.fill,
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    strokeLinecap: shape.strokeLinecap,
    strokeLinejoin: shape.strokeLinejoin,
    opacity: shape.opacity,
    transform: shape.transform,
  };
}

function renderShape(shape: FlatShape, key: string): ReactNode {
  const commonProps = getCommonShapeProps(shape);
  const animations = renderAnimations(shape.animations);

  switch (shape.kind) {
    case "group":
      return (
        <g key={key} {...commonProps}>
          {shape.children.map((child, index) => renderShape(child, `${key}-${index}`))}
          {animations}
        </g>
      );
    case "rect":
      return (
        <rect
          key={key}
          {...commonProps}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          rx={shape.rx}
          ry={shape.ry}
        >
          {animations}
        </rect>
      );
    case "circle":
      return (
        <circle key={key} {...commonProps} cx={shape.cx} cy={shape.cy} r={shape.r}>
          {animations}
        </circle>
      );
    case "ellipse":
      return (
        <ellipse
          key={key}
          {...commonProps}
          cx={shape.cx}
          cy={shape.cy}
          rx={shape.rx}
          ry={shape.ry}
        >
          {animations}
        </ellipse>
      );
    case "path":
      return (
        <path key={key} {...commonProps} d={shape.d}>
          {animations}
        </path>
      );
    case "polygon":
      return (
        <polygon key={key} {...commonProps} points={formatPointList(shape.points)}>
          {animations}
        </polygon>
      );
    case "line":
      return (
        <line
          key={key}
          {...commonProps}
          x1={shape.x1}
          y1={shape.y1}
          x2={shape.x2}
          y2={shape.y2}
        >
          {animations}
        </line>
      );
  }
}

function renderLayer(layer: FlatLayer, key: string) {
  return (
    <g
      key={key}
      id={layer.id}
      className={layer.className}
      opacity={layer.opacity}
      transform={layer.transform}
    >
      {layer.shapes.map((shape, index) => renderShape(shape, `${key}-shape-${index}`))}
    </g>
  );
}

export function FlatScene({
  scene,
  className,
  height,
  preserveAspectRatio = "xMidYMid meet",
  style,
  width,
}: FlatSceneProps) {
  const titleId = useId();
  const descriptionId = useId();
  const labelledBy = [scene.title ? titleId : undefined, scene.description ? descriptionId : undefined]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      aria-labelledby={labelledBy || undefined}
      className={className}
      height={height ?? scene.height}
      preserveAspectRatio={preserveAspectRatio}
      role="img"
      style={style}
      viewBox={getSceneViewBox(scene)}
      width={width ?? scene.width}
    >
      {scene.title ? <title id={titleId}>{scene.title}</title> : null}
      {scene.description ? <desc id={descriptionId}>{scene.description}</desc> : null}
      {scene.gradients?.length ? (
        <defs>{scene.gradients.map((gradient, index) => renderGradient(gradient, `gradient-${index}`))}</defs>
      ) : null}
      {scene.background ? <rect width="100%" height="100%" fill={scene.background} /> : null}
      {scene.layers.map((layer, index) => renderLayer(layer, `layer-${index}`))}
    </svg>
  );
}
