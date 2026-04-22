import {
  collectDensityMetricKeys,
  createDataDensityWindowIndex,
  createDensityViewportSummary,
  normalizeDensityMetrics,
  sumDensityMetrics,
  type DataDensityItemWindowQuery,
  type DataDensityMetricRecord,
  type DataDensityViewportSummary,
  type DataDensityWindowSummary,
} from "@moritzbrantner/data-density";

export type GraphMetricRecord = DataDensityMetricRecord;

export type GraphDensityNode<TProperties = Record<string, unknown>> = {
  id: string | number;
  label?: string;
  metrics?: GraphMetricRecord;
  properties?: TProperties;
};

export type IndexedGraphDensityNode<TProperties = Record<string, unknown>> = {
  id: string;
  index: number;
  label: string;
  metrics: GraphMetricRecord;
  properties: TProperties;
};

export type GraphDensityEdge<TProperties = Record<string, unknown>> = {
  directed?: boolean;
  id?: string | number;
  label?: string;
  metrics?: GraphMetricRecord;
  properties?: TProperties;
  source: string | number;
  target: string | number;
};

export type IndexedGraphDensityEdge<TProperties = Record<string, unknown>> = {
  directed: boolean;
  id: string;
  index: number;
  label: string;
  metrics: GraphMetricRecord;
  properties: TProperties;
  source: string;
  target: string;
};

export type GraphDensityEdgeMode = "incident" | "internal";

export type GraphDensityEdgeSelectionOptions = {
  mode?: GraphDensityEdgeMode;
};

export type GraphDensityNodeWindow<TNodeProperties = Record<string, unknown>> = {
  nodes: Array<IndexedGraphDensityNode<TNodeProperties>>;
  summary: DataDensityWindowSummary;
};

export type GraphDensityEdgeSelection<TEdgeProperties = Record<string, unknown>> = {
  edges: Array<IndexedGraphDensityEdge<TEdgeProperties>>;
  summary: {
    edgeCount: number;
    metrics: GraphMetricRecord;
    mode: GraphDensityEdgeMode;
    nodeCount: number;
  };
};

export type GraphDensitySubgraph<
  TNodeProperties = Record<string, unknown>,
  TEdgeProperties = Record<string, unknown>,
> = {
  edges: Array<IndexedGraphDensityEdge<TEdgeProperties>>;
  nodes: Array<IndexedGraphDensityNode<TNodeProperties>>;
  summary: DataDensityWindowSummary & {
    edgeCount: number;
    edgeMetrics: GraphMetricRecord;
    edgeMode: GraphDensityEdgeMode;
    selectedNodeCount: number;
  };
};

export type GraphDensityViewportSummary = DataDensityViewportSummary & {
  edgeCount: number;
  edgeMetricKeys: string[];
  edgeMetrics: GraphMetricRecord;
  edgeMode: GraphDensityEdgeMode;
  nodeCount: number;
  selectedNodeCount: number;
};

export type GraphDensitySubgraphQuery = DataDensityItemWindowQuery & {
  edgeMode?: GraphDensityEdgeMode;
};

export type GraphDensityIndexOptions<
  TNodeProperties = Record<string, unknown>,
  TEdgeProperties = Record<string, unknown>,
> = {
  filterEdge?: (edge: IndexedGraphDensityEdge<TEdgeProperties>) => boolean;
  filterNode?: (node: IndexedGraphDensityNode<TNodeProperties>) => boolean;
  includeDanglingEdges?: boolean;
};

export type GraphDensityIndex<
  TNodeProperties = Record<string, unknown>,
  TEdgeProperties = Record<string, unknown>,
> = {
  getEdgeById(edgeId: string): IndexedGraphDensityEdge<TEdgeProperties> | null;
  getEdgesForNodes(
    nodeIds: readonly (string | number)[],
    options?: GraphDensityEdgeSelectionOptions,
  ): GraphDensityEdgeSelection<TEdgeProperties>;
  getNodeById(nodeId: string): IndexedGraphDensityNode<TNodeProperties> | null;
  getNodeWindow(query: DataDensityItemWindowQuery): GraphDensityNodeWindow<TNodeProperties>;
  getSubgraph(
    query: GraphDensitySubgraphQuery,
  ): GraphDensitySubgraph<TNodeProperties, TEdgeProperties>;
};

export function createGraphDensityIndex<
  TNodeProperties = Record<string, unknown>,
  TEdgeProperties = Record<string, unknown>,
