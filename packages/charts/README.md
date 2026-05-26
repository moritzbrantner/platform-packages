# @moritzbrantner/charts

Density-aware chart indexing helpers for large numeric series.

## Main APIs

- `createChartDensityIndex(points, options)` / `createChartSeriesIndex(points, options)`
- `index.getChartSeries(query)` / `index.getBinnedSeries(query)`
- `createChartDensitySample(bin, valueMode)` / `createChartDensityViewportSummary(series)`

`createChartDensityIndex` forwards to `@moritzbrantner/data-density`, including the
`wasm-index` backend powered by `@mb-rust/dense-data-wasm`.

## Verification

- `bun run test`
- `bun run build && bun run bench:large-data`
