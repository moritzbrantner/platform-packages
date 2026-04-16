import Supercluster from "supercluster";

export type MapMetricRecord = Record<string, number>;

export type MapPoint<TProperties = Record<string, unknown>> = {
  id?: string | number;
  latitude: number;
  longitude: number;
  label?: string;
  metrics?: MapMetricRecord;
  properties?: TProperties;
};

export type AggregatedMapPoint<TProperties = Record<string, unknown>> = {
  kind: "point";
  coordinates: [longitude: number, latitude: number];
  metrics: MapMetricRecord;
  point: IndexedMapPoint<TProperties>;
};

export type AggregatedMapCluster = {
  kind: "cluster";
  clusterId: number;
  coordinates: [longitude: number, latitude: number];
  expansionZoom: number;
  metrics: MapMetricRecord;
  pointCount: number;
  pointCountAbbreviated: string;
};

export type AggregatedMapFeature<TProperties = Record<string, unknown>> =
  | AggregatedMapCluster
  | AggregatedMapPoint<TProperties>;

export type ViewportAggregationQuery = {
  bounds: [west: number, south: number, east: number, north: number];
  zoom: number;
};

export type VisibleAggregationSummary = {
  bounds: ViewportAggregationQuery["bounds"];
  metrics: MapMetricRecord;
  visibleClusterCount: number;
  visiblePointCount: number;
  visibleUnclusteredCount: number;
  zoom: number;
};

export type ViewportAggregation<TProperties = Record<string, unknown>> = {
  features: AggregatedMapFeature<TProperties>[];
  summary: VisibleAggregationSummary;
};

export type PointAggregationIndexOptions = {
  extent?: number;
  maxZoom?: number;
  minZoom?: number;
  radius?: number;
};

export type IndexedMapPoint<TProperties = Record<string, unknown>> = Required<
  MapPoint<TProperties>
> & {
  id: string;
};

type InternalMetricProperties = {
  pointId: string;
} & Record<string, number | string>;

type InternalPoint<TProperties> = IndexedMapPoint<TProperties>;

type InternalClusterProperties = Record<string, number | string | boolean | undefined> & {
  cluster?: boolean;
  cluster_id?: number;
  pointId?: string;
  point_count?: number;
  point_count_abbreviated?: string;
};

type GeoJsonPointFeature = {
  type: "Feature";
  properties: InternalMetricProperties;
  geometry: {
    type: "Point";
    coordinates: [longitude: number, latitude: number];
  };
};

const compactNumberFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
  notation: "compact",
});

export type PointAggregationIndex<TProperties = Record<string, unknown>> = {
  getClusterExpansionZoom(clusterId: number): number;
  getClusterLeaves(
    clusterId: number,
    limit?: number,
    offset?: number,
  ): Array<IndexedMapPoint<TProperties>>;
  getPointById(pointId: string): IndexedMapPoint<TProperties> | null;
  getViewportAggregation(
    query: ViewportAggregationQuery,
  ): ViewportAggregation<TProperties>;
};

