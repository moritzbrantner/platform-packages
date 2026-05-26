import { useCallback, useEffect, useMemo, useState, type JSX, type ReactNode } from "react";
import { Bar, BarChart, Line, LineChart } from "recharts";

import {
  createProgressiveChartDensityIndex,
  type ChartDensityIndex,
  type ChartDensityIndexOptions,
  type ChartDensityProgressiveStatus,
  type ChartDensityQuery,
  type ChartDensitySample,
  type ChartDensitySeries,
  type ChartDensityValueMode,
  type ChartSeriesPoint,
  type ProgressiveChartDensityIndex,
} from "./density";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartContainer,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Progress,
} from "@moritzbrantner/ui";

export type ChartRange = {
  description?: string;
  domain: [number, number];
  id: string;
  label: string;
};

export type MeasuredChartSeries<TProperties = Record<string, unknown>> = {
  queryMs: number;
  series: ChartDensitySeries<TProperties>;
};

export type ChartMetricCardProps = {
  className?: string;
  hint?: ReactNode;
  label: ReactNode;
  value: ReactNode;
};

export type ChartMetricStripProps = {
  className?: string;
  label: ReactNode;
  value: ReactNode;
};

export type ChartPanelProps = {
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  title: ReactNode;
};

export type ChartRangeSelectorProps = {
  activeRangeId: string;
  className?: string;
  formatDomain?: (domain: [number, number]) => string;
  onRangeChange: (rangeId: string) => void;
  ranges: ChartRange[];
};

export type ChartValueModeSelectorProps = {
  className?: string;
  modes?: ChartDensityValueMode[];
  onValueModeChange: (mode: ChartDensityValueMode) => void;
  valueMode: ChartDensityValueMode;
};

export type ChartBackendStatusProps = {
  className?: string;
  onWarmNow?: () => void | Promise<void>;
  progress?: number;
  status: ChartDensityProgressiveStatus;
};

export type ChartSampleSparklineProps<TProperties = Record<string, unknown>> = {
  ariaLabel?: string;
  className?: string;
  domain: [number, number];
  formatDomainValue?: (value: number) => string;
  samples: Array<ChartDensitySample<TProperties>>;
};

export type ChartHotBinRowProps<TProperties = Record<string, unknown>> = {
  className?: string;
  formatMetric?: (metricKey: string, value: number) => ReactNode;
  formatX?: (value: number) => string;
  sample: ChartDensitySample<TProperties>;
};

export type ChartValueModePreviewProps<TProperties = Record<string, unknown>> = {
  active?: boolean;
  className?: string;
  measured: MeasuredChartSeries<TProperties>;
  mode: ChartDensityValueMode;
  onSelect?: () => void;
};

const DEFAULT_VALUE_MODES: ChartDensityValueMode[] = ["average", "count", "max", "min", "sum"];

const valuePreviewConfig = {
  value: {
    color: "var(--chart-1)",
    label: "Value",
  },
};

const countPreviewConfig = {
  count: {
    color: "var(--chart-4)",
    label: "Point count",
  },
};

