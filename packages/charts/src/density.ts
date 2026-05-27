import {
  createDensityViewportSummary,
  createBinnedSeriesIndex,
  type BinnedSeries,
  type BinnedSeriesBackend,
  type BinnedSeriesBin,
  type BinnedSeriesIndexOptions,
  type BinnedSeriesQuery,
  type BinnedSeriesSummary,
  type DataDensityMetricRecord,
  type DataDensityViewportSummary,
  type IndexedNumericSeriesPoint,
  type NumericSeriesPoint,
} from "@moritzbrantner/data-density";

export type ChartMetricRecord = DataDensityMetricRecord;
export type ChartSeriesPoint<TProperties = Record<string, unknown>> =
  NumericSeriesPoint<TProperties>;
export type IndexedChartSeriesPoint<TProperties = Record<string, unknown>> =
  IndexedNumericSeriesPoint<TProperties>;
export type ChartDensityBin<TProperties = Record<string, unknown>> = BinnedSeriesBin<TProperties>;

export type ChartValueMode = "average" | "count" | "max" | "min" | "sum";

export type ChartValueModeRenderer = "line" | "bar";

export type ChartValueModeDefinition = {
  axisLabel: string;
  color: string;
  description: string;
  formatValue: (value: number | null, sample: ChartDensitySample) => string;
  id: ChartValueMode;
  label: string;
  renderer: ChartValueModeRenderer;
};

export type ChartGapBehavior = "preserve" | "connect" | "drop" | "zero-fill";

export type ChartGapAnnotation = {
  endIndex: number;
  endX: number;
  sampleCount: number;
  startIndex: number;
  startX: number;
};

export type ChartRenderDataOptions<TProperties = Record<string, unknown>> = {
  gapBehavior?: ChartGapBehavior;
  includeMetrics?: boolean;
  includeSample?: boolean;
  modes?: readonly ChartValueMode[];
  xLabel?: (sample: ChartDensitySample<TProperties>) => string;
};

export type ChartRenderDatum<TProperties = Record<string, unknown>> = {
  average: number | null;
  count: number | null;
  index: number;
  label: string;
  max: number | null;
  metrics?: ChartMetricRecord;
  min: number | null;
  pointCount: number;
  sample?: ChartDensitySample<TProperties>;
  sum: number | null;
  value: number | null;
  x: number;
  x0: number;
  x1: number;
};

export type ChartRenderData<TProperties = Record<string, unknown>> = {
  annotations: ChartGapAnnotation[];
  rows: Array<ChartRenderDatum<TProperties>>;
};

export type ChartDensityQuery = BinnedSeriesQuery & {
  valueMode?: ChartValueMode;
};

export type ChartDensityBackend = BinnedSeriesBackend | "progressive";

export type ChartDensitySample<TProperties = Record<string, unknown>> = {
  averageY: number | null;
  firstPoint: IndexedChartSeriesPoint<TProperties> | null;
  index: number;
  lastPoint: IndexedChartSeriesPoint<TProperties> | null;
  maxY: number | null;
  metrics: ChartMetricRecord;
  minY: number | null;
  pointCount: number;
  sumY: number;
  x: number;
  x0: number;
  x1: number;
  y: number | null;
};

export type ChartDensitySummary = BinnedSeriesSummary & {
  sampleCount: number;
  valueMode: ChartValueMode;
};

export type ChartDensityViewportSummary = DataDensityViewportSummary & {
  binCount: number;
  sampleCount: number;
  valueMode: ChartValueMode;
  xDomain: BinnedSeriesSummary["xDomain"];
};

export type ChartDensitySeries<TProperties = Record<string, unknown>> = {
  bins: Array<ChartDensityBin<TProperties>>;
  samples: Array<ChartDensitySample<TProperties>>;
  summary: ChartDensitySummary;
};

export type ChartDensityIndex<TProperties = Record<string, unknown>> = {
  getBinnedSeries(query: BinnedSeriesQuery): BinnedSeries<TProperties>;
  getChartSeries(query: ChartDensityQuery): ChartDensitySeries<TProperties>;
  getPointById(pointId: string): IndexedChartSeriesPoint<TProperties> | null;
  getSeriesBounds(): {
    maxX: number;
    maxY: number;
    minX: number;
    minY: number;
  } | null;
};

