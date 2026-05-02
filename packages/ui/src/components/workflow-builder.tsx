"use client";

import * as React from "react";
import { Maximize2Icon, MinusIcon, PlusIcon, Trash2Icon, WorkflowIcon } from "lucide-react";

import { cn } from "../lib/cn";
import { Badge } from "./badge";
import { Button } from "./button";
import { Separator } from "./separator";
import {
  WorkflowNode,
  getWorkflowNodePortCenterOffset,
  getWorkflowNodeSize,
  type WorkflowNodeData as WorkflowCanvasNodeData,
  type WorkflowNodePort as WorkflowCanvasNodePort,
} from "./workflow-node";

type WorkflowBuilderPort = WorkflowCanvasNodePort;

type WorkflowBuilderNodeData = WorkflowCanvasNodeData & {
  x: number;
  y: number;
};

type WorkflowBuilderEdge = {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  status?: "idle" | "running" | "success" | "error" | "warning" | string;
  metadata?: Record<string, unknown>;
};

type WorkflowBuilderSelection =
  | { type: "node"; id: string; node: WorkflowBuilderNodeData }
  | { type: "edge"; id: string; edge: WorkflowBuilderEdge }
  | null;

type WorkflowBuilderConnectionValidityInput = {
  nodes: WorkflowBuilderNodeData[];
  edges: WorkflowBuilderEdge[];
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
};

type WorkflowBuilderConnectionValidity = {
  valid: boolean;
  reason?: "duplicate" | "kind-mismatch" | "missing-port" | "self-connection";
};

type WorkflowBuilderProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  nodes: WorkflowBuilderNodeData[];
  edges: WorkflowBuilderEdge[];
  onNodesChange?: (nodes: WorkflowBuilderNodeData[]) => void;
  onEdgesChange?: (edges: WorkflowBuilderEdge[]) => void;
  selectedNodeId?: string | null;
  selectedEdgeId?: string | null;
  onSelectionChange?: (selection: WorkflowBuilderSelection) => void;
  readOnly?: boolean;
  defaultZoom?: number;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  minZoom?: number;
  maxZoom?: number;
};

type WorkflowBuilderNodeProps = Omit<React.ComponentProps<"div">, "onSelect"> & {
  node: WorkflowBuilderNodeData;
  selected?: boolean;
  readOnly?: boolean;
  pendingConnection?: PendingConnection | null;
  onNodeSelect?: (node: WorkflowBuilderNodeData) => void;
  onStartConnection?: (nodeId: string, portId: string) => void;
  onCompleteConnection?: (nodeId: string, portId: string) => void;
  onNodePointerDown?: (
    event: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>,
    node: WorkflowBuilderNodeData,
  ) => void;
};

type WorkflowBuilderToolbarProps = React.ComponentProps<"div"> & {
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  readOnly?: boolean;
  selectedLabel?: string;
  onZoomChange?: (zoom: number) => void;
  onFitView?: () => void;
  onDeleteSelection?: () => void;
};

type WorkflowBuilderMiniMapProps = React.ComponentProps<"div"> & {
  nodes: WorkflowBuilderNodeData[];
  edges?: WorkflowBuilderEdge[];
  selectedNodeId?: string | null;
};

type PendingConnection = {
  sourceNodeId: string;
  sourcePortId: string;
};

type WorkflowBuilderPortDirection = "input" | "output";

type WorkflowBuilderPoint = {
  x: number;
  y: number;
};

type WorkflowBuilderPortPointMap = Record<string, WorkflowBuilderPoint>;

type DragState = {
  nodeId: string;
  startX: number;
  startY: number;
  originalX: number;
  originalY: number;
} | null;

