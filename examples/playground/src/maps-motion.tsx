import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import type { GeoJSONSource, Map as MaplibreMap } from "maplibre-gl";

import {
  TemporalClusteredMap,
  createTemporalGeoJsonTracksFromGeoJson,
  defaultRasterMapStyle,
  getTemporalGeoJsonFeatureCollectionAtTime,
  getTemporalGeoJsonTimeRange,
  snapTemporalMapTime,
  type AggregatedMapFeature,
  type TemporalGeoJsonGeometryFeatureCollection,
  type TemporalGeoJsonInterpolationStrategy,
  type TemporalGeoJsonOutputFeatureCollection,
  type TemporalGeoJsonTrack,
  type TemporalMapTrack,
  type VisibleAggregationSummary,
} from "@moritzbrantner/maps";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

type MotionPointProperties = {
  fleet: "Static" | "Moving";
  origin: string;
  status: "Holding" | "Cruising";
};

type MotionTrack = TemporalMapTrack<MotionPointProperties>;
type GeometryTrackProperties = {
  category: "Point" | "Route" | "Zone";
  name: string;
};
type TemporalGeometryFeatureProperties = GeometryTrackProperties & {
  intensity: number;
  label: string;
  time: number;
  trackId: string;
};

const TOTAL_DOTS = 10_000;
const MOVING_DOTS = 5_000;
const STATIC_DOTS = TOTAL_DOTS - MOVING_DOTS;
const TIMELINE_START = Date.UTC(2026, 2, 3, 6, 0, 0);
const TIMELINE_STEP_MS = 20 * 60 * 1000;
const TIMELINE_STEPS = 18;
const GEOMETRY_TIMELINE_STEP_MS = TIMELINE_STEP_MS * 3;
const GEOMETRY_STRATEGIES: TemporalGeoJsonInterpolationStrategy[] = [
  "hold",
  "compatible",
  "resample",
  "centroid-radial",
];

