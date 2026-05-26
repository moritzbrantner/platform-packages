import { runOperation } from "@mb-rust/dense-data-wasm";
import Supercluster from "supercluster";

export type DataDensityMetricRecord = Record<string, number>;

export type DataDensityMetricSummary = {
  itemCount: number;
  metricKeys: string[];
  metrics: DataDensityMetricRecord;
};

export type DenseDataNumberSummary = {
  count: number;
  finiteCount: number;
  max: number | null;
  mean: number | null;
  min: number | null;
  nonFiniteCount: number;
  stdDev: number | null;
  sum: number | null;
  variance: number | null;
  weightSum: number;
};

export type DenseDataBounds = {
  max: number[];
  min: number[];
};

export type DenseDataAverages = {
  coordinates: number[];
  count: number;
  value: number | null;
  valueCount: number;
  valueWeightSum: number;
  weightSum: number;
};

export type DenseDataPoint = {
  coordinates: number[];
  id?: string;
  value?: number;
  weight?: number;
};

export type DenseDataSummary = {
  bounds: DenseDataBounds;
  coordinateStats: DenseDataNumberSummary[];
  count: number;
  dimensions: number;
  valueStats: DenseDataNumberSummary | null;
  weightSum: number;
};

export type DenseDataBucket = {
  averages: DenseDataAverages;
  bounds: DenseDataBounds;
  count: number;
  key: {
    indices: number[];
  };
  pointIndices: number[];
  weightSum: number;
};

export type DenseDataBucketIndexOptions = {
  cellSize: number;
  dimensions: number;
  origin?: number[];
  widths?: number[];
};

export type DenseDataBucketIndex = {
  getBuckets(): DenseDataBucket[];
  getPointByIndex(index: number): DenseDataPoint | null;
  getSummary(): DenseDataSummary;
};

export type DenseDataCluster = {
  averages: DenseDataAverages | null;
  bounds: DenseDataBounds | null;
  centroid: number[];
  clusterIndex: number;
  count: number;
  pointIndices: number[];
  weightSum: number;
};

export type DenseDataClusterOptions = {
  clusters: number;
  maxIterations?: number;
  tolerance?: number;
};

export type DenseDataClusterResult = {
  clusters: DenseDataCluster[];
  iterations: number;
};

export class DenseDataWasmError extends Error {
  readonly operation: string;

  constructor(operation: string, cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);
    super(`@mb-rust/dense-data-wasm failed while running ${operation}: ${message}`);
    this.name = "DenseDataWasmError";
    this.operation = operation;
  }
}

export type DataDensityViewportSummary = DataDensityMetricSummary & {
  kind: "chart" | "graph" | "map" | "table";
};

export type DataDensityItemWindowQuery = {
  limit: number;
  offset: number;
  overscan?: number;
};

export type IndexedDataDensityItem<TItem> = {
  id: string;
  index: number;
  item: TItem;
  metrics: DataDensityMetricRecord;
};

export type DataDensityWindowSummary = {
  endIndex: number;
  filteredItemCount: number;
  metrics: DataDensityMetricRecord;
  startIndex: number;
  totalItemCount: number;
  visibleItemCount: number;
};

export type DataDensityWindow<TItem> = {
  items: Array<IndexedDataDensityItem<TItem>>;
  summary: DataDensityWindowSummary;
};

export type DataDensityWindowIndexOptions<TItem> = {
  filterItem?: (item: TItem, index: number) => boolean;
  getId?: (item: TItem, index: number) => string | number | undefined;
  getMetrics?: (item: TItem, index: number) => DataDensityMetricRecord | undefined;
};

export type DataDensityWindowIndex<TItem> = {
  getItemById(itemId: string): IndexedDataDensityItem<TItem> | null;
  getWindow(query: DataDensityItemWindowQuery): DataDensityWindow<TItem>;
};

export type NumericSeriesPoint<TProperties = Record<string, unknown>> = {
  id?: string | number;
  label?: string;
  metrics?: DataDensityMetricRecord;
  properties?: TProperties;
  x: number;
  y: number;
};

export type IndexedNumericSeriesPoint<TProperties = Record<string, unknown>> = Required<
  NumericSeriesPoint<TProperties>
