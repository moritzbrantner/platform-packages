import type {
  FlatAnimation,
  FlatDesignScene,
  FlatEditableKeyframe,
  FlatGroup,
  FlatMotionSpec,
  FlatNodePath,
  FlatNodeRef,
  FlatNodeSummary,
  FlatShape,
  FlatTimelineMotionSpec,
} from "./scene-types";
import { createTimelineAnimations, type FlatMotionKeyframe } from "./animation-presets";
import type { FlatBuiltInFigureAnimationPreset, FlatFigureAnimationOptions } from "./figures";
import { createFlatFigureAnimations } from "./figures";

export type FlatNodeInsertPosition = {
  layerIndex: number;
  parentPath?: FlatNodePath;
  index: number;
};

export type DuplicateFlatNodeOptions = {
  destination?: FlatNodeInsertPosition;
  idSuffix?: string | ((id: string) => string);
};

export type FlatSceneMetadataPatch = Partial<
  Pick<FlatDesignScene, "background" | "description" | "height" | "title" | "viewBox" | "width">
>;

const minimumMotionDurationMs = 100;
const minimumScale = 0.2;
const maximumScale = 3;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizePath(path: FlatNodePath): number[] {
  return [...path];
}

function formatSeconds(durationMs: number) {
  const seconds = Number((durationMs / 1_000).toFixed(3));
  return `${seconds}s`;
}

function normalizeRepeatCount(
  repeatCount: FlatFigureAnimationOptions["repeatCount"],
): FlatTimelineMotionSpec["repeatCount"] {
  if (repeatCount === undefined || repeatCount === "indefinite") {
    return repeatCount;
  }

  const numericRepeatCount = Number(repeatCount);

  return Number.isFinite(numericRepeatCount) ? numericRepeatCount : "indefinite";
}

function cloneEditableKeyframe(keyframe: FlatEditableKeyframe): FlatEditableKeyframe {
  return {
    ...keyframe,
    scale:
      typeof keyframe.scale === "number"
        ? keyframe.scale
        : keyframe.scale
          ? { ...keyframe.scale }
          : keyframe.scale,
    rotate:
      typeof keyframe.rotate === "number"
        ? keyframe.rotate
        : keyframe.rotate
          ? { ...keyframe.rotate }
          : keyframe.rotate,
  };
}

function cloneMotionSpec<T extends FlatMotionSpec>(motion: T): T {
  if (motion.kind === "preset") {
    return {
      ...motion,
      options: motion.options ? { ...motion.options } : motion.options,
    };
  }

  return {
    ...motion,
    rotateCenter: motion.rotateCenter ? { ...motion.rotateCenter } : motion.rotateCenter,
    keyframes: motion.keyframes.map(cloneEditableKeyframe),
  } as T;
}

function isGroup(shape: FlatShape): shape is FlatGroup {
  return shape.kind === "group";
}

function samePath(left?: FlatNodePath, right?: FlatNodePath) {
  const safeLeft = left ?? [];
  const safeRight = right ?? [];

  if (safeLeft.length !== safeRight.length) {
    return false;
  }

  return safeLeft.every((value, index) => value === safeRight[index]);
}

