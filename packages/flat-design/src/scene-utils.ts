import type { FlatAnimation, FlatDesignScene, FlatPolygon } from "./scene-types";

export function formatAnimationValues(animation: FlatAnimation): string {
  if (animation.kind === "attribute") {
    return animation.values.map(String).join(";");
  }

  if (animation.transformType === "translate") {
    return animation.values.map((value) => `${value.x} ${value.y}`).join(";");
  }

  if (animation.transformType === "scale") {
    return animation.values
      .map((value) => (typeof value === "number" ? `${value} ${value}` : `${value.x} ${value.y}`))
      .join(";");
  }

  return animation.values
    .map((value) =>
      typeof value === "number" ? `${value}` : `${value.angle} ${value.cx} ${value.cy}`,
    )
    .join(";");
}

export function formatKeySplines(keySplines?: string[]): string | undefined {
  return keySplines?.join(";");
}

export function formatKeyTimes(keyTimes?: number[]): string | undefined {
  return keyTimes?.map(String).join(";");
}

export function formatPointList(points: FlatPolygon["points"]): string {
  return typeof points === "string"
    ? points
    : points.map((point) => `${point.x},${point.y}`).join(" ");
}

export function getSceneViewBox(
  scene: Pick<FlatDesignScene, "height" | "viewBox" | "width">,
): string {
  return scene.viewBox ?? `0 0 ${scene.width} ${scene.height}`;
}
