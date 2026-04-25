"use client";

import { type CSSProperties, useEffect, useId, useMemo, useRef, useState } from "react";

import {
  Badge,
  Button,
  Input,
  Label,
  NativeSelect,
  NativeSelectOption,
  ScrollArea,
  Separator,
  Textarea,
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
  ToolbarSpacer,
  ToolbarTitle,
  cn,
} from "@moritzbrantner/ui";

import {
  clearFlatNodeMotion,
  createEditableMotionFromPreset,
  duplicateFlatNode,
  getFlatNode,
  insertFlatNode,
  listFlatNodes,
  moveFlatNode,
  normalizeEditableMotion,
  removeFlatNode,
  setFlatNodeMotion,
  updateFlatNode,
  updateFlatSceneMetadata,
  type FlatNodeInsertPosition,
} from "./core";
import {
  createFlatBadgeFigure,
  createFlatCardFigure,
  createFlatCloudFigure,
  createFlatSparkleFigure,
  createFlatSunFigure,
  type FlatBuiltInFigureAnimationPreset,
} from "./figures";
import { EditableFlatScene, FlatMotionTimelineEditor } from "./react";
import { renderFlatSceneToSvg } from "./render-svg";
import type {
  FlatDesignScene,
  FlatGroup,
  FlatNodePath,
  FlatNodeRef,
  FlatPresetMotionSpec,
  FlatShape,
  FlatTimelineMotionSpec,
} from "./scene-types";

export type FlatSceneEditorSelection =
  | {
      mode: "scene";
    }
  | {
      mode: "node";
      ref: FlatNodeRef;
    };

export type FlatSceneEditorFigureFactoryOptions = {
  id: string;
  scene: FlatDesignScene;
  sequence: number;
  x: number;
  y: number;
};

export type FlatSceneEditorFigureDefinition = {
  id: string;
  label: string;
  create: (options: FlatSceneEditorFigureFactoryOptions) => FlatShape;
};

export type FlatSceneEditorProps = {
  scene: FlatDesignScene;
  onSceneChange?: (scene: FlatDesignScene) => void;
  selectedNodeRef?: FlatNodeRef;
  onSelectedNodeChange?: (ref: FlatNodeRef | undefined) => void;
  readOnly?: boolean;
  className?: string;
  availableFigures?: FlatSceneEditorFigureDefinition[];
  showExportPanel?: boolean;
};

const motionPresetOptions: FlatBuiltInFigureAnimationPreset[] = [
  "bobbing",
  "drift",
  "float",
  "pulse",
  "pop",
  "sway",
  "spin",
  "blink",
];

const defaultTimelineMotion = normalizeEditableMotion({
  kind: "timeline",
  durationMs: 5_000,
  keyframes: [
    { timeMs: 0, x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 },
    { timeMs: 2_500, x: 10, y: -12, scale: 1.05, rotate: 4, opacity: 0.88 },
    { timeMs: 5_000, x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 },
  ],
});

