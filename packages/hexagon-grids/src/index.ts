import {
  POLYGON_TO_CELLS_FLAGS,
  UNITS,
  areNeighborCells,
  cellArea,
  cellToBoundary,
  cellToLatLng,
  compactCells,
  getResolution,
  gridDisk,
  gridPathCells,
  isPentagon,
  isValidCell,
  latLngToCell,
  polygonToCells,
  polygonToCellsExperimental,
  uncompactCells,
  type H3Index,
} from "h3-js";

export type HexCellId = H3Index;

export interface HexCoordinate {
  latitude: number;
  longitude: number;
}

export type GeoJsonPosition = [longitude: number, latitude: number];
export type GeoJsonLinearRing = GeoJsonPosition[];

export interface GeoJsonPolygonGeometry {
  type: "Polygon";
  coordinates: GeoJsonLinearRing[];
}

export interface GeoJsonMultiPolygonGeometry {
  type: "MultiPolygon";
  coordinates: GeoJsonLinearRing[][];
}

export interface GeoJsonFeature<TGeometry, TProperties> {
  type: "Feature";
  geometry: TGeometry;
  properties: TProperties;
}

export interface HexPolygon {
  outer: GeoJsonLinearRing;
  holes?: GeoJsonLinearRing[];
}

export type HexPolygonInput =
  | GeoJsonPolygonGeometry
  | GeoJsonMultiPolygonGeometry
  | HexPolygon;

export type HexMetricRecord = Record<string, number>;

export interface HexGridPoint<TProperties = Record<string, unknown>> {
  id: string | number;
  latitude: number;
  longitude: number;
  metrics?: HexMetricRecord;
  properties?: TProperties;
}

export interface HexCellDescriptor {
  cellId: HexCellId;
  resolution: number;
  center: HexCoordinate;
  boundary: GeoJsonLinearRing;
  areaKm2: number;
  pentagon: boolean;
}

export interface HexCellFeatureProperties {
  cellId: HexCellId;
  resolution: number;
  areaKm2: number;
  pentagon: boolean;
}

export interface AggregatePointsToHexGridOptions<TPoint extends HexGridPoint> {
  filterPoint?: (point: TPoint) => boolean;
}

export interface AggregatedHexCell<TPoint extends HexGridPoint>
  extends HexCellDescriptor {
  pointCount: number;
  metrics: HexMetricRecord;
  points: TPoint[];
}

export interface HexGridAggregation<TPoint extends HexGridPoint> {
  resolution: number;
  pointCount: number;
  cellCount: number;
  metrics: HexMetricRecord;
  cells: AggregatedHexCell<TPoint>[];
}

export interface GetHexCellsForPolygonOptions {
  compact?: boolean;
  containment?: HexPolygonContainmentMode;
}

export const HEX_DISTANCE_UNITS = {
  meters: UNITS.m,
  kilometers: UNITS.km,
  radians: UNITS.rads,
} as const;

export const HEX_AREA_UNITS = {
  squareMeters: UNITS.m2,
  squareKilometers: UNITS.km2,
  squareRadians: UNITS.rads2,
} as const;

export const HEX_POLYGON_CONTAINMENT = {
  center: POLYGON_TO_CELLS_FLAGS.containmentCenter,
  full: POLYGON_TO_CELLS_FLAGS.containmentFull,
  overlapping: POLYGON_TO_CELLS_FLAGS.containmentOverlapping,
  overlappingBbox: POLYGON_TO_CELLS_FLAGS.containmentOverlappingBbox,
} as const;

export type HexPolygonContainmentMode = keyof typeof HEX_POLYGON_CONTAINMENT;

export function pointToHexCell(point: HexCoordinate, resolution: number): HexCellId {
  return latLngToCell(point.latitude, point.longitude, resolution);
}

export function isValidHexCell(cellId: HexCellId): boolean {
  return isValidCell(cellId);
}

export function areHexCellsNeighbors(origin: HexCellId, destination: HexCellId): boolean {
  return areNeighborCells(origin, destination);
}

export function getHexCellCenter(cellId: HexCellId): HexCoordinate {
  const [latitude, longitude] = cellToLatLng(cellId);
  return { latitude, longitude };
}

export function getHexCellBoundary(cellId: HexCellId): GeoJsonLinearRing {
  return closeRing(cellToBoundary(cellId, true).map(toGeoJsonPosition));
}

export function getHexCell(cellId: HexCellId): HexCellDescriptor {
  return {
    cellId,
    resolution: getResolution(cellId),
    center: getHexCellCenter(cellId),
    boundary: getHexCellBoundary(cellId),
    areaKm2: cellArea(cellId, HEX_AREA_UNITS.squareKilometers),
    pentagon: isPentagon(cellId),
  };
}

export function getHexCellFeature<TProperties extends Record<string, unknown>>(
  cellId: HexCellId,
  properties?: TProperties,
): GeoJsonFeature<GeoJsonPolygonGeometry, HexCellFeatureProperties & TProperties> {
  const descriptor = getHexCell(cellId);

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [descriptor.boundary],
    },
    properties: {
      cellId: descriptor.cellId,
      resolution: descriptor.resolution,
      areaKm2: descriptor.areaKm2,
      pentagon: descriptor.pentagon,
      ...(properties ?? ({} as TProperties)),
    },
  };
}