function WorkflowBuilder({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  selectedNodeId,
  selectedEdgeId,
  onSelectionChange,
  readOnly = false,
  defaultZoom = 1,
  zoom,
  onZoomChange,
  minZoom = 0.5,
  maxZoom = 1.75,
  className,
  ...props
}: WorkflowBuilderProps) {
  const [internalZoom, setInternalZoom] = React.useState(defaultZoom);
  const [internalSelectedNodeId, setInternalSelectedNodeId] = React.useState<string | null>(null);
  const [internalSelectedEdgeId, setInternalSelectedEdgeId] = React.useState<string | null>(null);
  const [pendingConnection, setPendingConnection] = React.useState<PendingConnection | null>(null);
  const [dragState, setDragState] = React.useState<DragState>(null);
  const [portPoints, setPortPoints] = React.useState<WorkflowBuilderPortPointMap>({});
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const currentZoom = zoom ?? internalZoom;
  const currentSelectedNodeId = selectedNodeId ?? internalSelectedNodeId;
  const currentSelectedEdgeId = selectedEdgeId ?? internalSelectedEdgeId;
  const selectedNode = nodes.find((node) => node.id === currentSelectedNodeId);
  const selectedEdge = edges.find((edge) => edge.id === currentSelectedEdgeId);

  const commitZoom = (nextZoom: number) => {
    const safeZoom = clampWorkflowValue(nextZoom, minZoom, maxZoom);
    setInternalZoom(safeZoom);
    onZoomChange?.(safeZoom);
  };

  const commitSelection = (selection: WorkflowBuilderSelection) => {
    setInternalSelectedNodeId(selection?.type === "node" ? selection.id : null);
    setInternalSelectedEdgeId(selection?.type === "edge" ? selection.id : null);
    onSelectionChange?.(selection);
  };

  const selectNode = (node: WorkflowBuilderNodeData) => {
    commitSelection({ type: "node", id: node.id, node });
  };

  const selectEdge = (edge: WorkflowBuilderEdge) => {
    commitSelection({ type: "edge", id: edge.id, edge });
  };

  const deleteSelection = () => {
    if (readOnly) {
      return;
    }

    if (selectedNode) {
      onNodesChange?.(nodes.filter((node) => node.id !== selectedNode.id));
      onEdgesChange?.(
        edges.filter(
          (edge) => edge.sourceNodeId !== selectedNode.id && edge.targetNodeId !== selectedNode.id,
        ),
      );
      commitSelection(null);
      return;
    }

    if (selectedEdge) {
      onEdgesChange?.(edges.filter((edge) => edge.id !== selectedEdge.id));
      commitSelection(null);
    }
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>,
  ) => {
    if (!dragState || readOnly) {
      return;
    }
    const pointer = getWorkflowPointer(event);
    const nextNodes = nodes.map((node) =>
      node.id === dragState.nodeId
        ? {
            ...node,
            x: Math.round(dragState.originalX + (pointer.x - dragState.startX) / currentZoom),
            y: Math.round(dragState.originalY + (pointer.y - dragState.startY) / currentZoom),
          }
        : node,
    );
    onNodesChange?.(nextNodes);
  };

  const handleNodePointerDown = (
    event: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>,
    node: WorkflowBuilderNodeData,
  ) => {
    selectNode(node);
    if (
      readOnly ||
      (event.button !== 0 && event.button !== undefined) ||
      isWorkflowPortEvent(event.target)
    ) {
      return;
    }
    const pointer = getWorkflowPointer(event);
    setDragState({
      nodeId: node.id,
      startX: pointer.x,
      startY: pointer.y,
      originalX: node.x,
      originalY: node.y,
    });
  };

  const completeConnection = (targetNodeId: string, targetPortId: string) => {
    if (!pendingConnection || readOnly) {
      return;
    }

    const validity = getWorkflowBuilderConnectionValidity({
      nodes,
      edges,
      sourceNodeId: pendingConnection.sourceNodeId,
      sourcePortId: pendingConnection.sourcePortId,
      targetNodeId,
      targetPortId,
    });

    if (validity.valid) {
      onEdgesChange?.([
        ...edges,
        {
          id: `edge-${pendingConnection.sourceNodeId}-${pendingConnection.sourcePortId}-${targetNodeId}-${targetPortId}`,
          sourceNodeId: pendingConnection.sourceNodeId,
          sourcePortId: pendingConnection.sourcePortId,
          targetNodeId,
          targetPortId,
        },
      ]);
    }

    setPendingConnection(null);
  };

  const fitView = () => {
    commitZoom(1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      deleteSelection();
    }
    if (event.key === "Escape") {
      setPendingConnection(null);
      commitSelection(null);
    }
  };

  React.useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const measuredPortPoints = measureWorkflowBuilderPortPoints(viewport, currentZoom);

    if (Object.keys(measuredPortPoints).length === 0) {
      return;
    }

    setPortPoints((currentPortPoints) =>
      workflowBuilderPortPointMapsAreEqual(currentPortPoints, measuredPortPoints)
        ? currentPortPoints
        : measuredPortPoints,
    );
  }, [currentZoom, edges, nodes, pendingConnection]);

  return (
    <div
      data-slot="workflow-builder"
      data-read-only={readOnly ? "true" : undefined}
      className={cn("space-y-3", className)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <WorkflowBuilderToolbar
        zoom={currentZoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        readOnly={readOnly}
        selectedLabel={selectedNode?.label ?? selectedEdge?.id}
        onZoomChange={commitZoom}
        onFitView={fitView}
        onDeleteSelection={deleteSelection}
      />
      <div
        data-slot="workflow-builder-surface"
        className="relative h-[32rem] overflow-auto rounded-md border bg-muted/20"
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDragState(null)}
        onPointerLeave={() => setDragState(null)}
        onMouseMove={handlePointerMove}
        onMouseUp={() => setDragState(null)}
        onMouseLeave={() => setDragState(null)}
      >
        <div
          ref={viewportRef}
          data-slot="workflow-builder-viewport"
          className="relative min-h-[52rem] min-w-[72rem] origin-top-left"
          style={{ transform: `scale(${currentZoom})`, width: `${100 / currentZoom}%` }}
        >
          <svg
            data-slot="workflow-builder-edges"
            aria-label="Workflow connections"
            className="pointer-events-none absolute inset-0 size-full overflow-visible"
          >
            {edges.map((edge) => {
              const line = getWorkflowEdgeLine(nodes, edge, portPoints);
              const selected = edge.id === currentSelectedEdgeId;
              return (
                <g key={edge.id}>
                  <path
                    data-slot="workflow-builder-edge-hit"
                    role="button"
                    tabIndex={0}
                    aria-label={`Connection ${edge.id}`}
                    d={line.path}
                    className="pointer-events-auto cursor-pointer fill-none stroke-transparent"
                    strokeWidth={16}
                    onClick={() => selectEdge(edge)}
                  />
                  <path
                    data-slot="workflow-builder-edge"
                    data-status={edge.status}
                    data-selected={selected ? "true" : undefined}
                    d={line.path}
                    className={cn(
                      "fill-none stroke-border",
                      selected && "stroke-primary",
                      edge.status === "error" && "stroke-destructive",
                      edge.status === "success" && "stroke-emerald-500",
                      edge.status === "running" && "stroke-blue-500",
                    )}
                    strokeWidth={selected ? 3 : 2}
                  />
                </g>
              );
            })}
          </svg>
          {nodes.map((node) => (
            <WorkflowBuilderNode
              key={node.id}
              node={node}
              selected={node.id === currentSelectedNodeId}
              readOnly={readOnly}
              pendingConnection={pendingConnection}
              onNodeSelect={selectNode}
              onStartConnection={(sourceNodeId, sourcePortId) =>
                setPendingConnection({ sourceNodeId, sourcePortId })
              }
              onCompleteConnection={completeConnection}
              onNodePointerDown={handleNodePointerDown}
            />
          ))}
        </div>
        <WorkflowBuilderMiniMap
          nodes={nodes}
          edges={edges}
          selectedNodeId={currentSelectedNodeId}
          className="absolute right-3 bottom-3"
        />
      </div>
    </div>
  );
}