> & {
  id: string;
};

export type NumericSeriesDomain = [min: number, max: number];

export type BinnedSeriesQuery = {
  includeEmptyBins?: boolean;
  targetBinCount: number;
  xDomain: NumericSeriesDomain;
};

export type BinnedSeriesBin<TProperties = Record<string, unknown>> = {
  averageY: number | null;
  firstPoint: IndexedNumericSeriesPoint<TProperties> | null;
  index: number;
  lastPoint: IndexedNumericSeriesPoint<TProperties> | null;
  maxY: number | null;
  metrics: DataDensityMetricRecord;
  minY: number | null;
  pointCount: number;
  sumY: number;
  x0: number;
  x1: number;
};

export type BinnedSeriesSummary = {
  binCount: number;
  metrics: DataDensityMetricRecord;
  pointCount: number;
  xDomain: NumericSeriesDomain;
};

export type BinnedSeries<TProperties = Record<string, unknown>> = {
  bins: Array<BinnedSeriesBin<TProperties>>;
  summary: BinnedSeriesSummary;
};

export type BinnedSeriesIndexOptions<TProperties = Record<string, unknown>> = {
  filterPoint?: (point: IndexedNumericSeriesPoint<TProperties>) => boolean;
};

export type BinnedSeriesIndex<TProperties = Record<string, unknown>> = {
  getBinnedSeries(query: BinnedSeriesQuery): BinnedSeries<TProperties>;
  getPointById(pointId: string): IndexedNumericSeriesPoint<TProperties> | null;
  getSeriesBounds(): {
    maxX: number;
    maxY: number;
    minX: number;
    minY: number;
  } | null;
};

export type GeoDensityPoint<TProperties = Record<string, unknown>> = {
  id?: string | number;
  label?: string;
  latitude: number;
  longitude: number;
  metrics?: DataDensityMetricRecord;
  properties?: TProperties;
};

export type IndexedGeoDensityPoint<TProperties = Record<string, unknown>> = Required<
  GeoDensityPoint<TProperties>
> & {
  id: string;
};

export type AggregatedGeoDensityPoint<TProperties = Record<string, unknown>> = {
  coordinates: [longitude: number, latitude: number];
  kind: "point";
  metrics: DataDensityMetricRecord;
  point: IndexedGeoDensityPoint<TProperties>;
};

export type AggregatedGeoDensityCluster = {
  clusterId: number;
  coordinates: [longitude: number, latitude: number];
  expansionZoom: number;
  kind: "cluster";
  metrics: DataDensityMetricRecord;
  pointCount: number;
  pointCountAbbreviated: string;
};

export type AggregatedGeoDensityFeature<TProperties = Record<string, unknown>> =
  | AggregatedGeoDensityCluster
  | AggregatedGeoDensityPoint<TProperties>;

export type GeoViewportAggregationQuery = {
  bounds: [west: number, south: number, east: number, north: number];
  zoom: number;
};

export type VisibleGeoAggregationSummary = {
  bounds: GeoViewportAggregationQuery["bounds"];
  metrics: DataDensityMetricRecord;
  visibleClusterCount: number;
  visiblePointCount: number;
  visibleUnclusteredCount: number;
  zoom: number;
};

export type GeoViewportAggregation<TProperties = Record<string, unknown>> = {
  features: Array<AggregatedGeoDensityFeature<TProperties>>;
  summary: VisibleGeoAggregationSummary;
};

export type GeoDensityViewportSummary = DataDensityViewportSummary & {
  bounds: GeoViewportAggregationQuery["bounds"];
  visibleClusterCount: number;
  visiblePointCount: number;
  visibleUnclusteredCount: number;
  zoom: number;
};

export type GeoDensityPointFilter<TProperties = Record<string, unknown>> = (
  point: IndexedGeoDensityPoint<TProperties>,
) => boolean;

export type GeoPointAggregationIndexOptions<TProperties = Record<string, unknown>> = {
  extent?: number;
  filterPoint?: GeoDensityPointFilter<TProperties>;
  maxZoom?: number;
  minZoom?: number;
  radius?: number;
};

