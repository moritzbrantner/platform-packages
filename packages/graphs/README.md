# @moritzbrantner/graphs

Windowed graph-density indexes for nodes, edges, and viewport summaries.

## Main APIs

- `createGraphDensityIndex(nodes, edges, options)` / `createGraphWindowIndex(nodes, edges, options)`
- `index.getNodeWindow(query)` / `index.getSubgraph(query)`
- `createGraphDensityViewportSummary(subgraph)`