function WorkflowBuilderNode({
  node,
  selected,
  readOnly,
  pendingConnection,
  onNodeSelect,
  onStartConnection,
  onCompleteConnection,
  onNodePointerDown,
  className,
  ...props
}: WorkflowBuilderNodeProps) {
  const nodeSize = getWorkflowNodeSize(node);

  return (
    <div
      data-slot="workflow-builder-node"
      data-node-id={node.id}
      data-selected={selected ? "true" : undefined}
      data-status={node.status}
      className={cn("absolute", className)}
      style={{ left: node.x, top: node.y, width: nodeSize.width }}
      onPointerDown={(event) => onNodePointerDown?.(event, node)}
      onMouseDown={(event) => onNodePointerDown?.(event, node)}
      {...props}
    >
      <WorkflowNode
        node={node}
        selected={selected}
        readOnly={readOnly}
        inputDisabled={readOnly || !pendingConnection}
        outputDisabled={readOnly}
        onNodeSelect={() => onNodeSelect?.(node)}
        onInputClick={(port) => onCompleteConnection?.(node.id, port.id)}
        onOutputClick={(port) => onStartConnection?.(node.id, port.id)}
        getInputAriaLabel={(port) => `Connect to ${node.label} ${port.label}`}
        getOutputAriaLabel={(port) => `Start ${node.label} ${port.label}`}
      />
    </div>
  );
}