export type GeoPointAggregationIndex<TProperties = Record<string, unknown>> = {
  getClusterExpansionZoom(clusterId: number): number;
  getClusterLeaves(
    clusterId: number,
    limit?: number,
    offset?: number,
  ): Array<IndexedGeoDensityPoint<TProperties>>;
  getPointById(pointId: string): IndexedGeoDensityPoint<TProperties> | null;
  getViewportAggregation(query: GeoViewportAggregationQuery): GeoViewportAggregation<TProperties>;
};

type InternalMetricProperties = {
  pointId: string;
} & Record<string, number | string>;

type InternalGeoPoint<TProperties> = IndexedGeoDensityPoint<TProperties>;

type InternalClusterProperties = Record<string, number | string | boolean | undefined> & {
  cluster?: boolean;
  cluster_id?: number;
  pointId?: string;
  point_count?: number;
  point_count_abbreviated?: string;
};

type GeoJsonPointFeature = {
  geometry: {
    coordinates: [longitude: number, latitude: number];
    type: "Point";
  };
  properties: InternalMetricProperties;
  type: "Feature";
};

const compactNumberFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
  notation: "compact",
});

export function normalizeDensityMetrics(
  metrics: DataDensityMetricRecord | undefined,
): DataDensityMetricRecord {
  if (!metrics) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metrics).filter((entry): entry is [string, number] => Number.isFinite(entry[1])),
  );
}

export function collectDensityMetricKeys(
  metricRecords: readonly (DataDensityMetricRecord | undefined)[],
): string[] {
  const metricKeys = new Set<string>();

  for (const metrics of metricRecords) {
    for (const metricKey of Object.keys(metrics ?? {})) {
      metricKeys.add(metricKey);
    }
  }

  return Array.from(metricKeys).sort((left, right) => left.localeCompare(right));
}

export function sumDensityMetrics(
  metricRecords: readonly (DataDensityMetricRecord | undefined)[],
  metricKeys = collectDensityMetricKeys(metricRecords),
): DataDensityMetricRecord {
  const totals = Object.fromEntries(metricKeys.map((metricKey) => [metricKey, 0]));

  for (const metrics of metricRecords) {
    for (const metricKey of metricKeys) {
      totals[metricKey] += readNumericMetric(metrics ?? {}, metricKey);
    }
  }

  return totals;
}

export function createDensityMetricSummary(
  metricRecords: readonly (DataDensityMetricRecord | undefined)[],
  itemCount = metricRecords.length,
): DataDensityMetricSummary {
  const metricKeys = collectDensityMetricKeys(metricRecords);

  return {
    itemCount,
    metricKeys,
    metrics: sumDensityMetrics(metricRecords, metricKeys),
  };
}

export function createDensityViewportSummary(
  kind: DataDensityViewportSummary["kind"],
  metricRecords: readonly (DataDensityMetricRecord | undefined)[],
  itemCount = metricRecords.length,
): DataDensityViewportSummary {
  return {
    kind,
    ...createDensityMetricSummary(metricRecords, itemCount),
  };
}

export function createGeoDensityViewportSummary<TProperties = Record<string, unknown>>(
  aggregation: GeoViewportAggregation<TProperties>,
): GeoDensityViewportSummary {
  return {
    ...createDensityViewportSummary(
      "map",
      aggregation.features.map((feature) => feature.metrics),
      aggregation.summary.visiblePointCount,
    ),
    bounds: aggregation.summary.bounds,
    visibleClusterCount: aggregation.summary.visibleClusterCount,
    visiblePointCount: aggregation.summary.visiblePointCount,
    visibleUnclusteredCount: aggregation.summary.visibleUnclusteredCount,
    zoom: aggregation.summary.zoom,
  };
}

export function createDensePointSummary(points: readonly DenseDataPoint[]): DenseDataSummary {
  return runDenseDataOperation<DenseDataSummary>("summarizeDensePoints", { points });
}

