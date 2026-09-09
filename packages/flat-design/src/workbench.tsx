"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  Badge,
  Button,
  Input,
  Label,
  NativeSelect,
  NativeSelectOption,
  ScrollArea,
  Separator,
  cn,
} from "@moritzbrantner/ui";

import {
  createEditableMotionFromPreset,
  getFlatNode,
  insertFlatNode,
  listFlatNodes,
  setFlatNodeMotion,
  updateFlatNode,
} from "./core";
import {
  applyFlatEditorCommand,
  flatNodeRefsEqual,
  getFlatNodeBounds,
  getFlatShapeRotation,
  normalizeFlatNodeRefs,
  toFlatNodeRefKey,
  type FlatBounds,
  type FlatPrimitiveKind,
} from "./editor-commands";
import type { FlatSceneEditorFigureDefinition } from "./editor";
import type { FlatBuiltInFigureAnimationPreset } from "./figures";
import { FlatScene } from "./flat-scene";
import { FlatMotionTimelineEditor } from "./react";
import type {
  FlatDesignScene,
  FlatNodeRef,
  FlatTimelineMotionSpec,
} from "./scene-types";

export type FlatDesignWorkbenchProps = {
  scene: FlatDesignScene;
  onSceneChange?: (scene: FlatDesignScene) => void;
  selectedNodeRef?: FlatNodeRef;
  onSelectedNodeChange?: (ref: FlatNodeRef | undefined) => void;
  readOnly?: boolean;
  className?: string;
  availableFigures?: FlatSceneEditorFigureDefinition[];
  showExportPanel?: boolean;
  gridSize?: number;
};

type Interaction =
  | {
      kind: "move";
      startScene: FlatDesignScene;
      refs: FlatNodeRef[];
      start: { x: number; y: number };
    }
  | {
      kind: "resize";
      startScene: FlatDesignScene;
      ref: FlatNodeRef;
      start: { x: number; y: number };
      startBounds: FlatBounds;
    }
  | {
      kind: "rotate";
      startScene: FlatDesignScene;
      refs: FlatNodeRef[];
      center: { x: number; y: number };
      startPointerAngle: number;
      startShapeAngle: number;
    }
  | {
      kind: "marquee";
      start: { x: number; y: number };
      current: { x: number; y: number };
      additive: boolean;
    };

const primitiveKinds: Array<{ kind: FlatPrimitiveKind; label: string }> = [
  { kind: "rect", label: "Rectangle" },
  { kind: "circle", label: "Circle" },
  { kind: "ellipse", label: "Ellipse" },
  { kind: "line", label: "Line" },
  { kind: "polygon", label: "Polygon" },
  { kind: "path", label: "Path" },
];

const motionPresets: FlatBuiltInFigureAnimationPreset[] = [
  "bobbing",
  "drift",
  "float",
  "pulse",
  "pop",
  "sway",
  "spin",
  "blink",
];

const defaultTimeline: FlatTimelineMotionSpec = {
  kind: "timeline",
  durationMs: 1_000,
  easing: "ease-in-out",
  keyframes: [
    { timeMs: 0, x: 0, y: 0, opacity: 1 },
    { timeMs: 1_000, x: 24, y: 0, opacity: 1 },
  ],
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function refsContain(refs: readonly FlatNodeRef[], candidate: FlatNodeRef) {
  return refs.some((ref) => flatNodeRefsEqual(ref, candidate));
}

function getPrimaryRef(refs: readonly FlatNodeRef[]) {
  return refs[refs.length - 1];
}

function pointFromPointer(
  event: Pick<ReactPointerEvent, "clientX" | "clientY">,
  scene: FlatDesignScene,
  svg: SVGSVGElement | null,
) {
  if (!svg) {
    return { x: 0, y: 0 };
  }
  const rect = svg.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: ((event.clientX - rect.left) / rect.width) * scene.width,
    y: ((event.clientY - rect.top) / rect.height) * scene.height,
  };
}

