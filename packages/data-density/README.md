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

## Window indexes

Use `createDataDensityWindowIndex()` for ordered datasets that back tables,
feeds, timelines, and other virtualized views. The index keeps original row
references and returns an overscanned slice with metric totals for just the
visible range.

```ts
import { createDataDensityWindowIndex } from "@moritzbrantner/data-density";

const index = createDataDensityWindowIndex(rows, {
  filterItem(row) {
    return row.status !== "archived";
  },
  getMetrics(row) {
    return { revenue: row.revenue, rows: 1 };
  },
});

const window = index.getWindow({ offset: 200, limit: 50, overscan: 10 });
```

## Binned series

Use `createBinnedSeriesIndex()` when a chart viewport can show hundreds of
summaries but the source series has thousands of points. Invalid `x`, `y`, and
metric values are ignored so consumers can safely pass partially cleaned data.

```ts
import { createBinnedSeriesIndex } from "@moritzbrantner/data-density";

const index = createBinnedSeriesIndex(
  samples.map((sample) => ({
    id: sample.id,
    x: sample.timestamp,
    y: sample.value,
    metrics: { count: 1, cost: sample.cost },
  })),
);

const series = index.getBinnedSeries({
  targetBinCount: 120,
  xDomain: [viewportStart, viewportEnd],
});
```

## Geo clustering

Use `createGeoPointAggregationIndex()` for map marker datasets. It wraps the
cluster engine and keeps metric totals attached to clusters and unclustered
points. Antimeridian-crossing bounds are supported by passing a west value that
is greater than east.

```ts
import { createGeoPointAggregationIndex } from "@moritzbrantner/data-density";

const index = createGeoPointAggregationIndex(points, {
  radius: 72,
});

const aggregation = index.getViewportAggregation({
  bounds: [-74.1, 40.5, -73.7, 40.9],
  zoom: 11,
});
```

## Split-readiness checklist

This package should remain in the monorepo until downstream packages consume it
as a normal published dependency in CI. Before moving it to a standalone
repository, keep these checks green:

```sh
bun run --filter @moritzbrantner/data-density verify:release
```

The release gate covers type checking, import/style linting, unit tests, build,
large-data benchmarks, and package dry-run contents.