function humanizeIdentifier(id: string) {
  return id
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function createNodeLabel(shape: FlatShape) {
  return shape.id
    ? humanizeIdentifier(shape.id)
    : `${shape.kind.charAt(0).toUpperCase()}${shape.kind.slice(1)}`;
}

function getNodeCollection(
  scene: FlatDesignScene,
  layerIndex: number,
  parentPath?: FlatNodePath,
): FlatShape[] | undefined {
  const layer = scene.layers[layerIndex];

  if (!layer) {
    return undefined;
  }

  if (!parentPath || parentPath.length === 0) {
    return layer.shapes;
  }

  const parent = getFlatNode(scene, {
    layerIndex,
    path: parentPath,
  });

  return parent && isGroup(parent) ? parent.children : undefined;
}

function updateShapesAtPath(
  shapes: FlatShape[],
  path: number[],
  updater: (shape: FlatShape) => FlatShape,
): FlatShape[] {
  const [index, ...rest] = path;
  const target = shapes[index];

  if (target === undefined) {
    return shapes;
  }

  if (rest.length === 0) {
    return shapes.map((shape, shapeIndex) => (shapeIndex === index ? updater(shape) : shape));
  }

  if (!isGroup(target)) {
    return shapes;
  }

  const nextChildren = updateShapesAtPath(target.children, rest, updater);

  if (nextChildren === target.children) {
    return shapes;
  }

  return shapes.map((shape, shapeIndex) =>
    shapeIndex === index
      ? {
          ...target,
          children: nextChildren,
        }
      : shape,
  );
}

function removeShapeAtPath(
  shapes: FlatShape[],
  path: number[],
): { removed?: FlatShape; shapes: FlatShape[] } {
  const [index, ...rest] = path;
  const target = shapes[index];

  if (target === undefined) {
    return { shapes };
  }

  if (rest.length === 0) {
    return {
      removed: target,
      shapes: shapes.filter((_, shapeIndex) => shapeIndex !== index),
    };
  }

  if (!isGroup(target)) {
    return { shapes };
  }

  const result = removeShapeAtPath(target.children, rest);

  if (!result.removed) {
    return { shapes };
  }

  return {
    removed: result.removed,
    shapes: shapes.map((shape, shapeIndex) =>
      shapeIndex === index
        ? {
            ...target,
            children: result.shapes,
          }
        : shape,
    ),
  };
}

function insertShapeAtPosition(
  scene: FlatDesignScene,
  position: FlatNodeInsertPosition,
  shape: FlatShape,
): FlatDesignScene {
  const collection = getNodeCollection(scene, position.layerIndex, position.parentPath);

  if (!collection) {
    return scene;
  }

  const nextIndex = clamp(position.index, 0, collection.length);

  return {
    ...scene,
    layers: scene.layers.map((layer, layerIndex) => {
      if (layerIndex !== position.layerIndex) {
        return layer;
      }

      if (!position.parentPath || position.parentPath.length === 0) {
        return {
          ...layer,
          shapes: [...layer.shapes.slice(0, nextIndex), shape, ...layer.shapes.slice(nextIndex)],
        };
      }

      return {
        ...layer,
        shapes: updateShapesAtPath(layer.shapes, normalizePath(position.parentPath), (parent) => {
          if (!isGroup(parent)) {
            return parent;
          }

          return {
            ...parent,
            children: [
              ...parent.children.slice(0, nextIndex),
              shape,
              ...parent.children.slice(nextIndex),
            ],
          };
        }),
      };
    }),
  };
}

function updateSceneShapes(
  scene: FlatDesignScene,
  layerIndex: number,
  updater: (shapes: FlatShape[]) => FlatShape[],
): FlatDesignScene {
  return {
    ...scene,
    layers: scene.layers.map((layer, currentLayerIndex) =>
      currentLayerIndex === layerIndex
        ? {
            ...layer,
            shapes: updater(layer.shapes),
          }
        : layer,
    ),
  };
}

function remapShapeIds(shape: FlatShape, suffix: string | ((id: string) => string)): FlatShape {
  const applySuffix = typeof suffix === "function" ? suffix : (id: string) => `${id}${suffix}`;
  const nextId = shape.id ? applySuffix(shape.id) : shape.id;

  if (!isGroup(shape)) {
    return {
      ...shape,
      id: nextId,
    };
  }

  return {
    ...shape,
    id: nextId,
    children: shape.children.map((child) => remapShapeIds(child, suffix)),
  };
}

function createDefaultTimelineKeyframes(durationMs: number): FlatEditableKeyframe[] {
  return [{ timeMs: 0 }, { timeMs: durationMs }];
}

function clampEditableKeyframe(
  keyframe: FlatEditableKeyframe,
  durationMs: number,
): FlatEditableKeyframe {
  const scale =
    typeof keyframe.scale === "number"
      ? clamp(keyframe.scale, minimumScale, maximumScale)
      : keyframe.scale
        ? {
            x: clamp(keyframe.scale.x, minimumScale, maximumScale),
            y: clamp(keyframe.scale.y, minimumScale, maximumScale),
          }
        : keyframe.scale;

  return {
    ...cloneEditableKeyframe(keyframe),
    timeMs: clamp(keyframe.timeMs, 0, durationMs),
    opacity:
      typeof keyframe.opacity === "number" ? clamp(keyframe.opacity, 0, 1) : keyframe.opacity,
    scale,
  };
}

function duplicateEndpoints(
  keyframes: FlatEditableKeyframe[],
  durationMs: number,
): FlatEditableKeyframe[] {
  if (keyframes.length >= 2) {
    return keyframes;
  }

  if (keyframes.length === 1) {
    const keyframe = cloneEditableKeyframe(keyframes[0]!);
    return [
      { ...keyframe, timeMs: 0 },
      { ...keyframe, timeMs: durationMs },
    ];
  }

  return createDefaultTimelineKeyframes(durationMs);
}

function expandMotionKeyframesForDirection(motion: FlatTimelineMotionSpec): FlatEditableKeyframe[] {
  if (motion.direction === "reverse") {
    return motion.keyframes
      .map((keyframe) => ({
        ...cloneEditableKeyframe(keyframe),
        timeMs: motion.durationMs - keyframe.timeMs,
      }))
      .sort((left, right) => left.timeMs - right.timeMs);
  }

  if (motion.direction !== "alternate") {
    return motion.keyframes.map(cloneEditableKeyframe);
  }

  const safeDurationMs = Math.max(motion.durationMs, minimumMotionDurationMs);
  const normalized = motion.keyframes.map((keyframe) => ({
    keyframe: cloneEditableKeyframe(keyframe),
    ratio: safeDurationMs === 0 ? 0 : keyframe.timeMs / safeDurationMs,
  }));
  const backward = [...normalized].reverse().slice(1);

  return [
    ...normalized.map(({ keyframe, ratio }) => ({
      ...keyframe,
      timeMs: ratio * safeDurationMs * 0.5,
    })),
    ...backward.map(({ keyframe, ratio }) => ({
      ...keyframe,
      timeMs: safeDurationMs * 0.5 + (1 - ratio) * safeDurationMs * 0.5,
    })),
  ];
}

function toTimelineAnimationKeyframes(motion: FlatTimelineMotionSpec): FlatMotionKeyframe[] {
  const expandedKeyframes = expandMotionKeyframesForDirection(motion);

  return expandedKeyframes.map((keyframe) => ({
    time: motion.durationMs === 0 ? 0 : keyframe.timeMs / motion.durationMs,
    x: keyframe.x,
    y: keyframe.y,
    scale: keyframe.scale,
    rotate: keyframe.rotate,
    opacity: keyframe.opacity,
  }));
}

export function listFlatNodes(scene: FlatDesignScene): FlatNodeSummary[] {
  const nodes: FlatNodeSummary[] = [];

  function visitShapes(
    shapes: FlatShape[],
    layerIndex: number,
    parentPath: number[],
    depth: number,
  ) {
    shapes.forEach((shape, shapeIndex) => {
      const path = [...parentPath, shapeIndex];
      nodes.push({
        ref: {
          layerIndex,
          path,
        },
        id: shape.id,
        kind: shape.kind,
        depth,
        hasMotion: Boolean(shape.motion),
        hasAnimations: Boolean(shape.animations?.length),
        label: createNodeLabel(shape),
      });

      if (isGroup(shape)) {
        visitShapes(shape.children, layerIndex, path, depth + 1);
      }
    });
  }

  scene.layers.forEach((layer, layerIndex) => {
    visitShapes(layer.shapes, layerIndex, [], 0);
  });

  return nodes;
}

export function getFlatNode(scene: FlatDesignScene, ref: FlatNodeRef): FlatShape | undefined {
  const layer = scene.layers[ref.layerIndex];

  if (!layer) {
    return undefined;
  }

  let shapes = layer.shapes;
  let node: FlatShape | undefined;

  for (const [pathIndex, index] of normalizePath(ref.path).entries()) {
    node = shapes[index];

    if (!node) {
      return undefined;
    }

    if (pathIndex < ref.path.length - 1) {
      if (!isGroup(node)) {
        return undefined;
      }

      shapes = node.children;
    }
  }

  return node;
}

export function findFlatNodeById(scene: FlatDesignScene, id: string): FlatNodeRef | undefined {
  return listFlatNodes(scene).find((node) => node.id === id)?.ref;
}

export function updateFlatSceneMetadata(
  scene: FlatDesignScene,
  patch: FlatSceneMetadataPatch,
): FlatDesignScene {
  return {
    ...scene,
    title: patch.title ?? scene.title,
    description: patch.description ?? scene.description,
    viewBox: patch.viewBox ?? scene.viewBox,
    background: patch.background ?? scene.background,
    width:
      patch.width === undefined
        ? scene.width
        : Math.max(1, Math.round(Number.isFinite(patch.width) ? patch.width : scene.width)),
    height:
      patch.height === undefined
        ? scene.height
        : Math.max(1, Math.round(Number.isFinite(patch.height) ? patch.height : scene.height)),
  };
}

export function insertFlatNode(
  scene: FlatDesignScene,
  position: FlatNodeInsertPosition,
  shape: FlatShape,
): FlatDesignScene {
  return insertShapeAtPosition(scene, position, cloneStructured(shape));
}

export function updateFlatNode(
  scene: FlatDesignScene,
  ref: FlatNodeRef,
  updater: (shape: FlatShape) => FlatShape,
): FlatDesignScene {
  const layer = scene.layers[ref.layerIndex];

  if (!layer || ref.path.length === 0) {
    return scene;
  }

  return updateSceneShapes(scene, ref.layerIndex, (shapes) =>
    updateShapesAtPath(shapes, normalizePath(ref.path), updater),
  );
}

export function removeFlatNode(scene: FlatDesignScene, ref: FlatNodeRef): FlatDesignScene {
  const layer = scene.layers[ref.layerIndex];

  if (!layer || ref.path.length === 0) {
    return scene;
  }

  return updateSceneShapes(
    scene,
    ref.layerIndex,
    (shapes) => removeShapeAtPath(shapes, normalizePath(ref.path)).shapes,
  );
}

export function duplicateFlatNode(
  scene: FlatDesignScene,
  ref: FlatNodeRef,
  options: DuplicateFlatNodeOptions = {},
): FlatDesignScene {
  const source = getFlatNode(scene, ref);

  if (!source) {
    return scene;
  }

  const duplicatedShape =
    options.idSuffix === undefined
      ? cloneStructured(source)
      : remapShapeIds(cloneStructured(source), options.idSuffix);
  const destination = options.destination ?? {
    layerIndex: ref.layerIndex,
    parentPath: ref.path.slice(0, -1),
    index: ref.path[ref.path.length - 1]! + 1,
  };

  return insertShapeAtPosition(scene, destination, duplicatedShape);
}

export function moveFlatNode(
  scene: FlatDesignScene,
  ref: FlatNodeRef,
  destination: FlatNodeInsertPosition,
): FlatDesignScene {
  const source = getFlatNode(scene, ref);

  if (!source || ref.path.length === 0) {
    return scene;
  }

  const sourceParentPath = ref.path.slice(0, -1);
  const sourceIndex = ref.path[ref.path.length - 1]!;
  const sameCollection =
    ref.layerIndex === destination.layerIndex && samePath(sourceParentPath, destination.parentPath);

  const withoutSource = removeFlatNode(scene, ref);
  const adjustedDestination =
    sameCollection && sourceIndex < destination.index
      ? {
          ...destination,
          index: destination.index - 1,
        }
      : destination;

  return insertShapeAtPosition(withoutSource, adjustedDestination, cloneStructured(source));
}

export function sortMotionKeyframes(motion: FlatTimelineMotionSpec): FlatTimelineMotionSpec {
  return {
    ...cloneMotionSpec(motion),
    keyframes: [...motion.keyframes]
      .map(cloneEditableKeyframe)
      .sort((left, right) => left.timeMs - right.timeMs),
  };
}

export function clampMotionKeyframes(motion: FlatTimelineMotionSpec): FlatTimelineMotionSpec {
  const durationMs = Math.max(minimumMotionDurationMs, motion.durationMs);

  return {
    ...cloneMotionSpec(motion),
    durationMs,
    keyframes: motion.keyframes.map((keyframe) => clampEditableKeyframe(keyframe, durationMs)),
  };
}

export function normalizeEditableMotion(motion: FlatTimelineMotionSpec): FlatTimelineMotionSpec {
  const durationMs = Math.max(minimumMotionDurationMs, motion.durationMs);
  const sorted = sortMotionKeyframes({
    ...cloneMotionSpec(motion),
    durationMs,
  });
  const clamped = clampMotionKeyframes(sorted);

  return {
    ...clamped,
    direction: clamped.direction ?? "normal",
    repeatCount: clamped.repeatCount ?? "indefinite",
    keyframes: duplicateEndpoints(clamped.keyframes, durationMs),
  };
}

export function addMotionKeyframe(
  motion: FlatTimelineMotionSpec,
  keyframe: FlatEditableKeyframe,
): FlatTimelineMotionSpec {
  return normalizeEditableMotion({
    ...cloneMotionSpec(motion),
    keyframes: [...motion.keyframes.map(cloneEditableKeyframe), cloneEditableKeyframe(keyframe)],
  });
}

export function updateMotionKeyframe(
  motion: FlatTimelineMotionSpec,
  index: number,
  patch: Partial<FlatEditableKeyframe>,
): FlatTimelineMotionSpec {
  if (index < 0 || index >= motion.keyframes.length) {
    return normalizeEditableMotion(motion);
  }

  return normalizeEditableMotion({
    ...cloneMotionSpec(motion),
    keyframes: motion.keyframes.map((keyframe, keyframeIndex) =>
      keyframeIndex === index
        ? {
            ...cloneEditableKeyframe(keyframe),
            ...cloneEditableKeyframe({
              ...cloneEditableKeyframe(keyframe),
              ...patch,
            }),
          }
        : cloneEditableKeyframe(keyframe),
    ),
  });
}

export function removeMotionKeyframe(
  motion: FlatTimelineMotionSpec,
  index: number,
): FlatTimelineMotionSpec {
  if (motion.keyframes.length <= 2 || index < 0 || index >= motion.keyframes.length) {
    return normalizeEditableMotion(motion);
  }

  return normalizeEditableMotion({
    ...cloneMotionSpec(motion),
    keyframes: motion.keyframes.filter((_, keyframeIndex) => keyframeIndex !== index),
  });
}

export function createEditableMotionFromPreset(
  preset: FlatBuiltInFigureAnimationPreset,
  options: FlatFigureAnimationOptions = {},
): FlatTimelineMotionSpec {
  switch (preset) {
    case "bobbing":
      return normalizeEditableMotion({
        kind: "timeline",
        durationMs: Math.round(Number.parseFloat(options.dur ?? "4.6") * 1_000),
        repeatCount: normalizeRepeatCount(options.repeatCount) ?? "indefinite",
        keyframes: [
          { timeMs: 0, x: 0, y: 0 },
          {
            timeMs: Math.round(Number.parseFloat(options.dur ?? "4.6") * 500),
            x: options.axis === "x" ? (options.distance ?? 12) : 0,
            y: options.axis === "x" ? 0 : -(options.distance ?? 12),
          },
          { timeMs: Math.round(Number.parseFloat(options.dur ?? "4.6") * 1_000), x: 0, y: 0 },
        ],
      });
    case "drift":
      return normalizeEditableMotion({
        kind: "timeline",
        durationMs: Math.round(Number.parseFloat(options.dur ?? "9") * 1_000),
        repeatCount: normalizeRepeatCount(options.repeatCount) ?? "indefinite",
        keyframes: [
          { timeMs: 0, x: 0, y: 0 },
          {
            timeMs: Math.round(Number.parseFloat(options.dur ?? "9") * 500),
            x: options.axis === "y" ? 0 : (options.distance ?? 18),
            y: options.axis === "y" ? (options.distance ?? 18) : 0,
          },
          { timeMs: Math.round(Number.parseFloat(options.dur ?? "9") * 1_000), x: 0, y: 0 },
        ],
      });
    case "float":
      return normalizeEditableMotion({
        kind: "timeline",
        durationMs: Math.round(Number.parseFloat(options.dur ?? "7.5") * 1_000),
        repeatCount: normalizeRepeatCount(options.repeatCount) ?? "indefinite",
        keyframes: [
          { timeMs: 0, x: 0, y: 0 },
          {
            timeMs: Math.round(Number.parseFloat(options.dur ?? "7.5") * 380),
            x: options.drift ?? 8,
            y: -(options.distance ?? 16),
          },
          {
            timeMs: Math.round(Number.parseFloat(options.dur ?? "7.5") * 720),
            x: -(options.drift ?? 8) * 0.5,
            y: -(options.distance ?? 16) * 0.35,
          },
          { timeMs: Math.round(Number.parseFloat(options.dur ?? "7.5") * 1_000), x: 0, y: 0 },
        ],
      });
    case "pulse":
      return normalizeEditableMotion({
        kind: "timeline",
        durationMs: Math.round(Number.parseFloat(options.dur ?? "6.4") * 1_000),
        repeatCount: normalizeRepeatCount(options.repeatCount) ?? "indefinite",
        keyframes: [
          { timeMs: 0, scale: options.from ?? 1, opacity: options.maxOpacity ?? 1 },
          {
            timeMs: Math.round(Number.parseFloat(options.dur ?? "6.4") * 500),
            scale: options.to ?? 1.05,
            opacity: options.minOpacity ?? 0.72,
          },
          {
            timeMs: Math.round(Number.parseFloat(options.dur ?? "6.4") * 1_000),
            scale: options.from ?? 1,
            opacity: options.maxOpacity ?? 1,
          },
        ],
      });
    case "pop":
      return normalizeEditableMotion({
        kind: "timeline",
        durationMs: Math.round(Number.parseFloat(options.dur ?? "3.2") * 1_000),
        repeatCount: normalizeRepeatCount(options.repeatCount) ?? "indefinite",
        keyframes: [
          { timeMs: 0, scale: options.from ?? 1 },
          {
            timeMs: Math.round(Number.parseFloat(options.dur ?? "3.2") * 350),
            scale: options.to ?? 1.12,
          },
          { timeMs: Math.round(Number.parseFloat(options.dur ?? "3.2") * 680), scale: 0.98 },
          {
            timeMs: Math.round(Number.parseFloat(options.dur ?? "3.2") * 1_000),
            scale: options.from ?? 1,
          },
        ],
      });
    case "sway":
      return normalizeEditableMotion({
        kind: "timeline",
        durationMs: Math.round(Number.parseFloat(options.dur ?? "5.8") * 1_000),
        repeatCount: normalizeRepeatCount(options.repeatCount) ?? "indefinite",
        keyframes: [
          { timeMs: 0, rotate: -(options.angle ?? 5) },
          {
            timeMs: Math.round(Number.parseFloat(options.dur ?? "5.8") * 500),
            rotate: options.angle ?? 5,
          },
          {
            timeMs: Math.round(Number.parseFloat(options.dur ?? "5.8") * 1_000),
            rotate: -(options.angle ?? 5),
          },
        ],
      });
    case "spin":
      return normalizeEditableMotion({
        kind: "timeline",
        durationMs: Math.round(Number.parseFloat(options.dur ?? "18") * 1_000),
        repeatCount: normalizeRepeatCount(options.repeatCount) ?? "indefinite",
        keyframes: [
          { timeMs: 0, rotate: 0 },
          {
            timeMs: Math.round(Number.parseFloat(options.dur ?? "18") * 1_000),
            rotate: options.angle ?? 360,
          },
        ],
      });
    case "blink":
      return normalizeEditableMotion({
        kind: "timeline",
        durationMs: Math.round(Number.parseFloat(options.dur ?? "3.8") * 1_000),
        repeatCount: normalizeRepeatCount(options.repeatCount) ?? "indefinite",
        keyframes: [
          { timeMs: 0, opacity: options.maxOpacity ?? 1 },
          {
            timeMs: Math.round(Number.parseFloat(options.dur ?? "3.8") * 500),
            opacity: options.minOpacity ?? 0.72,
          },
          {
            timeMs: Math.round(Number.parseFloat(options.dur ?? "3.8") * 1_000),
            opacity: options.maxOpacity ?? 1,
          },
        ],
      });
  }
}

export function compileFlatMotion(motion: FlatMotionSpec): FlatAnimation[] {
  if (motion.kind === "preset") {
    return (
      createFlatFigureAnimations({
        preset: motion.preset,
        options: motion.options,
      }) ?? []
    );
  }

  const normalized = normalizeEditableMotion(motion);

  return createTimelineAnimations({
    dur: formatSeconds(normalized.durationMs),
    repeatCount:
      normalized.repeatCount === undefined
        ? undefined
        : typeof normalized.repeatCount === "number"
          ? String(normalized.repeatCount)
          : normalized.repeatCount,
    rotateCenter: normalized.rotateCenter,
    keyframes: toTimelineAnimationKeyframes(normalized),
  });
}

export function setFlatNodeMotion(
  scene: FlatDesignScene,
  ref: FlatNodeRef,
  motion: FlatMotionSpec,
): FlatDesignScene {
  return updateFlatNode(scene, ref, (shape) => ({
    ...shape,
    motion: motion.kind === "timeline" ? normalizeEditableMotion(motion) : cloneMotionSpec(motion),
  }));
}

export function clearFlatNodeMotion(scene: FlatDesignScene, ref: FlatNodeRef): FlatDesignScene {
  return updateFlatNode(scene, ref, (shape) => ({
    ...shape,
    motion: undefined,
  }));
}

function cloneStructured<T>(value: T): T {
  return globalThis.structuredClone
    ? globalThis.structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}
