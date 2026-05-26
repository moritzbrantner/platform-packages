# @moritzbrantner/charts

Density-aware chart indexing helpers for large numeric series.

## Main APIs

The default export surface includes data helpers and chart-specific React UI:

- `createChartDensityIndex(points, options)` / `createChartSeriesIndex(points, options)`
- `createProgressiveChartDensityIndex(points, options)`
- `index.getChartSeries(query)` / `index.getBinnedSeries(query)`
- `createChartDensitySample(bin, valueMode)` / `createChartDensityViewportSummary(series)`
- `useProgressiveChartDensity(points, options)`
- `ChartMetricCard`, `ChartMetricStrip`, `ChartRangeSelector`, `ChartValueModeSelector`
- `ChartBackendStatus`, `ChartSampleSparkline`, `ChartHotBinRow`, `ChartValueModePreview`

## Examples

### UI-compatible Recharts rendering

`@moritzbrantner/charts` returns plain chart samples, so it can feed the chart
components and conventions from `@moritzbrantner/ui` while keeping large source
arrays out of the renderer.

```tsx
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { createChartDensityIndex } from "@moritzbrantner/charts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@moritzbrantner/ui";

const index = createChartDensityIndex(points);
const series = index.getChartSeries({
  includeEmptyBins: true,
  targetBinCount: 160,
  valueMode: "average",
  xDomain: [0, 1_440],
});
const chartData = series.samples.map((sample) => ({
  average: sample.y,
  label: `${Math.round(sample.x)}m`,
}));

export function DenseAreaChart() {
  return (
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
  );
}
```

### Chart-owned frontend components

Use `@moritzbrantner/charts` when chart-specific controls, backend status, or
sample previews should live with the chart package instead of the shared UI
design system.

```tsx
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartBackendStatus,
  ChartMetricCard,
  ChartRangeSelector,
  ChartValueModeSelector,
  createChartDensityViewportSummary,
  measureChartSeries,
  useProgressiveChartDensity,
  type ChartDensityValueMode,
  type ChartRange,
  type ChartSeriesPoint,
} from "@moritzbrantner/charts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@moritzbrantner/ui";

const ranges: ChartRange[] = [
  { id: "day", label: "Day", domain: [0, 1_440] },
  { id: "incident", label: "Incident", domain: [770, 900] },
];

export function DenseChartPanel({ points }: { points: ChartSeriesPoint[] }) {
  const [rangeId, setRangeId] = useState("day");
  const [valueMode, setValueMode] = useState<ChartDensityValueMode>("average");
  const { index, status, warmWasmNow } = useProgressiveChartDensity(points);
  const activeRange = ranges.find((range) => range.id === rangeId) ?? ranges[0]!;
  const measured = measureChartSeries(index, {
    includeEmptyBins: true,
    targetBinCount: 160,
    valueMode,
    xDomain: activeRange.domain,
  });
  const summary = createChartDensityViewportSummary(measured.series);
  const chartData = measured.series.samples.map((sample) => ({
    label: Math.round(sample.x),
    value: sample.y,
  }));

  return (
    <div className="grid gap-4">
      <ChartMetricCard label="Rendered samples" value={summary.sampleCount} />
      <ChartBackendStatus status={status} onWarmNow={warmWasmNow} />
      <ChartRangeSelector activeRangeId={rangeId} ranges={ranges} onRangeChange={setRangeId} />
      <ChartValueModeSelector valueMode={valueMode} onValueModeChange={setValueMode} />
      <ChartContainer config={{ value: { label: "Value", color: "var(--chart-1)" } }}>
        <AreaChart data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area dataKey="value" stroke="var(--color-value)" fill="var(--color-value)" />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
```

### Progressive WASM warmup

The default strategy renders immediately from `hybrid-js`, then warms a
`wasm-index` in an idle slot and serves later queries from the WASM backend.

```ts
import { createProgressiveChartDensityIndex } from "@moritzbrantner/charts";

const index = createProgressiveChartDensityIndex(points, {
  progressive: {
    onReady(nextIndex) {
      console.log("WASM chart index ready", nextIndex.getSeriesBounds());
    },
  },
});

const firstPaint = index.getChartSeries({
  targetBinCount: 120,
  xDomain: [0, 1_440],
});

await index.whenWasmReady();

const nextInteraction = index.getChartSeries({
  targetBinCount: 240,
  xDomain: [720, 900],
});
```

### Alternate value modes

Each bin includes average, count, min, max, and sum values. Use `valueMode` to
choose the sample `y` value without changing chart code.

```ts
const modes = ["average", "count", "max", "min", "sum"] as const;

const modeSeries = modes.map((valueMode) =>
  index.getChartSeries({
    includeEmptyBins: true,
    targetBinCount: 80,
    valueMode,
    xDomain: [0, 1_440],
  }),
);
```

### Viewport summaries and point lookup

Chart samples preserve metrics and source-point references for dashboard totals,
annotations, and drilldowns.

```ts
import { createChartDensityViewportSummary } from "@moritzbrantner/charts";

const series = index.getChartSeries({
  targetBinCount: 96,
  valueMode: "average",
  xDomain: [360, 720],
});
const summary = createChartDensityViewportSummary(series);
const busiestBin = [...series.samples].sort((left, right) => right.pointCount - left.pointCount)[0];
const firstSourcePoint = busiestBin?.firstPoint
  ? index.getPointById(busiestBin.firstPoint.id)
  : null;

console.log(summary.metrics, firstSourcePoint?.properties);
```

Open `examples/playground/charts.html` in the local playground for a combined
example with UI chart parity, dense WASM sampling, zoomed domains, value-mode
previews, viewport totals, and source-point lookup.

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
