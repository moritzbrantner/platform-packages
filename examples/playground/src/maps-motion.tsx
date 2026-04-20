import { useMemo, useState } from "react";

import {
  TemporalClusteredMap,
  type AggregatedMapFeature,
  type TemporalMapTrack,
  type VisibleAggregationSummary,
} from "@moritzbrantner/maps";
import {
  Badge,
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

const TOTAL_DOTS = 10_000;
const MOVING_DOTS = 5_000;
const STATIC_DOTS = TOTAL_DOTS - MOVING_DOTS;
const TIMELINE_START = Date.UTC(2026, 2, 3, 6, 0, 0);
const TIMELINE_STEP_MS = 20 * 60 * 1000;
const TIMELINE_STEPS = 18;

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
      activePage="maps-motion"
      title="Temporal map motion demo"
      description="A dedicated timeline page for load-testing moving dots. The map keeps 10,000 dots in play, with 5,000 stationary anchors and 5,000 seeded random routes that shift over time."
    >
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
                This page isolates the temporal behavior from the main maps demo.
                The moving half follows reproducible random routes between major
                hubs, while the static half stays fixed so you can gauge clustering
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
                The purpose of this page is to stress the temporal map UI without
                mixing it into the original maps playground page.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </PlaygroundPage>
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

mountPage(<MapsMotionPage />);
