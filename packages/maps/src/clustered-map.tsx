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
  Map as MaplibreMap,
  MapMouseEvent,
  MapGeoJSONFeature,
  StyleSpecification,
} from "maplibre-gl";

import {
  createPointAggregationIndex,
  getBoundsFromPoints,
  type AggregatedMapFeature,
  type AggregatedMapCluster,
  type MapPoint,
  type PointAggregationIndexOptions,
  type ViewportAggregationQuery,
  type VisibleAggregationSummary,
} from "./aggregation";
import {
  createClusterAreaRing,
  createClusterVoronoiBoundarySegments,
  createClusterVoronoiCells,
} from "./cluster-area";

const SOURCE_ID = "moritzbrantner-maps-source";
const CLUSTER_AREA_FILL_LAYER_ID = "moritzbrantner-maps-cluster-area-fill";
const CLUSTER_AREA_LINE_LAYER_ID = "moritzbrantner-maps-cluster-area-line";
const CLUSTER_LAYER_ID = "moritzbrantner-maps-clusters";
const CLUSTER_COUNT_LAYER_ID = "moritzbrantner-maps-cluster-count";
const POINT_LAYER_ID = "moritzbrantner-maps-points";

export type MapViewState = {
  center: [longitude: number, latitude: number];
  zoom: number;
};

export type ClusteredMapProps<TProperties = Record<string, unknown>> = {
  className?: string;
  clusterRadius?: PointAggregationIndexOptions["radius"];
  fitBoundsPadding?: number;
  fitToData?: boolean;
  initialViewState?: MapViewState;
  mapLabel?: string;
  mapStyle?: string | StyleSpecification;
  maxZoom?: PointAggregationIndexOptions["maxZoom"];
  minZoom?: PointAggregationIndexOptions["minZoom"];
  onFeatureSelect?: (feature: AggregatedMapFeature<TProperties> | null) => void;
  onMapReady?: (map: MaplibreMap) => void;
  onViewportAggregationChange?: (summary: VisibleAggregationSummary) => void;
  points: readonly MapPoint<TProperties>[];
  showAttributionControl?: boolean;
  style?: React.CSSProperties;
};

export const defaultRasterMapStyle: StyleSpecification = {
  version: 8,
  sources: {
    openstreetmap: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "\u00a9 OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "openstreetmap",
      type: "raster",
      source: "openstreetmap",
    },
  ],
};