export function createDensePointBucketIndex(
  points: readonly DenseDataPoint[],
  options: DenseDataBucketIndexOptions,
): DenseDataBucketIndex {
  const normalizedPoints = points.map(normalizeDenseDataPoint);
  const summary = createDensePointSummary(normalizedPoints);
  const bucketResponse = runDenseDataOperation<{ buckets: DenseDataBucket[] }>(
    "bucketDensePoints",
    {
      grid: options,
      points: normalizedPoints,
    },
  );

  return {
    getBuckets() {
      return bucketResponse.buckets;
    },
    getPointByIndex(index) {
      return normalizedPoints[index] ?? null;
    },
    getSummary() {
      return summary;
    },
  };
}

export function clusterDensePoints(
  points: readonly DenseDataPoint[],
  options: DenseDataClusterOptions,
): DenseDataClusterResult {
  return runDenseDataOperation<DenseDataClusterResult>("clusterDensePoints", {
    ...options,
    points: points.map(normalizeDenseDataPoint),
  });
}

export function createDataDensityWindowIndex<TItem>(
  items: readonly TItem[],
  options: DataDensityWindowIndexOptions<TItem> = {},
): DataDensityWindowIndex<TItem> {
  const indexedItems = items
    .map(
      (item, index): IndexedDataDensityItem<TItem> => ({
        id: String(options.getId?.(item, index) ?? readItemId(item, index)),
        index,
        item,
        metrics: normalizeDensityMetrics(
          options.getMetrics?.(item, index) ?? readItemMetrics(item),
        ),
      }),
    )
    .filter((entry) => options.filterItem?.(entry.item, entry.index) ?? true);
  const itemLookup = new Map(indexedItems.map((item) => [item.id, item]));
  const metricKeys = collectDensityMetricKeys(indexedItems.map((item) => item.metrics));

  return {
    getItemById(itemId) {
      return itemLookup.get(itemId) ?? null;
    },

    getWindow(query) {
      const offset = clampInteger(query.offset, 0, indexedItems.length);
      const limit = clampInteger(query.limit, 0, indexedItems.length);
      const overscan = clampInteger(query.overscan ?? 0, 0, indexedItems.length);
      const startIndex = Math.max(0, offset - overscan);
      const endIndex = Math.min(indexedItems.length, offset + limit + overscan);
      const windowItems = indexedItems.slice(startIndex, endIndex);

      return {
        items: windowItems,
        summary: {
          endIndex,
          filteredItemCount: indexedItems.length,
          metrics: sumDensityMetrics(
            windowItems.map((item) => item.metrics),
            metricKeys,
          ),
          startIndex,
          totalItemCount: items.length,
          visibleItemCount: windowItems.length,
        },
      };
    },
  };
}

