import {
  getFlatNode,
  insertFlatNode,
  removeFlatNode,
  updateFlatNode,
  type FlatNodeInsertPosition,
} from "./core";
import type {
  FlatDesignScene,
  FlatGroup,
  FlatLayer,
  FlatNodePath,
  FlatNodeRef,
  FlatShape,
} from "./scene-types";

export type FlatBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FlatPrimitiveKind = "circle" | "ellipse" | "line" | "path" | "polygon" | "rect";

export type FlatEditorCommand =
  | {
      kind: "insert-primitive";
      primitive: FlatPrimitiveKind;
      position: FlatNodeInsertPosition;
      id: string;
      x: number;
      y: number;
    }
  | { kind: "translate"; refs: FlatNodeRef[]; dx: number; dy: number }
  | { kind: "resize"; ref: FlatNodeRef; width: number; height: number }
  | { kind: "rotate"; refs: FlatNodeRef[]; angle: number }
  | { kind: "delete"; refs: FlatNodeRef[] }
  | { kind: "duplicate"; refs: FlatNodeRef[]; idSuffix?: string }
  | { kind: "group"; refs: FlatNodeRef[]; id: string }
  | { kind: "ungroup"; ref: FlatNodeRef }
  | { kind: "add-layer"; id?: string; index?: number }
  | { kind: "delete-layer"; layerIndex: number }
  | { kind: "rename-layer"; layerIndex: number; id?: string }
  | { kind: "move-layer"; layerIndex: number; toIndex: number }
  | { kind: "move-to-layer"; refs: FlatNodeRef[]; layerIndex: number };

const minimumSize = 1;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isGroup(shape: FlatShape): shape is FlatGroup {
  return shape.kind === "group";
}

function toPathKey(path: FlatNodePath) {
  return path.join(".");
}

export function toFlatNodeRefKey(ref: FlatNodeRef) {
  return `${ref.layerIndex}:${toPathKey(ref.path)}`;
}

export function flatNodeRefsEqual(left: FlatNodeRef, right: FlatNodeRef) {
  return toFlatNodeRefKey(left) === toFlatNodeRefKey(right);
}

function isAncestorPath(parent: FlatNodePath, child: FlatNodePath) {
  return (
    parent.length < child.length &&
    parent.every((segment, index) => child[index] === segment)
  );
}

/**
 * Removes duplicates and descendant refs when their ancestor is already selected.
 * This keeps destructive multi-node commands stable when a group and one of its
 * children are both present in the selection.
 */
export function normalizeFlatNodeRefs(refs: readonly FlatNodeRef[]) {
  const unique = new Map(refs.map((ref) => [toFlatNodeRefKey(ref), ref]));
  const values = [...unique.values()];

  return values.filter(
    (candidate) =>
      !values.some(
        (possibleAncestor) =>
          possibleAncestor.layerIndex === candidate.layerIndex &&
          isAncestorPath(possibleAncestor.path, candidate.path),
      ),
  );
}

function compareRefsForRemoval(left: FlatNodeRef, right: FlatNodeRef) {
  if (left.layerIndex !== right.layerIndex) {
    return right.layerIndex - left.layerIndex;
  }

  const leftParent = left.path.slice(0, -1).join(".");
  const rightParent = right.path.slice(0, -1).join(".");
  if (leftParent !== rightParent) {
    return right.path.length - left.path.length || rightParent.localeCompare(leftParent);
  }

  return (right.path.at(-1) ?? -1) - (left.path.at(-1) ?? -1);
}

function parsePointString(points: string) {
  const values = points.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi)?.map(Number) ?? [];
  if (values.length < 2 || values.length % 2 !== 0 || values.some((value) => !Number.isFinite(value))) {
    return undefined;
  }

  const parsed: Array<{ x: number; y: number }> = [];
  for (let index = 0; index < values.length; index += 2) {
    parsed.push({ x: values[index]!, y: values[index + 1]! });
  }
  return parsed;
}

function formatPoints(points: Array<{ x: number; y: number }>) {
  return points.map((point) => `${round(point.x)},${round(point.y)}`).join(" ");
}

