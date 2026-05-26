import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  createChartDensityViewportSummary,
  createProgressiveChartDensityIndex,
  type ChartDensitySample,
  type ChartDensitySeries,
  type ChartDensityValueMode,
  type ChartSeriesPoint,
  type ProgressiveChartDensityIndex,
} from "@moritzbrantner/charts";
import {
  Badge,
  Button,
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
  ItemContent,
  ItemDescription,
  ItemTitle,
  Progress,
  Slider,
} from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

type TelemetryPointProperties = {
  cohort: "consumer" | "enterprise" | "platform";
  minute: number;
  phase: "baseline" | "ramp" | "incident" | "recovery";
};

type ChartRange = {
  description: string;
  domain: [number, number];
  id: string;
  label: string;
};

type MeasuredSeries = {
  queryMs: number;
  series: ChartDensitySeries<TelemetryPointProperties>;
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

const countChartConfig = {
  count: {
    color: "var(--chart-4)",
    label: "Point count",
  },
};

const revenueChartConfig = {
  revenue: {
    color: "var(--chart-5)",
    label: "Revenue",
  },
};

function ChartsPage() {
  const [targetBinCount, setTargetBinCount] = useState(DEFAULT_TARGET_BINS);
  const [valueMode, setValueMode] = useState<ChartDensityValueMode>("average");
  const [rangeId, setRangeId] = useState("day");
  const [statusTick, setStatusTick] = useState(0);

  const chartIndex = useMemo(
    () =>
      createProgressiveChartDensityIndex(telemetryPoints, {
        progressive: {
          onError() {
            setStatusTick((tick) => tick + 1);
          },
          onReady() {
            setStatusTick((tick) => tick + 1);
          },
        },
      }),
    [],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStatusTick((tick) => tick + 1);

      if (chartIndex.getProgressiveStatus().wasmReady) {
        window.clearInterval(interval);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [chartIndex]);

  const activeRange = chartRanges.find((range) => range.id === rangeId) ?? chartRanges[0]!;
  const status = chartIndex.getProgressiveStatus();
  const backendKey = `${status.activeBackend}-${status.wasmReady}-${statusTick}`;
  const measuredSeries = useMemo(
    () =>
      measureChartQuery(chartIndex, {
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
    () => getSampleYBounds(measuredSeries.series.samples),
    [measuredSeries.series],
  );
  const modeSeries = useMemo(
    () =>
      VALUE_MODES.map((mode) => ({
        mode,
        measured: measureChartQuery(chartIndex, {
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
  const backendProgress = status.wasmReady ? 100 : status.isWarming ? 62 : 22;

  async function warmWasmNow() {
    setStatusTick((tick) => tick + 1);
    await chartIndex.warmWasmIndex().catch(() => undefined);
    setStatusTick((tick) => tick + 1);
  }

  return (
    <PlaygroundPage
      activePage="charts"
      title="Charts package examples"
      description="Use the same UI chart wrapper as @moritzbrantner/ui, then push beyond it with dense samples, value modes, viewport summaries, point lookup, and progressive WASM-backed indexing."
    >
      <section className="grid gap-4 lg:grid-cols-4">
        <MetricCard
          label="Source points"
          value={formatInteger(telemetryPoints.length)}
          hint="Generated telemetry retained in the density index."
        />
        <MetricCard
          label="Rendered samples"
          value={formatInteger(measuredSeries.series.summary.sampleCount)}
          hint={`${formatInteger(viewportSummary.itemCount)} points represented in view.`}
        />
        <MetricCard
          label="Active backend"
          value={status.activeBackend}
          hint={
            status.wasmReady
              ? "WASM index is serving chart queries."
              : "Hybrid JS is visible immediately."
          }
        />
        <MetricCard
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
                {VALUE_MODES.map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    size="sm"
                    variant={mode === valueMode ? "default" : "outline"}
                    onClick={() => setValueMode(mode)}
                  >
                    {mode}
                  </Button>
                ))}
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
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{status.activeBackend}</span>
                <span className="text-muted-foreground">
                  {status.wasmReady ? "ready" : status.isWarming ? "warming" : "scheduled"}
                </span>
              </div>
              <Progress value={backendProgress} />
            </div>
            <div className="grid gap-3">
              <MetricStrip
                label="Bins"
                value={formatInteger(measuredSeries.series.summary.binCount)}
              />
              <MetricStrip
                label="Metrics"
                value={
                  viewportSummary.metricKeys.length ? viewportSummary.metricKeys.join(", ") : "none"
                }
              />
              <MetricStrip label="Mode" value={measuredSeries.series.summary.valueMode} />
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={warmWasmNow}>
              Warm WASM now
            </Button>
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
            {chartRanges.map((range) => (
              <button
                key={range.id}
                type="button"
                className={`w-full border p-4 text-left transition hover:border-primary/60 ${
                  range.id === activeRange.id
                    ? "border-primary bg-primary/10"
                    : "border-border/60 bg-muted/20"
                }`}
                onClick={() => setRangeId(range.id)}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-medium">{range.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatMinute(range.domain[0])}-{formatMinute(range.domain[1])}
                  </span>
                </span>
                <span className="mt-2 block text-sm leading-6 text-muted-foreground">
                  {range.description}
                </span>
              </button>
            ))}
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
              <ModePreview
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
            <MetricStrip
              label="Orders"
              value={formatInteger(viewportSummary.metrics.orders ?? 0)}
            />
            <MetricStrip
              label="Revenue"
              value={formatCurrency(viewportSummary.metrics.revenue ?? 0)}
            />
            <MetricStrip
              label="Incidents"
              value={formatInteger(viewportSummary.metrics.incidents ?? 0)}
            />
            <MetricStrip
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
                <MetricStrip
                  label="Focused bin"
                  value={`${formatMinute(focusSample.x0)}-${formatMinute(focusSample.x1)}`}
                />
                <MetricStrip label="Point id" value={focusPoint.id} />
                <MetricStrip label="Cohort" value={focusPoint.properties.cohort} />
                <MetricStrip label="Phase" value={focusPoint.properties.phase} />
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
            <Sparkline samples={measuredSeries.series.samples} domain={activeRange.domain} />
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricStrip label="Max y" value={formatDecimal(visibleYBounds.maxY)} />
              <MetricStrip label="Min y" value={formatDecimal(visibleYBounds.minY)} />
              <MetricStrip label="Mode" value={valueMode} />
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
              <HotBinRow key={sample.index} sample={sample} />
            ))}
          </CardContent>
        </Card>
      </section>
    </PlaygroundPage>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="rounded-none border-border/60 bg-background/80 shadow-lg shadow-black/5">
      <CardContent className="space-y-2 p-5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-sm leading-6 text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function MetricStrip({ label, value }: { label: string; value: string }) {
  return (
    <Item variant="muted" className="items-start bg-muted/20 p-4">
      <ItemContent>
        <ItemDescription className="text-xs uppercase tracking-[0.18em]">{label}</ItemDescription>
        <ItemTitle className="mt-1 text-lg font-semibold">{value}</ItemTitle>
      </ItemContent>
    </Item>
  );
}

function ModePreview({
  active,
  measured,
  mode,
  onSelect,
}: {
  active: boolean;
  measured: MeasuredSeries;
  mode: ChartDensityValueMode;
  onSelect: () => void;
}) {
  const data = createChartData(measured.series.samples);

  return (
    <button
      type="button"
      className={`border p-3 text-left transition hover:border-primary/60 ${
        active ? "border-primary bg-primary/10" : "border-border/60 bg-muted/20"
      }`}
      onClick={onSelect}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-medium capitalize">{mode}</span>
        <span className="text-xs text-muted-foreground">{measured.queryMs.toFixed(2)} ms</span>
      </div>
      <ChartContainer
        className="h-28 w-full"
        config={mode === "count" ? countChartConfig : primaryChartConfig}
      >
        {mode === "count" ? (
          <BarChart data={data} margin={{ bottom: 0, left: 0, right: 0, top: 4 }}>
            <Bar dataKey="count" fill="var(--color-count)" radius={0} />
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ bottom: 0, left: 0, right: 0, top: 4 }}>
            <Line
              dataKey="value"
              dot={false}
              isAnimationActive={false}
              stroke="var(--color-average)"
              strokeWidth={1.5}
              type="monotone"
            />
          </LineChart>
        )}
      </ChartContainer>
    </button>
  );
}

function Sparkline({
  domain,
  samples,
}: {
  domain: [number, number];
  samples: Array<ChartDensitySample<TelemetryPointProperties>>;
}) {
  const values = samples.filter((sample) => sample.y !== null);
  const minY = Math.min(...values.map((sample) => sample.y ?? 0));
  const maxY = Math.max(...values.map((sample) => sample.y ?? 0));
  const spread = Math.max(1, maxY - minY);
  const points = values
    .map((sample) => {
      const x = ((sample.x - domain[0]) / (domain[1] - domain[0])) * 100;
      const y = 92 - (((sample.y ?? minY) - minY) / spread) * 84;

      return `${clamp(x, 0, 100)},${clamp(y, 8, 92)}`;
    })
    .join(" ");

  return (
    <div className="relative overflow-hidden border border-border/60 bg-muted/20 p-4">
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label="Dense chart sparkline"
        className="h-56 w-full"
      >
        <defs>
          <linearGradient id="charts-sparkline-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polyline
          points={`0,96 ${points} 100,96`}
          fill="url(#charts-sparkline-fill)"
          stroke="none"
        />
        <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="1.4" />
      </svg>
      <div className="absolute bottom-3 left-3 text-xs text-muted-foreground">
        {formatInteger(samples.length)} samples from {formatMinute(domain[0])} to{" "}
        {formatMinute(domain[1])}
      </div>
    </div>
  );
}

function HotBinRow({ sample }: { sample: ChartDensitySample<TelemetryPointProperties> }) {
  const revenue = sample.metrics.revenue ?? 0;

  return (
    <Item
      variant="muted"
      className="grid gap-3 bg-muted/20 p-4 text-sm md:grid-cols-[1fr_auto] md:items-center"
    >
      <div>
        <p className="font-medium">
          {formatMinute(sample.x0)}-{formatMinute(sample.x1)}
        </p>
        <p className="text-muted-foreground">
          {formatInteger(sample.pointCount)} source points, average {formatDecimal(sample.averageY)}
        </p>
      </div>
      <div className="text-left md:text-right">
        <p>{formatCurrency(revenue)}</p>
        <p className="text-muted-foreground">
          {formatInteger(sample.metrics.incidents ?? 0)} incidents
        </p>
      </div>
    </Item>
  );
}

function measureChartQuery(
  index: ProgressiveChartDensityIndex<TelemetryPointProperties>,
  query: Parameters<ProgressiveChartDensityIndex<TelemetryPointProperties>["getChartSeries"]>[0],
): MeasuredSeries {
  const startedAt = now();
  const series = index.getChartSeries(query);

  return {
    queryMs: now() - startedAt,
    series,
  };
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

function getSampleYBounds(samples: Array<ChartDensitySample<TelemetryPointProperties>>) {
  const values = samples.flatMap((sample) => [sample.minY, sample.maxY]).filter(isNumber);

  if (values.length === 0) {
    return {
      maxY: null,
      minY: null,
    };
  }

  return {
    maxY: Math.max(...values),
    minY: Math.min(...values),
  };
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

function isNumber(value: number | null): value is number {
  return value !== null;
}

function now() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

mountPage(<ChartsPage />);