export function ClusteredMap<TProperties = Record<string, unknown>>({
  className,
  clusterRadius,
  fitBoundsPadding = 56,
  fitToData = true,
  initialViewState,
  mapLabel = "Interactive map",
  mapStyle = defaultRasterMapStyle,
  maxZoom,
  minZoom,
  onFeatureSelect,
  onMapReady,
  onViewportAggregationChange,
  points,
  showAttributionControl = true,
  style,
}: ClusteredMapProps<TProperties>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const lastViewportSummaryKeyRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const deferredPoints = useDeferredValue(points);
  const index = useMemo(
    () =>
      createPointAggregationIndex(deferredPoints, {
        maxZoom,
        minZoom,
        radius: clusterRadius,
      }),
    [clusterRadius, deferredPoints, maxZoom, minZoom],
  );

  const syncSource = useEffectEvent(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;

    if (!source) {
      return;
    }

    const bounds = map.getBounds();
    const query: ViewportAggregationQuery = {
      bounds: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom: map.getZoom(),
    };
    const aggregation = index.getViewportAggregation(query);

    source.setData(toFeatureCollection(aggregation.features, index, query.bounds));
    const nextSummaryKey = serializeVisibleAggregationSummary(aggregation.summary);

    if (lastViewportSummaryKeyRef.current === nextSummaryKey) {
      return;
    }

    lastViewportSummaryKeyRef.current = nextSummaryKey;
    startTransition(() => {
      onViewportAggregationChange?.(aggregation.summary);
    });
  });

  const handleClick = useEffectEvent((feature: AggregatedMapFeature<TProperties> | null) => {
    startTransition(() => {
      onFeatureSelect?.(feature);
    });
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
        if (!localMap || localMap.getSource(SOURCE_ID)) {
          return;
        }

        localMap.addSource(SOURCE_ID, {
          type: "geojson",
          data: toFeatureCollection([], undefined, [-180, -85, 180, 85]),
        });
        localMap.addLayer({
          id: CLUSTER_AREA_FILL_LAYER_ID,
          type: "fill",
          source: SOURCE_ID,
          filter: ["==", ["get", "kind"], "cluster-area"],
          paint: {
            "fill-color": [
              "step",
              ["get", "pointCount"],
              "#0f766e",
              25,
              "#0284c7",
              250,
              "#7c3aed",
              2_500,
              "#ea580c",
            ],
            "fill-opacity": 0.1,
          },
        });
        localMap.addLayer({
          id: CLUSTER_AREA_LINE_LAYER_ID,
          type: "line",
          source: SOURCE_ID,
          filter: ["==", ["get", "kind"], "cluster-area-boundary"],
          paint: {
            "line-color": [
              "step",
              ["get", "pointCount"],
              "#115e59",
              25,
              "#0369a1",
              250,
              "#6d28d9",
              2_500,
              "#c2410c",
            ],
            "line-opacity": 0.45,
            "line-width": 2,
            "line-dasharray": [2, 1.5],
          },
        });
        localMap.addLayer({
          id: CLUSTER_LAYER_ID,
          type: "circle",
          source: SOURCE_ID,
          filter: ["==", ["get", "kind"], "cluster"],
          paint: {
            "circle-color": [
              "step",
              ["get", "pointCount"],
              "#0f766e",
              25,
              "#0284c7",
              250,
              "#7c3aed",
              2_500,
              "#ea580c",
            ],
            "circle-opacity": 0.9,
            "circle-radius": [
              "step",
              ["get", "pointCount"],
              18,
              25,
              24,
              250,
              32,
              2_500,
              42,
            ],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
          },
        });
        localMap.addLayer({
          id: CLUSTER_COUNT_LAYER_ID,
          type: "symbol",
          source: SOURCE_ID,
          filter: ["==", ["get", "kind"], "cluster"],
          layout: {
            "text-field": ["get", "pointCountAbbreviated"],
            "text-size": 12,
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          },
          paint: {
            "text-color": "#ffffff",
          },
        });
        localMap.addLayer({
          id: POINT_LAYER_ID,
          type: "circle",
          source: SOURCE_ID,
          filter: ["==", ["get", "kind"], "point"],
          paint: {
            "circle-color": "#0f172a",
            "circle-opacity": 0.75,
            "circle-radius": 5,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1.5,
          },
        });

        syncSource();
        handleMapReady(localMap);
      });

      localMap.on("moveend", syncSource);
      localMap.on("click", (event: MapMouseEvent) => {
        const renderedFeatures = localMap?.queryRenderedFeatures(event.point, {
          layers: [CLUSTER_LAYER_ID, POINT_LAYER_ID],
        });
        const selectedFeature = renderedFeatures?.[0]
          ? resolveRenderedFeature(renderedFeatures[0], index)
          : null;

        if (!selectedFeature) {
          handleClick(null);
          return;
        }

        if (selectedFeature.kind === "cluster") {
          localMap?.easeTo({
            center: selectedFeature.coordinates,
            zoom: selectedFeature.expansionZoom,
          });
          handleClick(selectedFeature);
          return;
        }

        handleClick(selectedFeature);
      });
      localMap.on("mouseenter", CLUSTER_LAYER_ID, () => {
        if (localMap) {
          localMap.getCanvas().style.cursor = "pointer";
        }
      });
      localMap.on("mouseenter", POINT_LAYER_ID, () => {
        if (localMap) {
          localMap.getCanvas().style.cursor = "pointer";
        }
      });
      localMap.on("mouseleave", CLUSTER_LAYER_ID, () => {
        if (localMap) {
          localMap.getCanvas().style.cursor = "";
        }
      });
      localMap.on("mouseleave", POINT_LAYER_ID, () => {
        if (localMap) {
          localMap.getCanvas().style.cursor = "";
        }
      });
    }

    initializeMap();

    return () => {
      isCancelled = true;
      lastViewportSummaryKeyRef.current = null;
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
  }, [deferredPoints, fitBoundsPadding, fitToData, index, syncSource]);

  return (
    <div
      aria-label={mapLabel}
      data-map-ready={isReady ? "true" : "false"}
      className={joinClassNames("mb-maps", className)}
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

function joinClassNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

function toFeatureCollection<TProperties>(
  features: readonly AggregatedMapFeature<TProperties>[],
  index?: ReturnType<typeof createPointAggregationIndex<TProperties>>,
  bounds: [number, number, number, number] = [-180, -85, 180, 85],
) {
  const clusterFeatures = features.filter(
    (feature): feature is AggregatedMapCluster => feature.kind === "cluster",
  );
  const areaFeatures = index
    ? createClusterAreaFeatures(clusterFeatures, index, bounds)
    : [];

  return {
    type: "FeatureCollection" as const,
    features: [
      ...areaFeatures,
      ...features.map((feature) => ({
        type: "Feature" as const,
        properties:
          feature.kind === "cluster"
            ? {
                kind: "cluster",
                clusterId: feature.clusterId,
                pointCount: feature.pointCount,
                pointCountAbbreviated: feature.pointCountAbbreviated,
                ...feature.metrics,
              }
            : {
                kind: "point",
                pointId: feature.point.id,
                label: feature.point.label,
                ...feature.metrics,
              },
        geometry: {
          type: "Point" as const,
          coordinates: feature.coordinates,
        },
      })),
    ],
  };
}

function createClusterAreaFeatures<TProperties>(
  clusterFeatures: readonly AggregatedMapCluster[],
  index: ReturnType<typeof createPointAggregationIndex<TProperties>>,
  bounds: [number, number, number, number],
) {
  const drafts = clusterFeatures
    .map((feature) => createClusterAreaDraft(feature, index))
    .filter(isDefined);

  const boundaryInputs = drafts.map((draft) => ({
    boundary: draft.baseRing,
    clusterId: draft.feature.clusterId,
    coordinates: draft.feature.coordinates,
  }));
  const clusterCells = createClusterVoronoiCells(boundaryInputs, bounds);
  const boundarySegments = createClusterVoronoiBoundarySegments(boundaryInputs, bounds);
  const draftByClusterId = new globalThis.Map<number | string, (typeof drafts)[number]>(
    drafts.map((draft) => [draft.feature.clusterId, draft] as const),
  );
  const areaFeatures = [...clusterCells.entries()]
    .map(([clusterId, ring]) => {
      const draft = draftByClusterId.get(clusterId);

      if (!draft || ring.length < 4) {
        return null;
      }

      return createClusterAreaFeature(draft.feature, ring);
    })
    .filter(isDefined);
  const boundaryFeatures = boundarySegments.map((segment) =>
    createClusterAreaBoundaryFeature(
      segment.coordinates,
      segment.clusterIndexes
        .filter((clusterIndex): clusterIndex is number => clusterIndex !== null)
        .map((clusterIndex) => drafts[clusterIndex]!.feature.pointCount),
    ),
  );

  return [...areaFeatures, ...boundaryFeatures];
}

function createClusterAreaDraft<TProperties>(
  feature: AggregatedMapCluster,
  index: ReturnType<typeof createPointAggregationIndex<TProperties>>,
) {
  const samplePoints = getClusterAreaSample(index, feature);
  const baseRing = createClusterAreaRing(samplePoints, feature.coordinates);

  if (!baseRing || baseRing.length < 4) {
    return null;
  }

  return {
    baseRing,
    feature,
  };
}

function createClusterAreaFeature(
  feature: AggregatedMapCluster,
  ring: Array<[number, number]>,
) {
  return {
    type: "Feature" as const,
    properties: {
      kind: "cluster-area",
      clusterId: feature.clusterId,
      pointCount: feature.pointCount,
    },
    geometry: {
      type: "Polygon" as const,
      coordinates: [ring],
    },
  };
}

function createClusterAreaBoundaryFeature(
  coordinates: Array<[number, number]>,
  pointCounts: readonly number[],
) {
  return {
    type: "Feature" as const,
    properties: {
      kind: "cluster-area-boundary",
      pointCount: Math.max(...pointCounts, 0),
    },
    geometry: {
      type: "LineString" as const,
      coordinates,
    },
  };
}

function getClusterAreaSample<TProperties>(
  index: ReturnType<typeof createPointAggregationIndex<TProperties>>,
  feature: AggregatedMapCluster,
) {
  const maxSamples = Math.min(feature.pointCount, 96);
  const batchSize = Math.min(maxSamples, 24);

  if (batchSize <= 0) {
    return [feature.coordinates];
  }

  const sample: Array<[number, number]> = [];
  const stride = Math.max(Math.floor(feature.pointCount / maxSamples), 1);

  for (let offset = 0; offset < feature.pointCount && sample.length < maxSamples; offset += stride * batchSize) {
    const leaves = index.getClusterLeaves(feature.clusterId, batchSize, offset);

    for (const leaf of leaves) {
      sample.push([leaf.longitude, leaf.latitude]);

      if (sample.length >= maxSamples) {
        break;
      }
    }
  }

  sample.push(feature.coordinates);

  return sample;
}

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}

