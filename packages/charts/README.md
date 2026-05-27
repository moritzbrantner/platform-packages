# @moritzbrantner/charts

Density-aware chart indexing helpers for large numeric series.

The package adapts `@moritzbrantner/data-density` bins into chart-shaped samples,
renderer data, viewport summaries, and chart-specific React controls. It does
not own a primary chart renderer; Recharts, SVG, canvas, WebGL, or server-side
renderers can all consume the same sample contract.

## Breaking migration

This version intentionally cleans up the experimental public API:

- `ChartDensityValueMode` is now `ChartValueMode`.
- `ChartRangeSelector` uses `value` and `onValueChange` instead of
  `activeRangeId` and `onRangeChange`.
- `ChartValueModeSelector` uses `value`, `onValueChange`, and `definitions`
  instead of `valueMode`, `onValueModeChange`, and `modes`.
- `ChartValueModePreview` receives a `definition` instead of a raw `mode`.

## Main APIs

- `createChartDensityIndex(points, options)` / `createChartSeriesIndex(points, options)`
- `createProgressiveChartDensityIndex(points, options)`
- `index.getChartSeries(query)` / `index.getBinnedSeries(query)`
- `createChartDensitySample(bin, valueMode)` / `createChartDensityViewportSummary(series)`
- `createChartRenderData(samples, options)` / `getChartGapAnnotations(samples)`
- `CHART_VALUE_MODE_DEFINITIONS`, `getChartValueModeDefinition(mode)`,
  `getChartValueModeDefinitions(modes)`
- `useProgressiveChartDensity(points, options)` / `useChartBinCount(options)`
- `ChartMetricCard`, `ChartMetricStrip`, `ChartRangeSelector`, `ChartValueModeSelector`
- `ChartBackendStatus`, `ChartSampleSparkline`, `ChartHotBinRow`, `ChartValueModePreview`

## Responsive Recharts chart

```tsx
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  createChartDensityIndex,
  createChartRenderData,
  useChartBinCount,
} from "@moritzbrantner/charts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@moritzbrantner/ui";

const index = createChartDensityIndex(points);

export function DenseAreaChart() {
  const { containerRef, targetBinCount } = useChartBinCount();
  const series = index.getChartSeries({
    includeEmptyBins: true,
    targetBinCount,
    valueMode: "average",
    xDomain: [0, 1_440],
  });
  const chartData = createChartRenderData(series.samples, {
    modes: ["average"],
    xLabel: (sample) => `${Math.round(sample.x)}m`,
  }).rows;

  return (
    <div ref={containerRef}>
      <ChartContainer
        className="min-h-72"
        config={{ average: { label: "Average", color: "var(--chart-1)" } }}
      >
        <AreaChart data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            dataKey="average"
            fill="var(--color-average)"
            fillOpacity={0.16}
            stroke="var(--color-average)"
            type="monotone"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
```

## Linked detail pane

```tsx
import { useState } from "react";
import { ChartSampleSparkline, useProgressiveChartDensity } from "@moritzbrantner/charts";

export function LinkedChartDetails({ points }) {
  const { index } = useProgressiveChartDensity(points);
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number | null>(null);
  const series = index.getChartSeries({
    includeEmptyBins: true,
    targetBinCount: 120,
    xDomain: [0, 1_440],
  });
  const selectedSample =
    series.samples.find((sample) => sample.index === selectedSampleIndex) ?? null;
  const point = selectedSample?.firstPoint
    ? index.getPointById(selectedSample.firstPoint.id)
    : null;

  return (
    <>
      <ChartSampleSparkline
        samples={series.samples}
        domain={series.summary.xDomain}
        selectedSampleIndex={selectedSampleIndex}
        onSampleSelect={(sample) => setSelectedSampleIndex(sample.index)}
      />
      <pre>{JSON.stringify(point?.properties ?? null, null, 2)}</pre>
    </>
  );
}
```

## Manual WASM warmup and fallback display

```tsx
import { ChartBackendStatus, useProgressiveChartDensity } from "@moritzbrantner/charts";

export function BackendPanel({ points }) {
  const { status, warmWasmNow } = useProgressiveChartDensity(points, {
    progressive: {
      warmup: "manual",
    },
  });

  return (
    <ChartBackendStatus
      status={status}
      onWarmNow={warmWasmNow}
      formatError={(error) => `Using hybrid JS fallback: ${String(error)}`}
    />
  );
}
```

## Server-side or renderer-agnostic data

```ts
import { createChartDensityIndex, createChartRenderData } from "@moritzbrantner/charts";

const index = createChartDensityIndex(points, { backend: "hybrid-js" });
const series = index.getChartSeries({
  includeEmptyBins: true,
  targetBinCount: 96,
  valueMode: "sum",
  xDomain: [360, 720],
});
const payload = createChartRenderData(series.samples, {
  gapBehavior: "preserve",
  includeMetrics: true,
  modes: ["sum", "count"],
});
```

## Choosing value modes

Use value-mode definitions when controls, axes, previews, and tooltips need
labels or formatting:

```ts
import { getChartValueModeDefinitions } from "@moritzbrantner/charts";

const definitions = getChartValueModeDefinitions(["average", "count", "max"]);
```

- `average`: mean y value per bin, usually best for trend lines.
- `count`: source-point count per bin, usually best as bars.
- `max`: highest y in each bin, useful for peaks and thresholds.
- `min`: lowest y in each bin, useful for floors and ranges.
- `sum`: total y in each bin, useful for volume and totals.

## Gap behavior

`createChartRenderData` supports four empty-bin policies:

- `preserve`: keep empty bins with `null` values. This is the default.
- `connect`: drop empty bins from rows and return gap annotations.
- `drop`: drop empty bins without annotations.
- `zero-fill`: keep empty bins and convert missing values to `0`.

```ts
const connected = createChartRenderData(series.samples, { gapBehavior: "connect" });
console.log(connected.annotations);
```

## Progressive strategy

By default, `createChartDensityIndex` renders immediately from `hybrid-js`, warms
a `wasm-index` in an idle slot, then serves later queries from the WASM backend.
Pass `backend: "hybrid-js"` or `backend: "wasm-index"` to force one backend.

Open `examples/playground/charts.html` in the local playground for a combined
example with responsive binning, value-mode previews, viewport totals, sample
selection, gap-safe render data, and source-point lookup.

## Verification

- `bun run test`
- `bun run build && bun run bench:large-data`
