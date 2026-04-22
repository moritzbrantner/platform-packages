import { useMemo, useState } from "react";

import {
  createBinnedSeriesIndex,
  createDataDensityWindowIndex,
  createGeoPointAggregationIndex,
  getBoundsFromGeoPoints,
  type AggregatedGeoDensityFeature,
  type BinnedSeriesBin,
  type GeoDensityPoint,
  type IndexedDataDensityItem,
  type NumericSeriesPoint,
} from "@moritzbrantner/data-density";
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
  Progress,
  Slider,
} from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

type OperationsRow = {
  account: string;
  id: string;
  latencyMs: number;
  region: string;
  service: string;
  status: "healthy" | "watch" | "incident";
  metrics: {
    events: number;
    latencyBudget: number;
    revenue: number;
  };
};

type FacilityProperties = {
  city: string;
  region: string;
};

const ROW_LIMIT = 9;
const ROW_OVERSCAN = 3;
const FULL_DAY_DOMAIN = [0, 1_439] as [min: number, max: number];
const EUROPE_BOUNDS = [-10.5, 35.5, 31, 59.5] as [
  west: number,
  south: number,
  east: number,
  north: number,
];

const rows = createOperationsRows(4_800);
const seriesPoints = createTrafficSeries(1_440);
const facilityPoints = createFacilityPoints(1_800);
const geoBounds = getBoundsFromGeoPoints(facilityPoints) ?? EUROPE_BOUNDS;

