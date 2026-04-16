import { useMemo, useState } from "react";

import {
  ClusteredMap,
  TemporalClusteredMap,
  type AggregatedMapFeature,
  type ClusteredMapProps,
  type MapPoint,
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
} from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

type DeliveryPoint = MapPoint<{
  city: string;
  region: string;
  segment: "Enterprise" | "Mid-market" | "SMB";
}>;
type CourierProperties = {
  route: string;
  status: "Dispatching" | "En route" | "Handoff";
};
type CourierTrack = TemporalMapTrack<CourierProperties>;

const DATASET_SIZE = 100_000;
const TEMPORAL_MAP_START = Date.UTC(2026, 0, 14, 6);
const TEMPORAL_MAP_STEP_MS = 45 * 60 * 1000;
const TEMPORAL_MAP_STEPS = 28;
type PlaygroundMapInstance = Parameters<
  NonNullable<ClusteredMapProps["onMapReady"]>
>[0];
type PlaygroundMapStyle = Exclude<ClusteredMapProps["mapStyle"], string | undefined>;
const E2E_MAP_STYLE: PlaygroundMapStyle = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#f4f4f5",
      },
    },
  ],
};

function MapsPage() {
  const e2eMode = useMemo(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("e2e") === "1",
    [],
  );
  const points = useMemo(() => createDeliveryPoints(DATASET_SIZE), []);
  const courierTracks = useMemo(() => createCourierTracks(220), []);
  const [selection, setSelection] = useState<AggregatedMapFeature<DeliveryPoint["properties"]> | null>(
    null,
  );
  const [summary, setSummary] = useState<VisibleAggregationSummary | null>(null);
  const [temporalSelection, setTemporalSelection] = useState<
    AggregatedMapFeature<CourierTrack["properties"]> | null
  >(null);
  const [temporalSummary, setTemporalSummary] = useState<VisibleAggregationSummary | null>(null);
  const [playbackTime, setPlaybackTime] = useState(TEMPORAL_MAP_START);
  const initialViewState = useMemo(
    () => ({
      center: [-98.5795, 39.8283] as [number, number],
      zoom: 3.2,
    }),
    [],
  );

  return (
    <PlaygroundPage
      activePage="maps"
      title="Maps package with zoom-aware aggregation"
      description="A 100,000-point delivery dataset rendered through @moritzbrantner/maps. Zoom in to break clusters apart, click clusters to expand them, and inspect the live viewport aggregation totals without dropping individual points at close range."
    >
      <section className="grid gap-4 xl:grid-cols-[1.45fr_0.8fr]">
        <Card className="overflow-hidden rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader className="border-b border-border/60">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                100,000 points
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                `supercluster` aggregation
              </Badge>
            </div>
            <div className="space-y-2">
              <CardTitle>Clustered delivery demand map</CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-6">
                The package uses a client-side aggregation index to collapse dense
                regions at low zoom and automatically reveal raw points as you drill
                in. This keeps the interaction usable even when the source dataset is
                six figures long.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ClusteredMap
              mapLabel="Clustered delivery demand map"
              points={points}
              initialViewState={initialViewState}
              mapStyle={e2eMode ? E2E_MAP_STYLE : undefined}
              style={{ minHeight: 640 }}
              onFeatureSelect={setSelection}
              onMapReady={e2eMode ? exposeE2EMapHandle : undefined}
              onViewportAggregationChange={setSummary}
            />
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
                Viewport totals
              </Badge>
              <CardTitle>What the current map view contains</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <MetricCard
                label="Visible points"
                testId="metric-visible-points"
                value={summary ? formatInteger(summary.visiblePointCount) : "\u2014"}
                hint="Underlying data points represented by points plus clusters."
              />
              <MetricCard
                label="Visible clusters"
                testId="metric-visible-clusters"
                value={summary ? formatInteger(summary.visibleClusterCount) : "\u2014"}
                hint="Aggregated bubbles currently standing in for dense regions."
              />
              <MetricCard
                label="Open orders"
                testId="metric-open-orders"
                value={summary ? formatInteger(summary.metrics.orders ?? 0) : "\u2014"}
                hint="Sum of the synthetic `orders` metric in the viewport."
              />
              <MetricCard
                label="Revenue"
                testId="metric-revenue"
                value={summary ? formatCurrency(summary.metrics.revenue ?? 0) : "\u2014"}
                hint="Aggregated `revenue` across everything on screen."
              />
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                Selection
              </Badge>
              <CardTitle>Cluster or point details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              {selection ? <SelectionDetails selection={selection} /> : <p>Click a cluster to expand it or click an individual point to inspect a single delivery record.</p>}
              <Button asChild variant="outline">
                <a href="/index.html">Back to overview</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
                Package shape
              </Badge>
              <CardTitle>What the new package exposes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                `ClusteredMap` provides the browser map surface and click-driven zoom
                expansion.
              </p>
              <p>
                `createPointAggregationIndex` is exported separately so aggregation can
                be tested or reused without rendering a map at all.
              </p>
              <p>
                Each point can carry numeric metrics such as `orders` or `revenue`,
                and those totals roll up into every cluster automatically.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.8fr]">
        <Card className="overflow-hidden rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader className="border-b border-border/60">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Time axis
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                Separate component
              </Badge>
            </div>
            <div className="space-y-2">
              <CardTitle>Temporal courier activity map</CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-6">
                `TemporalClusteredMap` keeps the base `ClusteredMap` focused on
                rendering while adding a playback rail that slices the active points
                for the current moment. Couriers appear when they are dispatched,
                move across the map, and disappear once the handoff is complete.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <TemporalClusteredMap
              defaultTime={TEMPORAL_MAP_START}
              initialViewState={initialViewState}
              mapLabel="Temporal courier activity map"
              onFeatureSelect={setTemporalSelection}
              onTimeChange={setPlaybackTime}
              onViewportAggregationChange={setTemporalSummary}
              playbackRate={90 * 60 * 1000}
              style={{ minHeight: 560 }}
              timeStep={TEMPORAL_MAP_STEP_MS}
              tracks={courierTracks}
              formatTimeLabel={formatTimelineTime}
            />
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
                Playback
              </Badge>
              <CardTitle>Current timeline slice</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <MetricCard
                label="Clock"
                testId="metric-temporal-clock"
                value={formatTimelineTime(playbackTime)}
                hint="The active timestamp driving the map."
              />
              <MetricCard
                label="Visible couriers"
                testId="metric-visible-couriers"
                value={temporalSummary ? formatInteger(temporalSummary.visiblePointCount) : "\u2014"}
                hint="Couriers currently visible on the map after time slicing."
              />
              <MetricCard
                label="In-flight revenue"
                testId="metric-temporal-revenue"
                value={temporalSummary ? formatCurrency(temporalSummary.metrics.revenue ?? 0) : "\u2014"}
                hint="Cluster and point metrics still roll up inside the active frame."
              />
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                Selection
              </Badge>
              <CardTitle>Temporal point details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              {temporalSelection ? (
                <TemporalSelectionDetails selection={temporalSelection} />
              ) : (
                <p>
                  Click a live courier or one of the temporary clusters while the
                  playback moves through the day.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </PlaygroundPage>
  );
}

function exposeE2EMapHandle(map: PlaygroundMapInstance) {
  if (typeof window === "undefined") {
    return;
  }

  window.__MB_MAPS_E2E__ = {
    map,
    readyCount: (window.__MB_MAPS_E2E__?.readyCount ?? 0) + 1,
  };
}

function MetricCard({
  hint,
  label,
  testId,
  value,
}: {
  hint: string;
  label: string;
  testId: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-border/60 bg-card/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p
        data-testid={testId}
        className="mt-2 text-3xl font-semibold tracking-tight text-foreground"
      >
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{hint}</p>
    </div>
  );
}

function SelectionDetails({
  selection,
}: {
  selection: AggregatedMapFeature<DeliveryPoint["properties"]>;
}) {
  if (selection.kind === "cluster") {
    return (
      <div className="space-y-3">
        <p className="text-base font-medium text-foreground">
          Cluster with {formatInteger(selection.pointCount)} points
        </p>
        <p>
          Expansion zoom: {selection.expansionZoom.toFixed(0)}. Revenue inside this
          cluster: {formatCurrency(selection.metrics.revenue ?? 0)}.
        </p>
        <p>Open orders inside this cluster: {formatInteger(selection.metrics.orders ?? 0)}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-base font-medium text-foreground">
        {selection.point.label || `Point ${selection.point.id}`}
      </p>
      <p>
        {selection.point.properties.region} region, {selection.point.properties.city},{" "}
        {selection.point.properties.segment} segment.
      </p>
      <p>
        {formatInteger(selection.metrics.orders ?? 0)} orders,{" "}
        {formatCurrency(selection.metrics.revenue ?? 0)} revenue.
      </p>
    </div>
  );
}

function TemporalSelectionDetails({
  selection,
}: {
  selection: AggregatedMapFeature<CourierTrack["properties"]>;
}) {
  if (selection.kind === "cluster") {
    return (
      <div className="space-y-3">
        <p className="text-base font-medium text-foreground">
          Active cluster with {formatInteger(selection.pointCount)} couriers
        </p>
        <p>
          Expansion zoom: {selection.expansionZoom.toFixed(0)}. Revenue in motion:{" "}
          {formatCurrency(selection.metrics.revenue ?? 0)}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-base font-medium text-foreground">
        {selection.point.label || `Courier ${selection.point.id}`}
      </p>
      <p>
        Route: {selection.point.properties.route}. Status:{" "}
        {selection.point.properties.status}.
      </p>
      <p>
        {formatInteger(Math.round(selection.metrics.orders ?? 0))} orders,{" "}
        {formatCurrency(selection.metrics.revenue ?? 0)} revenue.
      </p>
    </div>
  );
}

function createDeliveryPoints(count: number): DeliveryPoint[] {
  const random = createSeededRandom(42);
  const hubs = [
    { city: "New York", latitude: 40.7128, longitude: -74.006, region: "Northeast", spread: 1.3 },
    { city: "Los Angeles", latitude: 34.0522, longitude: -118.2437, region: "West", spread: 1.8 },
    { city: "Chicago", latitude: 41.8781, longitude: -87.6298, region: "Midwest", spread: 1.5 },
    { city: "Dallas", latitude: 32.7767, longitude: -96.797, region: "South", spread: 1.9 },
    { city: "Atlanta", latitude: 33.749, longitude: -84.388, region: "Southeast", spread: 1.4 },
    { city: "Seattle", latitude: 47.6062, longitude: -122.3321, region: "Northwest", spread: 1.6 },
    { city: "Miami", latitude: 25.7617, longitude: -80.1918, region: "Southeast", spread: 1.3 },
    { city: "Denver", latitude: 39.7392, longitude: -104.9903, region: "Mountain", spread: 1.7 },
  ] as const;
  const segments = ["Enterprise", "Mid-market", "SMB"] as const;

  return Array.from({ length: count }, (_, index) => {
    const hub = hubs[Math.floor(random() * hubs.length)] ?? hubs[0];
    const angle = random() * Math.PI * 2;
    const distance = Math.pow(random(), 0.72) * hub.spread;
    const latitude = hub.latitude + Math.sin(angle) * distance;
    const longitude = hub.longitude + Math.cos(angle) * distance * 1.15;
    const orders = 1 + Math.floor(random() * 8);
    const revenue = 80 + Math.round(random() * 1620);
    const segment = segments[Math.floor(random() * segments.length)] ?? segments[0];

    return {
      id: `delivery-${index}`,
      latitude,
      longitude,
      label: `Shipment ${index + 1}`,
      metrics: {
        orders,
        revenue,
      },
      properties: {
        city: hub.city,
        region: hub.region,
        segment,
      },
    };
  });
}

function createCourierTracks(count: number): CourierTrack[] {
  const random = createSeededRandom(7);
  const hubs = [
    { city: "Seattle", latitude: 47.6062, longitude: -122.3321 },
    { city: "San Francisco", latitude: 37.7749, longitude: -122.4194 },
    { city: "Denver", latitude: 39.7392, longitude: -104.9903 },
    { city: "Dallas", latitude: 32.7767, longitude: -96.797 },
    { city: "Chicago", latitude: 41.8781, longitude: -87.6298 },
    { city: "Atlanta", latitude: 33.749, longitude: -84.388 },
    { city: "New York", latitude: 40.7128, longitude: -74.006 },
    { city: "Miami", latitude: 25.7617, longitude: -80.1918 },
  ] as const;
  const totalDurationMs = TEMPORAL_MAP_STEP_MS * (TEMPORAL_MAP_STEPS - 1);

  return Array.from({ length: count }, (_, index) => {
    const origin = hubs[Math.floor(random() * hubs.length)] ?? hubs[0];
    let destination = hubs[Math.floor(random() * hubs.length)] ?? hubs[1];

    if (destination.city === origin.city) {
      destination = hubs[(hubs.indexOf(origin) + 2) % hubs.length] ?? hubs[1];
    }

    const startStep = Math.floor(random() * 10);
    const durationSteps = 6 + Math.floor(random() * 9);
    const endStep = Math.min(startStep + durationSteps, TEMPORAL_MAP_STEPS - 2);
    const frameCount = endStep - startStep + 1;
    const arc = 1.4 + random() * 2.6;
    const orderBase = 2 + Math.floor(random() * 5);
    const revenueBase = 140 + Math.round(random() * 780);
    const route = `${origin.city} to ${destination.city}`;
    const frames: Array<CourierTrack["frames"][number]> = Array.from({ length: frameCount }, (_, frameIndex) => {
      const progress = frameCount === 1 ? 1 : frameIndex / (frameCount - 1);
      const latitudeArc =
        Math.sin(progress * Math.PI) * arc +
        (random() - 0.5) * 0.25;
      const longitudeArc = Math.cos(progress * Math.PI * 2) * 0.9;
      const time = TEMPORAL_MAP_START + (startStep + frameIndex) * TEMPORAL_MAP_STEP_MS;
      const status: CourierProperties["status"] =
        progress < 0.18
          ? "Dispatching"
          : progress > 0.84
            ? "Handoff"
            : "En route";

      return {
        latitude:
          origin.latitude + (destination.latitude - origin.latitude) * progress + latitudeArc,
        longitude:
          origin.longitude +
          (destination.longitude - origin.longitude) * progress +
          longitudeArc,
        metrics: {
          orders: orderBase + progress * 3,
          revenue: revenueBase + progress * 480,
        },
        properties: {
          route,
          status,
        },
        time,
      };
    });
    const finalFrameTime = TEMPORAL_MAP_START + (endStep + 1) * TEMPORAL_MAP_STEP_MS;

    if (finalFrameTime <= TEMPORAL_MAP_START + totalDurationMs) {
      const lastFrame = frames[frames.length - 1]!;

      frames.push({
        latitude: lastFrame.latitude,
        longitude: lastFrame.longitude,
        properties: {
          route,
          status: "Handoff",
        },
        time: finalFrameTime,
        visible: false,
      });
    }

    return {
      id: `courier-${index}`,
      label: `Courier ${index + 1}`,
      frames,
    };
  });
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

function formatTimelineTime(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

mountPage(<MapsPage />);

declare global {
  interface Window {
    __MB_MAPS_E2E__?: {
      map: PlaygroundMapInstance;
      readyCount: number;
    };
  }
}
