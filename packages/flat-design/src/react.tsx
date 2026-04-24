import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";

import {
  addMotionKeyframe,
  findFlatNodeById,
  getFlatNode,
  listFlatNodes,
  normalizeEditableMotion,
  removeMotionKeyframe,
  updateMotionKeyframe,
} from "./core";
import { FlatScene, type FlatSceneProps } from "./flat-scene";
import type {
  FlatDesignScene,
  FlatEditableKeyframe,
  FlatNodeRef,
  FlatNodeSummary,
  FlatTimelineMotionSpec,
} from "./scene-types";

type TimelineField = "opacity" | "rotate" | "scale" | "timeMs" | "x" | "y";

export type UseFlatSceneSelectionResult = {
  nodes: FlatNodeSummary[];
  selectedNodeRef: FlatNodeRef | undefined;
  selectedNode: ReturnType<typeof getFlatNode>;
  selectNode: (ref: FlatNodeRef | undefined) => void;
  selectNodeById: (id: string) => void;
};

export type EditableFlatSceneProps = Omit<FlatSceneProps, "getShapeProps"> & {
  scene: FlatDesignScene;
  selectedNodeRef?: FlatNodeRef;
  onSelectedNodeChange?: (ref: FlatNodeRef | undefined) => void;
  selectionClassName?: string;
  hoverClassName?: string;
  hitTargetMode?: "shape" | "group";
};

export type FlatMotionTimelineEditorProps = {
  motion: FlatTimelineMotionSpec;
  selectedKeyframeIndex?: number;
  onMotionChange?: (motion: FlatTimelineMotionSpec) => void;
  onSelectedKeyframeIndexChange?: (index: number) => void;
  minDurationMs?: number;
  maxDurationMs?: number;
  className?: string;
  readOnly?: boolean;
};

function refsEqual(left?: FlatNodeRef, right?: FlatNodeRef) {
  if (!left || !right) {
    return left === right;
  }

  if (left.layerIndex !== right.layerIndex || left.path.length !== right.path.length) {
    return false;
  }

  return left.path.every((value, index) => value === right.path[index]);
}

function toRefKey(ref: FlatNodeRef) {
  return `${ref.layerIndex}:${ref.path.join(".")}`;
}

function toDomNodeId(ref: FlatNodeRef) {
  return `flat-node-l${ref.layerIndex}-p${ref.path.join("-") || "root"}`;
}

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ") || undefined;
}

function findSelectableElement(
  target: EventTarget | null,
  currentTarget: EventTarget | null,
  hitTargetMode: EditableFlatSceneProps["hitTargetMode"],
) {
  let node = target instanceof Element ? target : null;
  let fallback: Element | null = null;

  while (node && node !== currentTarget) {
    if (node instanceof SVGElement && node.dataset.flatNodeRef) {
      fallback ??= node;

      if (hitTargetMode !== "group" || node.dataset.flatNodeKind === "group") {
        return node;
      }
    }

    node = node.parentElement;
  }

  return fallback;
}