export function ChartPanel({
  badge,
  children,
  className,
  description,
  title,
}: ChartPanelProps): JSX.Element {
  return (
    <Card className={joinClassNames("rounded-none border-border/60 bg-background/80", className)}>
      <CardHeader>
        {badge ? (
          <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
            {badge}
          </Badge>
        ) : null}
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function ChartMetricCard({
  className,
  hint,
  label,
  value,
}: ChartMetricCardProps): JSX.Element {
  return (
    <Card
      className={joinClassNames(
        "rounded-none border-border/60 bg-background/80 shadow-lg shadow-black/5",
        className,
      )}
    >
      <CardContent className="space-y-2 p-5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {hint ? <p className="text-sm leading-6 text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function ChartMetricStrip({ className, label, value }: ChartMetricStripProps): JSX.Element {
  return (
    <Item variant="muted" className={joinClassNames("items-start bg-muted/20 p-4", className)}>
      <ItemContent>
        <ItemDescription className="text-xs uppercase tracking-[0.18em]">{label}</ItemDescription>
        <ItemTitle className="mt-1 text-lg font-semibold">{value}</ItemTitle>
      </ItemContent>
    </Item>
  );
}

export function ChartRangeSelector({
  activeRangeId,
  className,
  formatDomain = formatDomainRange,
  onRangeChange,
  ranges,
}: ChartRangeSelectorProps): JSX.Element {
  return (
    <div className={joinClassNames("space-y-3", className)}>
      {ranges.map((range) => {
        const active = range.id === activeRangeId;

        return (
          <Button
            key={range.id}
            type="button"
            variant="outline"
            className={joinClassNames(
              "h-auto w-full justify-start rounded-none border p-4 text-left transition hover:border-primary/60",
              active ? "border-primary bg-primary/10" : "border-border/60 bg-muted/20",
            )}
            onClick={() => onRangeChange(range.id)}
          >
            <span className="grid w-full gap-2">
              <span className="flex items-center justify-between gap-3">
                <span className="font-medium">{range.label}</span>
                <span className="text-xs text-muted-foreground">{formatDomain(range.domain)}</span>
              </span>
              {range.description ? (
                <span className="block text-sm leading-6 text-muted-foreground">
                  {range.description}
                </span>
              ) : null}
            </span>
          </Button>
        );
      })}
    </div>
  );
}

export function ChartValueModeSelector({
  className,
  modes = DEFAULT_VALUE_MODES,
  onValueModeChange,
  valueMode,
}: ChartValueModeSelectorProps): JSX.Element {
  return (
    <div className={joinClassNames("flex flex-wrap items-center gap-2", className)}>
      {modes.map((mode) => (
        <Button
          key={mode}
          type="button"
          size="sm"
          variant={mode === valueMode ? "default" : "outline"}
          aria-pressed={mode === valueMode}
          onClick={() => onValueModeChange(mode)}
        >
          {mode}
        </Button>
      ))}
    </div>
  );
}

export function ChartBackendStatus({
  className,
  onWarmNow,
  progress,
  status,
}: ChartBackendStatusProps): JSX.Element {
  const stateLabel = status.wasmReady ? "ready" : status.isWarming ? "warming" : "scheduled";
  const progressValue = progress ?? (status.wasmReady ? 100 : status.isWarming ? 62 : 22);

  return (
    <div className={joinClassNames("space-y-5", className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium">{status.activeBackend}</span>
          <span className="text-muted-foreground">{stateLabel}</span>
        </div>
        <Progress value={progressValue} />
      </div>
      {onWarmNow ? (
        <Button type="button" variant="outline" className="w-full" onClick={onWarmNow}>
          Warm WASM now
        </Button>
      ) : null}
    </div>
  );
}

export function ChartSampleSparkline<TProperties = Record<string, unknown>>({
  ariaLabel = "Dense chart sparkline",
  className,
  domain,
  formatDomainValue = formatCompactNumber,
  samples,
}: ChartSampleSparklineProps<TProperties>): JSX.Element {
  const values = samples.filter((sample) => sample.y !== null);

  if (values.length === 0) {
    return (
      <div
        className={joinClassNames(
          "flex h-56 items-center justify-center border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        No chart samples in this viewport.
      </div>
    );
  }

  const minY = Math.min(...values.map((sample) => sample.y ?? 0));
  const maxY = Math.max(...values.map((sample) => sample.y ?? 0));
  const spread = Math.max(1, maxY - minY);
  const domainSpread = Math.max(1, domain[1] - domain[0]);
  const points = values
    .map((sample) => {
      const x = ((sample.x - domain[0]) / domainSpread) * 100;
      const y = 92 - (((sample.y ?? minY) - minY) / spread) * 84;

      return `${clamp(x, 0, 100)},${clamp(y, 8, 92)}`;
    })
    .join(" ");
  const gradientId = `charts-sparkline-fill-${hashString(points)}`;

  return (
    <div
      className={joinClassNames(
        "relative overflow-hidden border border-border/60 bg-muted/20 p-4",
        className,
      )}
    >
      <svg viewBox="0 0 100 100" role="img" aria-label={ariaLabel} className="h-56 w-full">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polyline points={`0,96 ${points} 100,96`} fill={`url(#${gradientId})`} stroke="none" />
        <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="1.4" />
      </svg>
      <div className="absolute bottom-3 left-3 text-xs text-muted-foreground">
        {samples.length} samples from {formatDomainValue(domain[0])} to{" "}
        {formatDomainValue(domain[1])}
      </div>
    </div>
  );
}

export function ChartHotBinRow<TProperties = Record<string, unknown>>({
  className,
  formatMetric = formatMetricValue,
  formatX = formatCompactNumber,
  sample,
}: ChartHotBinRowProps<TProperties>): JSX.Element {
  const primaryMetric = getPrimaryMetric(sample.metrics);

  return (
    <Item
      variant="muted"
      className={joinClassNames(
        "grid gap-3 bg-muted/20 p-4 text-sm md:grid-cols-[1fr_auto] md:items-center",
        className,
      )}
    >
      <div>
        <p className="font-medium">
          {formatX(sample.x0)}-{formatX(sample.x1)}
        </p>
        <p className="text-muted-foreground">
          {formatCompactNumber(sample.pointCount)} source points, average{" "}
          {formatNullableNumber(sample.averageY)}
        </p>
      </div>
      {primaryMetric ? (
        <div className="text-left md:text-right">
          <p>{formatMetric(primaryMetric[0], primaryMetric[1])}</p>
          <p className="text-muted-foreground">{primaryMetric[0]}</p>
        </div>
      ) : null}
    </Item>
  );
}

export function ChartValueModePreview<TProperties = Record<string, unknown>>({
  active = false,
  className,
  measured,
  mode,
  onSelect,
}: ChartValueModePreviewProps<TProperties>): JSX.Element {
  const data = createPreviewData(measured.series.samples);
  const content = (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-medium capitalize">{mode}</span>
        <span className="text-xs text-muted-foreground">{measured.queryMs.toFixed(2)} ms</span>
      </div>
      <ChartContainer
        className="h-28 w-full"
        config={mode === "count" ? countPreviewConfig : valuePreviewConfig}
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
              stroke="var(--color-value)"
              strokeWidth={1.5}
              type="monotone"
            />
          </LineChart>
        )}
      </ChartContainer>
    </>
  );
  const previewClassName = joinClassNames(
    "h-auto w-full rounded-none border p-3 text-left transition hover:border-primary/60",
    active ? "border-primary bg-primary/10" : "border-border/60 bg-muted/20",
    className,
  );

  if (onSelect) {
    return (
      <Button
        type="button"
        variant="outline"
        className={joinClassNames("block justify-start", previewClassName)}
        aria-pressed={active}
        onClick={onSelect}
      >
        <span className="block w-full">{content}</span>
      </Button>
    );
  }

  return <div className={previewClassName}>{content}</div>;
}

export function useProgressiveChartDensity<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options?: Omit<ChartDensityIndexOptions<TProperties>, "backend">,
): {
  index: ProgressiveChartDensityIndex<TProperties>;
  status: ChartDensityProgressiveStatus;
  warmWasmNow: () => Promise<void>;
} {
  const [statusTick, setStatusTick] = useState(0);
  const index = useMemo(() => {
    const resolvedOptions = options ?? {};
    const progressiveOptions = resolvedOptions.progressive;

    return createProgressiveChartDensityIndex(points, {
      ...resolvedOptions,
      progressive: {
        ...progressiveOptions,
        onError(error) {
          progressiveOptions?.onError?.(error);
          setStatusTick((tick) => tick + 1);
        },
        onReady(nextIndex) {
          progressiveOptions?.onReady?.(nextIndex);
          setStatusTick((tick) => tick + 1);
        },
      },
    });
  }, [options, points]);
  const status = useMemo(() => index.getProgressiveStatus(), [index, statusTick]);

  useEffect(() => {
    if (status.wasmReady) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setStatusTick((tick) => tick + 1);

      if (index.getProgressiveStatus().wasmReady) {
        window.clearInterval(interval);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [index, status.wasmReady]);
  const warmWasmNow = useCallback(async () => {
    setStatusTick((tick) => tick + 1);

    try {
      await index.warmWasmIndex();
    } finally {
      setStatusTick((tick) => tick + 1);
    }
  }, [index]);

  return {
    index,
    status,
    warmWasmNow,
  };
}

export function measureChartSeries<TProperties = Record<string, unknown>>(
  index: ChartDensityIndex<TProperties>,
  query: ChartDensityQuery,
): MeasuredChartSeries<TProperties> {
  const startedAt = now();
  const series = index.getChartSeries(query);

  return {
    queryMs: now() - startedAt,
    series,
  };
}

export function getChartSampleYBounds<TProperties = Record<string, unknown>>(
  samples: Array<ChartDensitySample<TProperties>>,
): {
  maxY: number | null;
  minY: number | null;
} {
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

function createPreviewData<TProperties>(samples: Array<ChartDensitySample<TProperties>>) {
  return samples.map((sample) => ({
    count: sample.pointCount,
    label: formatCompactNumber(sample.x),
    value: sample.y,
    x: sample.x,
  }));
}

function formatDomainRange(domain: [number, number]) {
  return `${formatCompactNumber(domain[0])}-${formatCompactNumber(domain[1])}`;
}

function formatMetricValue(metricKey: string, value: number) {
  return `${formatCompactNumber(value)} ${metricKey}`;
}

function getPrimaryMetric(metrics: Record<string, number>) {
  const entries = Object.entries(metrics);

  return entries.find(([metricKey]) => metricKey === "revenue") ?? entries[0];
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
    notation: Math.abs(value) >= 10_000 ? "compact" : "standard",
  }).format(value);
}

function formatNullableNumber(value: number | null) {
  return value === null ? "n/a" : formatCompactNumber(value);
}

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

function isNumber(value: number | null): value is number {
  return value !== null;
}

function now() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}