export function createBinnedSeriesIndex<TProperties = Record<string, unknown>>(
  points: readonly NumericSeriesPoint<TProperties>[],
  options: BinnedSeriesIndexOptions<TProperties> = {},
): BinnedSeriesIndex<TProperties> {
  const normalizedPoints = points
    .map((point, index) => normalizeSeriesPoint(point, index))
    .filter(isFiniteSeriesPoint)
    .filter((point) => options.filterPoint?.(point) ?? true)
    .sort((left, right) => left.x - right.x);
  const pointLookup = new Map(normalizedPoints.map((point) => [point.id, point]));
  const metricKeys = collectDensityMetricKeys(normalizedPoints.map((point) => point.metrics));

  return {
    getBinnedSeries(query) {
      const xDomain = normalizeDomain(query.xDomain);
      const targetBinCount = clampInteger(query.targetBinCount, 1, 100_000);
      const startIndex = lowerBoundByX(normalizedPoints, xDomain[0]);
      const endIndex = upperBoundByX(normalizedPoints, xDomain[1]);
      const visiblePoints = normalizedPoints.slice(startIndex, endIndex);
      const kernelResult = runDenseDataOperation<{
        bins: Array<{
          averageY: number | null;
          firstPointIndex: number | null;
          index: number;
          lastPointIndex: number | null;
          maxY: number | null;
          metrics: DataDensityMetricRecord;
          minY: number | null;
          pointCount: number;
          sumY: number;
          x0: number;
          x1: number;
        }>;
      }>("binNumericSeries", {
        includeEmptyBins: query.includeEmptyBins ?? false,
        points: visiblePoints.map((point, index) => ({
          index,
          metrics: point.metrics,
          x: point.x,
          y: point.y,
        })),
        targetBinCount,
        xDomain,
      });
      const visibleBins = kernelResult.bins.map(
        (bin): BinnedSeriesBin<TProperties> => ({
          averageY: bin.averageY,
          firstPoint:
            bin.firstPointIndex === null || bin.firstPointIndex === undefined
              ? null
              : (visiblePoints[bin.firstPointIndex] ?? null),
          index: bin.index,
          lastPoint:
            bin.lastPointIndex === null || bin.lastPointIndex === undefined
              ? null
              : (visiblePoints[bin.lastPointIndex] ?? null),
          maxY: bin.maxY,
          metrics: normalizeDensityMetrics(bin.metrics),
          minY: bin.minY,
          pointCount: bin.pointCount,
          sumY: bin.sumY,
          x0: bin.x0,
          x1: bin.x1,
        }),
      );

      return {
        bins: visibleBins,
        summary: {
          binCount: visibleBins.length,
          metrics: sumDensityMetrics(
            visibleBins.map((bin) => bin.metrics),
            metricKeys,
          ),
          pointCount: visibleBins.reduce((total, bin) => total + bin.pointCount, 0),
          xDomain,
        },
      };
    },

    getPointById(pointId) {
      return pointLookup.get(pointId) ?? null;
    },

    getSeriesBounds() {
      if (normalizedPoints.length === 0) {
        return null;
      }

      let minY = Number.POSITIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;

      for (const point of normalizedPoints) {
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      }

      return {
        maxX: normalizedPoints[normalizedPoints.length - 1]!.x,
        maxY,
        minX: normalizedPoints[0]!.x,
        minY,
      };
    },
  };
}

export function createGeoPointAggregationIndex<TProperties = Record<string, unknown>>(
  points: readonly GeoDensityPoint<TProperties>[],
  options: GeoPointAggregationIndexOptions<TProperties> = {},
): GeoPointAggregationIndex<TProperties> {
  const normalizedPoints = points
    .map((point, index) => normalizeGeoPoint(point, index))
    .filter(isFiniteGeoPoint)
    .filter((point) => options.filterPoint?.(point) ?? true);
  const pointLookup = new Map(normalizedPoints.map((point) => [point.id, point]));
  const metricKeys = collectDensityMetricKeys(normalizedPoints.map((point) => point.metrics));
  const tree = new Supercluster<InternalMetricProperties, InternalClusterProperties>({
    extent: options.extent ?? 512,
    map: (properties) => mapProperties(properties, metricKeys),
    maxZoom: options.maxZoom ?? 16,
    minZoom: options.minZoom ?? 0,
    radius: options.radius ?? 72,
    reduce: (accumulated, properties) => {
      for (const metricKey of metricKeys) {
        accumulated[metricKey] =
          readNumericMetric(accumulated, metricKey) + readNumericMetric(properties, metricKey);
      }
    },
  });

  tree.load(
    normalizedPoints.map((point) => ({
      geometry: {
        coordinates: [point.longitude, point.latitude],
        type: "Point",
      },
      properties: {
        pointId: point.id,
        ...point.metrics,
      },
      type: "Feature",
    })),
  );

  return {
    getClusterExpansionZoom(clusterId) {
      return tree.getClusterExpansionZoom(clusterId);
    },

    getClusterLeaves(clusterId, limit = 10, offset = 0) {
      return tree
        .getLeaves(clusterId, limit, offset)
        .map((feature) => pointLookup.get(feature.properties.pointId))
        .filter((point): point is InternalGeoPoint<TProperties> => Boolean(point));
    },

    getPointById(pointId) {
      return pointLookup.get(pointId) ?? null;
    },

    getViewportAggregation(query) {
      const rawFeatures = getFeaturesForBounds(tree, query.bounds, query.zoom);
      const features = rawFeatures
        .map((feature) => toAggregatedGeoFeature(feature, pointLookup, metricKeys, tree))
        .filter((feature): feature is AggregatedGeoDensityFeature<TProperties> => Boolean(feature));

      return {
        features,
        summary: summarizeGeoFeatures(query, features, metricKeys),
      };
    },
  };
}