function readNumericKeyframeValue(keyframe: FlatEditableKeyframe, field: TimelineField) {
  const value = keyframe[field];

  return typeof value === "number" ? value : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function useFlatSceneSelection(scene: FlatDesignScene): UseFlatSceneSelectionResult {
  const nodes = useMemo(() => listFlatNodes(scene), [scene]);
  const [selectedNodeRef, setSelectedNodeRef] = useState<FlatNodeRef | undefined>(() => nodes[0]?.ref);
  const selectedNode = useMemo(
    () => (selectedNodeRef ? getFlatNode(scene, selectedNodeRef) : undefined),
    [scene, selectedNodeRef],
  );

  useEffect(() => {
    if (!selectedNodeRef) {
      return;
    }

    if (getFlatNode(scene, selectedNodeRef)) {
      return;
    }

    setSelectedNodeRef(nodes[0]?.ref);
  }, [nodes, scene, selectedNodeRef]);

  return {
    nodes,
    selectedNodeRef,
    selectedNode,
    selectNode: setSelectedNodeRef,
    selectNodeById(id: string) {
      setSelectedNodeRef(findFlatNodeById(scene, id));
    },
  };
}

export function EditableFlatScene({
  scene,
  selectedNodeRef,
  onSelectedNodeChange,
  className,
  style,
  width,
  height,
  preserveAspectRatio,
  selectionClassName,
  hoverClassName,
  hitTargetMode = "shape",
}: EditableFlatSceneProps) {
  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const element = findSelectableElement(event.target, event.currentTarget, hitTargetMode);
    const refValue = element?.getAttribute("data-flat-node-ref");

    if (!refValue) {
      onSelectedNodeChange?.(undefined);
      return;
    }

    const [layerIndexText, pathText = ""] = refValue.split(":");
    const ref: FlatNodeRef = {
      layerIndex: Number(layerIndexText),
      path: pathText ? pathText.split(".").map((segment) => Number(segment)) : [],
    };

    onSelectedNodeChange?.(ref);
  }

  return (
    <div onClick={handleClick}>
      <FlatScene
        scene={scene}
        className={className}
        style={style}
        width={width}
        height={height}
        preserveAspectRatio={preserveAspectRatio}
        getShapeProps={({ shape, ref }) => ({
          id: shape.id ?? toDomNodeId(ref),
          className: joinClassNames(
            hoverClassName,
            refsEqual(ref, selectedNodeRef) ? selectionClassName : undefined,
          ),
          "data-flat-node-ref": `${ref.layerIndex}:${ref.path.join(".")}`,
          "data-flat-node-kind": shape.kind,
        })}
      />
    </div>
  );
}

