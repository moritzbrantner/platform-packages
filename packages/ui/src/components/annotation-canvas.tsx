"use client";

import * as React from "react";
import { CircleIcon, HexagonIcon, MousePointer2Icon, SquareIcon } from "lucide-react";

import { cn } from "../lib/cn";
import { Button } from "./button";

type AnnotationCanvasShape = "rectangle" | "polygon" | "point";
type AnnotationCanvasTool = "select" | "rectangle" | "polygon" | "point";
type AnnotationCanvasPoint = {
  x: number;
  y: number;
};

type AnnotationCanvasAnnotation = {
  id: string;
  shape: AnnotationCanvasShape;
  points: AnnotationCanvasPoint[];
  label?: string;
  color?: string;
};

type AnnotationCanvasProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  annotations: AnnotationCanvasAnnotation[];
  onAnnotationsChange?: (annotations: AnnotationCanvasAnnotation[]) => void;
  selectedAnnotationId?: string | null;
  onSelectedAnnotationChange?: (
    annotationId: string | null,
    annotation?: AnnotationCanvasAnnotation,
  ) => void;
  tool?: AnnotationCanvasTool;
  onToolChange?: (tool: AnnotationCanvasTool) => void;
  width: number;
  height: number;
  imageUrl?: string;
  readOnly?: boolean;
};

type AnnotationCanvasToolbarProps = React.ComponentProps<"div"> & {
  tool: AnnotationCanvasTool;
  onToolChange?: (tool: AnnotationCanvasTool) => void;
  readOnly?: boolean;
};

type DraftAnnotation =
  | {
      type: "rectangle";
      start: AnnotationCanvasPoint;
      current: AnnotationCanvasPoint;
    }
  | {
      type: "polygon";
      points: AnnotationCanvasPoint[];
    }
  | null;

type MoveState = {
  id: string;
  start: AnnotationCanvasPoint;
  originalPoints: AnnotationCanvasPoint[];
} | null;