function MapsMotionPage() {
  const tracks = useMemo(() => createMotionTracks(), []);
  const [selection, setSelection] = useState<AggregatedMapFeature<MotionPointProperties> | null>(
    null,
  );
  const [summary, setSummary] = useState<VisibleAggregationSummary | null>(null);
  const [time, setTime] = useState(TIMELINE_START);
  const initialViewState = useMemo(
    () => ({
      center: [-98.5795, 39.8283] as [number, number],
      zoom: 3.35,
    }),
    [],
  );

  return (
    <PlaygroundPage
      activePage="temporal-maps"
      title="Temporal maps playground"
      description="A dedicated timeline page for load-testing TemporalClusteredMap. The map keeps 10,000 dots in play, with 5,000 stationary anchors and 5,000 seeded random routes that shift over time."
    >
      <TemporalGeoJsonStrategyDemo />

      <section className="grid gap-4 xl:grid-cols-[1.45fr_0.82fr]">
        <Card className="overflow-hidden rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader className="border-b border-border/60">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                10,000 dots
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                5,000 moving
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                5,000 static
              </Badge>
            </div>
            <div className="space-y-2">
              <CardTitle>Motion playback map</CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-6">
                This page isolates temporal behavior from the main maps demo. The
                moving half follows reproducible random routes between major hubs,
                while the static half stays fixed so you can gauge clustering
                stability as the timeline advances.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <TemporalClusteredMap
              autoPlay
              defaultTime={TIMELINE_START}
              formatTimeLabel={formatMotionTime}
              initialViewState={initialViewState}
              mapLabel="Temporal motion map"
              onFeatureSelect={setSelection}
              onTimeChange={setTime}
              onViewportAggregationChange={setSummary}
              playbackRate={TIMELINE_STEP_MS * 0.75}
              style={{ minHeight: 700 }}
              timeStep={TIMELINE_STEP_MS}
              tracks={tracks}
            />
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
                Timeline slice
              </Badge>
              <CardTitle>Current frame totals</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <MetricCard
                label="Clock"
                value={formatMotionTime(time)}
                hint="The active timestamp driving the moving subset."
              />
              <MetricCard
                label="Visible dots"
                value={summary ? formatInteger(summary.visiblePointCount) : "\u2014"}
                hint="All static and moving points represented in the current view."
              />
              <MetricCard
                label="Visible clusters"
                value={summary ? formatInteger(summary.visibleClusterCount) : "\u2014"}
                hint="Cluster count fluctuates as the moving half compresses or spreads out."
              />
              <MetricCard
                label="Aggregated load"
                value={summary ? formatInteger(Math.round(summary.metrics.load ?? 0)) : "\u2014"}
                hint="Synthetic load metric accumulated from every visible point."
              />
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                Selection
              </Badge>
              <CardTitle>Hovered feature details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              {selection ? (
                <SelectionDetails selection={selection} />
              ) : (
                <p>
                  Click a cluster to expand it or pick a single dot to inspect
                  whether it belongs to the moving or static half.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
                Dataset shape
              </Badge>
              <CardTitle>What this page is exercising</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                The dataset is deterministic so repeated runs produce the same
                movement paths and cluster transitions.
              </p>
              <p>
                Static points use a single keyframe at the start of the time range.
                Moving points use a full route across {TIMELINE_STEPS} timeline
                slices.
              </p>
              <p>
                The purpose of this page is to stress `TemporalClusteredMap` and
                the temporal track model without mixing it into the original maps
                playground page.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </PlaygroundPage>
  );
}

function TemporalGeoJsonStrategyDemo() {
  const tracks = useMemo(() => createTemporalGeometryTracks(), []);
  const timeRange = useMemo(() => getTemporalGeoJsonTimeRange(tracks), [tracks]);
  const [time, setTime] = useState(timeRange?.start ?? TIMELINE_START);
  const [strategy, setStrategy] = useState<TemporalGeoJsonInterpolationStrategy>("compatible");
  const activeTime = useMemo(
    () => (timeRange ? snapTemporalMapTime(time, timeRange, GEOMETRY_TIMELINE_STEP_MS) : 0),
    [time, timeRange],
  );
  const featureCollection = useMemo(
    () =>
      getTemporalGeoJsonFeatureCollectionAtTime(tracks, activeTime, {
        maxCoordinatesPerLine: 48,
        maxCoordinatesPerRing: 48,
        minResampleCoordinates: 24,
        strategy,
      }),
    [activeTime, strategy, tracks],
  );

  const handleTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(event.target.value);

    if (Number.isFinite(nextTime)) {
      setTime(nextTime);
    }
  };

  return (
    <section className="grid gap-4 xl:grid-cols-[1.35fr_0.8fr]">
      <Card className="overflow-hidden rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              GeoJSON source
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              Points, lines, polygons
            </Badge>
          </div>
          <div className="space-y-2">
            <CardTitle>Temporal geometry strategy map</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6">
              This source is generated by the new temporal GeoJSON utilities and
              rendered through direct MapLibre fill, line, and circle layers.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-5">
          <TemporalGeoJsonMapPreview data={featureCollection} />
          <div className="grid gap-4 rounded-[1.25rem] border border-border/70 bg-card/75 p-4 lg:grid-cols-[1fr_auto]">
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {GEOMETRY_STRATEGIES.map((value) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={strategy === value ? "default" : "outline"}
                    onClick={() => {
                      setStrategy(value);
                    }}
                  >
                    {formatStrategyLabel(value)}
                  </Button>
                ))}
              </div>
              <input
                aria-label="Temporal geometry timeline"
                className="w-full accent-[#0f766e]"
                disabled={!timeRange}
                max={timeRange?.end ?? 0}
                min={timeRange?.start ?? 0}
                onChange={handleTimeChange}
                step={GEOMETRY_TIMELINE_STEP_MS}
                type="range"
                value={activeTime}
              />
            </div>
            <div className="grid gap-1 text-sm">
              <span className="font-medium text-foreground">
                {formatMotionTime(activeTime)}
              </span>
              <span className="text-muted-foreground">
                {featureCollection.features.length} active geometries
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Strategy
            </Badge>
            <CardTitle>{formatStrategyLabel(strategy)}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <MetricCard
              label="Features"
              value={formatInteger(featureCollection.features.length)}
              hint="The current GeoJSON feature count emitted for the active timestamp."
            />
            <MetricCard
              label="Clock"
              value={formatMotionTime(activeTime)}
              hint="The same temporal utility powers the source and the visible controls."
            />
          </CardContent>
        </Card>
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
              Geometry set
            </Badge>
            <CardTitle>Mixed temporal source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              The route changes vertex counts, the zone changes polygon shape, and
              the point moves across the same timestamp range.
            </p>
            <p>
              Topology-safe strategies hold shapes when they cannot make a
              defensible match; resampling strategies approximate more motion.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function TemporalGeoJsonMapPreview({
  data,
}: {
  data: TemporalGeoJsonOutputFeatureCollection<GeometryTrackProperties>;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const [isReady, setIsReady] = useState(false);

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
        attributionControl: false,
        center: [-97.25, 39.25],
        container: containerRef.current,
        style: defaultRasterMapStyle,
        zoom: 3.35,
      });
      mapRef.current = localMap;
      localMap.addControl(new maplibre.NavigationControl(), "top-right");
      localMap.on("load", () => {
        if (!localMap || localMap.getSource("temporal-geojson-preview")) {
          return;
        }

        localMap.addSource("temporal-geojson-preview", {
          data,
          type: "geojson",
        });
        localMap.addLayer({
          filter: [
            "any",
            ["==", ["geometry-type"], "Polygon"],
            ["==", ["geometry-type"], "MultiPolygon"],
          ],
          id: "temporal-geojson-preview-fill",
          paint: {
            "fill-color": "#0f766e",
            "fill-opacity": 0.34,
          },
          source: "temporal-geojson-preview",
          type: "fill",
        });
        localMap.addLayer({
          filter: [
            "any",
            ["==", ["geometry-type"], "LineString"],
            ["==", ["geometry-type"], "MultiLineString"],
          ],
          id: "temporal-geojson-preview-line",
          paint: {
            "line-color": "#b45309",
            "line-opacity": 0.95,
            "line-width": 4,
          },
          source: "temporal-geojson-preview",
          type: "line",
        });
        localMap.addLayer({
          filter: ["==", ["geometry-type"], "Point"],
          id: "temporal-geojson-preview-point",
          paint: {
            "circle-color": "#1d4ed8",
            "circle-radius": 7,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
          },
          source: "temporal-geojson-preview",
          type: "circle",
        });
        setIsReady(true);
      });
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
    if (!isReady) {
      return;
    }

    const source = mapRef.current?.getSource("temporal-geojson-preview") as
      | GeoJSONSource
      | undefined;

    source?.setData(data);
  }, [data, isReady]);

  return (
    <div
      aria-label="Temporal GeoJSON strategy preview"
      data-map-ready={isReady ? "true" : "false"}
      className="mb-maps"
      style={{
        minHeight: 520,
        width: "100%",
      }}
    >
      <div ref={containerRef} className="mb-maps__canvas" />
    </div>
  );
}