export function getBoundsFromGeoPoints<TProperties = Record<string, unknown>>(
  points: readonly GeoDensityPoint<TProperties>[],
): [west: number, south: number, east: number, north: number] | null {
  let west = Number.POSITIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;
  let hasPoint = false;

  for (const point of points) {
    if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) {
      continue;
    }

    hasPoint = true;
    west = Math.min(west, point.longitude);
    south = Math.min(south, point.latitude);
    east = Math.max(east, point.longitude);
    north = Math.max(north, point.latitude);
  }

  return hasPoint ? [west, south, east, north] : null;
}

function normalizeSeriesPoint<TProperties>(
  point: NumericSeriesPoint<TProperties>,
  index: number,
): IndexedNumericSeriesPoint<TProperties> {
  return {
    id: String(point.id ?? index),
    label: point.label ?? "",
    metrics: normalizeDensityMetrics(point.metrics),
    properties: point.properties ?? ({} as TProperties),
    x: point.x,
    y: point.y,
  };
}

function normalizeDenseDataPoint(point: DenseDataPoint): DenseDataPoint {
  const normalized: DenseDataPoint = {
    coordinates: [...point.coordinates],
  };

  if (point.id !== undefined) {
    normalized.id = point.id;
  }

  if (point.weight !== undefined) {
    normalized.weight = point.weight;
  }

  if (point.value !== undefined) {
    normalized.value = point.value;
  }

  return normalized;
}

function runDenseDataOperation<TValue>(operation: string, input: Record<string, unknown>): TValue {
  try {
    return runOperation({
      input,
      operation,
    }).value as TValue;
  } catch (error) {
    throw new DenseDataWasmError(operation, error);
  }
}

function isFiniteSeriesPoint<TProperties>(point: IndexedNumericSeriesPoint<TProperties>) {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function lowerBoundByX<TProperties>(
  points: readonly IndexedNumericSeriesPoint<TProperties>[],
  x: number,
) {
  let low = 0;
  let high = points.length;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);

    if (points[middle]!.x < x) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  return low;
}

function upperBoundByX<TProperties>(
  points: readonly IndexedNumericSeriesPoint<TProperties>[],
  x: number,
) {
  let low = 0;
  let high = points.length;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);

    if (points[middle]!.x <= x) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  return low;
}

function normalizeDomain(domain: NumericSeriesDomain): NumericSeriesDomain {
  const left = Number.isFinite(domain[0]) ? domain[0] : 0;
  const right = Number.isFinite(domain[1]) ? domain[1] : left;

  return left <= right ? [left, right] : [right, left];
}

function normalizeGeoPoint<TProperties>(
  point: GeoDensityPoint<TProperties>,
  index: number,
): InternalGeoPoint<TProperties> {
  return {
    id: String(point.id ?? index),
    label: point.label ?? "",
    latitude: point.latitude,
    longitude: point.longitude,
    metrics: normalizeDensityMetrics(point.metrics),
    properties: point.properties ?? ({} as TProperties),
  };
}

function isFiniteGeoPoint<TProperties>(point: InternalGeoPoint<TProperties>) {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude);
}

function mapProperties(
  properties: InternalMetricProperties,
  metricKeys: readonly string[],
): InternalClusterProperties {
  const aggregated: InternalClusterProperties = {
    pointId: properties.pointId,
  };

  for (const metricKey of metricKeys) {
    aggregated[metricKey] = readNumericMetric(properties, metricKey);
  }

  return aggregated;
}

