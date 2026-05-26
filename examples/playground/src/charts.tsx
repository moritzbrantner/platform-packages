import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, Line, XAxis, YAxis } from "recharts";

import {
  ChartBackendStatus,
  ChartHotBinRow,
  ChartMetricCard,
  ChartMetricStrip,
  ChartRangeSelector,
  ChartSampleSparkline,
  ChartValueModePreview,
  ChartValueModeSelector,
  createChartDensityViewportSummary,
  getChartSampleYBounds,
  measureChartSeries,
  useProgressiveChartDensity,
  type ChartDensitySample,
  type ChartDensityValueMode,
  type ChartRange,
  type ChartSeriesPoint,
} from "@moritzbrantner/charts";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  Item,
  ItemDescription,
  Slider,
} from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

type TelemetryPointProperties = {
  cohort: "consumer" | "enterprise" | "platform";
  minute: number;
  phase: "baseline" | "ramp" | "incident" | "recovery";
};

const SOURCE_POINT_COUNT = 180_000;
const DAY_DOMAIN = [0, 1_440] as [number, number];
const DEFAULT_TARGET_BINS = 144;
const VALUE_MODES: ChartDensityValueMode[] = ["average", "count", "max", "min", "sum"];
const telemetryPoints = createTelemetryPoints(SOURCE_POINT_COUNT);

const chartRanges: ChartRange[] = [
  {
    id: "day",
    label: "Full day",
    description: "All generated telemetry for long-range dashboard views.",
    domain: DAY_DOMAIN,
  },
  {
    id: "morning",
    label: "Morning ramp",
    description: "High-throughput service ramp with dense but stable samples.",
    domain: [360, 720],
  },
  {
    id: "incident",
    label: "Incident",
    description: "A narrow domain around the generated incident burst.",
    domain: [770, 900],
  },
  {
    id: "recovery",
    label: "Recovery",
    description: "The recovery tail where min, max, and average separate.",
    domain: [900, 1_180],
  },
];

const primaryChartConfig = {
  average: {
    color: "var(--chart-1)",
    label: "Average",
  },
  maximum: {
    color: "var(--chart-2)",
    label: "Maximum",
  },
  minimum: {
    color: "var(--chart-3)",
    label: "Minimum",
  },
};