function DataDensityPage() {
  const [rowOffset, setRowOffset] = useState(240);
  const [targetBinCount, setTargetBinCount] = useState(36);
  const [geoZoom, setGeoZoom] = useState(4);

  const rowIndex = useMemo(
    () =>
      createDataDensityWindowIndex(rows, {
        filterItem(row) {
          return row.status !== "healthy" || row.latencyMs > 140;
        },
        getId(row) {
          return row.id;
        },
        getMetrics(row) {
          return row.metrics;
        },
      }),
    [],
  );
  const binnedIndex = useMemo(() => createBinnedSeriesIndex(seriesPoints), []);
  const geoIndex = useMemo(
    () => createGeoPointAggregationIndex(facilityPoints, { radius: 64 }),
    [],
  );
  const rowWindow = rowIndex.getWindow({
    limit: ROW_LIMIT,
    offset: rowOffset,
    overscan: ROW_OVERSCAN,
  });
  const maxRowOffset = Math.max(0, rowWindow.summary.filteredItemCount - ROW_LIMIT);
  const binnedSeries = binnedIndex.getBinnedSeries({
    includeEmptyBins: true,
    targetBinCount,
    xDomain: FULL_DAY_DOMAIN,
  });
  const geoAggregation = geoIndex.getViewportAggregation({
    bounds: EUROPE_BOUNDS,
    zoom: geoZoom,
  });
  const topGeoFeatures = [...geoAggregation.features]
    .sort((left, right) => (right.metrics.load ?? 0) - (left.metrics.load ?? 0))
    .slice(0, 5);

  return (
    <PlaygroundPage
      activePage="data-density"
      title="Data density package examples"
      description="Exercise the shared indexing layer directly: ordered windows for table-like data, chart-sized numeric bins, and viewport-aware geo aggregation with metric totals preserved."
    >
      <section className="grid gap-4 lg:grid-cols-4">
        <MetricCard
          label="Source rows"
          value={formatInteger(rowWindow.summary.totalItemCount)}
          hint="Raw operations records before the alert-focused filter."
        />
        <MetricCard
          label="Filtered rows"
          value={formatInteger(rowWindow.summary.filteredItemCount)}
          hint="Rows eligible for the current window index."
        />
        <MetricCard
          label="Series points"
          value={formatInteger(binnedSeries.summary.pointCount)}
          hint="One point per minute collapsed into display bins."
        />
        <MetricCard
          label="Geo points"
          value={formatInteger(geoAggregation.summary.visiblePointCount)}
          hint="Facilities represented by visible points and clusters."
        />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                createDataDensityWindowIndex
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                overscan {ROW_OVERSCAN}
              </Badge>
            </div>
            <CardTitle>Alert row window</CardTitle>
            <CardDescription>
              Move through thousands of ordered records while rendering only the requested rows plus
              overscan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">Window offset</span>
                <span className="text-muted-foreground">
                  {formatInteger(rowWindow.summary.startIndex)}-
                  {formatInteger(rowWindow.summary.endIndex)}
                </span>
              </div>
              <Slider
                value={[Math.min(rowOffset, maxRowOffset)]}
                min={0}
                max={maxRowOffset}
                step={12}
                onValueChange={(value) => setRowOffset(value[0] ?? 0)}
              />
            </div>

            <div className="grid gap-2">
              {rowWindow.items.map((entry) => (
                <OperationsRowItem key={entry.id} entry={entry} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Window summary
            </Badge>
            <CardTitle>Aggregated metrics travel with the view</CardTitle>
            <CardDescription>
              The summary is computed from the returned window, so a virtualized renderer can keep
              totals visible without scanning the full dataset.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricStrip
              label="Events in returned rows"
              value={formatInteger(rowWindow.summary.metrics.events ?? 0)}
            />
            <MetricStrip
              label="Revenue in returned rows"
              value={formatCurrency(rowWindow.summary.metrics.revenue ?? 0)}
            />
            <MetricStrip
              label="Latency budget"
              value={formatInteger(rowWindow.summary.metrics.latencyBudget ?? 0)}
            />
            <Item variant="muted" className="items-start bg-muted/20">
              <ItemDescription className="line-clamp-none leading-6">
                The same primitive backs dense table, graph node, and timeline views: build an index
                once, request the currently visible slice, and keep the surrounding UI focused on
                compact render data.
              </ItemDescription>
            </Item>
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                createBinnedSeriesIndex
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {targetBinCount} bins
              </Badge>
            </div>
            <CardTitle>Minute traffic collapsed into chart bins</CardTitle>
            <CardDescription>
              The index returns min, max, average, count, and metric totals for each display-sized
              bin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">Target bin count</span>
                <span className="text-muted-foreground">{targetBinCount}</span>
              </div>
              <Slider
                value={[targetBinCount]}
                min={12}
                max={72}
                step={6}
                onValueChange={(value) => setTargetBinCount(value[0] ?? 36)}
              />
            </div>
            <SeriesBars bins={binnedSeries.bins} />
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricStrip
                label="Requests"
                value={formatInteger(binnedSeries.summary.metrics.requests ?? 0)}
              />
              <MetricStrip
                label="Incidents"
                value={formatInteger(binnedSeries.summary.metrics.incidents ?? 0)}
              />
              <MetricStrip label="Samples" value={formatInteger(binnedSeries.summary.binCount)} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                createGeoPointAggregationIndex
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                zoom {geoZoom}
              </Badge>
            </div>
            <CardTitle>Viewport aggregation without a map renderer</CardTitle>
            <CardDescription>
              The geo index can be tested directly, then handed to a map, canvas, SVG layer, or
              server-driven viewport API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">Aggregation zoom</span>
                <span className="text-muted-foreground">
                  {geoAggregation.summary.visibleClusterCount} clusters
                </span>
              </div>
              <Slider
                value={[geoZoom]}
                min={2}
                max={9}
                step={1}
                onValueChange={(value) => setGeoZoom(value[0] ?? 4)}
              />
            </div>
            <GeoPreview features={geoAggregation.features} bounds={geoBounds} />
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricStrip
                label="Load"
                value={formatInteger(geoAggregation.summary.metrics.load ?? 0)}
              />
              <MetricStrip
                label="Demand"
                value={formatInteger(geoAggregation.summary.metrics.demand ?? 0)}
              />
              <MetricStrip
                label="Unclustered"
                value={formatInteger(geoAggregation.summary.visibleUnclusteredCount)}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Highest load features
            </Badge>
            <CardTitle>Cluster and point payloads</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {topGeoFeatures.map((feature) => (
              <FeatureRow key={getFeatureKey(feature)} feature={feature} />
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
              Suggested next package
            </Badge>
            <CardTitle>@moritzbrantner/timelines</CardTitle>
            <CardDescription>
              A dense temporal-event package would reuse row windows for lane virtualization and
              numeric bins for zoomed-out time ranges.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <SuggestionPoint
              title="Event lanes"
              text="Render millions of logs, edits, deployments, or telemetry events as virtualized lanes."
            />
            <SuggestionPoint
              title="Zoom summaries"
              text="Collapse hours or days into bins with count, severity, cost, and duration totals."
            />
            <SuggestionPoint
              title="Selection API"
              text="Expose the visible range and selected events so apps can synchronize charts and detail panes."
            />
          </CardContent>
        </Card>
      </section>
    </PlaygroundPage>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
      <CardContent className="space-y-2 p-5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className="text-sm leading-6 text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function MetricStrip({ label, value }: { label: string; value: string }) {
  return (
    <Item variant="muted" className="items-start bg-muted/20 p-4">
      <ItemContent>
        <ItemDescription className="text-xs uppercase tracking-[0.18em]">{label}</ItemDescription>
        <ItemTitle className="mt-1 text-xl font-semibold">{value}</ItemTitle>
      </ItemContent>
    </Item>
  );
}

function OperationsRowItem({ entry }: { entry: IndexedDataDensityItem<OperationsRow> }) {
  const latencyPercent = Math.min(100, Math.round((entry.item.latencyMs / 260) * 100));

  return (
    <Item
      variant="muted"
      className="grid gap-3 bg-muted/20 p-3 text-sm md:grid-cols-[1.1fr_0.9fr_0.8fr] md:items-center"
    >
      <div>
        <p className="font-medium">{entry.item.account}</p>
        <p className="text-muted-foreground">
          {entry.item.service} / {entry.item.region}
        </p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{entry.item.latencyMs} ms</span>
          <span>{entry.item.status}</span>
        </div>
        <Progress value={latencyPercent} />
      </div>
      <div className="text-left md:text-right">
        <p className="font-medium">{formatInteger(entry.metrics.events)} events</p>
        <p className="text-muted-foreground">{formatCurrency(entry.metrics.revenue)}</p>
      </div>
    </Item>
  );
}

function SeriesBars({ bins }: { bins: Array<BinnedSeriesBin> }) {
  const maxAverage = Math.max(1, ...bins.map((bin) => bin.averageY ?? 0));
  const labelStep = Math.max(1, Math.floor(bins.length / 6));

  return (
    <Item variant="muted" className="block bg-muted/20 p-4">
      <div className="flex h-56 items-end gap-1">
        {bins.map((bin) => {
          const height = Math.max(4, ((bin.averageY ?? 0) / maxAverage) * 100);

          return (
            <div key={bin.index} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
              <div
                className="w-full rounded-t-sm bg-primary"
                style={{ height: `${height}%` }}
                title={`${formatHour(bin.x0)} avg ${Math.round(bin.averageY ?? 0)}`}
              />
              <span className="h-4 text-center text-[10px] text-muted-foreground">
                {bin.index % labelStep === 0 ? formatHour(bin.x0) : ""}
              </span>
            </div>
          );
        })}
      </div>
    </Item>
  );
}

function GeoPreview({
  features,
  bounds,
}: {
  features: Array<AggregatedGeoDensityFeature<FacilityProperties>>;
  bounds: [west: number, south: number, east: number, north: number];
}) {
  const visibleFeatures = features.slice(0, 120);

  return (
    <Item variant="muted" className="relative block min-h-[360px] overflow-hidden bg-muted/20">
      <div className="absolute inset-x-0 top-1/2 border-t border-border/50" />
      <div className="absolute inset-y-0 left-1/2 border-l border-border/50" />
      {visibleFeatures.map((feature) => {
        const [left, top] = projectFeature(feature, bounds);
        const isCluster = feature.kind === "cluster";
        const size = isCluster ? Math.min(64, 24 + Math.log2(feature.pointCount + 1) * 7) : 14;

        return (
          <div
            key={getFeatureKey(feature)}
            className={
              isCluster
                ? "absolute grid place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground shadow-lg shadow-black/20"
                : "absolute rounded-full border-2 border-background bg-chart-2 shadow-md shadow-black/20"
            }
            style={{
              height: size,
              left: `${left}%`,
              top: `${top}%`,
              transform: "translate(-50%, -50%)",
              width: size,
            }}
            title={isCluster ? `${feature.pointCountAbbreviated} facilities` : feature.point.label}
          >
            {isCluster ? feature.pointCountAbbreviated : null}
          </div>
        );
      })}
      <Badge variant="outline" className="absolute bottom-3 left-3 bg-background/85">
        Rendering {visibleFeatures.length} of {features.length} aggregation features
      </Badge>
    </Item>
  );
}

function FeatureRow({ feature }: { feature: AggregatedGeoDensityFeature<FacilityProperties> }) {
  const label =
    feature.kind === "cluster"
      ? `${feature.pointCountAbbreviated} facilities`
      : feature.point.label;

  return (
    <Item
      variant="muted"
      className="grid gap-3 bg-muted/20 p-4 text-sm md:grid-cols-[1fr_auto] md:items-center"
    >
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground">
          {feature.kind === "cluster"
            ? `expands at zoom ${feature.expansionZoom}`
            : `${feature.point.properties.city}, ${feature.point.properties.region}`}
        </p>
      </div>
      <div className="text-left md:text-right">
        <p>{formatInteger(feature.metrics.load ?? 0)} load</p>
        <p className="text-muted-foreground">{formatInteger(feature.metrics.demand ?? 0)} demand</p>
      </div>
    </Item>
  );
}

function SuggestionPoint({ title, text }: { title: string; text: string }) {
  return (
    <Item variant="muted" className="items-start bg-muted/20 p-4">
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription className="line-clamp-none leading-6">{text}</ItemDescription>
      </ItemContent>
    </Item>
  );
}

function createOperationsRows(count: number): OperationsRow[] {
  const regions = ["EMEA", "AMER", "APAC", "LATAM"];
  const services = ["Inference", "Search", "Billing", "Storage", "Streams"];
  const accounts = ["Northstar", "Acme", "Helio", "Umbra", "Iris", "Kite"];

  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin(index / 57) + Math.cos(index / 131);
    const latencyMs = Math.round(80 + Math.abs(wave) * 78 + (index % 19) * 3);
    const events = 18 + (index % 31) + Math.round(Math.abs(wave) * 24);
    const status =
      latencyMs > 190 || index % 97 === 0
        ? "incident"
        : latencyMs > 140 || index % 11 === 0
          ? "watch"
          : "healthy";

    return {
      account: `${accounts[index % accounts.length]} ${1000 + index}`,
      id: `ops-${index}`,
      latencyMs,
      metrics: {
        events,
        latencyBudget: Math.max(0, 240 - latencyMs),
        revenue: events * (18 + (index % 7) * 4),
      },
      region: regions[index % regions.length]!,
      service: services[index % services.length]!,
      status,
    };
  });
}

function createTrafficSeries(count: number): Array<NumericSeriesPoint> {
  return Array.from({ length: count }, (_, minute) => {
    const dayCurve = Math.sin((minute / count) * Math.PI);
    const pulse = Math.sin(minute / 17) * 16 + Math.cos(minute / 43) * 11;
    const requests = Math.max(30, Math.round(140 + dayCurve * 360 + pulse));
    const incidents = minute % 157 === 0 || requests > 485 ? 1 : 0;

    return {
      id: `minute-${minute}`,
      label: formatHour(minute),
      metrics: {
        incidents,
        requests,
      },
      x: minute,
      y: requests,
    };
  });
}

function createFacilityPoints(count: number): Array<GeoDensityPoint<FacilityProperties>> {
  const cities = [
    { city: "London", latitude: 51.5072, longitude: -0.1276, region: "UK" },
    { city: "Paris", latitude: 48.8566, longitude: 2.3522, region: "FR" },
    { city: "Berlin", latitude: 52.52, longitude: 13.405, region: "DE" },
    { city: "Madrid", latitude: 40.4168, longitude: -3.7038, region: "ES" },
    { city: "Milan", latitude: 45.4642, longitude: 9.19, region: "IT" },
    { city: "Warsaw", latitude: 52.2297, longitude: 21.0122, region: "PL" },
    { city: "Amsterdam", latitude: 52.3676, longitude: 4.9041, region: "NL" },
    { city: "Vienna", latitude: 48.2082, longitude: 16.3738, region: "AT" },
  ];

  return Array.from({ length: count }, (_, index) => {
    const city = cities[index % cities.length]!;
    const jitterA = seededNoise(index * 17 + 3) - 0.5;
    const jitterB = seededNoise(index * 29 + 11) - 0.5;
    const load = 20 + (index % 23) * 3 + Math.round(seededNoise(index) * 32);

    return {
      id: `facility-${index}`,
      label: `${city.city} facility ${index + 1}`,
      latitude: city.latitude + jitterA * 2.1,
      longitude: city.longitude + jitterB * 3.2,
      metrics: {
        demand: Math.round(load * (1.7 + seededNoise(index + 9))),
        load,
      },
      properties: {
        city: city.city,
        region: city.region,
      },
    };
  });
}

function seededNoise(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;

  return value - Math.floor(value);
}

function projectFeature(
  feature: AggregatedGeoDensityFeature<FacilityProperties>,
  bounds: [west: number, south: number, east: number, north: number],
) {
  const [west, south, east, north] = bounds;
  const [longitude, latitude] = feature.coordinates;
  const left = ((longitude - west) / (east - west)) * 100;
  const top = 100 - ((latitude - south) / (north - south)) * 100;

  return [clamp(left, 4, 96), clamp(top, 5, 95)] as const;
}

function getFeatureKey(feature: AggregatedGeoDensityFeature<FacilityProperties>) {
  return feature.kind === "cluster" ? `cluster-${feature.clusterId}` : `point-${feature.point.id}`;
}

function formatHour(minute: number) {
  const hours = Math.floor(minute / 60);
  const minutes = Math.floor(minute % 60);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("en").format(Math.round(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

mountPage(<DataDensityPage />);