export type ChartDensityWarmupScheduler = (warmup: () => void) => void;

export type ChartDensityProgressiveOptions<TProperties = Record<string, unknown>> = {
  onError?: (error: unknown) => void;
  onReady?: (index: ChartDensityIndex<TProperties>) => void;
  scheduler?: ChartDensityWarmupScheduler;
  warmup?: "manual" | "scheduled";
};

export type ChartDensityIndexOptions<TProperties = Record<string, unknown>> = Omit<
  BinnedSeriesIndexOptions<TProperties>,
  "backend"
> & {
  backend?: ChartDensityBackend;
  progressive?: ChartDensityProgressiveOptions<TProperties>;
};

export type ChartDensityProgressiveStatus = {
  activeBackend: BinnedSeriesBackend;
  isWarming: boolean;
  wasmError: unknown | null;
  wasmReady: boolean;
};

export type ProgressiveChartDensityIndex<TProperties = Record<string, unknown>> =
  ChartDensityIndex<TProperties> & {
    getActiveBackend(): BinnedSeriesBackend;
    getProgressiveStatus(): ChartDensityProgressiveStatus;
    warmWasmIndex(): Promise<ChartDensityIndex<TProperties>>;
    whenWasmReady(): Promise<ChartDensityIndex<TProperties>>;
  };

export const CHART_VALUE_MODE_DEFINITIONS: readonly ChartValueModeDefinition[] = [
  {
    axisLabel: "Average y",
    color: "var(--chart-1)",
    description: "Mean y value across every source point in each bin.",
    formatValue: formatNullableCompactNumber,
    id: "average",
    label: "Average",
    renderer: "line",
  },
  {
    axisLabel: "Point count",
    color: "var(--chart-4)",
    description: "Number of source points represented by each bin.",
    formatValue: formatNullableCompactNumber,
    id: "count",
    label: "Count",
    renderer: "bar",
  },
  {
    axisLabel: "Maximum y",
    color: "var(--chart-2)",
    description: "Highest y value found inside each bin.",
    formatValue: formatNullableCompactNumber,
    id: "max",
    label: "Maximum",
    renderer: "line",
  },
  {
    axisLabel: "Minimum y",
    color: "var(--chart-3)",
    description: "Lowest y value found inside each bin.",
    formatValue: formatNullableCompactNumber,
    id: "min",
    label: "Minimum",
    renderer: "line",
  },
  {
    axisLabel: "Sum y",
    color: "var(--chart-5)",
    description: "Total y value across every source point in each bin.",
    formatValue: formatNullableCompactNumber,
    id: "sum",
    label: "Sum",
    renderer: "line",
  },
];

export function getChartValueModeDefinition(mode: ChartValueMode): ChartValueModeDefinition {
  const definition = CHART_VALUE_MODE_DEFINITIONS.find((item) => item.id === mode);

  if (!definition) {
    throw new Error(`Unknown chart value mode: ${mode}`);
  }

  return definition;
}

export function getChartValueModeDefinitions(
  modes?: readonly ChartValueMode[],
): ChartValueModeDefinition[] {
  if (!modes) {
    return [...CHART_VALUE_MODE_DEFINITIONS];
  }

  return modes.map((mode) => getChartValueModeDefinition(mode));
}

export function createChartDensityIndex<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: ChartDensityIndexOptions<TProperties> = {},
): ChartDensityIndex<TProperties> {
  const { backend = "progressive", progressive, ...indexOptions } = options;

  if (backend === "progressive") {
    return createProgressiveChartDensityIndex(points, {
      ...indexOptions,
      progressive,
    });
  }

  return createStaticChartDensityIndex(points, {
    ...indexOptions,
    backend,
  });
}

