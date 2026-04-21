"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  GeoJSONSource,
  HeatmapLayerSpecification,
  Map as MaplibreMap,
  StyleSpecification,
} from "maplibre-gl";

import {
  createPointAggregationIndex,
  getBoundsFromPoints,
  type AggregatedMapFeature,
  type IndexedMapPoint,
  type MapPoint,
  type MapPointFilter,
  type PointAggregationIndexOptions,
  type ViewportAggregationQuery,
} from "./aggregation";
import { defaultRasterMapStyle, type MapViewState } from "./clustered-map";

const HEAT_MAP_SOURCE_ID = "moritzbrantner-maps-heat-source";
const HEAT_MAP_LAYER_ID = "moritzbrantner-maps-heat-layer";
const HEAT_MAP_WEIGHT_METRIC = "__moritzbrantnerHeatMapWeight";

export type HeatMapWeightAccessor<TProperties = Record<string, unknown>> = (
  point: IndexedMapPoint<TProperties>,
) => number;

export type HeatMapColorStop = readonly [density: number, color: string];

export type HeatMapRadius =
  | number
  | {
      max: number;
      maxZoom?: number;
      min: number;
      minZoom?: number;
    };

export type HeatMapFeatureProperties = {
  kind: "heat-cluster" | "heat-point";
  label: string;
  pointId: string;
  pointCount: number;
  rawWeight: number;
  weight: number;
} & Record<string, number | string>;

export type HeatMapFeature = {
  geometry: {
    coordinates: [longitude: number, latitude: number];
    type: "Point";
  };
  properties: HeatMapFeatureProperties;
  type: "Feature";
};

export type HeatMapFeatureCollection = {
  features: HeatMapFeature[];
  type: "FeatureCollection";
};

export type HeatMapWeightOptions<TProperties = Record<string, unknown>> = {
  filterPoint?: MapPointFilter<TProperties>;
  getWeight?: HeatMapWeightAccessor<TProperties>;
  maxWeight?: number;
  weightMetric?: string;
};

export type HeatMapDensityIndexOptions<TProperties = Record<string, unknown>> =
  HeatMapWeightOptions<TProperties> & {
    maxZoom?: PointAggregationIndexOptions<TProperties>["maxZoom"];
    minZoom?: PointAggregationIndexOptions<TProperties>["minZoom"];
    radius?: PointAggregationIndexOptions<TProperties>["radius"];
  };

export type HeatMapDensityIndex = {
  getFeatureCollection(query: ViewportAggregationQuery): HeatMapFeatureCollection;
  maxWeight: number;
  pointCount: number;
};

export type HeatMapProps<TProperties = Record<string, unknown>> =
  HeatMapWeightOptions<TProperties> & {
    className?: string;
    fitBoundsPadding?: number;
    fitToData?: boolean;
    heatmapAggregationMaxZoom?: PointAggregationIndexOptions<TProperties>["maxZoom"];
    heatmapAggregationMinZoom?: PointAggregationIndexOptions<TProperties>["minZoom"];
    heatmapAggregationRadius?: PointAggregationIndexOptions<TProperties>["radius"];
    heatmapColorRamp?: readonly HeatMapColorStop[];
    heatmapIntensity?: number;
    heatmapMaxZoom?: number;
    heatmapOpacity?: number;
    heatmapRadius?: HeatMapRadius;
    initialViewState?: MapViewState;
    mapLabel?: string;
    mapStyle?: string | StyleSpecification;
    onMapReady?: (map: MaplibreMap) => void;
    points: readonly MapPoint<TProperties>[];
    showAttributionControl?: boolean;
    style?: React.CSSProperties;
  };

const defaultHeatMapColorRamp = [
  [0, "rgba(15, 23, 42, 0)"],
  [0.15, "#67e8f9"],
  [0.35, "#22c55e"],
  [0.58, "#fde047"],
  [0.78, "#fb923c"],
  [1, "#dc2626"],
] as const satisfies readonly HeatMapColorStop[];