function snapDelta(value: number, gridSize: number, enabled: boolean) {
  if (!enabled || gridSize <= 0) {
    return value;
  }
  return Math.round(value / gridSize) * gridSize;
}

function boundsIntersect(left: FlatBounds, right: FlatBounds) {
  return !(
    left.x + left.width < right.x ||
    right.x + right.width < left.x ||
    left.y + left.height < right.y ||
    right.y + right.height < left.y
  );
}

function marqueeBounds(interaction: Extract<Interaction, { kind: "marquee" }>): FlatBounds {
  return {
    x: Math.min(interaction.start.x, interaction.current.x),
    y: Math.min(interaction.start.y, interaction.current.y),
    width: Math.abs(interaction.current.x - interaction.start.x),
    height: Math.abs(interaction.current.y - interaction.start.y),
  };
}

function createUniqueId(scene: FlatDesignScene, prefix: string) {
  const existing = new Set(listFlatNodes(scene).map((node) => node.id).filter(Boolean));
  const normalized =
    prefix.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "node";
  if (!existing.has(normalized)) {
    return normalized;
  }
  let sequence = 2;
  while (existing.has(`${normalized}-${sequence}`)) {
    sequence += 1;
  }
  return `${normalized}-${sequence}`;
}

function createUniqueLayerId(scene: FlatDesignScene) {
  const existing = new Set(scene.layers.map((layer) => layer.id).filter(Boolean));
  let sequence = scene.layers.length + 1;
  let id = `layer-${sequence}`;
  while (existing.has(id)) {
    sequence += 1;
    id = `layer-${sequence}`;
  }
  return id;
}

function getInsertPoint(scene: FlatDesignScene, sequence: number) {
  const offset = (sequence % 5) * 18;
  return {
    x: Math.max(16, Math.round(scene.width * 0.28) + offset),
    y: Math.max(16, Math.round(scene.height * 0.28) + offset),
  };
}

function getInsertionLayer(selection: readonly FlatNodeRef[]) {
  return getPrimaryRef(selection)?.layerIndex ?? 0;
}