export function createProgressiveChartDensityIndex<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: Omit<ChartDensityIndexOptions<TProperties>, "backend"> = {},
): ProgressiveChartDensityIndex<TProperties> {
  const { progressive, ...indexOptions } = options;
  let activeBackend: BinnedSeriesBackend = "hybrid-js";
  let activeIndex = createStaticChartDensityIndex(points, {
    ...indexOptions,
    backend: "hybrid-js",
  });
  let wasmIndex: ChartDensityIndex<TProperties> | null = null;
  let wasmError: unknown | null = null;
  let isWarming = false;
  let warmupPromise: Promise<ChartDensityIndex<TProperties>> | null = null;

  const warmWasmIndex = () => {
    if (wasmIndex) {
      return Promise.resolve(wasmIndex);
    }

    if (warmupPromise) {
      return warmupPromise;
    }

    isWarming = true;
    wasmError = null;
    warmupPromise = Promise.resolve()
      .then(() => {
        const nextIndex = createStaticChartDensityIndex(points, {
          ...indexOptions,
          backend: "wasm-index",
        });

        wasmIndex = nextIndex;
        activeIndex = nextIndex;
        activeBackend = "wasm-index";
        progressive?.onReady?.(nextIndex);

        return nextIndex;
      })
      .catch((error: unknown) => {
        wasmError = error;
        progressive?.onError?.(error);
        throw error;
      })
      .finally(() => {
        isWarming = false;
      });

    return warmupPromise;
  };

  if (progressive?.warmup !== "manual") {
    scheduleChartDensityWarmup(progressive?.scheduler, () => {
      void warmWasmIndex().catch(() => undefined);
    });
  }

  return {
    getActiveBackend() {
      return activeBackend;
    },

    getBinnedSeries(query) {
      return activeIndex.getBinnedSeries(query);
    },

    getChartSeries(query) {
      return activeIndex.getChartSeries(query);
    },

    getPointById(pointId) {
      return activeIndex.getPointById(pointId);
    },

    getProgressiveStatus() {
      return {
        activeBackend,
        isWarming,
        wasmError,
        wasmReady: Boolean(wasmIndex),
      };
    },

    getSeriesBounds() {
      return activeIndex.getSeriesBounds();
    },

    warmWasmIndex,

    whenWasmReady() {
      return warmWasmIndex();
    },
  };
}

function createStaticChartDensityIndex<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: BinnedSeriesIndexOptions<TProperties>,
): ChartDensityIndex<TProperties> {
  const binnedIndex = createBinnedSeriesIndex(points, options);

  return {
    getBinnedSeries(query) {
      return binnedIndex.getBinnedSeries(query);
    },

    getChartSeries(query) {
      const valueMode = query.valueMode ?? "average";
      const series = binnedIndex.getBinnedSeries(query);
      const samples = series.bins.map((bin) => createChartDensitySample(bin, valueMode));

      return {
        bins: series.bins,
        samples,
        summary: {
          ...series.summary,
          sampleCount: samples.length,
          valueMode,
        },
      };
    },

    getPointById(pointId) {
      return binnedIndex.getPointById(pointId);
    },

    getSeriesBounds() {
      return binnedIndex.getSeriesBounds();
    },
  };
}

export const createChartSeriesIndex = createChartDensityIndex;

export function createChartDensitySample<TProperties = Record<string, unknown>>(
  bin: ChartDensityBin<TProperties>,
  valueMode: ChartValueMode = "average",
): ChartDensitySample<TProperties> {
  return {
    averageY: bin.averageY,
    firstPoint: bin.firstPoint,
    index: bin.index,
    lastPoint: bin.lastPoint,
    maxY: bin.maxY,
    metrics: bin.metrics,
    minY: bin.minY,
    pointCount: bin.pointCount,
    sumY: bin.sumY,
    x: (bin.x0 + bin.x1) / 2,
    x0: bin.x0,
    x1: bin.x1,
    y: getChartDensityValue(bin, valueMode),
  };
}

export function createChartDensityViewportSummary<TProperties = Record<string, unknown>>(
  series: ChartDensitySeries<TProperties>,
): ChartDensityViewportSummary {
  return {
    ...createDensityViewportSummary(
      "chart",
      series.bins.map((bin) => bin.metrics),
      series.summary.pointCount,
    ),
    binCount: series.summary.binCount,
    sampleCount: series.summary.sampleCount,
    valueMode: series.summary.valueMode,
    xDomain: series.summary.xDomain,
  };
}