function ChartsPage() {
  const [targetBinCount, setTargetBinCount] = useState(DEFAULT_TARGET_BINS);
  const [valueMode, setValueMode] = useState<ChartDensityValueMode>("average");
  const [rangeId, setRangeId] = useState("day");
  const { index: chartIndex, status, warmWasmNow } = useProgressiveChartDensity(telemetryPoints);

  const activeRange = chartRanges.find((range) => range.id === rangeId) ?? chartRanges[0]!;
  const backendKey = `${status.activeBackend}-${status.wasmReady}-${status.isWarming}`;
  const measuredSeries = useMemo(
    () =>
      measureChartSeries(chartIndex, {
        includeEmptyBins: true,
        targetBinCount,
        valueMode,
        xDomain: activeRange.domain,
      }),
    [activeRange.domain, backendKey, chartIndex, targetBinCount, valueMode],
  );
  const viewportSummary = useMemo(
    () => createChartDensityViewportSummary(measuredSeries.series),
    [measuredSeries.series],
  );
  const chartData = useMemo(
    () => createChartData(measuredSeries.series.samples),
    [measuredSeries.series],
  );
  const visibleYBounds = useMemo(
    () => getChartSampleYBounds(measuredSeries.series.samples),
    [measuredSeries.series],
  );
  const modeSeries = useMemo(
    () =>
      VALUE_MODES.map((mode) => ({
        mode,
        measured: measureChartSeries(chartIndex, {
          includeEmptyBins: true,
          targetBinCount: 64,
          valueMode: mode,
          xDomain: activeRange.domain,
        }),
      })),
    [activeRange.domain, backendKey, chartIndex],
  );
  const topBins = useMemo(
    () =>
      [...measuredSeries.series.samples]
        .filter((sample) => sample.pointCount > 0)
        .sort((left, right) => right.pointCount - left.pointCount)
        .slice(0, 6),
    [measuredSeries.series],
  );
  const focusSample =
    measuredSeries.series.samples.find((sample) => sample.firstPoint && sample.lastPoint) ??
    measuredSeries.series.samples.find((sample) => sample.pointCount > 0);
  const focusPoint = focusSample?.firstPoint
    ? chartIndex.getPointById(focusSample.firstPoint.id)
    : null;

  return (
    <PlaygroundPage
      activePage="charts"
      title="Charts package examples"
      description="Use the same UI chart wrapper as @moritzbrantner/ui, then push beyond it with dense samples, value modes, viewport summaries, point lookup, and progressive WASM-backed indexing."
    >
      <section className="grid gap-4 lg:grid-cols-4">
        <ChartMetricCard
          label="Source points"
          value={formatInteger(telemetryPoints.length)}
          hint="Generated telemetry retained in the density index."
        />
        <ChartMetricCard
          label="Rendered samples"
          value={formatInteger(measuredSeries.series.summary.sampleCount)}
          hint={`${formatInteger(viewportSummary.itemCount)} points represented in view.`}
        />
        <ChartMetricCard
          label="Active backend"
          value={status.activeBackend}
          hint={
            status.wasmReady
              ? "WASM index is serving chart queries."
              : "Hybrid JS is visible immediately."
          }
        />
        <ChartMetricCard
          label="Last query"
          value={`${measuredSeries.queryMs.toFixed(2)} ms`}
          hint="Measured while creating the render series."
        />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="rounded-none border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                UI ChartContainer
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {formatInteger(SOURCE_POINT_COUNT)} raw points
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {targetBinCount} samples
              </Badge>
            </div>
            <CardTitle>Dense telemetry as a UI-compatible chart</CardTitle>
            <CardDescription>
              Recharts receives only chart-sized samples from @moritzbrantner/charts while the
              wrapper, tooltip, legend, and color variables come from @moritzbrantner/ui.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ChartContainer className="min-h-[360px] w-full" config={primaryChartConfig}>
              <AreaChart data={chartData} margin={{ bottom: 4, left: 8, right: 12, top: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" minTickGap={32} tickLine={false} axisLine={false} />
                <YAxis width={44} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend content={<ChartLegendContent />} />
                <Area
                  dataKey="average"
                  fill="var(--color-average)"
                  fillOpacity={0.14}
                  name="Average"
                  stroke="var(--color-average)"
                  type="monotone"
                />
                <Line
                  dataKey="maximum"
                  dot={false}
                  name="Maximum"
                  stroke="var(--color-maximum)"
                  strokeWidth={1.4}
                  type="monotone"
                />
                <Line
                  dataKey="minimum"
                  dot={false}
                  name="Minimum"
                  stroke="var(--color-minimum)"
                  strokeWidth={1.4}
                  type="monotone"
                />
              </AreaChart>
            </ChartContainer>

            <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">Target samples</span>
                  <span className="text-muted-foreground">{targetBinCount}</span>
                </div>
                <Slider
                  value={[targetBinCount]}
                  min={48}
                  max={360}
                  step={12}
                  onValueChange={(value) => setTargetBinCount(value[0] ?? DEFAULT_TARGET_BINS)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ChartValueModeSelector
                  modes={VALUE_MODES}
                  valueMode={valueMode}
                  onValueModeChange={setValueMode}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Progressive backend
            </Badge>
            <CardTitle>Immediate render, WASM warmup after idle</CardTitle>
            <CardDescription>
              The page starts with a synchronous hybrid index and automatically switches to the WASM
              index when it is ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ChartBackendStatus status={status} onWarmNow={warmWasmNow} />
            <div className="grid gap-3">
              <ChartMetricStrip
                label="Bins"
                value={formatInteger(measuredSeries.series.summary.binCount)}
              />
              <ChartMetricStrip
                label="Metrics"
                value={
                  viewportSummary.metricKeys.length ? viewportSummary.metricKeys.join(", ") : "none"
                }
              />
              <ChartMetricStrip label="Mode" value={measuredSeries.series.summary.valueMode} />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-none border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Domains
            </Badge>
            <CardTitle>Zoom without changing the renderer contract</CardTitle>
            <CardDescription>
              Each range queries the same index with a different x-domain and returns the same
              sample shape.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ChartRangeSelector
              activeRangeId={activeRange.id}
              formatDomain={(domain) => `${formatMinute(domain[0])}-${formatMinute(domain[1])}`}
              onRangeChange={setRangeId}
              ranges={chartRanges}
            />
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Value modes
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                same index
              </Badge>
            </div>
            <CardTitle>Average, count, max, min, and sum from one query API</CardTitle>
            <CardDescription>
              The package keeps the chart renderer simple while preserving full bin statistics for
              alternate visualizations.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {modeSeries.map(({ mode, measured }) => (
              <ChartValueModePreview
                key={mode}
                mode={mode}
                measured={measured}
                active={mode === valueMode}
                onSelect={() => setValueMode(mode)}
              />
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-none border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Viewport summary
            </Badge>
            <CardTitle>Dense chart samples still carry dashboard totals</CardTitle>
            <CardDescription>
              The render layer can show compact lines while adjacent panels keep count, incident,
              and revenue totals in sync with the visible domain.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <ChartMetricStrip
              label="Orders"
              value={formatInteger(viewportSummary.metrics.orders ?? 0)}
            />
            <ChartMetricStrip
              label="Revenue"
              value={formatCurrency(viewportSummary.metrics.revenue ?? 0)}
            />
            <ChartMetricStrip
              label="Incidents"
              value={formatInteger(viewportSummary.metrics.incidents ?? 0)}
            />
            <ChartMetricStrip
              label="Visible domain"
              value={`${formatMinute(viewportSummary.xDomain[0])}-${formatMinute(
                viewportSummary.xDomain[1],
              )}`}
            />
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Point lookup
            </Badge>
            <CardTitle>Samples can link back to source records</CardTitle>
            <CardDescription>
              Each density bin keeps first and last indexed points so charts can open detail panes
              without scanning raw arrays.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {focusSample && focusPoint ? (
              <>
                <ChartMetricStrip
                  label="Focused bin"
                  value={`${formatMinute(focusSample.x0)}-${formatMinute(focusSample.x1)}`}
                />
                <ChartMetricStrip label="Point id" value={focusPoint.id} />
                <ChartMetricStrip label="Cohort" value={focusPoint.properties.cohort} />
                <ChartMetricStrip label="Phase" value={focusPoint.properties.phase} />
              </>
            ) : (
              <Item variant="muted" className="bg-muted/20 p-4">
                <ItemDescription>No source point is available in this viewport.</ItemDescription>
              </Item>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-none border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              SVG renderer
            </Badge>
            <CardTitle>Same samples, no chart library required</CardTitle>
            <CardDescription>
              The package returns plain render data, so canvas, SVG, WebGL, and server-side
              renderers can share the same density index.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChartSampleSparkline
              samples={measuredSeries.series.samples}
              domain={activeRange.domain}
              formatDomainValue={formatMinute}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <ChartMetricStrip label="Max y" value={formatDecimal(visibleYBounds.maxY)} />
              <ChartMetricStrip label="Min y" value={formatDecimal(visibleYBounds.minY)} />
              <ChartMetricStrip label="Mode" value={valueMode} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Hottest bins
            </Badge>
            <CardTitle>Dense bins expose operational metadata</CardTitle>
            <CardDescription>
              Sorting the returned samples gives side panels and annotations without additional
              passes over the source data.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {topBins.map((sample) => (
              <ChartHotBinRow
                key={sample.index}
                sample={sample}
                formatX={formatMinute}
                formatMetric={(metricKey, value) =>
                  metricKey === "revenue" ? formatCurrency(value) : formatInteger(value)
                }
              />
            ))}
          </CardContent>
        </Card>
      </section>
    </PlaygroundPage>
  );
}

function createChartData(samples: Array<ChartDensitySample<TelemetryPointProperties>>) {
  return samples.map((sample) => ({
    average: sample.averageY,
    count: sample.pointCount,
    label: formatMinute(sample.x),
    maximum: sample.maxY,
    minimum: sample.minY,
    revenue: sample.metrics.revenue ?? 0,
    value: sample.y,
    x: sample.x,
  }));
}

function createTelemetryPoints(count: number): Array<ChartSeriesPoint<TelemetryPointProperties>> {
  const cohorts: TelemetryPointProperties["cohort"][] = ["consumer", "enterprise", "platform"];

  return Array.from({ length: count }, (_, index) => {
    const minute = (index / (count - 1)) * DAY_DOMAIN[1];
    const jitter = (seededNoise(index * 13) - 0.5) * 0.85;
    const x = clamp(minute + jitter, DAY_DOMAIN[0], DAY_DOMAIN[1]);
    const dailyCurve = Math.sin((x / DAY_DOMAIN[1]) * Math.PI);
    const localWave = Math.sin(index / 23) * 16 + Math.cos(index / 71) * 9;
    const incidentCurve = gaussian(x, 835, 28) * 210;
    const recoveryCurve = gaussian(x, 990, 78) * 62;
    const y = Math.max(12, 140 + dailyCurve * 240 + localWave + incidentCurve - recoveryCurve);
    const incident = incidentCurve > 35 || (x > 820 && x < 850 && index % 53 === 0) ? 1 : 0;
    const orders = 1 + Math.round(y / 190) + (index % 7 === 0 ? 1 : 0);
    const cohort = cohorts[index % cohorts.length]!;
    const phase = getPhase(x);

    return {
      id: `telemetry-${index}`,
      label: `${formatMinute(x)} ${cohort}`,
      metrics: {
        incidents: incident,
        orders,
        revenue: Math.round(orders * (18 + seededNoise(index + 5) * 42)),
      },
      properties: {
        cohort,
        minute: Math.round(x),
        phase,
      },
      x,
      y,
    };
  });
}

function getPhase(minute: number): TelemetryPointProperties["phase"] {
  if (minute < 420) {
    return "baseline";
  }

  if (minute < 760) {
    return "ramp";
  }

  if (minute < 900) {
    return "incident";
  }

  return "recovery";
}

function gaussian(value: number, center: number, width: number) {
  const distance = (value - center) / width;

  return Math.exp(-0.5 * distance * distance);
}

function seededNoise(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;

  return value - Math.floor(value);
}

function formatMinute(value: number) {
  const normalized = Math.max(0, Math.min(DAY_DOMAIN[1], Math.round(value)));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("en").format(Math.round(value));
}

function formatDecimal(value: number | null) {
  return value === null ? "n/a" : value.toFixed(1);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

mountPage(<ChartsPage />);