function AnnotationCanvas({
  annotations,
  onAnnotationsChange,
  selectedAnnotationId,
  onSelectedAnnotationChange,
  tool = "select",
  onToolChange,
  width,
  height,
  imageUrl,
  readOnly = false,
  className,
  ...props
}: AnnotationCanvasProps) {
  const [internalSelection, setInternalSelection] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftAnnotation>(null);
  const [moveState, setMoveState] = React.useState<MoveState>(null);
  const selection = selectedAnnotationId ?? internalSelection;
  const selectedAnnotation = annotations.find((annotation) => annotation.id === selection);

  const commitSelection = (annotationId: string | null) => {
    const annotation = annotations.find((item) => item.id === annotationId);
    setInternalSelection(annotationId);
    onSelectedAnnotationChange?.(annotationId, annotation);
  };

  const commitAnnotations = (nextAnnotations: AnnotationCanvasAnnotation[]) => {
    onAnnotationsChange?.(nextAnnotations);
  };

  const createAnnotation = (
    shape: AnnotationCanvasShape,
    points: AnnotationCanvasPoint[],
  ): AnnotationCanvasAnnotation => ({
    id: `annotation-${Date.now()}-${Math.round(Math.random() * 10000)}`,
    shape,
    points,
    color: "var(--primary)",
    label: shape,
  });

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (readOnly) {
      return;
    }
    const point = getAnnotationPoint(event, width, height);

    if (tool === "rectangle") {
      setDraft({ type: "rectangle", start: point, current: point });
      return;
    }

    if (tool === "point") {
      const annotation = createAnnotation("point", [point]);
      commitAnnotations([...annotations, annotation]);
      commitSelection(annotation.id);
      return;
    }

    if (tool === "polygon") {
      setDraft((current) => {
        const points = current?.type === "polygon" ? [...current.points, point] : [point];
        return { type: "polygon", points };
      });
      return;
    }

    commitSelection(null);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const point = getAnnotationPoint(event, width, height);

    if (draft?.type === "rectangle") {
      setDraft({ ...draft, current: point });
      return;
    }

    if (moveState && !readOnly) {
      const deltaX = point.x - moveState.start.x;
      const deltaY = point.y - moveState.start.y;
      commitAnnotations(
        annotations.map((annotation) =>
          annotation.id === moveState.id
            ? {
                ...annotation,
                points: moveState.originalPoints.map((originalPoint) => ({
                  x: originalPoint.x + deltaX,
                  y: originalPoint.y + deltaY,
                })),
              }
            : annotation,
        ),
      );
    }
  };

  const handlePointerUp = () => {
    if (draft?.type === "rectangle") {
      const points = normalizeRectanglePoints(draft.start, draft.current);
      const safePoints = ensureRectangleSize(points);
      const annotation = createAnnotation("rectangle", safePoints);
      commitAnnotations([...annotations, annotation]);
      commitSelection(annotation.id);
      setDraft(null);
    }

    setMoveState(null);
  };

  const finishPolygon = () => {
    if (draft?.type !== "polygon" || draft.points.length < 3) {
      return;
    }
    const annotation = createAnnotation("polygon", draft.points);
    commitAnnotations([...annotations, annotation]);
    commitSelection(annotation.id);
    setDraft(null);
    onToolChange?.("select");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (readOnly) {
      return;
    }

    if ((event.key === "Delete" || event.key === "Backspace") && selection) {
      event.preventDefault();
      commitAnnotations(annotations.filter((annotation) => annotation.id !== selection));
      commitSelection(null);
    }

    if (event.key === "Enter") {
      finishPolygon();
    }

    if (event.key === "Escape") {
      setDraft(null);
      commitSelection(null);
    }
  };

  return (
    <div
      data-slot="annotation-canvas"
      data-tool={tool}
      data-read-only={readOnly ? "true" : undefined}
      className={cn("space-y-3", className)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <AnnotationCanvasToolbar tool={tool} onToolChange={onToolChange} readOnly={readOnly} />
      <svg
        data-slot="annotation-canvas-surface"
        role="img"
        aria-label="Annotation canvas"
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full rounded-md border bg-muted/30"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={finishPolygon}
      >
        {imageUrl ? (
          <image href={imageUrl} x="0" y="0" width={width} height={height} preserveAspectRatio="none" />
        ) : (
          <rect x="0" y="0" width={width} height={height} fill="var(--muted)" opacity="0.3" />
        )}
        {annotations.map((annotation) => (
          <AnnotationShape
            key={annotation.id}
            annotation={annotation}
            selected={annotation.id === selection}
            onPointerDown={(event) => {
              if (readOnly) {
                return;
              }
              event.stopPropagation();
              commitSelection(annotation.id);
              if (tool === "select") {
                setMoveState({
                  id: annotation.id,
                  start: getAnnotationPoint(event, width, height),
                  originalPoints: annotation.points,
                });
              }
            }}
          />
        ))}
        {draft?.type === "rectangle" ? (
          <AnnotationShape
            annotation={{
              id: "draft-rectangle",
              shape: "rectangle",
              points: normalizeRectanglePoints(draft.start, draft.current),
              color: "var(--primary)",
            }}
            selected
            draft
          />
        ) : null}
        {draft?.type === "polygon" ? (
          <polyline
            points={draft.points.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke="var(--primary)"
            strokeDasharray="4 4"
            strokeWidth={2}
          />
        ) : null}
        {selectedAnnotation?.label ? (
          <text
            x={selectedAnnotation.points[0]?.x ?? 0}
            y={(selectedAnnotation.points[0]?.y ?? 0) - 6}
            className="fill-foreground text-xs"
          >
            {selectedAnnotation.label}
          </text>
        ) : null}
      </svg>
    </div>
  );
}

function AnnotationCanvasToolbar({
  tool,
  onToolChange,
  readOnly,
  className,
  ...props
}: AnnotationCanvasToolbarProps) {
  const tools: Array<{
    tool: AnnotationCanvasTool;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }> = [
    { tool: "select", label: "Select", icon: MousePointer2Icon },
    { tool: "rectangle", label: "Rectangle", icon: SquareIcon },
    { tool: "polygon", label: "Polygon", icon: HexagonIcon },
    { tool: "point", label: "Point", icon: CircleIcon },
  ];

  return (
    <div
      data-slot="annotation-canvas-toolbar"
      role="toolbar"
      aria-label="Annotation tools"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    >
      {tools.map(({ tool: toolName, label, icon: Icon }) => (
        <Button
          key={toolName}
          type="button"
          variant={tool === toolName ? "secondary" : "outline"}
          size="icon-sm"
          aria-label={label}
          aria-pressed={tool === toolName}
          disabled={readOnly && toolName !== "select"}
          onClick={() => onToolChange?.(toolName)}
        >
          <Icon />
        </Button>
      ))}
    </div>
  );
}

function AnnotationShape({
  annotation,
  selected,
  draft,
  onPointerDown,
}: {
  annotation: AnnotationCanvasAnnotation;
  selected?: boolean;
  draft?: boolean;
  onPointerDown?: React.PointerEventHandler<SVGElement>;
}) {
  const color = annotation.color ?? "var(--primary)";
  const strokeWidth = selected ? 3 : 2;

  if (annotation.shape === "point") {
    const point = annotation.points[0] ?? { x: 0, y: 0 };
    return (
      <circle
        data-slot="annotation-canvas-annotation"
        data-selected={selected ? "true" : undefined}
        cx={point.x}
        cy={point.y}
        r={5}
        fill={color}
        stroke="white"
        strokeWidth={strokeWidth}
        onPointerDown={onPointerDown}
      />
    );
  }

  if (annotation.shape === "polygon") {
    return (
      <polygon
        data-slot="annotation-canvas-annotation"
        data-selected={selected ? "true" : undefined}
        points={annotation.points.map((point) => `${point.x},${point.y}`).join(" ")}
        fill={draft ? "transparent" : color}
        fillOpacity={draft ? undefined : 0.14}
        stroke={color}
        strokeWidth={strokeWidth}
        onPointerDown={onPointerDown}
      />
    );
  }

  const [start = { x: 0, y: 0 }, end = start] = annotation.points;
  return (
    <rect
      data-slot="annotation-canvas-annotation"
      data-selected={selected ? "true" : undefined}
      x={start.x}
      y={start.y}
      width={Math.max(0, end.x - start.x)}
      height={Math.max(0, end.y - start.y)}
      fill={draft ? "transparent" : color}
      fillOpacity={draft ? undefined : 0.14}
      stroke={color}
      strokeWidth={strokeWidth}
      onPointerDown={onPointerDown}
    />
  );
}

function getAnnotationPoint(
  event: React.PointerEvent<SVGElement>,
  width: number,
  height: number,
): AnnotationCanvasPoint {
  const rect = event.currentTarget.getBoundingClientRect();
  const rectWidth = rect.width || width;
  const rectHeight = rect.height || height;
  const pointer = getAnnotationPointer(event);
  return {
    x: clampAnnotationValue((((pointer?.x ?? rect.left) - rect.left) / rectWidth) * width, 0, width),
    y: clampAnnotationValue((((pointer?.y ?? rect.top) - rect.top) / rectHeight) * height, 0, height),
  };
}

function getAnnotationPointer(event: React.PointerEvent<SVGElement>) {
  const nativeEvent = event.nativeEvent as PointerEvent & {
    pageX?: number;
    pageY?: number;
    x?: number;
    y?: number;
  };
  const x = [nativeEvent.clientX, nativeEvent.pageX, nativeEvent.x, event.clientX].find(
    (value) => typeof value === "number" && Number.isFinite(value),
  );
  const y = [nativeEvent.clientY, nativeEvent.pageY, nativeEvent.y, event.clientY].find(
    (value) => typeof value === "number" && Number.isFinite(value),
  );

  if (x === undefined || y === undefined) {
    return undefined;
  }

  return { x, y };
}

function normalizeRectanglePoints(
  start: AnnotationCanvasPoint,
  end: AnnotationCanvasPoint,
): [AnnotationCanvasPoint, AnnotationCanvasPoint] {
  return [
    { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y) },
    { x: Math.max(start.x, end.x), y: Math.max(start.y, end.y) },
  ];
}

function ensureRectangleSize(
  points: [AnnotationCanvasPoint, AnnotationCanvasPoint],
): [AnnotationCanvasPoint, AnnotationCanvasPoint] {
  const [start, end] = points;
  return [
    start,
    {
      x: end.x > start.x ? end.x : start.x + 1,
      y: end.y > start.y ? end.y : start.y + 1,
    },
  ];
}

function clampAnnotationValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export { AnnotationCanvas, AnnotationCanvasToolbar };
export type {
  AnnotationCanvasAnnotation,
  AnnotationCanvasPoint,
  AnnotationCanvasProps,
  AnnotationCanvasShape,
  AnnotationCanvasTool,
};