function selectionBounds(scene: FlatDesignScene, refs: readonly FlatNodeRef[]) {
  const bounds = refs
    .map((ref) => getFlatNodeBounds(scene, ref))
    .filter((bound): bound is FlatBounds => Boolean(bound));
  if (bounds.length === 0) {
    return undefined;
  }
  const minX = Math.min(...bounds.map((bound) => bound.x));
  const minY = Math.min(...bounds.map((bound) => bound.y));
  const maxX = Math.max(...bounds.map((bound) => bound.x + bound.width));
  const maxY = Math.max(...bounds.map((bound) => bound.y + bound.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function cloneScene(scene: FlatDesignScene): FlatDesignScene {
  return JSON.parse(JSON.stringify(scene)) as FlatDesignScene;
}

function isEditingText(event: KeyboardEvent) {
  const target = event.target;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

export function FlatDesignWorkbench({
  scene,
  onSceneChange,
  selectedNodeRef,
  onSelectedNodeChange,
  readOnly = false,
  className,
  availableFigures = [],
  gridSize = 8,
}: FlatDesignWorkbenchProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const interactionRef = useRef<Interaction | undefined>(undefined);
  const pastRef = useRef<FlatDesignScene[]>([]);
  const futureRef = useRef<FlatDesignScene[]>([]);
  const [selectedRefs, setSelectedRefs] = useState<FlatNodeRef[]>(() =>
    selectedNodeRef ? [selectedNodeRef] : [],
  );
  const [zoom, setZoom] = useState(1);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [hiddenLayers, setHiddenLayers] = useState<Set<number>>(() => new Set());
  const [lockedLayers, setLockedLayers] = useState<Set<number>>(() => new Set());
  const [interaction, setInteraction] = useState<Interaction>();
  const [guides, setGuides] = useState<{ x?: number; y?: number }>({});
  const [, setHistoryVersion] = useState(0);

  const nodes = useMemo(() => listFlatNodes(scene), [scene]);
  const primaryRef = getPrimaryRef(selectedRefs);
  const primaryShape = primaryRef ? getFlatNode(scene, primaryRef) : undefined;
  const primaryBounds = primaryRef ? getFlatNodeBounds(scene, primaryRef) : undefined;
  const selectedBounds = selectionBounds(scene, selectedRefs);
  const previewScene = useMemo(
    () => ({
      ...scene,
      layers: scene.layers.map((layer, index) =>
        hiddenLayers.has(index) ? { ...layer, opacity: 0 } : layer,
      ),
    }),
    [hiddenLayers, scene],
  );

  useEffect(() => {
    if (selectedNodeRef) {
      setSelectedRefs([selectedNodeRef]);
    }
  }, [selectedNodeRef]);

  useEffect(() => {
    const valid = selectedRefs.filter((ref) => Boolean(getFlatNode(scene, ref)));
    if (valid.length !== selectedRefs.length) {
      setSelectedRefs(valid);
    }
  }, [scene, selectedRefs]);

  function setSelection(refs: FlatNodeRef[]) {
    const normalized = normalizeFlatNodeRefs(refs);
    setSelectedRefs(normalized);
    onSelectedNodeChange?.(getPrimaryRef(normalized));
  }

  function commit(nextScene: FlatDesignScene, options: { record?: boolean } = {}) {
    if (nextScene === scene || readOnly) {
      return;
    }
    if (options.record !== false) {
      pastRef.current.push(cloneScene(scene));
      if (pastRef.current.length > 100) {
        pastRef.current.shift();
      }
      futureRef.current = [];
      setHistoryVersion((value) => value + 1);
    }
    onSceneChange?.(nextScene);
  }

  function beginContinuousEdit(startScene: FlatDesignScene) {
    pastRef.current.push(cloneScene(startScene));
    if (pastRef.current.length > 100) {
      pastRef.current.shift();
    }
    futureRef.current = [];
    setHistoryVersion((value) => value + 1);
  }

  function undo() {
    if (readOnly) {
      return;
    }
    const previous = pastRef.current.pop();
    if (!previous) {
      return;
    }
    futureRef.current.push(cloneScene(scene));
    setSelection([]);
    onSceneChange?.(previous);
    setHistoryVersion((value) => value + 1);
  }

  function redo() {
    if (readOnly) {
      return;
    }
    const next = futureRef.current.pop();
    if (!next) {
      return;
    }
    pastRef.current.push(cloneScene(scene));
    setSelection([]);
    onSceneChange?.(next);
    setHistoryVersion((value) => value + 1);
  }

  function run(
    command: Parameters<typeof applyFlatEditorCommand>[1],
    options?: { clearSelection?: boolean },
  ) {
    const next = applyFlatEditorCommand(scene, command);
    commit(next);
    if (options?.clearSelection) {
      setSelection([]);
    }
  }

  function handleInsertPrimitive(kind: FlatPrimitiveKind) {
    const point = getInsertPoint(scene, nodes.length);
    const id = createUniqueId(scene, kind);
    const layerIndex = getInsertionLayer(selectedRefs);
    const next = applyFlatEditorCommand(scene, {
      kind: "insert-primitive",
      primitive: kind,
      position: { layerIndex, index: scene.layers[layerIndex]?.shapes.length ?? 0 },
      id,
      x: point.x,
      y: point.y,
    });
    commit(next);
    const inserted = listFlatNodes(next).find((node) => node.id === id)?.ref;
    if (inserted) {
      setSelection([inserted]);
    }
  }

  function handleInsertFigure(figure: FlatSceneEditorFigureDefinition) {
    if (readOnly) {
      return;
    }
    const layerIndex = getInsertionLayer(selectedRefs);
    const point = getInsertPoint(scene, nodes.length);
    const id = createUniqueId(scene, figure.id);
    const shape = figure.create({ id, scene, sequence: nodes.length, x: point.x, y: point.y });
    const next = insertFlatNode(
      scene,
      { layerIndex, index: scene.layers[layerIndex]?.shapes.length ?? 0 },
      shape,
    );
    commit(next);
    const inserted = listFlatNodes(next).find((node) => node.id === id)?.ref;
    if (inserted) {
      setSelection([inserted]);
    }
  }

  function handleShapePointerDown(event: ReactPointerEvent<SVGElement>, ref: FlatNodeRef) {
    if (readOnly || hiddenLayers.has(ref.layerIndex) || lockedLayers.has(ref.layerIndex)) {
      return;
    }
    event.stopPropagation();
    const point = pointFromPointer(event, scene, event.currentTarget.ownerSVGElement);
    const nextSelection = event.shiftKey
      ? refsContain(selectedRefs, ref)
        ? selectedRefs.filter((candidate) => !flatNodeRefsEqual(candidate, ref))
        : [...selectedRefs, ref]
      : refsContain(selectedRefs, ref)
        ? selectedRefs
        : [ref];
    setSelection(nextSelection);
    if (nextSelection.length === 0) {
      return;
    }
    const nextInteraction: Interaction = {
      kind: "move",
      startScene: scene,
      refs: nextSelection,
      start: point,
    };
    interactionRef.current = nextInteraction;
    setInteraction(nextInteraction);
    beginContinuousEdit(scene);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleCanvasPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (readOnly || event.button !== 0) {
      return;
    }
    const target = event.target;
    if (target instanceof Element && target.closest("[data-flat-node-ref]")) {
      return;
    }
    const svg = canvasRef.current?.querySelector("svg") ?? null;
    const point = pointFromPointer(event, scene, svg);
    const nextInteraction: Interaction = {
      kind: "marquee",
      start: point,
      current: point,
      additive: event.shiftKey,
    };
    interactionRef.current = nextInteraction;
    setInteraction(nextInteraction);
    if (!event.shiftKey) {
      setSelection([]);
    }
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleCanvasPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const active = interactionRef.current;
    if (!active) {
      return;
    }
    const svg = canvasRef.current?.querySelector("svg") ?? null;
    const point = pointFromPointer(event, scene, svg);

    if (active.kind === "marquee") {
      const next = { ...active, current: point };
      interactionRef.current = next;
      setInteraction(next);
      return;
    }

    if (active.kind === "move") {
      const rawDx = point.x - active.start.x;
      const rawDy = point.y - active.start.y;
      const dx = snapDelta(rawDx, gridSize, snapEnabled);
      const dy = snapDelta(rawDy, gridSize, snapEnabled);
      const nextScene = applyFlatEditorCommand(active.startScene, {
        kind: "translate",
        refs: active.refs,
        dx,
        dy,
      });
      onSceneChange?.(nextScene);
      setGuides({
        x: snapEnabled && dx !== rawDx ? active.start.x + dx : undefined,
        y: snapEnabled && dy !== rawDy ? active.start.y + dy : undefined,
      });
      return;
    }

    if (active.kind === "resize") {
      const dx = snapDelta(point.x - active.start.x, gridSize, snapEnabled);
      const dy = snapDelta(point.y - active.start.y, gridSize, snapEnabled);
      const nextScene = applyFlatEditorCommand(active.startScene, {
        kind: "resize",
        ref: active.ref,
        width: Math.max(1, active.startBounds.width + dx),
        height: Math.max(1, active.startBounds.height + dy),
      });
      onSceneChange?.(nextScene);
      return;
    }

    const pointerAngle =
      Math.atan2(point.y - active.center.y, point.x - active.center.x) * (180 / Math.PI);
    const angle = active.startShapeAngle + pointerAngle - active.startPointerAngle;
    const nextScene = applyFlatEditorCommand(active.startScene, {
      kind: "rotate",
      refs: active.refs,
      angle,
    });
    onSceneChange?.(nextScene);
  }

  function handleCanvasPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const active = interactionRef.current;
    if (!active) {
      return;
    }
    if (active.kind === "marquee") {
      const bounds = marqueeBounds(active);
      const matches = nodes
        .filter(
          (node) =>
            !hiddenLayers.has(node.ref.layerIndex) && !lockedLayers.has(node.ref.layerIndex),
        )
        .filter((node) => {
          const nodeBounds = getFlatNodeBounds(scene, node.ref);
          return nodeBounds ? boundsIntersect(bounds, nodeBounds) : false;
        })
        .map((node) => node.ref);
      setSelection(active.additive ? [...selectedRefs, ...matches] : matches);
    }
    interactionRef.current = undefined;
    setInteraction(undefined);
    setGuides({});
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleResizePointerDown(event: ReactPointerEvent<SVGCircleElement>) {
    if (!primaryRef || !primaryBounds || readOnly) {
      return;
    }
    event.stopPropagation();
    const point = pointFromPointer(event, scene, event.currentTarget.ownerSVGElement);
    const nextInteraction: Interaction = {
      kind: "resize",
      startScene: scene,
      ref: primaryRef,
      start: point,
      startBounds: primaryBounds,
    };
    interactionRef.current = nextInteraction;
    setInteraction(nextInteraction);
    beginContinuousEdit(scene);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleRotatePointerDown(event: ReactPointerEvent<SVGCircleElement>) {
    if (!primaryRef || !primaryShape || !primaryBounds || readOnly) {
      return;
    }
    event.stopPropagation();
    const center = {
      x: primaryBounds.x + primaryBounds.width / 2,
      y: primaryBounds.y + primaryBounds.height / 2,
    };
    const point = pointFromPointer(event, scene, event.currentTarget.ownerSVGElement);
    const startPointerAngle =
      Math.atan2(point.y - center.y, point.x - center.x) * (180 / Math.PI);
    const nextInteraction: Interaction = {
      kind: "rotate",
      startScene: scene,
      refs: selectedRefs,
      center,
      startPointerAngle,
      startShapeAngle: getFlatShapeRotation(primaryShape),
    };
    interactionRef.current = nextInteraction;
    setInteraction(nextInteraction);
    beginContinuousEdit(scene);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditingText(event)) {
        return;
      }
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }
      if (modifier && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (readOnly || selectedRefs.length === 0) {
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        run({ kind: "delete", refs: selectedRefs }, { clearSelection: true });
        return;
      }
      const nudge = event.shiftKey ? 10 : 1;
      const delta =
        event.key === "ArrowLeft"
          ? { dx: -nudge, dy: 0 }
          : event.key === "ArrowRight"
            ? { dx: nudge, dy: 0 }
            : event.key === "ArrowUp"
              ? { dx: 0, dy: -nudge }
              : event.key === "ArrowDown"
                ? { dx: 0, dy: nudge }
                : undefined;
      if (delta) {
        event.preventDefault();
        run({ kind: "translate", refs: selectedRefs, ...delta });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const marquee = interaction?.kind === "marquee" ? marqueeBounds(interaction) : undefined;
  const primaryTimeline =
    primaryShape?.motion?.kind === "timeline"
      ? primaryShape.motion
      : primaryShape?.motion?.kind === "preset"
        ? createEditableMotionFromPreset(primaryShape.motion.preset, primaryShape.motion.options)
        : defaultTimeline;

  return (
    <div className={cn("grid gap-4", className)}>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background/80 p-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pastRef.current.length === 0 || readOnly}
          onClick={undo}
        >
          Undo
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={futureRef.current.length === 0 || readOnly}
          onClick={redo}
        >
          Redo
        </Button>
        <Separator orientation="vertical" className="h-7" />
        <Button
          type="button"
          size="sm"
          variant={snapEnabled ? "secondary" : "outline"}
          onClick={() => setSnapEnabled((value) => !value)}
        >
          Snap {gridSize}px
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setZoom((value) => clamp(value - 0.1, 0.35, 3))}
        >
          −
        </Button>
        <Badge variant="secondary">{Math.round(zoom * 100)}%</Badge>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setZoom((value) => clamp(value + 0.1, 0.35, 3))}
        >
          +
        </Button>
        <Separator orientation="vertical" className="h-7" />
        {primitiveKinds.map((primitive) => (
          <Button
            key={primitive.kind}
            type="button"
            size="sm"
            variant="outline"
            disabled={readOnly}
            onClick={() => handleInsertPrimitive(primitive.kind)}
          >
            {primitive.label}
          </Button>
        ))}
        {availableFigures.map((figure) => (
          <Button
            key={figure.id}
            type="button"
            size="sm"
            variant="ghost"
            disabled={readOnly}
            onClick={() => handleInsertFigure(figure)}
          >
            {figure.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[17rem_minmax(0,1fr)_20rem]">
        <aside className="space-y-4 rounded-xl border border-border/60 bg-background/70 p-3">
          <div>
            <div className="text-sm font-semibold">Layers</div>
            <p className="text-xs text-muted-foreground">
              Drag to reorder. Visibility and locks are workspace-only.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={readOnly}
            onClick={() => run({ kind: "add-layer", id: createUniqueLayerId(scene) })}
          >
            Add layer
          </Button>
          <div className="space-y-2">
            {scene.layers.map((layer, layerIndex) => (
              <div
                key={`${layer.id ?? "layer"}-${layerIndex}`}
                draggable={!readOnly}
                className="rounded-lg border border-border/60 p-2"
                onDragStart={(event) =>
                  event.dataTransfer.setData("text/flat-layer-index", String(layerIndex))
                }
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const source = Number(event.dataTransfer.getData("text/flat-layer-index"));
                  if (Number.isInteger(source)) {
                    run({ kind: "move-layer", layerIndex: source, toIndex: layerIndex });
                    setSelection([]);
                  }
                }}
              >
                <Input
                  value={layer.id ?? ""}
                  aria-label={`Layer ${layerIndex + 1} name`}
                  disabled={readOnly}
                  onChange={(event) =>
                    run({
                      kind: "rename-layer",
                      layerIndex,
                      id: event.target.value || undefined,
                    })
                  }
                />
                <div className="mt-2 grid grid-cols-3 gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={hiddenLayers.has(layerIndex) ? "secondary" : "ghost"}
                    onClick={() =>
                      setHiddenLayers((current) => {
                        const next = new Set(current);
                        if (next.has(layerIndex)) next.delete(layerIndex);
                        else next.add(layerIndex);
                        return next;
                      })
                    }
                  >
                    {hiddenLayers.has(layerIndex) ? "Show" : "Hide"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={lockedLayers.has(layerIndex) ? "secondary" : "ghost"}
                    onClick={() =>
                      setLockedLayers((current) => {
                        const next = new Set(current);
                        if (next.has(layerIndex)) next.delete(layerIndex);
                        else next.add(layerIndex);
                        return next;
                      })
                    }
                  >
                    {lockedLayers.has(layerIndex) ? "Unlock" : "Lock"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={readOnly || scene.layers.length <= 1}
                    onClick={() => {
                      run({ kind: "delete-layer", layerIndex });
                      setSelection([]);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Separator />
          <div>
            <div className="text-sm font-semibold">Scene tree</div>
            <p className="text-xs text-muted-foreground">
              Shift-click on canvas or tree for multi-selection.
            </p>
          </div>
          <ScrollArea className="h-72 rounded-lg border border-border/60">
            <div className="space-y-1 p-2">
              {nodes.map((node) => (
                <Button
                  key={toFlatNodeRefKey(node.ref)}
                  type="button"
                  size="sm"
                  variant={refsContain(selectedRefs, node.ref) ? "secondary" : "ghost"}
                  className="h-auto w-full justify-start"
                  style={{ paddingLeft: `${8 + node.depth * 14}px` } as CSSProperties}
                  disabled={hiddenLayers.has(node.ref.layerIndex)}
                  onClick={(event) => {
                    if (event.shiftKey) {
                      setSelection(
                        refsContain(selectedRefs, node.ref)
                          ? selectedRefs.filter((ref) => !flatNodeRefsEqual(ref, node.ref))
                          : [...selectedRefs, node.ref],
                      );
                    } else {
                      setSelection([node.ref]);
                    }
                  }}
                >
                  <span className="truncate">{node.label}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={readOnly || selectedRefs.length < 2}
              onClick={() => {
                const groupId = createUniqueId(scene, "group");
                const next = applyFlatEditorCommand(scene, {
                  kind: "group",
                  refs: selectedRefs,
                  id: groupId,
                });
                commit(next);
                const ref = listFlatNodes(next).find((node) => node.id === groupId)?.ref;
                setSelection(ref ? [ref] : []);
              }}
            >
              Group
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={readOnly || primaryShape?.kind !== "group"}
              onClick={() => {
                if (!primaryRef) return;
                run({ kind: "ungroup", ref: primaryRef }, { clearSelection: true });
              }}
            >
              Ungroup
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={readOnly || selectedRefs.length === 0}
              onClick={() => run({ kind: "duplicate", refs: selectedRefs })}
            >
              Duplicate
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={readOnly || selectedRefs.length === 0}
              onClick={() =>
                run({ kind: "delete", refs: selectedRefs }, { clearSelection: true })
              }
            >
              Delete
            </Button>
          </div>
        </aside>

        <main className="min-w-0 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>Drag shapes. Drag the square handle to resize and the round handle to rotate.</span>
            <span>Arrow: 1px · Shift+Arrow: 10px</span>
          </div>
          <div className="overflow-auto">
            <div
              ref={canvasRef}
              className="relative mx-auto origin-top-left touch-none select-none bg-background shadow-sm"
              style={{
                width: scene.width,
                height: scene.height,
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
              }}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerCancel={handleCanvasPointerUp}
            >
              <FlatScene
                scene={previewScene}
                width={scene.width}
                height={scene.height}
                style={{ display: "block", width: scene.width, height: scene.height }}
                getShapeProps={({ ref }) => ({
                  "data-flat-node-ref": toFlatNodeRefKey(ref),
                  style: {
                    cursor: lockedLayers.has(ref.layerIndex) ? "not-allowed" : "move",
                    pointerEvents:
                      hiddenLayers.has(ref.layerIndex) || lockedLayers.has(ref.layerIndex)
                        ? "none"
                        : undefined,
                  },
                  onPointerDown: (event) => handleShapePointerDown(event, ref),
                })}
              />
              <svg
                className="pointer-events-none absolute inset-0"
                width={scene.width}
                height={scene.height}
                viewBox={`0 0 ${scene.width} ${scene.height}`}
                aria-hidden="true"
              >
                {guides.x !== undefined ? (
                  <line
                    x1={guides.x}
                    y1={0}
                    x2={guides.x}
                    y2={scene.height}
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    opacity={0.45}
                  />
                ) : null}
                {guides.y !== undefined ? (
                  <line
                    x1={0}
                    y1={guides.y}
                    x2={scene.width}
                    y2={guides.y}
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    opacity={0.45}
                  />
                ) : null}
                {selectedBounds ? (
                  <rect
                    x={selectedBounds.x}
                    y={selectedBounds.y}
                    width={selectedBounds.width}
                    height={selectedBounds.height}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5 / zoom}
                    strokeDasharray={`${5 / zoom} ${3 / zoom}`}
                  />
                ) : null}
                {primaryBounds ? (
                  <>
                    <line
                      x1={primaryBounds.x + primaryBounds.width / 2}
                      y1={primaryBounds.y}
                      x2={primaryBounds.x + primaryBounds.width / 2}
                      y2={primaryBounds.y - 26 / zoom}
                      stroke="currentColor"
                      strokeWidth={1 / zoom}
                    />
                    <circle
                      cx={primaryBounds.x + primaryBounds.width / 2}
                      cy={primaryBounds.y - 30 / zoom}
                      r={6 / zoom}
                      fill="currentColor"
                      className="pointer-events-auto cursor-grab"
                      onPointerDown={handleRotatePointerDown}
                    />
                    <circle
                      cx={primaryBounds.x + primaryBounds.width}
                      cy={primaryBounds.y + primaryBounds.height}
                      r={6 / zoom}
                      fill="currentColor"
                      className="pointer-events-auto cursor-nwse-resize"
                      onPointerDown={handleResizePointerDown}
                    />
                  </>
                ) : null}
                {marquee ? (
                  <rect
                    x={marquee.x}
                    y={marquee.y}
                    width={marquee.width}
                    height={marquee.height}
                    fill="currentColor"
                    fillOpacity={0.08}
                    stroke="currentColor"
                    strokeWidth={1 / zoom}
                    strokeDasharray={`${4 / zoom} ${3 / zoom}`}
                  />
                ) : null}
              </svg>
            </div>
          </div>
        </main>

        <aside className="space-y-4 rounded-xl border border-border/60 bg-background/70 p-3">
          <div>
            <div className="text-sm font-semibold">Inspector</div>
            <p className="text-xs text-muted-foreground">
              {selectedRefs.length === 0 ? "Nothing selected" : `${selectedRefs.length} selected`}
            </p>
          </div>
          {primaryShape && primaryRef ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="flat-workbench-node-id">Node id</Label>
                <Input
                  id="flat-workbench-node-id"
                  value={primaryShape.id ?? ""}
                  disabled={readOnly}
                  onChange={(event) =>
                    commit(
                      updateFlatNode(scene, primaryRef, (shape) => ({
                        ...shape,
                        id: event.target.value || undefined,
                      })),
                    )
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="flat-workbench-fill">Fill</Label>
                  <Input
                    id="flat-workbench-fill"
                    value={primaryShape.fill ?? ""}
                    disabled={readOnly}
                    onChange={(event) =>
                      commit(
                        updateFlatNode(scene, primaryRef, (shape) => ({
                          ...shape,
                          fill: event.target.value || undefined,
                        })),
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="flat-workbench-stroke">Stroke</Label>
                  <Input
                    id="flat-workbench-stroke"
                    value={primaryShape.stroke ?? ""}
                    disabled={readOnly}
                    onChange={(event) =>
                      commit(
                        updateFlatNode(scene, primaryRef, (shape) => ({
                          ...shape,
                          stroke: event.target.value || undefined,
                        })),
                      )
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="flat-workbench-opacity">Opacity</Label>
                <Input
                  id="flat-workbench-opacity"
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={primaryShape.opacity ?? 1}
                  disabled={readOnly}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    commit(
                      updateFlatNode(scene, primaryRef, (shape) => ({
                        ...shape,
                        opacity: clamp(Number.isFinite(value) ? value : 1, 0, 1),
                      })),
                    );
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="flat-workbench-layer">Move to layer</Label>
                <NativeSelect
                  id="flat-workbench-layer"
                  value={String(primaryRef.layerIndex)}
                  disabled={readOnly}
                  onChange={(event) => {
                    const layerIndex = Number(event.target.value);
                    if (Number.isInteger(layerIndex) && layerIndex !== primaryRef.layerIndex) {
                      run(
                        { kind: "move-to-layer", refs: selectedRefs, layerIndex },
                        { clearSelection: true },
                      );
                    }
                  }}
                >
                  {scene.layers.map((layer, index) => (
                    <NativeSelectOption key={`${layer.id ?? "layer"}-${index}`} value={String(index)}>
                      {layer.id || `Layer ${index + 1}`}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="text-sm font-semibold">Motion</div>
                <div className="flex flex-wrap gap-1">
                  {motionPresets.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={readOnly || selectedRefs.length !== 1}
                      onClick={() =>
                        commit(setFlatNodeMotion(scene, primaryRef, { kind: "preset", preset }))
                      }
                    >
                      {preset}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={readOnly || selectedRefs.length !== 1}
                    onClick={() => commit(setFlatNodeMotion(scene, primaryRef, primaryTimeline))}
                  >
                    Timeline
                  </Button>
                </div>
                <FlatMotionTimelineEditor
                  motion={primaryTimeline}
                  readOnly={
                    readOnly || selectedRefs.length !== 1 || primaryShape.motion?.kind === "preset"
                  }
                  onMotionChange={(motion) =>
                    commit(setFlatNodeMotion(scene, primaryRef, motion))
                  }
                />
              </div>
            </>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
