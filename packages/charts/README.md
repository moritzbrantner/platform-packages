# @moritzbrantner/charts

Density-aware chart indexing helpers for large numeric series.

## Main APIs

- `createChartDensityIndex(points, options)` / `createChartSeriesIndex(points, options)`
- `createProgressiveChartDensityIndex(points, options)`
- `index.getChartSeries(query)` / `index.getBinnedSeries(query)`
- `createChartDensitySample(bin, valueMode)` / `createChartDensityViewportSummary(series)`

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