export function getChartGapAnnotations<TProperties>(
  samples: Array<ChartDensitySample<TProperties>>,
): ChartGapAnnotation[] {
  const annotations: ChartGapAnnotation[] = [];
  let startSample: ChartDensitySample<TProperties> | null = null;
  let previousSample: ChartDensitySample<TProperties> | null = null;

  for (const sample of samples) {
    if (sample.y === null) {
      startSample ??= sample;
      previousSample = sample;
      continue;
    }

    if (startSample && previousSample) {
      annotations.push(createGapAnnotation(startSample, previousSample));
    }

    startSample = null;
    previousSample = null;
  }

  if (startSample && previousSample) {
    annotations.push(createGapAnnotation(startSample, previousSample));
  }

  return annotations;
}

export function createChartRenderData<TProperties>(
  samples: Array<ChartDensitySample<TProperties>>,
  options: ChartRenderDataOptions<TProperties> = {},
): ChartRenderData<TProperties> {
  const {
    gapBehavior = "preserve",
    includeMetrics = false,
    includeSample = false,
    modes,
    xLabel = (sample) => String(sample.x),
  } = options;
  const includedModes = new Set<ChartValueMode>(modes ?? ["average", "count", "max", "min", "sum"]);
  const includeEmptySamples = gapBehavior === "preserve" || gapBehavior === "zero-fill";
  const zeroFill = gapBehavior === "zero-fill";
  const annotations = gapBehavior === "connect" ? getChartGapAnnotations(samples) : [];
  const rows = samples
    .filter((sample) => includeEmptySamples || sample.y !== null)
    .map((sample) => {
      const row: ChartRenderDatum<TProperties> = {
        average: includedModes.has("average")
          ? normalizeRenderValue(sample.averageY, zeroFill)
          : null,
        count: includedModes.has("count")
          ? normalizeRenderValue(sample.pointCount > 0 ? sample.pointCount : null, zeroFill)
          : null,
        index: sample.index,
        label: xLabel(sample),
        max: includedModes.has("max") ? normalizeRenderValue(sample.maxY, zeroFill) : null,
        min: includedModes.has("min") ? normalizeRenderValue(sample.minY, zeroFill) : null,
        pointCount: sample.pointCount,
        sum: includedModes.has("sum")
          ? normalizeRenderValue(sample.pointCount > 0 ? sample.sumY : null, zeroFill)
          : null,
        value: normalizeRenderValue(sample.y, zeroFill),
        x: sample.x,
        x0: sample.x0,
        x1: sample.x1,
      };

      if (includeMetrics) {
        row.metrics = sample.metrics;
      }

      if (includeSample) {
        row.sample = sample;
      }

      return row;
    });

  return {
    annotations,
    rows,
  };
}

function getChartDensityValue<TProperties>(
  bin: ChartDensityBin<TProperties>,
  valueMode: ChartValueMode,
) {
  if (bin.pointCount === 0) {
    return null;
  }

  switch (valueMode) {
    case "count":
      return bin.pointCount;
    case "max":
      return bin.maxY;
    case "min":
      return bin.minY;
    case "sum":
      return bin.sumY;
    case "average":
      return bin.averageY;
  }
}

function createGapAnnotation<TProperties>(
  startSample: ChartDensitySample<TProperties>,
  endSample: ChartDensitySample<TProperties>,
): ChartGapAnnotation {
  return {
    endIndex: endSample.index,
    endX: endSample.x,
    sampleCount: endSample.index - startSample.index + 1,
    startIndex: startSample.index,
    startX: startSample.x,
  };
}

function normalizeRenderValue(value: number | null, zeroFill: boolean) {
  return value === null && zeroFill ? 0 : value;
}

function formatNullableCompactNumber(value: number | null) {
  if (value === null) {
    return "n/a";
  }

  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
    notation: Math.abs(value) >= 10_000 ? "compact" : "standard",
  }).format(value);
}

function scheduleChartDensityWarmup(
  scheduler: ChartDensityWarmupScheduler | undefined,
  warmup: () => void,
) {
  if (scheduler) {
    scheduler(warmup);
    return;
  }

  const runtime = globalThis as {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => unknown;
    setTimeout?: (callback: () => void, delay: number) => unknown;
  };

  if (typeof runtime.requestIdleCallback === "function") {
    runtime.requestIdleCallback(warmup, { timeout: 1_000 });
    return;
  }

  const timeoutHandle = runtime.setTimeout?.(warmup, 0);
  const maybeNodeTimer = timeoutHandle as { unref?: () => void } | undefined;

  maybeNodeTimer?.unref?.();
}
