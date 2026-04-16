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
  type MapPointFilter,
  type MapPoint,
  type PointAggregationIndex,
  type PointAggregationIndexOptions,
  type ViewportAggregationQuery,
  type VisibleAggregationSummary,
} from "./aggregation";
import {
  createProjectedClusterVoronoiGeometry,
} from "./cluster-area";
import {
  assignClusterAreaColors,
  createBoundaryLineColor,
  createClusterAreaSubjects,
  getClusterAreaId,
} from "./cluster-area-visuals";

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
  filterPoint?: MapPointFilter<TProperties>;
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
  filterPoint,
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
        filterPoint,
        maxZoom,
        minZoom,
        radius: clusterRadius,
      }),
    [clusterRadius, deferredPoints, filterPoint, maxZoom, minZoom],
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

    source.setData(toFeatureCollection(aggregation.features, index, map));
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
          data: toFeatureCollection([]),
        });
        localMap.addLayer({
          id: CLUSTER_AREA_FILL_LAYER_ID,
          type: "fill",
          source: SOURCE_ID,
          filter: ["==", ["get", "kind"], "cluster-area"],
          paint: {
            "fill-color": [
              "coalesce",
              ["get", "clusterColor"],
              "#2563eb",
            ],
            "fill-opacity": 0.56,
          },
        });
        localMap.addLayer({
          id: CLUSTER_AREA_LINE_LAYER_ID,
          type: "line",
          source: SOURCE_ID,
          filter: ["==", ["get", "kind"], "cluster-area-boundary"],
          paint: {
            "line-color": [
              "coalesce",
              ["get", "lineColor"],
              "#0f172a",
            ],
            "line-opacity": 0.9,
            "line-width": 2,
          },
        });
        localMap.addLayer({
          id: CLUSTER_LAYER_ID,
          type: "circle",
          source: SOURCE_ID,
          filter: ["==", ["get", "kind"], "cluster"],
          paint: {
            "circle-color": [
              "coalesce",
              ["get", "clusterColor"],
              [
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
            "circle-color": [
              "coalesce",
              ["get", "clusterColor"],
              "#0f172a",
            ],
            "circle-opacity": 0.92,
            "circle-radius": 6,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
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
  index?: PointAggregationIndex<TProperties>,
  map?: MaplibreMap,
) {
  const areaFeatures = index && map
    ? createClusterAreaFeatures(features, index, map)
    : { areaFeatures: [], colorsByAreaId: new Map<string, string>() };

  return {
    type: "FeatureCollection" as const,
    features: [
      ...areaFeatures.areaFeatures,
      ...features.map((feature) => ({
        type: "Feature" as const,
        properties:
          feature.kind === "cluster"
            ? {
                kind: "cluster",
                clusterId: feature.clusterId,
                clusterColor:
                  areaFeatures.colorsByAreaId.get(getClusterAreaId(feature)) ?? null,
                pointCount: feature.pointCount,
                pointCountAbbreviated: feature.pointCountAbbreviated,
                ...feature.metrics,
              }
            : {
                kind: "point",
                clusterColor:
                  areaFeatures.colorsByAreaId.get(getClusterAreaId(feature)) ?? null,
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
  features: readonly AggregatedMapFeature<TProperties>[],
  index: PointAggregationIndex<TProperties>,
  map: MaplibreMap,
) {
  const viewportWidth = map.getContainer().clientWidth;
  const viewportHeight = map.getContainer().clientHeight;

  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return { areaFeatures: [], colorsByAreaId: new Map<string, string>() };
  }

  const subjects = createClusterAreaSubjects(features, index);

  if (subjects.length === 0) {
    return { areaFeatures: [], colorsByAreaId: new Map<string, string>() };
  }

  const subjectByAreaId = new globalThis.Map(
    subjects.map((subject) => [subject.areaId, subject] as const),
  );
  const projectedInputs = subjects.flatMap((subject) =>
    subject.sampleCoordinates.map((coordinates) => ({
      clusterId: subject.areaId,
      coordinates,
    })),
  );
  const geometry = createProjectedClusterVoronoiGeometry(projectedInputs, {
    includeOuterEdges: false,
    project(coordinate) {
      const point = map.project(coordinate);
      return [point.x, point.y];
    },
    unproject(coordinate) {
      const point = map.unproject(coordinate);
      return [point.lng, point.lat];
    },
    viewportBounds: [-24, -24, viewportWidth + 24, viewportHeight + 24],
  });
  const colorsByAreaId = assignClusterAreaColors(
    subjects.map((subject) => subject.areaId),
    geometry.boundarySegments,
  );
  const areaFeatures = geometry.regions
    .map((region) => {
      const subject = subjectByAreaId.get(String(region.clusterId));

      if (!subject || region.polygons.length === 0) {
        return null;
      }

      return createClusterAreaFeature(
        subject,
        region.polygons,
        colorsByAreaId.get(subject.areaId) ?? "#2563eb",
      );
    })
    .filter(isDefined);
  const boundaryFeatures = geometry.boundarySegments.map((segment) =>
    createClusterAreaBoundaryFeature(
      segment.coordinates,
      segment.clusterIds
        .filter((clusterId): clusterId is string => typeof clusterId === "string")
        .map((clusterId) => subjectByAreaId.get(clusterId)?.pointCount ?? 0),
      createBoundaryLineColor(segment.clusterIds, colorsByAreaId),
    ),
  );

  return {
    areaFeatures: [...areaFeatures, ...boundaryFeatures],
    colorsByAreaId,
  };
}

function createClusterAreaFeature(
  feature: {
    areaId: string;
    pointCount: number;
  },
  polygons: Array<Array<Array<[number, number]>>>,
  clusterColor: string,
) {
  if (polygons.length > 1) {
    return {
      type: "Feature" as const,
      properties: {
        kind: "cluster-area",
        clusterColor,
        clusterId: feature.areaId,
        pointCount: feature.pointCount,
      },
      geometry: {
        type: "MultiPolygon" as const,
        coordinates: polygons,
      },
    };
  }

  return {
    type: "Feature" as const,
    properties: {
      kind: "cluster-area",
      clusterColor,
      clusterId: feature.areaId,
      pointCount: feature.pointCount,
    },
    geometry: {
      type: "Polygon" as const,
      coordinates: polygons[0]!,
    },
  };
}

function createClusterAreaBoundaryFeature(
  coordinates: Array<[number, number]>,
  pointCounts: readonly number[],
  lineColor: string,
) {
  return {
    type: "Feature" as const,
    properties: {
      kind: "cluster-area-boundary",
      lineColor,
      pointCount: Math.max(...pointCounts, 0),
    },
    geometry: {
      type: "LineString" as const,
      coordinates,
    },
  };
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