export function HeatMap<TProperties = Record<string, unknown>>({
  className,
  filterPoint,
  fitBoundsPadding = 56,
  fitToData = true,
  heatmapAggregationMaxZoom,
  heatmapAggregationMinZoom,
  heatmapAggregationRadius = 56,
  getWeight,
  heatmapColorRamp = defaultHeatMapColorRamp,
  heatmapIntensity = 1,
  heatmapMaxZoom = 16,
  heatmapOpacity = 0.84,
  heatmapRadius = {
    max: 42,
    min: 12,
  },
  initialViewState,
  mapLabel = "Interactive heat map",
  mapStyle = defaultRasterMapStyle,
  maxWeight,
  onMapReady,
  points,
  showAttributionControl = true,
  style,
  weightMetric,
}: HeatMapProps<TProperties>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const [isReady, setIsReady] = useState(false);
  const deferredPoints = useDeferredValue(points);
  const densityIndex = useMemo(
    () =>
      createHeatMapDensityIndex(deferredPoints, {
        filterPoint,
        getWeight,
        maxZoom: heatmapAggregationMaxZoom ?? heatmapMaxZoom,
        maxWeight,
        minZoom: heatmapAggregationMinZoom,
        radius: heatmapAggregationRadius,
        weightMetric,
      }),
    [
      deferredPoints,
      filterPoint,
      getWeight,
      heatmapAggregationMaxZoom,
      heatmapAggregationMinZoom,
      heatmapAggregationRadius,
      heatmapMaxZoom,
      maxWeight,
      weightMetric,
    ],
  );

  const syncSource = useEffectEvent(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const source = map.getSource(HEAT_MAP_SOURCE_ID) as GeoJSONSource | undefined;

    if (!source) {
      return;
    }

    const bounds = map.getBounds();
    const query: ViewportAggregationQuery = {
      bounds: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom: map.getZoom(),
    };

    source.setData(densityIndex.getFeatureCollection(query));
  });

  const handleMapReady = useEffectEvent((map: MaplibreMap) => {
    setIsReady(true);
    startTransition(() => {
      onMapReady?.(map);
    });
  });

  useEffect(() => {
    let isCancelled = false;
    let localMap: MaplibreMap | null = null;

    async function initializeMap() {
      if (!containerRef.current) {
        return;
      }

      const maplibre = await import("maplibre-gl");

      if (isCancelled || !containerRef.current) {
        return;
      }

      localMap = new maplibre.Map({
        attributionControl: showAttributionControl ? undefined : false,
        container: containerRef.current,
        center: initialViewState?.center ?? [12, 25],
        style: mapStyle,
        zoom: initialViewState?.zoom ?? 1.6,
      });
      mapRef.current = localMap;
      localMap.addControl(new maplibre.NavigationControl(), "top-right");

      localMap.on("load", () => {
        if (!localMap || localMap.getSource(HEAT_MAP_SOURCE_ID)) {
          return;
        }

        localMap.addSource(HEAT_MAP_SOURCE_ID, {
          type: "geojson",
          data: createEmptyHeatMapFeatureCollection(),
        });
        localMap.addLayer({
          id: HEAT_MAP_LAYER_ID,
          maxzoom: heatmapMaxZoom,
          paint: createHeatMapPaint({
            colorRamp: heatmapColorRamp,
            intensity: heatmapIntensity,
            opacity: heatmapOpacity,
            radius: heatmapRadius,
          }),
          source: HEAT_MAP_SOURCE_ID,
          type: "heatmap",
        });

        syncSource();
        handleMapReady(localMap);
      });

      localMap.on("moveend", syncSource);
    }

    initializeMap();

    return () => {
      isCancelled = true;
      setIsReady(false);

      if (localMap) {
        localMap.remove();
      }

      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (fitToData && !initialViewState) {
      const dataBounds = getBoundsFromPoints(deferredPoints);

      if (dataBounds) {
        map.fitBounds(
          [
            [dataBounds[0], dataBounds[1]],
            [dataBounds[2], dataBounds[3]],
          ],
          {
            duration: 0,
            padding: fitBoundsPadding,
          },
        );
      }
    }

    syncSource();
  }, [deferredPoints, densityIndex, fitBoundsPadding, fitToData, initialViewState, syncSource]);

  return (
    <div
      aria-label={mapLabel}
      className={joinClassNames("mb-maps", className)}
      data-map-ready={isReady ? "true" : "false"}
      style={{
        minHeight: 480,
        width: "100%",
        ...style,
      }}
    >
      <div ref={containerRef} className="mb-maps__canvas" />
    </div>
  );
}