function pathApproximatePoints(d: string) {
  const values = d.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi)?.map(Number) ?? [];
  if (values.length < 2) {
    return undefined;
  }

  const points: Array<{ x: number; y: number }> = [];
  for (let index = 0; index + 1 < values.length; index += 2) {
    const x = values[index]!;
    const y = values[index + 1]!;
    if (Number.isFinite(x) && Number.isFinite(y)) {
      points.push({ x, y });
    }
  }
  return points.length > 0 ? points : undefined;
}

function unionBounds(bounds: FlatBounds[]) {
  if (bounds.length === 0) {
    return undefined;
  }
  const minX = Math.min(...bounds.map((bound) => bound.x));
  const minY = Math.min(...bounds.map((bound) => bound.y));
  const maxX = Math.max(...bounds.map((bound) => bound.x + bound.width));
  const maxY = Math.max(...bounds.map((bound) => bound.y + bound.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function boundsFromPoints(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return undefined;
  }
  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function getFlatShapeBounds(shape: FlatShape): FlatBounds | undefined {
  switch (shape.kind) {
    case "rect":
      return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
    case "circle":
      return { x: shape.cx - shape.r, y: shape.cy - shape.r, width: shape.r * 2, height: shape.r * 2 };
    case "ellipse":
      return {
        x: shape.cx - shape.rx,
        y: shape.cy - shape.ry,
        width: shape.rx * 2,
        height: shape.ry * 2,
      };
    case "line": {
      const x = Math.min(shape.x1, shape.x2);
      const y = Math.min(shape.y1, shape.y2);
      return {
        x,
        y,
        width: Math.max(Math.abs(shape.x2 - shape.x1), minimumSize),
        height: Math.max(Math.abs(shape.y2 - shape.y1), minimumSize),
      };
    }
    case "polygon":
      return boundsFromPoints(
        typeof shape.points === "string" ? (parsePointString(shape.points) ?? []) : shape.points,
      );
    case "path":
      return boundsFromPoints(pathApproximatePoints(shape.d) ?? []);
    case "group":
      return unionBounds(
        shape.children
          .map((child) => getFlatShapeBounds(child))
          .filter((bound): bound is FlatBounds => Boolean(bound)),
      );
  }
}

export function getFlatNodeBounds(scene: FlatDesignScene, ref: FlatNodeRef) {
  const shape = getFlatNode(scene, ref);
  return shape ? getFlatShapeBounds(shape) : undefined;
}

function round(value: number) {
  return Number(value.toFixed(3));
}

function translateTransform(transform: string | undefined, dx: number, dy: number) {
  const prefix = `translate(${round(dx)} ${round(dy)})`;
  return transform?.trim() ? `${prefix} ${transform.trim()}` : prefix;
}

export function translateFlatShape(shape: FlatShape, dx: number, dy: number): FlatShape {
  if (dx === 0 && dy === 0) {
    return shape;
  }

  switch (shape.kind) {
    case "rect":
      return { ...shape, x: shape.x + dx, y: shape.y + dy };
    case "circle":
      return { ...shape, cx: shape.cx + dx, cy: shape.cy + dy };
    case "ellipse":
      return { ...shape, cx: shape.cx + dx, cy: shape.cy + dy };
    case "line":
      return {
        ...shape,
        x1: shape.x1 + dx,
        y1: shape.y1 + dy,
        x2: shape.x2 + dx,
        y2: shape.y2 + dy,
      };
    case "polygon": {
      const points = typeof shape.points === "string" ? parsePointString(shape.points) : shape.points;
      if (!points) {
        return { ...shape, transform: translateTransform(shape.transform, dx, dy) };
      }
      const translated = points.map((point) => ({ x: point.x + dx, y: point.y + dy }));
      return {
        ...shape,
        points: typeof shape.points === "string" ? formatPoints(translated) : translated,
      };
    }
    case "path":
      return { ...shape, transform: translateTransform(shape.transform, dx, dy) };
    case "group":
      return { ...shape, children: shape.children.map((child) => translateFlatShape(child, dx, dy)) };
  }
}

function scalePoint(
  point: { x: number; y: number },
  origin: { x: number; y: number },
  scaleX: number,
  scaleY: number,
) {
  return {
    x: origin.x + (point.x - origin.x) * scaleX,
    y: origin.y + (point.y - origin.y) * scaleY,
  };
}

function scaleShapeAroundBounds(
  shape: FlatShape,
  originalBounds: FlatBounds,
  scaleX: number,
  scaleY: number,
): FlatShape {
  const origin = { x: originalBounds.x, y: originalBounds.y };

  switch (shape.kind) {
    case "rect": {
      const point = scalePoint({ x: shape.x, y: shape.y }, origin, scaleX, scaleY);
      return {
        ...shape,
        x: point.x,
        y: point.y,
        width: Math.max(minimumSize, shape.width * scaleX),
        height: Math.max(minimumSize, shape.height * scaleY),
      };
    }
    case "circle": {
      const center = scalePoint({ x: shape.cx, y: shape.cy }, origin, scaleX, scaleY);
      return {
        ...shape,
        cx: center.x,
        cy: center.y,
        r: Math.max(minimumSize / 2, shape.r * Math.max(Math.abs(scaleX), Math.abs(scaleY))),
      };
    }
    case "ellipse": {
      const center = scalePoint({ x: shape.cx, y: shape.cy }, origin, scaleX, scaleY);
      return {
        ...shape,
        cx: center.x,
        cy: center.y,
        rx: Math.max(minimumSize / 2, shape.rx * Math.abs(scaleX)),
        ry: Math.max(minimumSize / 2, shape.ry * Math.abs(scaleY)),
      };
    }
    case "line": {
      const start = scalePoint({ x: shape.x1, y: shape.y1 }, origin, scaleX, scaleY);
      const end = scalePoint({ x: shape.x2, y: shape.y2 }, origin, scaleX, scaleY);
      return { ...shape, x1: start.x, y1: start.y, x2: end.x, y2: end.y };
    }
    case "polygon": {
      const points = typeof shape.points === "string" ? parsePointString(shape.points) : shape.points;
      if (!points) {
        return shape;
      }
      const scaled = points.map((point) => scalePoint(point, origin, scaleX, scaleY));
      return { ...shape, points: typeof shape.points === "string" ? formatPoints(scaled) : scaled };
    }
    case "path": {
      const transform = `translate(${round(origin.x)} ${round(origin.y)}) scale(${round(scaleX)} ${round(scaleY)}) translate(${-round(origin.x)} ${-round(origin.y)})`;
      return { ...shape, transform: shape.transform ? `${transform} ${shape.transform}` : transform };
    }
    case "group":
      return {
        ...shape,
        children: shape.children.map((child) =>
          scaleShapeAroundBounds(child, originalBounds, scaleX, scaleY),
        ),
      };
  }
}

export function resizeFlatShape(shape: FlatShape, width: number, height: number): FlatShape {
  const bounds = getFlatShapeBounds(shape);
  if (!bounds) {
    return shape;
  }

  const safeWidth = Math.max(minimumSize, width);
  const safeHeight = Math.max(minimumSize, height);
  const scaleX = bounds.width === 0 ? 1 : safeWidth / bounds.width;
  const scaleY = bounds.height === 0 ? 1 : safeHeight / bounds.height;
  return scaleShapeAroundBounds(shape, bounds, scaleX, scaleY);
}

export function getFlatShapeRotation(shape: FlatShape) {
  const match = shape.transform?.match(/rotate\(\s*(-?(?:\d+\.?\d*|\.\d+))/i);
  return match ? Number(match[1]) : 0;
}

function withRotationTransform(
  transform: string | undefined,
  angle: number,
  center: { x: number; y: number },
) {
  const withoutRotate = (transform ?? "").replace(/\s*rotate\([^)]*\)/gi, "").trim();
  const rotate = `rotate(${round(angle)} ${round(center.x)} ${round(center.y)})`;
  return withoutRotate ? `${withoutRotate} ${rotate}` : rotate;
}

export function rotateFlatShape(shape: FlatShape, angle: number): FlatShape {
  const bounds = getFlatShapeBounds(shape);
  if (!bounds) {
    return shape;
  }
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  return { ...shape, transform: withRotationTransform(shape.transform, angle, center) };
}

export function createFlatPrimitive(
  primitive: FlatPrimitiveKind,
  id: string,
  x: number,
  y: number,
): FlatShape {
  switch (primitive) {
    case "rect":
      return { kind: "rect", id, x, y, width: 96, height: 64, fill: "#5b8def" };
    case "circle":
      return { kind: "circle", id, cx: x + 36, cy: y + 36, r: 36, fill: "#5b8def" };
    case "ellipse":
      return { kind: "ellipse", id, cx: x + 48, cy: y + 32, rx: 48, ry: 32, fill: "#5b8def" };
    case "line":
      return { kind: "line", id, x1: x, y1: y, x2: x + 96, y2: y + 64, stroke: "#1f2937", strokeWidth: 4 };
    case "polygon":
      return {
        kind: "polygon",
        id,
        points: [
          { x: x + 48, y },
          { x: x + 96, y: y + 72 },
          { x, y: y + 72 },
        ],
        fill: "#5b8def",
      };
    case "path":
      return {
        kind: "path",
        id,
        d: `M ${x} ${y + 56} C ${x + 20} ${y} ${x + 76} ${y} ${x + 96} ${y + 56} C ${x + 70} ${y + 86} ${x + 26} ${y + 86} ${x} ${y + 56} Z`,
        fill: "#5b8def",
      };
  }
}

function removeRefs(scene: FlatDesignScene, refs: readonly FlatNodeRef[]) {
  return normalizeFlatNodeRefs(refs)
    .sort(compareRefsForRemoval)
    .reduce((current, ref) => removeFlatNode(current, ref), scene);
}

function applyToRefs(
  scene: FlatDesignScene,
  refs: readonly FlatNodeRef[],
  updater: (shape: FlatShape) => FlatShape,
) {
  return normalizeFlatNodeRefs(refs).reduce(
    (current, ref) => updateFlatNode(current, ref, updater),
    scene,
  );
}

function groupSelected(scene: FlatDesignScene, refs: readonly FlatNodeRef[], id: string) {
  const normalized = normalizeFlatNodeRefs(refs);
  if (normalized.length < 2) {
    return scene;
  }

  const first = normalized[0]!;
  const parentPath = first.path.slice(0, -1);
  if (
    normalized.some(
      (ref) =>
        ref.layerIndex !== first.layerIndex ||
        toPathKey(ref.path.slice(0, -1)) !== toPathKey(parentPath),
    )
  ) {
    return scene;
  }

  const ordered = [...normalized].sort((left, right) => (left.path.at(-1) ?? 0) - (right.path.at(-1) ?? 0));
  const children = ordered
    .map((ref) => getFlatNode(scene, ref))
    .filter((shape): shape is FlatShape => Boolean(shape));
  if (children.length !== ordered.length) {
    return scene;
  }

  const insertionIndex = ordered[0]!.path.at(-1) ?? 0;
  const withoutChildren = removeRefs(scene, ordered);
  return insertFlatNode(
    withoutChildren,
    { layerIndex: first.layerIndex, parentPath, index: insertionIndex },
    { kind: "group", id, children },
  );
}

function ungroupSelected(scene: FlatDesignScene, ref: FlatNodeRef) {
  const group = getFlatNode(scene, ref);
  if (!group || !isGroup(group)) {
    return scene;
  }

  const parentPath = ref.path.slice(0, -1);
  const insertionIndex = ref.path.at(-1) ?? 0;
  let nextScene = removeFlatNode(scene, ref);
  group.children.forEach((child, offset) => {
    nextScene = insertFlatNode(
      nextScene,
      { layerIndex: ref.layerIndex, parentPath, index: insertionIndex + offset },
      child,
    );
  });
  return nextScene;
}

function addLayer(scene: FlatDesignScene, id: string | undefined, index: number | undefined) {
  const layer: FlatLayer = { id, shapes: [] };
  const nextIndex = clamp(index ?? scene.layers.length, 0, scene.layers.length);
  return {
    ...scene,
    layers: [...scene.layers.slice(0, nextIndex), layer, ...scene.layers.slice(nextIndex)],
  };
}

function deleteLayer(scene: FlatDesignScene, layerIndex: number) {
  if (scene.layers.length <= 1 || !scene.layers[layerIndex]) {
    return scene;
  }
  return { ...scene, layers: scene.layers.filter((_, index) => index !== layerIndex) };
}

function renameLayer(scene: FlatDesignScene, layerIndex: number, id: string | undefined) {
  if (!scene.layers[layerIndex]) {
    return scene;
  }
  return {
    ...scene,
    layers: scene.layers.map((layer, index) => (index === layerIndex ? { ...layer, id } : layer)),
  };
}

function moveLayer(scene: FlatDesignScene, layerIndex: number, toIndex: number) {
  const source = scene.layers[layerIndex];
  if (!source || layerIndex === toIndex) {
    return scene;
  }
  const layers = [...scene.layers];
  layers.splice(layerIndex, 1);
  layers.splice(clamp(toIndex, 0, layers.length), 0, source);
  return { ...scene, layers };
}

function moveRefsToLayer(scene: FlatDesignScene, refs: readonly FlatNodeRef[], layerIndex: number) {
  if (!scene.layers[layerIndex]) {
    return scene;
  }
  const normalized = normalizeFlatNodeRefs(refs);
  const shapes = normalized
    .map((ref) => getFlatNode(scene, ref))
    .filter((shape): shape is FlatShape => Boolean(shape));
  if (shapes.length !== normalized.length) {
    return scene;
  }

  let nextScene = removeRefs(scene, normalized);
  const targetLayer = nextScene.layers[layerIndex];
  if (!targetLayer) {
    return scene;
  }
  shapes.forEach((shape, offset) => {
    nextScene = insertFlatNode(
      nextScene,
      { layerIndex, index: targetLayer.shapes.length + offset },
      shape,
    );
  });
  return nextScene;
}

export function applyFlatEditorCommand(scene: FlatDesignScene, command: FlatEditorCommand) {
  switch (command.kind) {
    case "insert-primitive":
      return insertFlatNode(
        scene,
        command.position,
        createFlatPrimitive(command.primitive, command.id, command.x, command.y),
      );
    case "translate":
      return applyToRefs(scene, command.refs, (shape) => translateFlatShape(shape, command.dx, command.dy));
    case "resize":
      return updateFlatNode(scene, command.ref, (shape) => resizeFlatShape(shape, command.width, command.height));
    case "rotate":
      return applyToRefs(scene, command.refs, (shape) => rotateFlatShape(shape, command.angle));
    case "delete":
      return removeRefs(scene, command.refs);
    case "duplicate": {
      const normalized = normalizeFlatNodeRefs(command.refs);
      let nextScene = scene;
      for (const ref of normalized) {
        const shape = getFlatNode(scene, ref);
        if (!shape) {
          continue;
        }
        const index = ref.path.at(-1) ?? 0;
        const duplicate = translateFlatShape(
          shape.id ? { ...shape, id: `${shape.id}${command.idSuffix ?? "-copy"}` } : shape,
          12,
          12,
        );
        nextScene = insertFlatNode(nextScene, {
          layerIndex: ref.layerIndex,
          parentPath: ref.path.slice(0, -1),
          index: index + 1,
        }, duplicate);
      }
      return nextScene;
    }
    case "group":
      return groupSelected(scene, command.refs, command.id);
    case "ungroup":
      return ungroupSelected(scene, command.ref);
    case "add-layer":
      return addLayer(scene, command.id, command.index);
    case "delete-layer":
      return deleteLayer(scene, command.layerIndex);
    case "rename-layer":
      return renameLayer(scene, command.layerIndex, command.id);
    case "move-layer":
      return moveLayer(scene, command.layerIndex, command.toIndex);
    case "move-to-layer":
      return moveRefsToLayer(scene, command.refs, command.layerIndex);
  }
}
