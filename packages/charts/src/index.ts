import {
  createDensityViewportSummary,
  createBinnedSeriesIndex,
  type BinnedSeries,
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

export type ChartDensityValueMode = "average" | "count" | "max" | "min" | "sum";

export type ChartDensityQuery = BinnedSeriesQuery & {
  valueMode?: ChartDensityValueMode;
};

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
  valueMode: ChartDensityValueMode;
};

export type ChartDensityViewportSummary = DataDensityViewportSummary & {
  binCount: number;
  sampleCount: number;
  valueMode: ChartDensityValueMode;
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

export type ChartDensityIndexOptions<TProperties = Record<string, unknown>> =
  BinnedSeriesIndexOptions<TProperties>;

export function createChartDensityIndex<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: ChartDensityIndexOptions<TProperties> = {},
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
  valueMode: ChartDensityValueMode = "average",
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

function getChartDensityValue<TProperties>(
  bin: ChartDensityBin<TProperties>,
  valueMode: ChartDensityValueMode,
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