export function getHexCellsInDisk(cellId: HexCellId, distance: number): HexCellId[] {
  return gridDisk(cellId, distance);
}

export function getHexGridPath(startCellId: HexCellId, endCellId: HexCellId): HexCellId[] {
  return gridPathCells(startCellId, endCellId);
}

export function compactHexCells(cellIds: HexCellId[]): HexCellId[] {
  return compactCells(deduplicateCellIds(cellIds));
}

export function expandHexCells(cellIds: HexCellId[], resolution: number): HexCellId[] {
  return uncompactCells(deduplicateCellIds(cellIds), resolution);
}

export function getHexCellsForPolygon(
  polygon: HexPolygonInput,
  resolution: number,
  options: GetHexCellsForPolygonOptions = {},
): HexCellId[] {
  const cells = normalizePolygonInput(polygon).flatMap((loops) => {
    if (options.containment && options.containment !== "center") {
      return polygonToCellsExperimental(
        loops.map(normalizeRing),
        resolution,
        HEX_POLYGON_CONTAINMENT[options.containment],
        true,
      );
    }

    return polygonToCells(loops.map(normalizeRing), resolution, true);
  });

  const uniqueCells = deduplicateCellIds(cells);

  return options.compact ? compactHexCells(uniqueCells) : uniqueCells;
}

export function aggregatePointsToHexGrid<TPoint extends HexGridPoint>(
  points: TPoint[],
  resolution: number,
  options: AggregatePointsToHexGridOptions<TPoint> = {},
): HexGridAggregation<TPoint> {
  const cells = new Map<HexCellId, AggregatedHexCell<TPoint>>();
  const totals: HexMetricRecord = {};
  let pointCount = 0;

  for (const point of points) {
    if (options.filterPoint && !options.filterPoint(point)) {
      continue;
    }

    pointCount += 1;
    mergeMetrics(totals, point.metrics);

    const cellId = pointToHexCell(point, resolution);
    const existingCell = cells.get(cellId);

    if (existingCell) {
      existingCell.pointCount += 1;
      existingCell.points.push(point);
      mergeMetrics(existingCell.metrics, point.metrics);
      continue;
    }

    cells.set(cellId, {
      ...getHexCell(cellId),
      pointCount: 1,
      metrics: { ...(point.metrics ?? {}) },
      points: [point],
    });
  }

  const aggregatedCells = Array.from(cells.values()).sort(
    (left, right) => right.pointCount - left.pointCount || left.cellId.localeCompare(right.cellId),
  );

  return {
    resolution,
    pointCount,
    cellCount: aggregatedCells.length,
    metrics: totals,
    cells: aggregatedCells,
  };
}

function normalizePolygonInput(polygon: HexPolygonInput): GeoJsonLinearRing[][] {
  if (isGeoJsonPolygon(polygon)) {
    return [polygon.coordinates];
  }

  if (isGeoJsonMultiPolygon(polygon)) {
    return polygon.coordinates;
  }

  return [[polygon.outer, ...(polygon.holes ?? [])]];
}

function normalizeRing(ring: GeoJsonLinearRing): GeoJsonLinearRing {
  const normalizedRing = ring.map(([longitude, latitude]) => [longitude, latitude] as GeoJsonPosition);

  if (normalizedRing.length < 3) {
    throw new Error("Hex polygon rings must contain at least three coordinates.");
  }

  if (hasSamePosition(normalizedRing[0], normalizedRing[normalizedRing.length - 1])) {
    normalizedRing.pop();
  }

  if (normalizedRing.length < 3) {
    throw new Error("Hex polygon rings must contain at least three unique coordinates.");
  }

  return normalizedRing;
}

function mergeMetrics(target: HexMetricRecord, metrics?: HexMetricRecord): void {
  if (!metrics) {
    return;
  }

  for (const [metricName, value] of Object.entries(metrics)) {
    target[metricName] = (target[metricName] ?? 0) + value;
  }
}

function deduplicateCellIds(cellIds: HexCellId[]): HexCellId[] {
  return Array.from(new Set(cellIds));
}

function closeRing(ring: GeoJsonLinearRing): GeoJsonLinearRing {
  if (ring.length === 0) {
    return [];
  }

  if (hasSamePosition(ring[0], ring[ring.length - 1])) {
    return ring;
  }

  return [...ring, [ring[0][0], ring[0][1]]];
}

function hasSamePosition(left?: GeoJsonPosition, right?: GeoJsonPosition): boolean {
  return Boolean(left && right && left[0] === right[0] && left[1] === right[1]);
}

function toGeoJsonPosition([longitude, latitude]: [number, number]): GeoJsonPosition {
  return [longitude, latitude];
}

function isGeoJsonPolygon(polygon: HexPolygonInput): polygon is GeoJsonPolygonGeometry {
  return "type" in polygon && polygon.type === "Polygon";
}

function isGeoJsonMultiPolygon(polygon: HexPolygonInput): polygon is GeoJsonMultiPolygonGeometry {
  return "type" in polygon && polygon.type === "MultiPolygon";
}