function getFeaturesForBounds(
  tree: Supercluster<InternalMetricProperties, InternalClusterProperties>,
  bounds: GeoViewportAggregationQuery["bounds"],
  zoom: number,
) {
  if (bounds[0] <= bounds[2]) {
    return tree.getClusters(bounds, Math.round(zoom));
  }

  const features = [
    ...tree.getClusters([bounds[0], bounds[1], 180, bounds[3]], Math.round(zoom)),
    ...tree.getClusters([-180, bounds[1], bounds[2], bounds[3]], Math.round(zoom)),
  ];
  const seen = new Set<string>();

  return features.filter((feature) => {
    const isCluster = feature.properties.cluster === true;
    const key = isCluster
      ? `cluster:${feature.properties.cluster_id}`
      : `point:${feature.properties.pointId}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function toAggregatedGeoFeature<TProperties>(
  feature:
    | GeoJsonPointFeature
    | ReturnType<
        Supercluster<InternalMetricProperties, InternalClusterProperties>["getClusters"]
      >[number],
  pointLookup: Map<string, InternalGeoPoint<TProperties>>,
  metricKeys: readonly string[],
  tree: Supercluster<InternalMetricProperties, InternalClusterProperties>,
): AggregatedGeoDensityFeature<TProperties> | null {
  const [longitude, latitude] = feature.geometry.coordinates;

  if (feature.properties.cluster === true) {
    const clusterId = feature.properties.cluster_id;
    const pointCount = feature.properties.point_count;
    const pointCountAbbreviated = feature.properties.point_count_abbreviated;

    if (
      typeof clusterId !== "number" ||
      !Number.isFinite(clusterId) ||
      typeof pointCount !== "number" ||
      !Number.isFinite(pointCount)
    ) {
      return null;
    }

    return {
      clusterId,
      coordinates: [longitude, latitude],
      expansionZoom: tree.getClusterExpansionZoom(clusterId),
      kind: "cluster",
      metrics: getMetricsFromProperties(feature.properties, metricKeys),
      pointCount,
      pointCountAbbreviated:
        typeof pointCountAbbreviated === "string"
          ? pointCountAbbreviated
          : compactNumberFormatter.format(pointCount),
    };
  }

  const pointId = feature.properties.pointId;

  if (typeof pointId !== "string") {
    return null;
  }

  const point = pointLookup.get(pointId);

  if (!point) {
    return null;
  }

  return {
    coordinates: [longitude, latitude],
    kind: "point",
    metrics: point.metrics,
    point,
  };
}

function getMetricsFromProperties(
  properties: InternalClusterProperties,
  metricKeys: readonly string[],
): DataDensityMetricRecord {
  const metrics: DataDensityMetricRecord = {};

  for (const metricKey of metricKeys) {
    metrics[metricKey] = readNumericMetric(properties, metricKey);
  }

  return metrics;
}

function summarizeGeoFeatures<TProperties>(
  query: GeoViewportAggregationQuery,
  features: readonly AggregatedGeoDensityFeature<TProperties>[],
  metricKeys: readonly string[],
): VisibleGeoAggregationSummary {
  const metrics = Object.fromEntries(metricKeys.map((metricKey) => [metricKey, 0]));
  let visibleClusterCount = 0;
  let visiblePointCount = 0;
  let visibleUnclusteredCount = 0;

  for (const feature of features) {
    if (feature.kind === "cluster") {
      visibleClusterCount += 1;
      visiblePointCount += feature.pointCount;

      for (const metricKey of metricKeys) {
        metrics[metricKey] += feature.metrics[metricKey] ?? 0;
      }

      continue;
    }

    visiblePointCount += 1;
    visibleUnclusteredCount += 1;

    for (const metricKey of metricKeys) {
      metrics[metricKey] += feature.metrics[metricKey] ?? 0;
    }
  }

  return {
    bounds: query.bounds,
    metrics,
    visibleClusterCount,
    visiblePointCount,
    visibleUnclusteredCount,
    zoom: query.zoom,
  };
}

function readItemId<TItem>(item: TItem, index: number) {
  if (isRecord(item) && isStringOrNumber(item.id)) {
    return item.id;
  }

  return index;
}

function readItemMetrics<TItem>(item: TItem) {
  if (isRecord(item) && isRecord(item.metrics)) {
    return item.metrics as DataDensityMetricRecord;
  }

  return undefined;
}

function readNumericMetric(
  properties: Record<string, number | string | boolean | undefined>,
  metricKey: string,
) {
  const value = properties[metricKey];

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(Math.floor(value), min), max);
}

function isStringOrNumber(value: unknown): value is string | number {
  return typeof value === "string" || typeof value === "number";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