function MetricCard({
  hint,
  label,
  value,
}: {
  hint: string;
  label: string;
  value: string;
}) {
  return (
    <Item variant="muted" className="items-start bg-card/70 p-4">
      <ItemContent>
        <ItemDescription className="text-xs uppercase tracking-[0.2em]">
          {label}
        </ItemDescription>
        <ItemTitle className="mt-1 text-3xl font-semibold tracking-tight">
          {value}
        </ItemTitle>
        <ItemDescription className="line-clamp-none leading-6">
          {hint}
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}

function SelectionDetails({
  selection,
}: {
  selection: AggregatedMapFeature<MotionPointProperties>;
}) {
  if (selection.kind === "cluster") {
    return (
      <div className="space-y-3">
        <p className="text-base font-medium text-foreground">
          Cluster with {formatInteger(selection.pointCount)} dots
        </p>
        <p>
          Expansion zoom: {selection.expansionZoom.toFixed(0)}. Aggregated load:{" "}
          {formatInteger(Math.round(selection.metrics.load ?? 0))}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-base font-medium text-foreground">
        {selection.point.label || `Dot ${selection.point.id}`}
      </p>
      <p>
        Fleet: {selection.point.properties.fleet}. Origin:{" "}
        {selection.point.properties.origin}. Status: {selection.point.properties.status}.
      </p>
      <p>
        Load: {formatInteger(Math.round(selection.metrics.load ?? 0))}. Revenue:{" "}
        {formatCurrency(selection.metrics.revenue ?? 0)}.
      </p>
    </div>
  );
}

function createTemporalGeometryTracks(): Array<TemporalGeoJsonTrack<GeometryTrackProperties>> {
  const collection: TemporalGeoJsonGeometryFeatureCollection<TemporalGeometryFeatureProperties> = {
    features: [
      {
        geometry: {
          coordinates: [-122.3321, 47.6062],
          type: "Point",
        },
        properties: {
          category: "Point",
          intensity: 2,
          label: "Mobile sensor",
          name: "Mobile sensor",
          time: TIMELINE_START,
          trackId: "sensor",
        },
        type: "Feature",
      },
      {
        geometry: {
          coordinates: [-77.0369, 38.9072],
          type: "Point",
        },
        properties: {
          category: "Point",
          intensity: 6,
          label: "Mobile sensor",
          name: "Mobile sensor",
          time: TIMELINE_START + GEOMETRY_TIMELINE_STEP_MS * 4,
          trackId: "sensor",
        },
        type: "Feature",
      },
      {
        geometry: {
          coordinates: [
            [-118.2437, 34.0522],
            [-104.9903, 39.7392],
            [-87.6298, 41.8781],
          ],
          type: "LineString",
        },
        properties: {
          category: "Route",
          intensity: 5,
          label: "Freight corridor",
          name: "Freight corridor",
          time: TIMELINE_START,
          trackId: "corridor",
        },
        type: "Feature",
      },
      {
        geometry: {
          coordinates: [
            [-112.074, 33.4484],
            [-96.797, 32.7767],
            [-84.388, 33.749],
            [-74.006, 40.7128],
          ],
          type: "LineString",
        },
        properties: {
          category: "Route",
          intensity: 8,
          label: "Freight corridor",
          name: "Freight corridor",
          time: TIMELINE_START + GEOMETRY_TIMELINE_STEP_MS * 4,
          trackId: "corridor",
        },
        type: "Feature",
      },
      {
        geometry: {
          coordinates: [
            [
              [-106, 36],
              [-96, 35],
              [-92, 42],
              [-104, 45],
              [-106, 36],
            ],
          ],
          type: "Polygon",
        },
        properties: {
          category: "Zone",
          intensity: 4,
          label: "Coverage zone",
          name: "Coverage zone",
          time: TIMELINE_START,
          trackId: "coverage",
        },
        type: "Feature",
      },
      {
        geometry: {
          coordinates: [
            [
              [-101, 32],
              [-88, 34],
              [-84, 40],
              [-92, 47],
              [-104, 43],
              [-101, 32],
            ],
          ],
          type: "Polygon",
        },
        properties: {
          category: "Zone",
          intensity: 7,
          label: "Coverage zone",
          name: "Coverage zone",
          time: TIMELINE_START + GEOMETRY_TIMELINE_STEP_MS * 4,
          trackId: "coverage",
        },
        type: "Feature",
      },
    ],
    type: "FeatureCollection",
  };

  return createTemporalGeoJsonTracksFromGeoJson(collection, {
    getProperties: (feature) => ({
      category: feature.properties?.category ?? "Zone",
      name: feature.properties?.name ?? String(feature.properties?.trackId ?? ""),
    }),
    metricKeys: ["intensity"],
  });
}

function createMotionTracks(): MotionTrack[] {
  const random = createSeededRandom(20260416);
  const hubs = [
    { city: "Seattle", latitude: 47.6062, longitude: -122.3321 },
    { city: "San Francisco", latitude: 37.7749, longitude: -122.4194 },
    { city: "Los Angeles", latitude: 34.0522, longitude: -118.2437 },
    { city: "Denver", latitude: 39.7392, longitude: -104.9903 },
    { city: "Dallas", latitude: 32.7767, longitude: -96.797 },
    { city: "Chicago", latitude: 41.8781, longitude: -87.6298 },
    { city: "Atlanta", latitude: 33.749, longitude: -84.388 },
    { city: "Miami", latitude: 25.7617, longitude: -80.1918 },
    { city: "Washington", latitude: 38.9072, longitude: -77.0369 },
    { city: "New York", latitude: 40.7128, longitude: -74.006 },
    { city: "Boston", latitude: 42.3601, longitude: -71.0589 },
    { city: "Phoenix", latitude: 33.4484, longitude: -112.074 },
  ] as const;
  const tracks: MotionTrack[] = [];

  for (let index = 0; index < STATIC_DOTS; index += 1) {
    const hub = hubs[Math.floor(random() * hubs.length)] ?? hubs[0];
    const angle = random() * Math.PI * 2;
    const radius = Math.pow(random(), 0.8) * 1.9;

    tracks.push({
      id: `static-${index}`,
      label: `Anchor ${index + 1}`,
      frames: [
        {
          latitude: hub.latitude + Math.sin(angle) * radius,
          longitude: hub.longitude + Math.cos(angle) * radius * 1.2,
          metrics: {
            load: 1 + Math.floor(random() * 5),
            revenue: 100 + Math.round(random() * 500),
          },
          properties: {
            fleet: "Static",
            origin: hub.city,
            status: "Holding",
          },
          time: TIMELINE_START,
        },
      ],
    });
  }

  for (let index = 0; index < MOVING_DOTS; index += 1) {
    const origin = hubs[Math.floor(random() * hubs.length)] ?? hubs[0];
    let destination = hubs[Math.floor(random() * hubs.length)] ?? hubs[1];

    if (destination.city === origin.city) {
      destination = hubs[(hubs.indexOf(origin) + 3) % hubs.length] ?? hubs[1];
    }

    const drift = 1.2 + random() * 2.6;
    const phase = random() * Math.PI * 2;
    const frames: MotionTrack["frames"] = Array.from(
      { length: TIMELINE_STEPS },
      (_, frameIndex) => {
        const progress = frameIndex / (TIMELINE_STEPS - 1);
        const time = TIMELINE_START + frameIndex * TIMELINE_STEP_MS;
        const arc = Math.sin(progress * Math.PI) * drift;
        const wobble = Math.sin(progress * Math.PI * 4 + phase) * 0.22;

        return {
          latitude:
            origin.latitude +
            (destination.latitude - origin.latitude) * progress +
            arc +
            wobble,
          longitude:
            origin.longitude +
            (destination.longitude - origin.longitude) * progress +
            Math.cos(progress * Math.PI * 2 + phase) * 1.05,
          metrics: {
            load: 2 + Math.round(progress * 4),
            revenue: 180 + Math.round(random() * 420) + progress * 260,
          },
          properties: {
            fleet: "Moving",
            origin: origin.city,
            status: "Cruising",
          },
          time,
        };
      },
    );

    tracks.push({
      id: `moving-${index}`,
      label: `Mover ${index + 1}`,
      frames,
    });
  }

  return tracks;
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0;

  return function nextRandom() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMotionTime(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function formatStrategyLabel(value: TemporalGeoJsonInterpolationStrategy) {
  return value
    .split("-")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

mountPage(<MapsMotionPage />);