function WorkflowBuilderToolbar({
  zoom,
  minZoom = 0.5,
  maxZoom = 1.75,
  readOnly,
  selectedLabel,
  onZoomChange,
  onFitView,
  onDeleteSelection,
  className,
  ...props
}: WorkflowBuilderToolbarProps) {
  return (
    <div
      data-slot="workflow-builder-toolbar"
      role="toolbar"
      aria-label="Workflow builder controls"
      className={cn("flex flex-wrap items-center justify-between gap-2", className)}
      {...props}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <WorkflowIcon className="size-4 text-muted-foreground" aria-hidden="true" />
        Workflow
        {selectedLabel ? <Badge variant="secondary">{selectedLabel}</Badge> : null}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Zoom out"
          disabled={zoom <= minZoom}
          onClick={() => onZoomChange?.(zoom - 0.1)}
        >
          <MinusIcon />
        </Button>
        <span className="min-w-12 text-center text-xs text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Zoom in"
          disabled={zoom >= maxZoom}
          onClick={() => onZoomChange?.(zoom + 0.1)}
        >
          <PlusIcon />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Fit view"
          onClick={onFitView}
        >
          <Maximize2Icon />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Delete selected"
          disabled={readOnly || !selectedLabel}
          onClick={onDeleteSelection}
        >
          <Trash2Icon />
        </Button>
      </div>
    </div>
  );
}