const defaultAvailableFigures: FlatSceneEditorFigureDefinition[] = [
  {
    id: "cloud",
    label: "Cloud",
    create: ({ id, x, y }) => createFlatCloudFigure({ id, x, y }),
  },
  {
    id: "badge",
    label: "Badge",
    create: ({ id, x, y }) => createFlatBadgeFigure({ id, x, y }),
  },
  {
    id: "card",
    label: "Card",
    create: ({ id, x, y }) => createFlatCardFigure({ id, x, y }),
  },
  {
    id: "sparkle",
    label: "Sparkle",
    create: ({ id, x, y }) => createFlatSparkleFigure({ id, x, y }),
  },
  {
    id: "sun",
    label: "Sun",
    create: ({ id, x, y }) => createFlatSunFigure({ id, x, y }),
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function refsEqual(left?: FlatNodeRef, right?: FlatNodeRef) {
  if (!left || !right) {
    return left === right;
  }

  if (left.layerIndex !== right.layerIndex || left.path.length !== right.path.length) {
    return false;
  }

  return left.path.every((value, index) => value === right.path[index]);
}

function isGroup(shape: FlatShape): shape is FlatGroup {
  return shape.kind === "group";
}

function createShapeLabel(shape: FlatShape) {
  if (shape.id) {
    return shape.id;
  }

  return `${shape.kind.charAt(0).toUpperCase()}${shape.kind.slice(1)}`;
}

function parseGroupTransform(transform?: string) {
  const translateMatch = transform?.match(
    /translate\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/,
  );
  const scaleMatch = transform?.match(/scale\(\s*(-?\d+(?:\.\d+)?)\s*\)/);

  return {
    x: translateMatch ? Number(translateMatch[1]) : 0,
    y: translateMatch ? Number(translateMatch[2]) : 0,
    scale: scaleMatch ? Number(scaleMatch[1]) : 1,
  };
}

function createGroupTransform(x = 0, y = 0, scale = 1) {
  const transforms: string[] = [];

  if (x !== 0 || y !== 0) {
    transforms.push(`translate(${x} ${y})`);
  }

  if (scale !== 1) {
    transforms.push(`scale(${scale})`);
  }

  return transforms.length > 0 ? transforms.join(" ") : undefined;
}

function getNodeIndex(path: FlatNodePath) {
  return path.length === 0 ? -1 : (path[path.length - 1] ?? -1);
}

function getParentPath(path: FlatNodePath): FlatNodePath {
  return path.slice(0, -1);
}

function getShapeCollection(scene: FlatDesignScene, layerIndex: number, path?: FlatNodePath) {
  if (!path || path.length === 0) {
    return scene.layers[layerIndex]?.shapes ?? [];
  }

  const parent = getFlatNode(scene, {
    layerIndex,
    path,
  });

  return parent && isGroup(parent) ? parent.children : [];
}

function getMoveDestination(
  scene: FlatDesignScene,
  ref: FlatNodeRef,
  direction: -1 | 1,
): FlatNodeInsertPosition | undefined {
  const index = getNodeIndex(ref.path);

  if (index < 0) {
    return undefined;
  }

  const parentPath = getParentPath(ref.path);
  const collection = getShapeCollection(scene, ref.layerIndex, parentPath);
  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= collection.length) {
    return undefined;
  }

  return {
    layerIndex: ref.layerIndex,
    parentPath,
    index: nextIndex,
  };
}

function createUniqueNodeId(scene: FlatDesignScene, prefix: string) {
  const normalizedPrefix =
    prefix
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") || "node";
  const existing = new Set(
    listFlatNodes(scene)
      .map((node) => node.id)
      .filter(Boolean),
  );

  if (!existing.has(normalizedPrefix)) {
    return normalizedPrefix;
  }

  let sequence = 2;
  while (existing.has(`${normalizedPrefix}-${sequence}`)) {
    sequence += 1;
  }

  return `${normalizedPrefix}-${sequence}`;
}

function createInsertPosition(
  scene: FlatDesignScene,
  selectedNodeRef?: FlatNodeRef,
): FlatNodeInsertPosition {
  if (!selectedNodeRef) {
    return {
      layerIndex: 0,
      index: scene.layers[0]?.shapes.length ?? 0,
    };
  }

  return {
    layerIndex: selectedNodeRef.layerIndex,
    parentPath: getParentPath(selectedNodeRef.path),
    index: getNodeIndex(selectedNodeRef.path) + 1,
  };
}

function getInsertionPoint(scene: FlatDesignScene, sequence: number) {
  const column = sequence % 3;
  const row = Math.floor(sequence / 3) % 3;

  return {
    x: Math.round(scene.width * 0.34 + column * 64),
    y: Math.round(scene.height * 0.3 + row * 54),
  };
}

function useControllableSelectedNodeRef(
  scene: FlatDesignScene,
  selectedNodeRef: FlatNodeRef | undefined,
  onSelectedNodeChange: ((ref: FlatNodeRef | undefined) => void) | undefined,
) {
  const [internalSelectedNodeRef, setInternalSelectedNodeRef] = useState<FlatNodeRef | undefined>(
    selectedNodeRef,
  );
  const currentSelectedNodeRef = selectedNodeRef ?? internalSelectedNodeRef;

  useEffect(() => {
    if (selectedNodeRef !== undefined) {
      setInternalSelectedNodeRef(selectedNodeRef);
    }
  }, [selectedNodeRef]);

  useEffect(() => {
    if (!currentSelectedNodeRef) {
      return;
    }

    if (getFlatNode(scene, currentSelectedNodeRef)) {
      return;
    }

    if (selectedNodeRef === undefined) {
      setInternalSelectedNodeRef(undefined);
    }

    onSelectedNodeChange?.(undefined);
  }, [currentSelectedNodeRef, onSelectedNodeChange, scene, selectedNodeRef]);

  function setSelectedRef(nextRef: FlatNodeRef | undefined) {
    if (selectedNodeRef === undefined) {
      setInternalSelectedNodeRef(nextRef);
    }

    onSelectedNodeChange?.(nextRef);
  }

  return [currentSelectedNodeRef, setSelectedRef] as const;
}

function Section({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border/60 bg-background/70", className)}>
      <div className="space-y-1 border-b border-border/60 px-4 py-3">
        <div className="text-sm font-semibold">{title}</div>
        {description ? (
          <p className="text-xs leading-5 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        value={Number.isFinite(value) ? String(value) : "0"}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </Field>
  );
}

function ColorField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="h-10 w-12 rounded-md border border-border bg-transparent"
          value={normalizeColor(value)}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        <Input
          value={value ?? ""}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </Field>
  );
}

function normalizeColor(value?: string) {
  return /^#[0-9a-f]{6}$/i.test(value ?? "") ? (value as string) : "#2d7ff9";
}

export function FlatSceneEditor({
  scene,
  onSceneChange,
  selectedNodeRef,
  onSelectedNodeChange,
  readOnly = false,
  className,
  availableFigures = defaultAvailableFigures,
  showExportPanel = true,
}: FlatSceneEditorProps) {
  const canvasViewportRef = useRef<HTMLDivElement | null>(null);
  const exportTextareaId = useId();
  const [currentSelectedNodeRef, setCurrentSelectedNodeRef] = useControllableSelectedNodeRef(
    scene,
    selectedNodeRef,
    onSelectedNodeChange,
  );
  const [zoom, setZoom] = useState(1);
  const [fitView, setFitView] = useState(true);
  const [exportStatus, setExportStatus] = useState<"idle" | "copied" | "unsupported">("idle");
  const nodes = useMemo(() => listFlatNodes(scene), [scene]);
  const selectedNode = currentSelectedNodeRef
    ? getFlatNode(scene, currentSelectedNodeRef)
    : undefined;
  const selection: FlatSceneEditorSelection = currentSelectedNodeRef
    ? { mode: "node", ref: currentSelectedNodeRef }
    : { mode: "scene" };
  const svgMarkup = useMemo(
    () =>
      renderFlatSceneToSvg(scene, {
        width: scene.width,
        height: scene.height,
      }),
    [scene],
  );

  useEffect(() => {
    if (!fitView) {
      return;
    }

    const element = canvasViewportRef.current;

    if (!element) {
      return;
    }

    function updateFitZoom(target: HTMLDivElement) {
      const nextZoom = clamp(
        Math.min(
          (target.clientWidth - 32) / scene.width,
          (target.clientHeight - 32) / scene.height,
        ),
        0.35,
        2.5,
      );
      setZoom(Number.isFinite(nextZoom) ? nextZoom : 1);
    }

    updateFitZoom(element);

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => updateFitZoom(element));
    observer.observe(element);

    return () => observer.disconnect();
  }, [fitView, scene.height, scene.width]);

  function commitScene(nextScene: FlatDesignScene) {
    onSceneChange?.(nextScene);
  }

  function handleZoomChange(nextZoom: number) {
    setFitView(false);
    setZoom(clamp(nextZoom, 0.35, 3));
  }

  function handleFitToView() {
    setFitView(true);
  }

  function handleInsertFigure(figure: FlatSceneEditorFigureDefinition) {
    if (readOnly) {
      return;
    }

    const position = createInsertPosition(scene, currentSelectedNodeRef);
    const sequence = nodes.length;
    const point = getInsertionPoint(scene, sequence);
    const nextId = createUniqueNodeId(scene, figure.id);
    const nextScene = insertFlatNode(
      scene,
      position,
      figure.create({
        id: nextId,
        scene,
        sequence,
        x: point.x,
        y: point.y,
      }),
    );

    commitScene(nextScene);
    setCurrentSelectedNodeRef(findNodeRefById(nextScene, nextId));
  }

  function handleDuplicateSelectedNode() {
    if (!currentSelectedNodeRef || readOnly) {
      return;
    }

    const nextScene = duplicateFlatNode(scene, currentSelectedNodeRef, {
      idSuffix: (id) => {
        const prefix = id.trim() || "node";
        return createUniqueNodeId(scene, `${prefix}-copy`);
      },
    });
    const sourceId = selectedNode?.id;
    const nextSelectedRef =
      sourceId === undefined
        ? undefined
        : findNodeRefById(nextScene, createUniqueNodeId(scene, `${sourceId}-copy`));

    commitScene(nextScene);
    setCurrentSelectedNodeRef(nextSelectedRef);
  }

  function handleDeleteSelectedNode() {
    if (!currentSelectedNodeRef || readOnly) {
      return;
    }

    commitScene(removeFlatNode(scene, currentSelectedNodeRef));
    setCurrentSelectedNodeRef(undefined);
  }

  function handleMoveSelectedNode(direction: -1 | 1) {
    if (!currentSelectedNodeRef || readOnly) {
      return;
    }

    const destination = getMoveDestination(scene, currentSelectedNodeRef, direction);
    const selectedNodeId = selectedNode?.id;

    if (!destination) {
      return;
    }

    const nextScene = moveFlatNode(scene, currentSelectedNodeRef, destination);

    commitScene(nextScene);
    if (selectedNodeId) {
      setCurrentSelectedNodeRef(findNodeRefById(nextScene, selectedNodeId));
    }
  }

  function updateSelectedShape(updater: (shape: FlatShape) => FlatShape) {
    if (!currentSelectedNodeRef || readOnly) {
      return;
    }

    commitScene(updateFlatNode(scene, currentSelectedNodeRef, updater));
  }

  function updateSelectedGroupTransform(patch: Partial<{ x: number; y: number; scale: number }>) {
    updateSelectedShape((shape) => {
      if (!isGroup(shape)) {
        return shape;
      }

      const transform = parseGroupTransform(shape.transform);

      return {
        ...shape,
        transform: createGroupTransform(
          patch.x ?? transform.x,
          patch.y ?? transform.y,
          patch.scale ?? transform.scale,
        ),
      };
    });
  }

  function applyMotionPreset(preset: FlatBuiltInFigureAnimationPreset) {
    if (!currentSelectedNodeRef || readOnly) {
      return;
    }

    commitScene(
      setFlatNodeMotion(scene, currentSelectedNodeRef, {
        kind: "preset",
        preset,
      }),
    );
  }

  function switchSelectedNodeToTimelineMotion() {
    if (!currentSelectedNodeRef || readOnly) {
      return;
    }

    const nextMotion =
      selectedNode?.motion?.kind === "preset"
        ? createEditableMotionFromPreset(selectedNode.motion.preset)
        : selectedNode?.motion?.kind === "timeline"
          ? selectedNode.motion
          : defaultTimelineMotion;

    commitScene(setFlatNodeMotion(scene, currentSelectedNodeRef, nextMotion));
  }

  function updateTimelineMotion(patch: Partial<FlatTimelineMotionSpec>) {
    if (!currentSelectedNodeRef || readOnly) {
      return;
    }

    const baseMotion =
      selectedNode?.motion?.kind === "timeline"
        ? selectedNode.motion
        : selectedNode?.motion?.kind === "preset"
          ? createEditableMotionFromPreset(selectedNode.motion.preset)
          : defaultTimelineMotion;

    commitScene(
      setFlatNodeMotion(
        scene,
        currentSelectedNodeRef,
        normalizeEditableMotion({ ...baseMotion, ...patch }),
      ),
    );
  }

  async function handleExportSvg() {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setExportStatus("unsupported");
      return;
    }

    await navigator.clipboard.writeText(svgMarkup);
    setExportStatus("copied");
    window.setTimeout(() => setExportStatus("idle"), 1_500);
  }

  const groupTransform =
    selectedNode && isGroup(selectedNode) ? parseGroupTransform(selectedNode.transform) : undefined;
  const selectedMotion = selectedNode?.motion;
  const editableMotion =
    selectedMotion?.kind === "timeline"
      ? selectedMotion
      : selectedMotion?.kind === "preset"
        ? createEditableMotionFromPreset(selectedMotion.preset)
        : defaultTimelineMotion;
  const selectedNodeSummary = currentSelectedNodeRef
    ? nodes.find((node) => refsEqual(node.ref, currentSelectedNodeRef))
    : undefined;
  const selectedLayerIndex = currentSelectedNodeRef
    ? (selectedNodeSummary?.ref.layerIndex ?? currentSelectedNodeRef.layerIndex) + 1
    : undefined;
  const moveUpDestination =
    currentSelectedNodeRef === undefined
      ? undefined
      : getMoveDestination(scene, currentSelectedNodeRef, -1);
  const moveDownDestination =
    currentSelectedNodeRef === undefined
      ? undefined
      : getMoveDestination(scene, currentSelectedNodeRef, 1);

  return (
    <div className={cn("grid gap-4", className)}>
      <Toolbar className="rounded-2xl border-border/60 bg-card/85">
        <ToolbarGroup className="min-w-56 flex-1">
          <div className="grid min-w-0 gap-1">
            <ToolbarTitle>Flat Scene Editor</ToolbarTitle>
            <p className="text-xs text-muted-foreground">
              Package-backed scene and motion editing surface.
            </p>
          </div>
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup className="flex-wrap">
          <Label htmlFor={`${exportTextareaId}-title`} className="sr-only">
            Scene title
          </Label>
          <Input
            id={`${exportTextareaId}-title`}
            className="w-44"
            value={scene.title ?? ""}
            placeholder="Untitled scene"
            disabled={readOnly}
            onChange={(event) =>
              commitScene(updateFlatSceneMetadata(scene, { title: event.target.value }))
            }
          />
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup aria-label="Zoom controls">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleZoomChange(zoom - 0.1)}
          >
            -
          </Button>
          <Badge variant="secondary" className="min-w-14 justify-center rounded-full">
            {Math.round(zoom * 100)}%
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleZoomChange(zoom + 0.1)}
          >
            +
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleFitToView}>
            Fit
          </Button>
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup aria-label="Insert figures" className="flex-wrap">
          {availableFigures.map((figure) => (
            <Button
              key={figure.id}
              type="button"
              variant="outline"
              size="sm"
              disabled={readOnly}
              onClick={() => handleInsertFigure(figure)}
            >
              Add {figure.label}
            </Button>
          ))}
        </ToolbarGroup>
        <ToolbarSpacer />
        <ToolbarGroup aria-label="Selection actions" className="flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!currentSelectedNodeRef || readOnly}
            onClick={handleDuplicateSelectedNode}
          >
            Duplicate
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!currentSelectedNodeRef || readOnly}
            onClick={handleDeleteSelectedNode}
          >
            Delete
          </Button>
          <Button type="button" size="sm" onClick={handleExportSvg}>
            Export SVG
          </Button>
        </ToolbarGroup>
      </Toolbar>

      <div className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)_20rem]">
        <Section
          title="Scene Tree"
          description="Select the scene root or any node. Reorder the selected node within its current parent."
          className="min-h-0"
        >
          <Button
            type="button"
            variant={selection.mode === "scene" ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => setCurrentSelectedNodeRef(undefined)}
          >
            Scene root
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={!moveUpDestination || readOnly}
              onClick={() => handleMoveSelectedNode(-1)}
            >
              Move up
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={!moveDownDestination || readOnly}
              onClick={() => handleMoveSelectedNode(1)}
            >
              Move down
            </Button>
          </div>
          <ScrollArea className="h-[20rem] rounded-lg border border-border/60">
            <div className="space-y-1 p-2">
              {nodes.map((node) => (
                <Button
                  key={`${node.ref.layerIndex}:${node.ref.path.join(".")}`}
                  type="button"
                  variant={refsEqual(node.ref, currentSelectedNodeRef) ? "secondary" : "ghost"}
                  className="h-auto w-full justify-between gap-3 rounded-lg px-2 py-2 text-left"
                  style={{ paddingLeft: `${10 + node.depth * 16}px` } as CSSProperties}
                  onClick={() => setCurrentSelectedNodeRef(node.ref)}
                >
                  <span className="min-w-0 truncate">{node.label}</span>
                  <span className="shrink-0 text-[0.68rem] uppercase tracking-wide text-muted-foreground">
                    {node.kind}
                  </span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </Section>

        <div className="grid gap-4">
          <Section
            title="Canvas"
            description="Click the background to return to scene properties. Click any node to edit it."
          >
            <div
              ref={canvasViewportRef}
              className="overflow-auto rounded-2xl border border-border/60 bg-[radial-gradient(circle_at_top,#f8fbff,transparent_45%),linear-gradient(180deg,#ffffff,#eef4ff)] p-4"
            >
              <div
                className="mx-auto w-fit origin-top transition-transform"
                style={{ transform: `scale(${zoom})` }}
              >
                <EditableFlatScene
                  scene={scene}
                  selectedNodeRef={currentSelectedNodeRef}
                  onSelectedNodeChange={setCurrentSelectedNodeRef}
                  selectionClassName="drop-shadow-[0_0_10px_rgba(45,127,249,0.85)]"
                  hoverClassName="cursor-pointer transition-[filter] hover:drop-shadow-[0_0_8px_rgba(45,127,249,0.45)]"
                  width={scene.width}
                  height={scene.height}
                  style={{
                    display: "block",
                    width: scene.width,
                    height: scene.height,
                    background: scene.background ?? "#ffffff",
                  }}
                />
              </div>
            </div>
          </Section>

          <Section
            title="Motion Timeline"
            description={
              currentSelectedNodeRef
                ? "Assign a preset motion or switch to an editable timeline for keyframe control."
                : "Select a node to edit motion."
            }
          >
            <div className="flex flex-wrap gap-2">
              {motionPresetOptions.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!currentSelectedNodeRef || readOnly}
                  onClick={() => applyMotionPreset(preset)}
                >
                  {preset}
                </Button>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!currentSelectedNodeRef || readOnly}
                onClick={switchSelectedNodeToTimelineMotion}
              >
                Use timeline
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!currentSelectedNodeRef || readOnly}
                onClick={() => {
                  if (!currentSelectedNodeRef || readOnly) {
                    return;
                  }

                  commitScene(clearFlatNodeMotion(scene, currentSelectedNodeRef));
                }}
              >
                Clear motion
              </Button>
            </div>
            <FlatMotionTimelineEditor
              motion={editableMotion}
              readOnly={!currentSelectedNodeRef || readOnly || selectedMotion?.kind === "preset"}
              onMotionChange={(motion) => {
                if (!currentSelectedNodeRef || readOnly) {
                  return;
                }

                commitScene(setFlatNodeMotion(scene, currentSelectedNodeRef, motion));
              }}
            />
            {selectedMotion?.kind === "preset" ? (
              <p className="text-xs leading-5 text-muted-foreground">
                The selected node currently uses the <strong>{selectedMotion.preset}</strong>{" "}
                preset. Choose
                <strong> Use timeline</strong> to convert it into editable keyframes.
              </p>
            ) : null}
          </Section>

          {showExportPanel ? (
            <Section
              title="SVG Export"
              description="The editor preview and export use the same scene object and `renderFlatSceneToSvg()` output."
            >
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {scene.width} x {scene.height}
                </Badge>
                {exportStatus === "copied" ? <Badge>Copied</Badge> : null}
                {exportStatus === "unsupported" ? (
                  <Badge variant="outline">Clipboard unavailable</Badge>
                ) : null}
              </div>
              <Textarea
                id={exportTextareaId}
                readOnly
                value={svgMarkup}
                className="min-h-64 font-mono text-xs"
              />
            </Section>
          ) : null}
        </div>

        <Section
          title={selection.mode === "scene" ? "Scene Inspector" : "Node Inspector"}
          description={
            selection.mode === "scene"
              ? "Document metadata for the current editable scene."
              : "Safe typed properties for the selected node and its motion."
          }
        >
          {selection.mode === "scene" ? (
            <>
              <Field label="Title">
                <Input
                  value={scene.title ?? ""}
                  placeholder="Untitled scene"
                  disabled={readOnly}
                  onChange={(event) =>
                    commitScene(updateFlatSceneMetadata(scene, { title: event.target.value }))
                  }
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberField
                  label="Width"
                  value={scene.width}
                  min={1}
                  disabled={readOnly}
                  onChange={(value) =>
                    commitScene(updateFlatSceneMetadata(scene, { width: value }))
                  }
                />
                <NumberField
                  label="Height"
                  value={scene.height}
                  min={1}
                  disabled={readOnly}
                  onChange={(value) =>
                    commitScene(updateFlatSceneMetadata(scene, { height: value }))
                  }
                />
              </div>
              <ColorField
                label="Background"
                value={scene.background}
                disabled={readOnly}
                onChange={(value) =>
                  commitScene(updateFlatSceneMetadata(scene, { background: value }))
                }
              />
            </>
          ) : selectedNode ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{createShapeLabel(selectedNode)}</div>
                  <p className="text-xs text-muted-foreground">
                    Layer {selectedLayerIndex ?? 1} · {selectedNode.kind}
                  </p>
                </div>
                <Badge variant="secondary">{selectedNode.kind}</Badge>
              </div>
              <Field label="Node id">
                <Input
                  value={selectedNode.id ?? ""}
                  placeholder="node-id"
                  disabled={readOnly}
                  onChange={(event) =>
                    updateSelectedShape((shape) => ({
                      ...shape,
                      id: event.target.value,
                    }))
                  }
                />
              </Field>
              <NumberField
                label="Opacity"
                value={selectedNode.opacity ?? 1}
                min={0}
                max={1}
                step={0.05}
                disabled={readOnly}
                onChange={(value) =>
                  updateSelectedShape((shape) => ({
                    ...shape,
                    opacity: clamp(value, 0, 1),
                  }))
                }
              />
              {isGroup(selectedNode) ? (
                <>
                  <Separator />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <NumberField
                      label="Translate X"
                      value={groupTransform?.x ?? 0}
                      disabled={readOnly}
                      onChange={(value) => updateSelectedGroupTransform({ x: value })}
                    />
                    <NumberField
                      label="Translate Y"
                      value={groupTransform?.y ?? 0}
                      disabled={readOnly}
                      onChange={(value) => updateSelectedGroupTransform({ y: value })}
                    />
                  </div>
                  <NumberField
                    label="Scale"
                    value={groupTransform?.scale ?? 1}
                    min={0.2}
                    max={3}
                    step={0.05}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedGroupTransform({ scale: clamp(value, 0.2, 3) })
                    }
                  />
                </>
              ) : null}
              {selectedNode.kind === "rect" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <NumberField
                    label="X"
                    value={selectedNode.x}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        x: value,
                      }))
                    }
                  />
                  <NumberField
                    label="Y"
                    value={selectedNode.y}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        y: value,
                      }))
                    }
                  />
                  <NumberField
                    label="Width"
                    value={selectedNode.width}
                    min={1}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        width: Math.max(1, value),
                      }))
                    }
                  />
                  <NumberField
                    label="Height"
                    value={selectedNode.height}
                    min={1}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        height: Math.max(1, value),
                      }))
                    }
                  />
                  <ColorField
                    label="Fill"
                    value={selectedNode.fill}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        fill: value,
                      }))
                    }
                  />
                </div>
              ) : null}
              {selectedNode.kind === "circle" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <NumberField
                    label="Center X"
                    value={selectedNode.cx}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        cx: value,
                      }))
                    }
                  />
                  <NumberField
                    label="Center Y"
                    value={selectedNode.cy}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        cy: value,
                      }))
                    }
                  />
                  <NumberField
                    label="Radius"
                    value={selectedNode.r}
                    min={1}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        r: Math.max(1, value),
                      }))
                    }
                  />
                  <ColorField
                    label="Fill"
                    value={selectedNode.fill}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        fill: value,
                      }))
                    }
                  />
                </div>
              ) : null}
              {selectedNode.kind === "ellipse" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <NumberField
                    label="Center X"
                    value={selectedNode.cx}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        cx: value,
                      }))
                    }
                  />
                  <NumberField
                    label="Center Y"
                    value={selectedNode.cy}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        cy: value,
                      }))
                    }
                  />
                  <NumberField
                    label="Radius X"
                    value={selectedNode.rx}
                    min={1}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        rx: Math.max(1, value),
                      }))
                    }
                  />
                  <NumberField
                    label="Radius Y"
                    value={selectedNode.ry}
                    min={1}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        ry: Math.max(1, value),
                      }))
                    }
                  />
                  <ColorField
                    label="Fill"
                    value={selectedNode.fill}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        fill: value,
                      }))
                    }
                  />
                </div>
              ) : null}
              {selectedNode.kind === "line" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <NumberField
                    label="X1"
                    value={selectedNode.x1}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        x1: value,
                      }))
                    }
                  />
                  <NumberField
                    label="Y1"
                    value={selectedNode.y1}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        y1: value,
                      }))
                    }
                  />
                  <NumberField
                    label="X2"
                    value={selectedNode.x2}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        x2: value,
                      }))
                    }
                  />
                  <NumberField
                    label="Y2"
                    value={selectedNode.y2}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        y2: value,
                      }))
                    }
                  />
                  <NumberField
                    label="Stroke width"
                    value={selectedNode.strokeWidth ?? 1}
                    min={0}
                    step={0.5}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        strokeWidth: Math.max(0, value),
                      }))
                    }
                  />
                  <ColorField
                    label="Stroke"
                    value={selectedNode.stroke}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        stroke: value,
                      }))
                    }
                  />
                </div>
              ) : null}
              {selectedNode.kind === "path" || selectedNode.kind === "polygon" ? (
                <>
                  <ColorField
                    label="Fill"
                    value={selectedNode.fill}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        fill: value,
                      }))
                    }
                  />
                  <ColorField
                    label="Stroke"
                    value={selectedNode.stroke}
                    disabled={readOnly}
                    onChange={(value) =>
                      updateSelectedShape((shape) => ({
                        ...(shape as typeof selectedNode),
                        stroke: value,
                      }))
                    }
                  />
                </>
              ) : null}
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">Motion</div>
                    <p className="text-xs text-muted-foreground">
                      {selectedMotion
                        ? selectedMotion.kind === "preset"
                          ? `Preset: ${selectedMotion.preset}`
                          : "Editable timeline motion"
                        : "No motion assigned"}
                    </p>
                  </div>
                  {selectedMotion ? (
                    <Badge variant="outline">{selectedMotion.kind}</Badge>
                  ) : (
                    <Badge variant="secondary">none</Badge>
                  )}
                </div>
                <Field label="Repeat count">
                  <NativeSelect
                    value={
                      selectedMotion?.kind === "timeline"
                        ? String(selectedMotion.repeatCount ?? "indefinite")
                        : "indefinite"
                    }
                    disabled={
                      readOnly || !currentSelectedNodeRef || selectedMotion?.kind !== "timeline"
                    }
                    onChange={(event) =>
                      updateTimelineMotion({
                        repeatCount:
                          event.target.value === "indefinite"
                            ? "indefinite"
                            : Number(event.target.value),
                      })
                    }
                  >
                    <NativeSelectOption value="indefinite">Indefinite</NativeSelectOption>
                    <NativeSelectOption value="1">1</NativeSelectOption>
                    <NativeSelectOption value="2">2</NativeSelectOption>
                    <NativeSelectOption value="3">3</NativeSelectOption>
                    <NativeSelectOption value="5">5</NativeSelectOption>
                  </NativeSelect>
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <NumberField
                    label="Rotate center X"
                    value={
                      selectedMotion?.kind === "timeline"
                        ? (selectedMotion.rotateCenter?.cx ?? 0)
                        : 0
                    }
                    disabled={
                      readOnly || !currentSelectedNodeRef || selectedMotion?.kind !== "timeline"
                    }
                    onChange={(value) =>
                      updateTimelineMotion({
                        rotateCenter: {
                          cx: value,
                          cy:
                            selectedMotion?.kind === "timeline"
                              ? (selectedMotion.rotateCenter?.cy ?? 0)
                              : 0,
                        },
                      })
                    }
                  />
                  <NumberField
                    label="Rotate center Y"
                    value={
                      selectedMotion?.kind === "timeline"
                        ? (selectedMotion.rotateCenter?.cy ?? 0)
                        : 0
                    }
                    disabled={
                      readOnly || !currentSelectedNodeRef || selectedMotion?.kind !== "timeline"
                    }
                    onChange={(value) =>
                      updateTimelineMotion({
                        rotateCenter: {
                          cx:
                            selectedMotion?.kind === "timeline"
                              ? (selectedMotion.rotateCenter?.cx ?? 0)
                              : 0,
                          cy: value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </>
          ) : null}
        </Section>
      </div>
    </div>
  );
}

function findNodeRefById(scene: FlatDesignScene, id: string) {
  return listFlatNodes(scene).find((node) => node.id === id)?.ref;
}