function serializeVisibleAggregationSummary(summary: VisibleAggregationSummary) {
  return JSON.stringify({
    bounds: summary.bounds.map((value) => Number(value.toFixed(6))),
    metrics: Object.entries(summary.metrics)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, value]) => [key, Number(value.toFixed(6))]),
    visibleClusterCount: summary.visibleClusterCount,
    visiblePointCount: summary.visiblePointCount,
    visibleUnclusteredCount: summary.visibleUnclusteredCount,
    zoom: Number(summary.zoom.toFixed(6)),
  });
}

function resolveRenderedFeature<TProperties>(
  feature: MapGeoJSONFeature,
  index: ReturnType<typeof createPointAggregationIndex<TProperties>>,
): AggregatedMapFeature<TProperties> | null {
  if (feature.properties?.kind === "cluster") {
    const clusterId = Number(feature.properties.clusterId);

    if (!Number.isFinite(clusterId)) {
      return null;
    }

    if (feature.geometry.type !== "Point") {
      return null;
    }

    return {
      kind: "cluster",
      clusterId,
      coordinates: [
        feature.geometry.coordinates[0],
        feature.geometry.coordinates[1],
      ],
      expansionZoom: index.getClusterExpansionZoom(clusterId),
      metrics: readFeatureMetrics(feature),
      pointCount: Number(feature.properties.pointCount ?? 0),
      pointCountAbbreviated: String(
        feature.properties.pointCountAbbreviated ?? feature.properties.pointCount ?? "",
      ),
    };
  }

  const pointId = String(feature.properties?.pointId ?? "");
  const point = index.getPointById(pointId);

  if (!point || feature.geometry.type !== "Point") {
    return null;
  }

  return {
    kind: "point",
    coordinates: [
      feature.geometry.coordinates[0],
      feature.geometry.coordinates[1],
    ],
    metrics: point.metrics,
    point,
  };
}

function readFeatureMetrics(feature: MapGeoJSONFeature) {
  const metrics: Record<string, number> = {};
  const reservedKeys = new Set([
    "clusterId",
    "kind",
    "pointCount",
    "pointCountAbbreviated",
    "pointId",
  ]);

  for (const [key, value] of Object.entries(feature.properties ?? {})) {
    if (!reservedKeys.has(key) && typeof value === "number" && Number.isFinite(value)) {
      metrics[key] = value;
    }
  }

  return metrics;
}