export function createHeatMapFeatureCollection<TProperties = Record<string, unknown>>(
  points: readonly MapPoint<TProperties>[],
  options: HeatMapWeightOptions<TProperties> = {},
): HeatMapFeatureCollection {
  const indexedPoints = points
    .map(toIndexedMapPoint)
    .filter(isValidHeatMapPoint)
    .filter((point) => options.filterPoint?.(point) ?? true);
  const rawWeights = indexedPoints.map((point) => resolveHeatMapPointWeight(point, options));
  const effectiveMaxWeight = getEffectiveMaxWeight(rawWeights, options.maxWeight);
  const features = indexedPoints
    .map((point, index) => {
      const rawWeight = rawWeights[index] ?? 0;

      if (rawWeight <= 0) {
        return null;
      }

      return {
        geometry: {
          coordinates: [point.longitude, point.latitude] as [number, number],
          type: "Point" as const,
        },
        properties: {
          ...point.metrics,
          kind: "heat-point" as const,
          label: point.label,
          pointId: point.id,
          pointCount: 1,
          rawWeight,
          weight: clamp(rawWeight / effectiveMaxWeight, 0, 1),
        },
        type: "Feature" as const,
      };
    })
    .filter(isDefined);

  return {
    features,
    type: "FeatureCollection",
  };
}

export function createHeatMapDensityIndex<TProperties = Record<string, unknown>>(
  points: readonly MapPoint<TProperties>[],
  options: HeatMapDensityIndexOptions<TProperties> = {},
): HeatMapDensityIndex {
  const weightedPoints = points
    .map(toIndexedMapPoint)
    .filter(isValidHeatMapPoint)
    .filter((point) => options.filterPoint?.(point) ?? true)
    .map((point) => ({
      point,
      rawWeight: resolveHeatMapPointWeight(point, options),
    }))
    .filter((entry) => entry.rawWeight > 0);
  const effectiveMaxWeight = getEffectiveMaxWeight(
    weightedPoints.map((entry) => entry.rawWeight),
    options.maxWeight,
  );
  const index = createPointAggregationIndex(
    weightedPoints.map(({ point, rawWeight }) => ({
      id: point.id,
      label: point.label,
      latitude: point.latitude,
      longitude: point.longitude,
      metrics: {
        ...point.metrics,
        [HEAT_MAP_WEIGHT_METRIC]: rawWeight,
      },
      properties: point.properties,
    })),
    {
      maxZoom: options.maxZoom,
      minZoom: options.minZoom,
      radius: options.radius,
    },
  );

  return {
    getFeatureCollection(query) {
      return createHeatMapFeatureCollectionFromAggregates(
        index.getViewportAggregation(query).features,
        effectiveMaxWeight,
      );
    },
    maxWeight: effectiveMaxWeight,
    pointCount: weightedPoints.length,
  };
}

export function getHeatMapMaxWeight<TProperties = Record<string, unknown>>(
  points: readonly MapPoint<TProperties>[],
  options: Omit<HeatMapWeightOptions<TProperties>, "maxWeight"> = {},
) {
  return Math.max(
    0,
    ...points
      .map(toIndexedMapPoint)
      .filter(isValidHeatMapPoint)
      .filter((point) => options.filterPoint?.(point) ?? true)
      .map((point) => resolveHeatMapPointWeight(point, options)),
  );
}

export function resolveHeatMapPointWeight<TProperties = Record<string, unknown>>(
  point: IndexedMapPoint<TProperties>,
  options: Omit<HeatMapWeightOptions<TProperties>, "maxWeight"> = {},
) {
  const rawWeight = getRawHeatMapPointWeight(point, options);

  if (!Number.isFinite(rawWeight)) {
    return 0;
  }

  return Math.max(0, rawWeight);
}