export function createPointAggregationIndex<TProperties = Record<string, unknown>>(
  points: readonly MapPoint<TProperties>[],
  options: PointAggregationIndexOptions = {},
): PointAggregationIndex<TProperties> {
  const normalizedPoints = points.map((point, index) => normalizePoint(point, index));
  const pointLookup = new Map(normalizedPoints.map((point) => [point.id, point]));
  const metricKeys = collectMetricKeys(normalizedPoints);
  const tree = new Supercluster<
    InternalMetricProperties,
    InternalClusterProperties
  >({
    extent: options.extent ?? 512,
    maxZoom: options.maxZoom ?? 16,
    minZoom: options.minZoom ?? 0,
    radius: options.radius ?? 72,
    map: (properties) => mapProperties(properties, metricKeys),
    reduce: (accumulated, properties) => {
      for (const metricKey of metricKeys) {
        accumulated[metricKey] =
          readNumericMetric(accumulated, metricKey) +
          readNumericMetric(properties, metricKey);
      }
    },
  });

  tree.load(
    normalizedPoints.map((point) => ({
      type: "Feature",
      properties: {
        pointId: point.id,
        ...point.metrics,
      },
      geometry: {
        type: "Point",
        coordinates: [point.longitude, point.latitude],
      },
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
        .filter((point): point is InternalPoint<TProperties> => Boolean(point));
    },

    getPointById(pointId) {
      return pointLookup.get(pointId) ?? null;
    },

    getViewportAggregation(query) {
      const rawFeatures = getFeaturesForBounds(tree, query.bounds, query.zoom);
      const features = rawFeatures
        .map((feature) => toAggregatedFeature(feature, pointLookup, metricKeys, tree))
        .filter((feature): feature is AggregatedMapFeature<TProperties> => Boolean(feature));

      return {
        features,
        summary: summarizeFeatures(query, features, metricKeys),
      };
    },
  };
}

export function getBoundsFromPoints<TProperties = Record<string, unknown>>(
  points: readonly MapPoint<TProperties>[],
): [west: number, south: number, east: number, north: number] | null {
  if (points.length === 0) {
    return null;
  }

  let west = Number.POSITIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    west = Math.min(west, point.longitude);
    south = Math.min(south, point.latitude);
    east = Math.max(east, point.longitude);
    north = Math.max(north, point.latitude);
  }

  return [west, south, east, north];
}

function normalizePoint<TProperties>(
  point: MapPoint<TProperties>,
  index: number,
): InternalPoint<TProperties> {
  return {
    id: String(point.id ?? index),
    label: point.label ?? "",
    latitude: point.latitude,
    longitude: point.longitude,
    metrics: normalizeMetrics(point.metrics),
    properties: point.properties ?? ({} as TProperties),
  };
}

function normalizeMetrics(metrics: MapMetricRecord | undefined): MapMetricRecord {
  if (!metrics) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metrics).filter((entry): entry is [string, number] =>
      Number.isFinite(entry[1]),
    ),
  );
}

function collectMetricKeys<TProperties>(
  points: readonly InternalPoint<TProperties>[],
): string[] {
  const metricKeys = new Set<string>();

  for (const point of points) {
    for (const metricKey of Object.keys(point.metrics)) {
      metricKeys.add(metricKey);
    }
  }

  return Array.from(metricKeys).sort((left, right) => left.localeCompare(right));
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
  bounds: ViewportAggregationQuery["bounds"],
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

function toAggregatedFeature<TProperties>(
  feature: GeoJsonPointFeature | ReturnType<
    Supercluster<InternalMetricProperties, InternalClusterProperties>["getClusters"]
  >[number],
  pointLookup: Map<string, InternalPoint<TProperties>>,
  metricKeys: readonly string[],
  tree: Supercluster<InternalMetricProperties, InternalClusterProperties>,
): AggregatedMapFeature<TProperties> | null {
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
      kind: "cluster",
      clusterId,
      coordinates: [longitude, latitude],
      expansionZoom: tree.getClusterExpansionZoom(clusterId),
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
    kind: "point",
    coordinates: [longitude, latitude],
    metrics: point.metrics,
    point,
  };
}

function getMetricsFromProperties(
  properties: InternalClusterProperties,
  metricKeys: readonly string[],
): MapMetricRecord {
  const metrics: MapMetricRecord = {};

  for (const metricKey of metricKeys) {
    metrics[metricKey] = readNumericMetric(properties, metricKey);
  }

  return metrics;
}

function readNumericMetric(
  properties: Record<string, number | string | boolean | undefined>,
  metricKey: string,
) {
  const value = properties[metricKey];

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function summarizeFeatures<TProperties>(
  query: ViewportAggregationQuery,
  features: readonly AggregatedMapFeature<TProperties>[],
  metricKeys: readonly string[],
): VisibleAggregationSummary {
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