export function FlatMotionTimelineEditor({
  motion,
  selectedKeyframeIndex,
  onMotionChange,
  onSelectedKeyframeIndexChange,
  minDurationMs = 100,
  maxDurationMs = 60_000,
  className,
  readOnly = false,
}: FlatMotionTimelineEditorProps) {
  const normalizedMotion = useMemo(() => normalizeEditableMotion(motion), [motion]);
  const [internalSelectedKeyframeIndex, setInternalSelectedKeyframeIndex] = useState(0);
  const activeIndex = clamp(
    selectedKeyframeIndex ?? internalSelectedKeyframeIndex,
    0,
    Math.max(normalizedMotion.keyframes.length - 1, 0),
  );

  useEffect(() => {
    if (selectedKeyframeIndex === undefined) {
      setInternalSelectedKeyframeIndex(activeIndex);
    }
  }, [activeIndex, selectedKeyframeIndex]);

  function selectKeyframe(index: number) {
    if (selectedKeyframeIndex === undefined) {
      setInternalSelectedKeyframeIndex(index);
    }

    onSelectedKeyframeIndexChange?.(index);
  }

  function commitMotion(nextMotion: FlatTimelineMotionSpec) {
    onMotionChange?.(normalizeEditableMotion(nextMotion));
  }

  function handleDurationChange(value: number) {
    commitMotion({
      ...normalizedMotion,
      durationMs: clamp(value, minDurationMs, maxDurationMs),
    });
  }

  function handleAddKeyframe(event: MouseEvent<HTMLButtonElement>) {
    if (readOnly) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = rect.width === 0 ? 0 : (event.clientX - rect.left) / rect.width;
    const timeMs = clamp(Math.round(ratio * normalizedMotion.durationMs), 0, normalizedMotion.durationMs);
    const source = normalizedMotion.keyframes[activeIndex] ?? normalizedMotion.keyframes[0] ?? { timeMs };
    const nextMotion = addMotionKeyframe(normalizedMotion, {
      ...source,
      timeMs,
    });
    const nextIndex = nextMotion.keyframes.findIndex((keyframe) => keyframe.timeMs === timeMs);

    commitMotion(nextMotion);
    selectKeyframe(nextIndex >= 0 ? nextIndex : 0);
  }

  function handleRemoveKeyframe() {
    if (readOnly) {
      return;
    }

    const nextMotion = removeMotionKeyframe(normalizedMotion, activeIndex);
    commitMotion(nextMotion);
    selectKeyframe(Math.max(activeIndex - 1, 0));
  }

  function handleKeyframeFieldChange(index: number, field: TimelineField, value: number) {
    if (readOnly) {
      return;
    }

    commitMotion(
      updateMotionKeyframe(normalizedMotion, index, {
        [field]:
          field === "opacity"
            ? clamp(value, 0, 1)
            : field === "scale"
              ? clamp(value, 0.2, 3)
              : field === "timeMs"
                ? clamp(value, 0, normalizedMotion.durationMs)
                : value,
      }),
    );
  }

  const activeKeyframe = normalizedMotion.keyframes[activeIndex] ?? normalizedMotion.keyframes[0];

  return (
    <div className={className}>
      <div className="grid gap-4 rounded-xl border border-border/60 bg-white/70 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem_8rem] md:items-end">
          <label className="grid gap-1 text-xs font-medium text-foreground">
            Duration (ms)
            <input
              className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
              aria-label="Motion duration"
              type="number"
              min={minDurationMs}
              max={maxDurationMs}
              step={100}
              value={normalizedMotion.durationMs}
              onChange={(event) => handleDurationChange(Number(event.target.value))}
              disabled={readOnly}
            />
          </label>
          <div className="grid gap-1 text-xs font-medium text-foreground">
            <span>Direction</span>
            <div className="h-9 rounded-md border border-border bg-muted/40 px-3 text-sm leading-9">
              {normalizedMotion.direction ?? "normal"}
            </div>
          </div>
          <button
            type="button"
            className="h-9 rounded-md border border-border bg-background px-3 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleRemoveKeyframe}
            disabled={readOnly || normalizedMotion.keyframes.length <= 2}
          >
            Delete keyframe
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>0ms</span>
            <span>
              {activeKeyframe?.timeMs ?? 0}ms / {normalizedMotion.durationMs}ms
            </span>
            <span>{normalizedMotion.durationMs}ms</span>
          </div>
          <button
            type="button"
            className="relative h-12 w-full rounded-md border border-border bg-background"
            aria-label="Motion timeline rail"
            onClick={handleAddKeyframe}
            disabled={readOnly}
          >
            <span className="absolute left-3 right-3 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
            {normalizedMotion.keyframes.map((keyframe, index) => (
              <span
                key={`${keyframe.timeMs}-${index}`}
                className={[
                  "absolute top-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[0.65rem] font-semibold shadow-sm",
                  index === activeIndex
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-white text-foreground",
                ].join(" ")}
                style={{
                  left: `${normalizedMotion.durationMs === 0 ? 0 : (keyframe.timeMs / normalizedMotion.durationMs) * 100}%`,
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  selectKeyframe(index);
                }}
              >
                {index + 1}
              </span>
            ))}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-3 font-semibold">Frame</th>
                <th className="pb-2 pr-3 font-semibold">Time</th>
                <th className="pb-2 pr-3 font-semibold">X</th>
                <th className="pb-2 pr-3 font-semibold">Y</th>
                <th className="pb-2 pr-3 font-semibold">Scale</th>
                <th className="pb-2 pr-3 font-semibold">Rotate</th>
                <th className="pb-2 font-semibold">Opacity</th>
              </tr>
            </thead>
            <tbody>
              {normalizedMotion.keyframes.map((keyframe, index) => (
                <tr
                  key={index}
                  className={index === activeIndex ? "bg-primary/5" : undefined}
                  onClick={() => selectKeyframe(index)}
                >
                  <td className="py-1.5 pr-3 text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </td>
                  {(["timeMs", "x", "y", "scale", "rotate", "opacity"] as const).map((field) => (
                    <td key={field} className="py-1.5 pr-3 last:pr-0">
                      <input
                        className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm outline-none transition focus:border-primary"
                        aria-label={`Keyframe ${index + 1} ${field}`}
                        type="number"
                        min={field === "timeMs" || field === "opacity" ? 0 : field === "scale" ? 0.2 : undefined}
                        max={
                          field === "timeMs"
                            ? normalizedMotion.durationMs
                            : field === "opacity"
                              ? 1
                              : field === "scale"
                                ? 3
                                : undefined
                        }
                        step={field === "timeMs" ? 100 : field === "opacity" || field === "scale" ? 0.01 : 1}
                        value={readNumericKeyframeValue(keyframe, field)}
                        onChange={(event) =>
                          handleKeyframeFieldChange(index, field, Number(event.target.value))
                        }
                        disabled={readOnly}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
