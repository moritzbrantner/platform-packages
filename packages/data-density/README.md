# @moritzbrantner/data-density

Shared helpers for keeping dense datasets interactive before they reach React or a
renderer.

The map package uses three ideas that generalize well:

- Build an index once, then query only the current view instead of rendering the
  whole dataset.
- Collapse many records into display-sized summaries, while keeping metric totals
  such as demand, revenue, or weights available for labels and dashboards.
- Keep the UI layer focused on compact render data. React components can defer
  expensive input changes, schedule callbacks with transitions, and update canvas
  or vector layers from these summaries.

This package contains the reusable parts:

- `createGeoPointAggregationIndex()` clusters geographic points by viewport and
  zoom. This is what `@moritzbrantner/maps` uses for high-volume map markers.
- `createBinnedSeriesIndex()` groups numeric series into chart-sized bins with
  min, max, average, count, and metric totals.
- `createDataDensityWindowIndex()` returns overscanned windows for ordered data,
  useful for tables, lists, timelines, and other virtualized views.
- `collectDensityMetricKeys()` and `sumDensityMetrics()` provide shared metric
  normalization and aggregation.

The pattern is portable, but each renderer still needs its own final step:
maps need projection-aware clustering, charts need domain/bin choices, graphs need
layout simplification, and tables need virtualization. The shared package gives
those components a consistent indexing and aggregation layer.