function createEmptyHeatMapFeatureCollection(): HeatMapFeatureCollection {
  return {
    features: [],
    type: "FeatureCollection",
  };
}

function createHeatMapFeatureCollectionFromAggregates<TProperties>(
  features: readonly AggregatedMapFeature<TProperties>[],
  effectiveMaxWeight: number,
): HeatMapFeatureCollection {
  return {
    features: features
      .map((feature) => createHeatMapFeatureFromAggregate(feature, effectiveMaxWeight))
      .filter(isDefined),
    type: "FeatureCollection",
  };
}

function createHeatMapFeatureFromAggregate<TProperties>(
  feature: AggregatedMapFeature<TProperties>,
  effectiveMaxWeight: number,
): HeatMapFeature | null {
  const rawWeight = feature.metrics[HEAT_MAP_WEIGHT_METRIC] ?? 0;

  if (rawWeight <= 0) {
    return null;
  }

  return {
    geometry: {
      coordinates: feature.coordinates,
      type: "Point",
    },
    properties: {
      ...copyPublicHeatMapMetrics(feature.metrics),
      kind: feature.kind === "cluster" ? "heat-cluster" : "heat-point",
      label:
        feature.kind === "cluster"
          ? feature.pointCountAbbreviated
          : feature.point.label,
      pointId:
        feature.kind === "cluster"
          ? `cluster-${feature.clusterId}`
          : feature.point.id,
      pointCount: feature.kind === "cluster" ? feature.pointCount : 1,
      rawWeight,
      weight: Math.max(0, rawWeight / effectiveMaxWeight),
    },
    type: "Feature",
  };
}

function copyPublicHeatMapMetrics(metrics: Record<string, number>) {
  return Object.fromEntries(
    Object.entries(metrics).filter(([metricKey]) => metricKey !== HEAT_MAP_WEIGHT_METRIC),
  );
}

function getRawHeatMapPointWeight<TProperties>(
  point: IndexedMapPoint<TProperties>,
  options: Omit<HeatMapWeightOptions<TProperties>, "maxWeight">,
) {
  if (options.getWeight) {
    return options.getWeight(point);
  }

  if (options.weightMetric) {
    return point.metrics[options.weightMetric] ?? 0;
  }

  return point.metrics.weight ?? 1;
}

function createHeatMapPaint({
  colorRamp,
  intensity,
  opacity,
  radius,
}: {
  colorRamp: readonly HeatMapColorStop[];
  intensity: number;
  opacity: number;
  radius: HeatMapRadius;
}) {
  return {
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      ...colorRamp.flatMap(([density, color]) => [density, color]),
    ],
    "heatmap-intensity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      0,
      Math.max(0, intensity * 0.55),
      9,
      Math.max(0, intensity),
    ],
    "heatmap-opacity": clamp(opacity, 0, 1),
    "heatmap-radius": createHeatMapRadiusExpression(radius),
    "heatmap-weight": ["get", "weight"],
  } as NonNullable<HeatmapLayerSpecification["paint"]>;
}

function createHeatMapRadiusExpression(radius: HeatMapRadius) {
  if (typeof radius === "number") {
    return Math.max(0, radius);
  }

  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    radius.minZoom ?? 0,
    Math.max(0, radius.min),
    radius.maxZoom ?? 9,
    Math.max(0, radius.max),
  ];
}

function getEffectiveMaxWeight(rawWeights: readonly number[], maxWeight: number | undefined) {
  if (Number.isFinite(maxWeight) && (maxWeight ?? 0) > 0) {
    return maxWeight!;
  }

  return Math.max(1, ...rawWeights);
}

function toIndexedMapPoint<TProperties>(
  point: MapPoint<TProperties>,
  index: number,
): IndexedMapPoint<TProperties> {
  return {
    id: String(point.id ?? index),
    label: point.label ?? "",
    latitude: point.latitude,
    longitude: point.longitude,
    metrics: point.metrics ?? {},
    properties: point.properties ?? ({} as TProperties),
  };
}

function isValidHeatMapPoint<TProperties>(point: IndexedMapPoint<TProperties>) {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function joinClassNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}
