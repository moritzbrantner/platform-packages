import { describe, expect, test } from "vitest";

import { createGraphDensityIndex } from "@moritzbrantner/graphs";

describe("@moritzbrantner/graphs", () => {
  test("creates node windows and edge summaries from graph data", () => {
    const index = createGraphDensityIndex(
      Array.from({ length: 6 }, (_, nodeIndex) => ({
        id: `node-${nodeIndex}`,
        metrics: { demand: nodeIndex + 1 },
      })),
      [
        { id: "edge-0-1", metrics: { weight: 2 }, source: "node-0", target: "node-1" },
        { id: "edge-1-2", metrics: { weight: 3 }, source: "node-1", target: "node-2" },
        { id: "edge-2-3", metrics: { weight: 4 }, source: "node-2", target: "node-3" },
        { id: "edge-3-4", metrics: { weight: 5 }, source: "node-3", target: "node-4" },
        { id: "dangling", metrics: { weight: 100 }, source: "node-4", target: "missing" },
      ],
    );

    const subgraph = index.getSubgraph({
      edgeMode: "internal",
      limit: 3,
      offset: 1,
    });

    expect(subgraph.nodes.map((node) => node.id)).toEqual([
      "node-1",
      "node-2",
      "node-3",
    ]);
    expect(subgraph.summary.visibleItemCount).toBe(3);
    expect(subgraph.summary.metrics.demand).toBe(9);
    expect(subgraph.edges.map((edge) => edge.id)).toEqual(["edge-1-2", "edge-2-3"]);
    expect(subgraph.summary.edgeCount).toBe(2);
    expect(subgraph.summary.edgeMetrics.weight).toBe(7);
    expect(index.getEdgeById("dangling")).toBeNull();
  });

  test("can select incident edges around arbitrary node ids", () => {
    const index = createGraphDensityIndex(
      [{ id: "a" }, { id: "b" }, { id: "c" }],
      [
        { id: "a-b", metrics: { weight: 1 }, source: "a", target: "b" },
        { id: "b-c", metrics: { weight: 2 }, source: "b", target: "c" },
      ],
    );

    const selection = index.getEdgesForNodes(["b"], { mode: "incident" });

    expect(selection.edges.map((edge) => edge.id)).toEqual(["a-b", "b-c"]);
    expect(selection.summary.metrics.weight).toBe(3);
  });
});