function WorkflowBuilderMiniMap({
  nodes,
  edges: _edges,
  selectedNodeId,
  className,
  ...props
}: WorkflowBuilderMiniMapProps) {
  void _edges;
  const bounds = getWorkflowBounds(nodes);

  return (
    <div
      data-slot="workflow-builder-minimap"
      role="img"
      aria-label="Workflow minimap"
      className={cn("h-24 w-36 rounded-md border bg-background/90 p-2 shadow-sm", className)}
      {...props}
    >
      <div className="relative size-full">
        {nodes.map((node) => {
          const left = ((node.x - bounds.x) / bounds.width) * 100;
          const top = ((node.y - bounds.y) / bounds.height) * 100;
          return (
            <span
              key={node.id}
              data-slot="workflow-builder-minimap-node"
              data-selected={node.id === selectedNodeId ? "true" : undefined}
              className="absolute size-2 rounded-sm bg-muted-foreground data-[selected=true]:bg-primary"
              style={{ left: `${left}%`, top: `${top}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}

function getWorkflowBuilderConnectionValidity({
  nodes,
  edges,
  sourceNodeId,
  sourcePortId,
  targetNodeId,
  targetPortId,
}: WorkflowBuilderConnectionValidityInput): WorkflowBuilderConnectionValidity {
  const sourceNode = nodes.find((node) => node.id === sourceNodeId);
  const targetNode = nodes.find((node) => node.id === targetNodeId);
  const sourcePort = sourceNode?.outputs?.find((port) => port.id === sourcePortId);
  const targetPort = targetNode?.inputs?.find((port) => port.id === targetPortId);

  if (!sourceNode || !targetNode || !sourcePort || !targetPort) {
    return { valid: false, reason: "missing-port" };
  }

  if (sourceNodeId === targetNodeId) {
    return { valid: false, reason: "self-connection" };
  }

  if (sourcePort.kind && targetPort.kind && sourcePort.kind !== targetPort.kind) {
    return { valid: false, reason: "kind-mismatch" };
  }

  const duplicate = edges.some(
    (edge) =>
      edge.sourceNodeId === sourceNodeId &&
      edge.sourcePortId === sourcePortId &&
      edge.targetNodeId === targetNodeId &&
      edge.targetPortId === targetPortId,
  );

  if (duplicate) {
    return { valid: false, reason: "duplicate" };
  }

  return { valid: true };
}

function getWorkflowEdgeLine(
  nodes: WorkflowBuilderNodeData[],
  edge: WorkflowBuilderEdge,
  portPoints: WorkflowBuilderPortPointMap = {},
) {
  const sourceNode = nodes.find((node) => node.id === edge.sourceNodeId);
  const targetNode = nodes.find((node) => node.id === edge.targetNodeId);
  const source = sourceNode
    ? getWorkflowNodePortPoint(sourceNode, "output", edge.sourcePortId, portPoints)
    : { x: 0, y: 0 };
  const target = targetNode
    ? getWorkflowNodePortPoint(targetNode, "input", edge.targetPortId, portPoints)
    : { x: 0, y: 0 };
  const handle = Math.max(48, Math.abs(target.x - source.x) / 2);

  return {
    path: `M ${source.x} ${source.y} C ${source.x + handle} ${source.y}, ${target.x - handle} ${target.y}, ${target.x} ${target.y}`,
  };
}

function getWorkflowNodePortPoint(
  node: WorkflowBuilderNodeData,
  direction: WorkflowBuilderPortDirection,
  portId: string,
  portPoints: WorkflowBuilderPortPointMap = {},
): WorkflowBuilderPoint {
  const size = getWorkflowNodeSize(node);
  const compact = node.variant === "compact";
  const measuredPoint = portPoints[getWorkflowBuilderPortPointKey(node.id, direction, portId)];

  if (measuredPoint) {
    return measuredPoint;
  }

  const x = node.x + getWorkflowNodePortDotXOffset(node, direction);

  if (compact) {
    return {
      x,
      y: node.y + size.height / 2,
    };
  }

  const ports = direction === "input" ? (node.inputs ?? []) : (node.outputs ?? []);
  const portIndex = ports.findIndex((port) => port.id === portId);

  if (portIndex === -1) {
    return {
      x,
      y: node.y + size.height / 2,
    };
  }

  return {
    x,
    y: node.y + getWorkflowNodePortCenterOffset(node, portIndex),
  };
}

function getWorkflowBounds(nodes: WorkflowBuilderNodeData[]) {
  const xs = nodes.map((node) => node.x);
  const ys = nodes.map((node) => node.y);
  const minX = Math.min(...xs, 0);
  const minY = Math.min(...ys, 0);
  const sizes = nodes.map((node) => getWorkflowNodeSize(node));
  const maxX = Math.max(
    ...xs.map((x, index) => x + sizes[index]!.width),
    workflowNodeSizeFallback().width,
  );
  const maxY = Math.max(
    ...ys.map((y, index) => y + sizes[index]!.height),
    workflowNodeSizeFallback().height,
  );

  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  };
}

function getWorkflowNodePortDotXOffset(
  node: WorkflowBuilderNodeData,
  direction: WorkflowBuilderPortDirection,
) {
  const size = getWorkflowNodeSize(node);

  if (node.variant !== "compact") {
    return direction === "input"
      ? workflowNodePortDotInset()
      : size.width - workflowNodePortDotInset();
  }

  if (direction === "input") {
    return workflowNodePortDotInset();
  }

  const compactPortColumnWidth =
    (size.width -
      workflowNodeCompactPortPadding() * 2 -
      workflowNodeCompactPortGap() * 2 -
      workflowNodeCompactPortArrowWidth()) /
    2;

  return (
    workflowNodeCompactPortPadding() +
    compactPortColumnWidth +
    workflowNodeCompactPortGap() +
    workflowNodeCompactPortArrowWidth() +
    workflowNodeCompactPortGap() +
    workflowNodePortDotInset()
  );
}

function measureWorkflowBuilderPortPoints(
  viewport: HTMLElement,
  zoom: number,
): WorkflowBuilderPortPointMap {
  const viewportRect = viewport.getBoundingClientRect();

  if (viewportRect.width === 0 || viewportRect.height === 0 || zoom <= 0) {
    return {};
  }

  const portPoints: WorkflowBuilderPortPointMap = {};
  const portElements = viewport.querySelectorAll<HTMLElement>(
    "[data-slot='workflow-node-port'][data-port-id]",
  );

  portElements.forEach((portElement) => {
    const nodeElement = portElement.closest<HTMLElement>("[data-slot='workflow-builder-node']");
    const dotElement = portElement.querySelector<HTMLElement>(
      "[data-slot='workflow-node-port-dot']",
    );
    const nodeId = nodeElement?.dataset.nodeId;
    const portId = portElement.dataset.portId;
    const direction = portElement.dataset.portDirection as WorkflowBuilderPortDirection | undefined;

    if (!nodeId || !portId || !dotElement || !isWorkflowBuilderPortDirection(direction)) {
      return;
    }

    const dotRect = dotElement.getBoundingClientRect();

    if (dotRect.width === 0 || dotRect.height === 0) {
      return;
    }

    portPoints[getWorkflowBuilderPortPointKey(nodeId, direction, portId)] = {
      x: (dotRect.left + dotRect.width / 2 - viewportRect.left) / zoom,
      y: (dotRect.top + dotRect.height / 2 - viewportRect.top) / zoom,
    };
  });

  return portPoints;
}

function workflowBuilderPortPointMapsAreEqual(
  first: WorkflowBuilderPortPointMap,
  second: WorkflowBuilderPortPointMap,
) {
  const firstKeys = Object.keys(first);
  const secondKeys = Object.keys(second);

  return (
    firstKeys.length === secondKeys.length &&
    firstKeys.every((key) => first[key]?.x === second[key]?.x && first[key]?.y === second[key]?.y)
  );
}

function getWorkflowBuilderPortPointKey(
  nodeId: string,
  direction: WorkflowBuilderPortDirection,
  portId: string,
) {
  return `${nodeId}:${direction}:${portId}`;
}

function isWorkflowBuilderPortDirection(
  direction: string | undefined,
): direction is WorkflowBuilderPortDirection {
  return direction === "input" || direction === "output";
}

function isWorkflowPortEvent(target: EventTarget) {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest("[data-slot='workflow-builder-port'], [data-slot='workflow-node-port']"))
  );
}

function getWorkflowPointer(
  event: React.PointerEvent<HTMLElement> | React.MouseEvent<HTMLElement>,
) {
  const nativeEvent = event.nativeEvent as (PointerEvent | MouseEvent) & {
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

  return {
    x: x ?? 0,
    y: y ?? 0,
  };
}

function clampWorkflowValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function workflowNodeSizeFallback() {
  return {
    width: 248,
    height: 124,
  };
}

function workflowNodePortDotInset() {
  return 28;
}

function workflowNodeCompactPortPadding() {
  return 12;
}

function workflowNodeCompactPortGap() {
  return 8;
}

function workflowNodeCompactPortArrowWidth() {
  return 16;
}

export {
  WorkflowBuilder,
  WorkflowBuilderMiniMap,
  WorkflowBuilderNode,
  WorkflowBuilderToolbar,
  getWorkflowBuilderConnectionValidity,
};
export type {
  WorkflowBuilderConnectionValidity,
  WorkflowBuilderConnectionValidityInput,
  WorkflowBuilderEdge,
  WorkflowBuilderNodeData,
  WorkflowBuilderPort,
  WorkflowBuilderProps,
  WorkflowBuilderSelection,
};
