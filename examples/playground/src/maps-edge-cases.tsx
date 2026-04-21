import { useMemo, useState } from "react";

import {
  ClusteredMap,
  HeatMap,
  TemporalHeatMap,
  createHeatMapDensityIndex,
  type AggregatedMapFeature,
  type IndexedMapPoint,
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
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

type EdgeMapKind = "Gateway" | "Incident" | "Sensor" | "Warehouse";
type EdgeMapPriority = "Low" | "Medium" | "High";
type EdgeMapProperties = {
  kind: EdgeMapKind;
  note: string;
  priority: EdgeMapPriority;
  region: string;
};
type EdgeMapPoint = MapPoint<EdgeMapProperties>;
type EdgeMapFilter = "all" | "incidents" | "priority";
type HeatMetric = "risk" | "dwellHours" | "backlog";
type TemporalSignalProperties = {
  corridor: string;
  signal: "Burst" | "Idle" | "Recovery";
};
type TemporalSignalTrack = TemporalMapTrack<TemporalSignalProperties>;

const MAP_INITIAL_VIEW = {
  center: [178.6, 10.5] as [number, number],
  zoom: 1.45,
};
const TEMPORAL_START = Date.UTC(2026, 3, 18, 8, 0, 0);
const TEMPORAL_STEP_MS = 30 * 60 * 1000;

const heatMetricLabels: Record<HeatMetric, string> = {
  backlog: "Backlog",
  dwellHours: "Dwell",
  risk: "Risk",
};

function MapEdgeCasesPage() {
  const points = useMemo(() => createEdgeCasePoints(), []);
  const temporalTracks = useMemo(() => createTemporalSignalTracks(), []);
  const [filter, setFilter] = useState<EdgeMapFilter>("all");
  const [heatMetric, setHeatMetric] = useState<HeatMetric>("risk");
  const [summary, setSummary] = useState<VisibleAggregationSummary | null>(null);
  const [selection, setSelection] = useState<
    AggregatedMapFeature<EdgeMapProperties> | null
  >(null);
  const filterPoint = useMemo(() => createFilterPredicate(filter), [filter]);
  const finitePointCount = useMemo(() => points.filter(isFinitePoint).length, [points]);
  const filteredPointCount = useMemo(
    () =>
      points
        .filter(isFinitePoint)
        .filter((point, index) => filterPoint(toIndexedPoint(point, index))).length,
    [filterPoint, points],
  );
  const invalidPointCount = points.length - finitePointCount;
  const heatIndex = useMemo(
    () =>
      createHeatMapDensityIndex(points, {
        radius: 88,
        weightMetric: heatMetric,
      }),
    [heatMetric, points],
  );
  const droppedHeatPointCount = points.length - heatIndex.pointCount;

  return (
    <PlaygroundPage
      activePage="map-edge-cases"
      title="Map edge-case lab"
      description="Focused geospatial examples for tricky data shapes: dateline-adjacent points, duplicate coordinates, invalid records, extreme metric values, filter changes, and sparse temporal heat-map frames."
    >
      <div className="grid gap-6">
        <section className="grid gap-4 xl:grid-cols-[1.45fr_0.82fr]">
          <Card className="overflow-hidden rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader className="border-b border-border/60">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  Dateline and duplicates
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {filteredPointCount} filtered points
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {invalidPointCount} invalid skipped
                </Badge>
              </div>
              <div className="space-y-2">
                <CardTitle>Clustered operational edge map</CardTitle>
                <CardDescription className="max-w-3xl text-sm leading-6">
                  The source mixes Pacific dateline crossings, repeated Singapore
                  coordinates, high-latitude sensors, a zero-value control point,
                  and intentionally invalid rows.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ClusteredMap
                clusterRadius={filter === "priority" ? 54 : 88}
                filterPoint={filterPoint}
                fitToData={false}
                initialViewState={MAP_INITIAL_VIEW}
                mapLabel="Clustered operational edge map"
                onFeatureSelect={setSelection}
                onViewportAggregationChange={setSummary}
                points={points}
                style={{ minHeight: 680 }}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
              <CardHeader>
                <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
                  Filters
                </Badge>
                <CardTitle>Cluster input mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(["all", "incidents", "priority"] as const).map((value) => (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={filter === value ? "default" : "outline"}
                      onClick={() => {
                        setSelection(null);
                        setFilter(value);
                      }}
                    >
                      {formatFilterLabel(value)}
                    </Button>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <MetricCard
                    label="Visible points"
                    value={summary ? formatInteger(summary.visiblePointCount) : "\u2014"}
                    hint="Raw points represented by visible points plus clusters."
                  />
                  <MetricCard
                    label="Visible clusters"
                    value={summary ? formatInteger(summary.visibleClusterCount) : "\u2014"}
                    hint="Current cluster count after filtering and zooming."
                  />
                  <MetricCard
                    label="Risk total"
                    value={summary ? formatInteger(Math.round(summary.metrics.risk ?? 0)) : "\u2014"}
                    hint="Finite risk metrics accumulated in the viewport."
                  />
                </div>
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
                {selection ? (
                  <SelectionDetails selection={selection} />
                ) : (
                  <p>
                    Select a cluster or point to inspect edge-case properties and
                    normalized metric totals.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
          <Card className="overflow-hidden rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader className="border-b border-border/60">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  Weighted heat map
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {heatIndex.pointCount} weighted points
                </Badge>
              </div>
              <div className="space-y-2">
                <CardTitle>Metric-weighted incident density</CardTitle>
                <CardDescription className="max-w-3xl text-sm leading-6">
                  Switch between metric keys to check normalization when some rows
                  have zero, negative, missing, or non-finite weights.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 p-5">
              <div className="flex flex-wrap gap-2">
                {(["risk", "dwellHours", "backlog"] as const).map((value) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={heatMetric === value ? "default" : "outline"}
                    onClick={() => {
                      setHeatMetric(value);
                    }}
                  >
                    {heatMetricLabels[value]}
                  </Button>
                ))}
              </div>
              <HeatMap
                fitToData={false}
                heatmapAggregationRadius={96}
                heatmapColorRamp={[
                  [0, "rgba(15, 23, 42, 0)"],
                  [0.18, "#38bdf8"],
                  [0.38, "#22c55e"],
                  [0.62, "#facc15"],
                  [0.82, "#f97316"],
                  [1, "#b91c1c"],
                ]}
                heatmapIntensity={1.35}
                heatmapRadius={{
                  max: 52,
                  maxZoom: 8,
                  min: 14,
                  minZoom: 0,
                }}
                initialViewState={MAP_INITIAL_VIEW}
                mapLabel="Metric-weighted incident density"
                points={points}
                style={{ minHeight: 560 }}
                weightMetric={heatMetric}
              />
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
                Weight audit
              </Badge>
              <CardTitle>{heatMetricLabels[heatMetric]} normalization</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                label="Max weight"
                value={formatInteger(Math.round(heatIndex.maxWeight))}
                hint="Largest positive finite raw weight used for normalization."
              />
              <MetricCard
                label="Dropped rows"
                value={formatInteger(droppedHeatPointCount)}
                hint="Rows with invalid coordinates or unusable selected weights."
              />
              <MetricCard
                label="Raw rows"
                value={formatInteger(points.length)}
                hint="Total source rows, including invalid coordinate records."
              />
              <MetricCard
                label="Finite rows"
                value={formatInteger(finitePointCount)}
                hint="Rows with finite latitude and longitude."
              />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.8fr]">
          <Card className="overflow-hidden rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader className="border-b border-border/60">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  Temporal heat
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  Sparse frames
                </Badge>
              </div>
              <div className="space-y-2">
                <CardTitle>Sparse signal timeline</CardTitle>
                <CardDescription className="max-w-3xl text-sm leading-6">
                  Tracks appear late, disappear with explicit invisible frames, cross
                  the dateline, and reuse positions so temporal slicing and heat
                  scaling can be checked together.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <TemporalHeatMap
                autoPlay
                defaultTime={TEMPORAL_START + TEMPORAL_STEP_MS}
                fitToData={false}
                formatTimeLabel={formatSignalTime}
                heatmapAggregationRadius={84}
                heatmapIntensity={1.25}
                heatmapRadius={{
                  max: 48,
                  maxZoom: 8,
                  min: 12,
                  minZoom: 0,
                }}
                initialViewState={MAP_INITIAL_VIEW}
                mapLabel="Sparse signal temporal heat map"
                playbackRate={TEMPORAL_STEP_MS * 0.85}
                style={{ minHeight: 560 }}
                timeStep={TEMPORAL_STEP_MS / 2}
                tracks={temporalTracks}
                weightMetric="risk"
              />
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                Timeline rows
              </Badge>
              <CardTitle>Temporal stress cases</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Pacific corridor crosses from 179.7E to 179.8W while retaining a
                consistent heat scale.
              </p>
              <p>
                Singapore duplicate tracks occupy the same coordinate at different
                risk levels to exercise weighted aggregation.
              </p>
              <p>
                Recovery frames set <code>visible: false</code> so empty slices and
                disappearing tracks are represented in the playback.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
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
  selection: AggregatedMapFeature<EdgeMapProperties>;
}) {
  if (selection.kind === "cluster") {
    return (
      <div className="space-y-3">
        <p className="text-base font-medium text-foreground">
          Cluster with {formatInteger(selection.pointCount)} records
        </p>
        <p>
          Expansion zoom: {selection.expansionZoom.toFixed(0)}. Risk:{" "}
          {formatInteger(Math.round(selection.metrics.risk ?? 0))}. Backlog:{" "}
          {formatInteger(Math.round(selection.metrics.backlog ?? 0))}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-base font-medium text-foreground">
        {selection.point.label || `Point ${selection.point.id}`}
      </p>
      <p>
        {selection.point.properties.kind}, {selection.point.properties.region},{" "}
        {selection.point.properties.priority} priority.
      </p>
      <p>{selection.point.properties.note}</p>
      <p>
        Risk {formatInteger(Math.round(selection.metrics.risk ?? 0))}, backlog{" "}
        {formatInteger(Math.round(selection.metrics.backlog ?? 0))}, dwell{" "}
        {formatInteger(Math.round(selection.metrics.dwellHours ?? 0))}h.
      </p>
    </div>
  );
}

function createFilterPredicate(filter: EdgeMapFilter) {
  return (point: IndexedMapPoint<EdgeMapProperties>) => {
    if (filter === "incidents") {
      return point.properties.kind === "Incident";
    }

    if (filter === "priority") {
      return point.properties.priority === "High";
    }

    return true;
  };
}

function createEdgeCasePoints(): EdgeMapPoint[] {
  return [
    {
      id: "dateline-fiji",
      label: "Fiji westbound gateway",
      latitude: -17.7134,
      longitude: 178.065,
      metrics: {
        backlog: 180,
        dwellHours: 19,
        risk: 74,
        shipments: 1_840,
      },
      properties: {
        kind: "Gateway",
        note: "Near the 180th meridian with high volume.",
        priority: "High",
        region: "Pacific",
      },
    },
    {
      id: "dateline-samoa",
      label: "Samoa eastbound incident",
      latitude: -13.759,
      longitude: -172.1046,
      metrics: {
        backlog: 90,
        dwellHours: 11,
        risk: 66,
        shipments: 920,
      },
      properties: {
        kind: "Incident",
        note: "Opposite side of the dateline from the Fiji gateway.",
        priority: "High",
        region: "Pacific",
      },
    },
    {
      id: "dateline-kiribati",
      label: "Kiribati sparse sensor",
      latitude: 1.8721,
      longitude: -157.4278,
      metrics: {
        backlog: 4,
        dwellHours: 2,
        risk: 12,
        shipments: 85,
      },
      properties: {
        kind: "Sensor",
        note: "Sparse oceanic point that should not dominate bounds.",
        priority: "Low",
        region: "Pacific",
      },
    },
    {
      id: "polar-svalbard",
      label: "Svalbard high-latitude sensor",
      latitude: 78.2232,
      longitude: 15.6469,
      metrics: {
        backlog: 12,
        dwellHours: 7,
        risk: 31,
        shipments: 120,
      },
      properties: {
        kind: "Sensor",
        note: "High latitude within Web Mercator's practical range.",
        priority: "Medium",
        region: "Arctic",
      },
    },
    {
      id: "singapore-a",
      label: "Singapore gateway A",
      latitude: 1.3521,
      longitude: 103.8198,
      metrics: {
        backlog: 280,
        dwellHours: 26,
        risk: 92,
        shipments: 2_700,
      },
      properties: {
        kind: "Gateway",
        note: "Duplicate coordinate with a large finite metric payload.",
        priority: "High",
        region: "Southeast Asia",
      },
    },
    {
      id: "singapore-b",
      label: "Singapore warehouse B",
      latitude: 1.3521,
      longitude: 103.8198,
      metrics: {
        backlog: 48,
        dwellHours: 0,
        risk: 0,
        shipments: 360,
      },
      properties: {
        kind: "Warehouse",
        note: "Same coordinate with zero heat-map risk weight.",
        priority: "Low",
        region: "Southeast Asia",
      },
    },
    {
      id: "singapore-c",
      label: "Singapore incident C",
      latitude: 1.3521,
      longitude: 103.8198,
      metrics: {
        backlog: 112,
        dwellHours: 34,
        risk: 88,
        shipments: 540,
      },
      properties: {
        kind: "Incident",
        note: "Same coordinate with separate point identity.",
        priority: "High",
        region: "Southeast Asia",
      },
    },
    {
      id: "null-island-control",
      label: "Null island control",
      latitude: 0,
      longitude: 0,
      metrics: {
        backlog: 0,
        dwellHours: -4,
        risk: 0,
        shipments: 0,
      },
      properties: {
        kind: "Sensor",
        note: "Valid coordinate with zero and negative heat-map weights.",
        priority: "Low",
        region: "Control",
      },
    },
    {
      id: "alaska-edge",
      label: "Aleutian transfer incident",
      latitude: 52.7126,
      longitude: 174.1136,
      metrics: {
        backlog: 61,
        dwellHours: 15,
        risk: 58,
        shipments: 480,
      },
      properties: {
        kind: "Incident",
        note: "Northern Pacific edge case near wrapped longitudes.",
        priority: "Medium",
        region: "North Pacific",
      },
    },
    {
      id: "invalid-coordinate",
      label: "Invalid coordinate row",
      latitude: Number.NaN,
      longitude: 28.9784,
      metrics: {
        backlog: 999,
        dwellHours: 99,
        risk: 99,
        shipments: 999,
      },
      properties: {
        kind: "Incident",
        note: "Non-finite latitude should be removed before indexing.",
        priority: "High",
        region: "Invalid",
      },
    },
    {
      id: "nonfinite-metric",
      label: "Non-finite metric row",
      latitude: 41.0082,
      longitude: 28.9784,
      metrics: {
        backlog: Number.POSITIVE_INFINITY,
        dwellHours: 8,
        risk: 22,
        shipments: 140,
      },
      properties: {
        kind: "Warehouse",
        note: "Finite coordinate with a non-finite metric that should be ignored.",
        priority: "Medium",
        region: "Europe",
      },
    },
  ];
}

function createTemporalSignalTracks(): TemporalSignalTrack[] {
  return [
    {
      id: "pacific-crossing",
      label: "Pacific crossing",
      properties: {
        corridor: "Fiji to Samoa",
        signal: "Burst",
      },
      frames: [
        {
          latitude: -17.7134,
          longitude: 179.7,
          metrics: {
            risk: 24,
          },
          time: TEMPORAL_START,
          visible: false,
        },
        {
          latitude: -16.4,
          longitude: 179.92,
          metrics: {
            risk: 96,
          },
          time: TEMPORAL_START + TEMPORAL_STEP_MS,
        },
        {
          latitude: -14.2,
          longitude: -179.84,
          metrics: {
            risk: 72,
          },
          time: TEMPORAL_START + TEMPORAL_STEP_MS * 3,
        },
        {
          latitude: -13.759,
          longitude: -172.1046,
          metrics: {
            risk: 0,
          },
          properties: {
            corridor: "Fiji to Samoa",
            signal: "Recovery",
          },
          time: TEMPORAL_START + TEMPORAL_STEP_MS * 5,
          visible: false,
        },
      ],
    },
    {
      id: "singapore-stacked-a",
      label: "Singapore stacked A",
      properties: {
        corridor: "Singapore port",
        signal: "Idle",
      },
      frames: [
        {
          latitude: 1.3521,
          longitude: 103.8198,
          metrics: {
            risk: 18,
          },
          time: TEMPORAL_START,
        },
        {
          latitude: 1.3521,
          longitude: 103.8198,
          metrics: {
            risk: 86,
          },
          properties: {
            corridor: "Singapore port",
            signal: "Burst",
          },
          time: TEMPORAL_START + TEMPORAL_STEP_MS * 2,
        },
        {
          latitude: 1.3521,
          longitude: 103.8198,
          metrics: {
            risk: 12,
          },
          properties: {
            corridor: "Singapore port",
            signal: "Recovery",
          },
          time: TEMPORAL_START + TEMPORAL_STEP_MS * 4,
        },
      ],
    },
    {
      id: "singapore-stacked-b",
      label: "Singapore stacked B",
      properties: {
        corridor: "Singapore port",
        signal: "Idle",
      },
      frames: [
        {
          latitude: 1.3521,
          longitude: 103.8198,
          metrics: {
            risk: 4,
          },
          time: TEMPORAL_START + TEMPORAL_STEP_MS,
        },
        {
          latitude: 1.3521,
          longitude: 103.8198,
          metrics: {
            risk: 64,
          },
          time: TEMPORAL_START + TEMPORAL_STEP_MS * 2,
        },
        {
          latitude: 1.3521,
          longitude: 103.8198,
          metrics: {
            risk: 0,
          },
          time: TEMPORAL_START + TEMPORAL_STEP_MS * 3,
          visible: false,
        },
      ],
    },
    {
      id: "arctic-sparse",
      label: "Arctic sparse signal",
      properties: {
        corridor: "Svalbard",
        signal: "Burst",
      },
      frames: [
        {
          latitude: 78.2232,
          longitude: 15.6469,
          metrics: {
            risk: 44,
          },
          time: TEMPORAL_START + TEMPORAL_STEP_MS * 2,
        },
      ],
    },
  ];
}

function toIndexedPoint(point: EdgeMapPoint, index: number): IndexedMapPoint<EdgeMapProperties> {
  return {
    id: String(point.id ?? index),
    label: point.label ?? "",
    latitude: point.latitude,
    longitude: point.longitude,
    metrics: point.metrics ?? {},
    properties: point.properties ?? {
      kind: "Sensor",
      note: "",
      priority: "Low",
      region: "Unknown",
    },
  };
}

function isFinitePoint(point: EdgeMapPoint) {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude);
}

function formatFilterLabel(value: EdgeMapFilter) {
  if (value === "incidents") {
    return "Incidents";
  }

  if (value === "priority") {
    return "High priority";
  }

  return "All";
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatSignalTime(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

mountPage(<MapEdgeCasesPage />);