>(
  nodes: readonly GraphDensityNode<TNodeProperties>[],
  edges: readonly GraphDensityEdge<TEdgeProperties>[],
  options: GraphDensityIndexOptions<TNodeProperties, TEdgeProperties> = {},
): GraphDensityIndex<TNodeProperties, TEdgeProperties> {
  const normalizedNodes = nodes
    .map((node, index) => normalizeGraphNode(node, index))
    .filter((node) => options.filterNode?.(node) ?? true);
  const nodeLookup = new Map(normalizedNodes.map((node) => [node.id, node]));
  const nodeWindowIndex = createDataDensityWindowIndex(normalizedNodes, {
    getId: (node) => node.id,
    getMetrics: (node) => node.metrics,
  });
  const normalizedEdges = edges
    .map((edge, index) => normalizeGraphEdge(edge, index))
    .filter(
      (edge) =>
        options.includeDanglingEdges === true ||
        (nodeLookup.has(edge.source) && nodeLookup.has(edge.target)),
    )
    .filter((edge) => options.filterEdge?.(edge) ?? true);
  const edgeLookup = new Map(normalizedEdges.map((edge) => [edge.id, edge]));
  const edgeMetricKeys = collectDensityMetricKeys(normalizedEdges.map((edge) => edge.metrics));
  const getEdgesForNodes: GraphDensityIndex<
    TNodeProperties,
    TEdgeProperties
  >["getEdgesForNodes"] = (nodeIds, selectionOptions = {}) =>
    selectGraphEdgesForNodes(
      normalizedEdges,
      normalizeNodeIdSet(nodeIds),
      edgeMetricKeys,
      selectionOptions.mode ?? "internal",
    );
  const getNodeWindow: GraphDensityIndex<TNodeProperties, TEdgeProperties>["getNodeWindow"] = (
    query,
  ) => {
    const window = nodeWindowIndex.getWindow(query);

    return {
      nodes: window.items.map((item) => item.item),
      summary: window.summary,
    };
  };

  return {
    getEdgeById(edgeId) {
      return edgeLookup.get(edgeId) ?? null;
    },

    getEdgesForNodes,

    getNodeById(nodeId) {
      return nodeWindowIndex.getItemById(nodeId)?.item ?? null;
    },

    getNodeWindow,

    getSubgraph(query) {
      const nodeWindow = getNodeWindow(query);
      const edgeSelection = getEdgesForNodes(
        nodeWindow.nodes.map((node) => node.id),
        { mode: query.edgeMode ?? "internal" },
      );

      return {
        edges: edgeSelection.edges,
        nodes: nodeWindow.nodes,
        summary: {
          ...nodeWindow.summary,
          edgeCount: edgeSelection.summary.edgeCount,
          edgeMetrics: edgeSelection.summary.metrics,
          edgeMode: edgeSelection.summary.mode,
          selectedNodeCount: edgeSelection.summary.nodeCount,
        },
      };
    },
  };
}

export const createGraphWindowIndex = createGraphDensityIndex;

export function createGraphDensityViewportSummary<
  TNodeProperties = Record<string, unknown>,
  TEdgeProperties = Record<string, unknown>,
>(subgraph: GraphDensitySubgraph<TNodeProperties, TEdgeProperties>): GraphDensityViewportSummary {
  const edgeMetricKeys = collectDensityMetricKeys(subgraph.edges.map((edge) => edge.metrics));

  return {
    ...createDensityViewportSummary(
      "graph",
      subgraph.nodes.map((node) => node.metrics),
      subgraph.nodes.length,
    ),
    edgeCount: subgraph.summary.edgeCount,
    edgeMetricKeys,
    edgeMetrics: sumDensityMetrics(
      subgraph.edges.map((edge) => edge.metrics),
      edgeMetricKeys,
    ),
    edgeMode: subgraph.summary.edgeMode,
    nodeCount: subgraph.nodes.length,
    selectedNodeCount: subgraph.summary.selectedNodeCount,
  };
}

function normalizeGraphNode<TProperties>(
  node: GraphDensityNode<TProperties>,
  index: number,
): IndexedGraphDensityNode<TProperties> {
  return {
    id: String(node.id),
    index,
    label: node.label ?? "",
    metrics: normalizeDensityMetrics(node.metrics),
    properties: node.properties ?? ({} as TProperties),
  };
}

function normalizeGraphEdge<TProperties>(
  edge: GraphDensityEdge<TProperties>,
  index: number,
): IndexedGraphDensityEdge<TProperties> {
  return {
    directed: edge.directed ?? false,
    id: String(edge.id ?? index),
    index,
    label: edge.label ?? "",
    metrics: normalizeDensityMetrics(edge.metrics),
    properties: edge.properties ?? ({} as TProperties),
    source: String(edge.source),
    target: String(edge.target),
  };
}

function selectGraphEdgesForNodes<TEdgeProperties>(
  edges: readonly IndexedGraphDensityEdge<TEdgeProperties>[],
  nodeIds: ReadonlySet<string>,
  metricKeys: string[],
  mode: GraphDensityEdgeMode,
): GraphDensityEdgeSelection<TEdgeProperties> {
  const selectedEdges = edges.filter((edge) => {
    const hasSource = nodeIds.has(edge.source);
    const hasTarget = nodeIds.has(edge.target);

    return mode === "internal" ? hasSource && hasTarget : hasSource || hasTarget;
  });

  return {
    edges: selectedEdges,
    summary: {
      edgeCount: selectedEdges.length,
      metrics: sumDensityMetrics(
        selectedEdges.map((edge) => edge.metrics),
        metricKeys,
      ),
      mode,
      nodeCount: nodeIds.size,
    },
  };
}

function normalizeNodeIdSet(nodeIds: readonly (string | number)[]) {
  return new Set(nodeIds.map((nodeId) => String(nodeId)));
}
