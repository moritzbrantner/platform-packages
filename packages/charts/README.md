# @moritzbrantner/charts

Density-aware chart indexing helpers for large numeric series.

## Main APIs

- `createChartDensityIndex(points, options)` / `createChartSeriesIndex(points, options)`
- `createProgressiveChartDensityIndex(points, options)`
- `index.getChartSeries(query)` / `index.getBinnedSeries(query)`
- `createChartDensitySample(bin, valueMode)` / `createChartDensityViewportSummary(series)`

By default, `createChartDensityIndex` uses the progressive chart strategy:

1. Build a `hybrid-js` index synchronously for immediate chart samples.
2. Warm a `wasm-index` in the next idle slot.
3. Switch subsequent queries to the `wasm-index` once it is ready.

Pass `backend: "hybrid-js"` or `backend: "wasm-index"` to force one backend. Use
`createProgressiveChartDensityIndex` when you need status inspection or manual
warmup, for example after the first chart interaction.

The `wasm-index` backend is provided by `@moritzbrantner/data-density` and powered
by `@mb-rust/dense-data-wasm`.

## Verification

- `bun run test`
- `bun run build && bun run bench:large-data`
