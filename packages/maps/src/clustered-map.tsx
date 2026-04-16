"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
} from "react";
import type {
  GeoJSONSource,
  Map,
  MapGeoJSONFeature,
  StyleSpecification,
} from "maplibre-gl";

import {
  createPointAggregationIndex,
  getBoundsFromPoints,
  type AggregatedMapFeature,
  type MapPoint,
  type PointAggregationIndexOptions,
  type ViewportAggregationQuery,
  type VisibleAggregationSummary,
} from "./aggregation";

const SOURCE_ID = "moritzbrantner-maps-source";
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
  mapStyle?: string | StyleSpecification;
  maxZoom?: PointAggregationIndexOptions["maxZoom"];
  minZoom?: PointAggregationIndexOptions["minZoom"];
  onFeatureSelect?: (feature: AggregatedMapFeature<TProperties> | null) => void;
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
  mapStyle = defaultRasterMapStyle,
  maxZoom,
  minZoom,
  onFeatureSelect,
  onViewportAggregationChange,
  points,
  showAttributionControl = true,
  style,
}: ClusteredMapProps<TProperties>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
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

    source.setData(toFeatureCollection(aggregation.features));
    startTransition(() => {
      onViewportAggregationChange?.(aggregation.summary);
    });
  });

  const handleClick = useEffectEvent((feature: AggregatedMapFeature<TProperties> | null) => {
    startTransition(() => {
      onFeatureSelect?.(feature);
    });
  });

  useEffect(() => {
    let isCancelled = false;
    let localMap: Map | null = null;

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
          data: toFeatureCollection([]),
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
      });

      localMap.on("moveend", syncSource);
      localMap.on("click", (event) => {
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

      if (localMap) {
        localMap.remove();
      }

      mapRef.current = null;
    };
  }, [initialViewState, mapStyle, showAttributionControl]);

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
  }, [deferredPoints, fitBoundsPadding, fitToData, initialViewState, index, syncSource]);

  return (
    <div
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
) {
  return {
    type: "FeatureCollection" as const,
    features: features.map((feature) => ({
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
  };
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
