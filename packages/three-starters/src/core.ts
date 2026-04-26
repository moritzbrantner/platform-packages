import { ExtrudeGeometry, Path, Shape, Vector2 } from "three";

export type HexGridPlane = "xy" | "xz" | "yz";
export type HexGridOffset = [x: number, y: number];
export type HexGridPosition = [x: number, y: number, z: number];

export interface HexGridCell {
  index: number;
  row: number;
  column: number;
  offset: HexGridOffset;
}

export interface HexGridLayout {
  rows: number;
  columns: number;
  radius: number;
  gap: number;
  width: number;
  height: number;
  cells: HexGridCell[];
}

export interface CreateHexGridLayoutOptions {
  rows: number;
  columns: number;
  radius?: number;
  gap?: number;
  center?: boolean;
}

export interface CreateHoneycombCellGeometryOptions {
  radius?: number;
  wallThickness?: number;
  depth?: number;
}

const DEFAULT_RADIUS = 1;
const DEFAULT_GAP = 0.08;
const DEFAULT_WALL_THICKNESS = 0.24;
const DEFAULT_DEPTH = 0.35;
const SQRT_THREE = Math.sqrt(3);
const FLAT_TOP_START_ANGLE_DEGREES = 30;

export function createHexGridLayout({
  rows,
  columns,
  radius = DEFAULT_RADIUS,
  gap = DEFAULT_GAP,
  center = true,
}: CreateHexGridLayoutOptions): HexGridLayout {
  assertPositiveInteger(rows, "rows");
  assertPositiveInteger(columns, "columns");
  assertPositiveNumber(radius, "radius");
  assertNonNegativeNumber(gap, "gap");

  const columnStep = radius * 1.5 + gap;
  const rowStep = radius * SQRT_THREE + gap;
  const hexHeight = radius * SQRT_THREE;

  const rawCells = Array.from({ length: rows * columns }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const offsetX = column * columnStep;
    const offsetY = row * rowStep + (column % 2 === 0 ? 0 : rowStep / 2);

    return {
      index,
      row,
      column,
      offset: [offsetX, offsetY] as HexGridOffset,
    };
  });

  const centeredCells = center ? centerHexGridCells(rawCells, radius, hexHeight) : rawCells;
  const bounds = measureHexGrid(centeredCells, radius, hexHeight);

  return {
    rows,
    columns,
    radius,
    gap,
    width: bounds.width,
    height: bounds.height,
    cells: centeredCells,
  };
}

export function createHoneycombCellGeometry({
  radius = DEFAULT_RADIUS,
  wallThickness = DEFAULT_WALL_THICKNESS,
  depth = DEFAULT_DEPTH,
}: CreateHoneycombCellGeometryOptions = {}): ExtrudeGeometry {
  const shape = createHoneycombCellShape({ radius, wallThickness });
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 1,
    steps: 1,
  });

  geometry.center();

  return geometry;
}

export function createHoneycombCellShape({
  radius = DEFAULT_RADIUS,
  wallThickness = DEFAULT_WALL_THICKNESS,
}: Omit<CreateHoneycombCellGeometryOptions, "depth"> = {}): Shape {
  assertPositiveNumber(radius, "radius");
  assertPositiveNumber(wallThickness, "wallThickness");

  if (wallThickness >= radius) {
    throw new Error("wallThickness must be smaller than radius");
  }

  const outerPoints = createHexagonPoints(radius);
  const innerPoints = createHexagonPoints(radius - wallThickness);
  const shape = polygonToShape(outerPoints);
  const hole = polygonToPath([...innerPoints].reverse());

  shape.holes.push(hole);

  return shape;
}

export function getHexGridCellPosition(
  cell: Pick<HexGridCell, "offset">,
  plane: HexGridPlane = "xy",
): HexGridPosition {
  const [x, y] = cell.offset;

  if (plane === "xz") {
    return [x, 0, y];
  }

  if (plane === "yz") {
    return [0, x, y];
  }

  return [x, y, 0];
}

function centerHexGridCells(
  cells: HexGridCell[],
  radius: number,
  hexHeight: number,
): HexGridCell[] {
  const bounds = measureHexGrid(cells, radius, hexHeight);
  const shiftX = (bounds.minX + bounds.maxX) / 2;
  const shiftY = (bounds.minY + bounds.maxY) / 2;

  return cells.map((cell) => ({
    ...cell,
    offset: [cell.offset[0] - shiftX, cell.offset[1] - shiftY],
  }));
}

function measureHexGrid(cells: HexGridCell[], radius: number, hexHeight: number) {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const cell of cells) {
    minX = Math.min(minX, cell.offset[0] - radius);
    maxX = Math.max(maxX, cell.offset[0] + radius);
    minY = Math.min(minY, cell.offset[1] - hexHeight / 2);
    maxY = Math.max(maxY, cell.offset[1] + hexHeight / 2);
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function createHexagonPoints(radius: number): Vector2[] {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = degreesToRadians(FLAT_TOP_START_ANGLE_DEGREES + index * 60);

    return new Vector2(radius * Math.cos(angle), radius * Math.sin(angle));
  });
}

function polygonToShape(points: Vector2[]): Shape {
  const [firstPoint, ...otherPoints] = points;
  const shape = new Shape();

  shape.moveTo(firstPoint.x, firstPoint.y);

  for (const point of otherPoints) {
    shape.lineTo(point.x, point.y);
  }

  shape.closePath();

  return shape;
}

function polygonToPath(points: Vector2[]): Path {
  const [firstPoint, ...otherPoints] = points;
  const path = new Path();

  path.moveTo(firstPoint.x, firstPoint.y);

  for (const point of otherPoints) {
    path.lineTo(point.x, point.y);
  }

  path.closePath();

  return path;
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
}

function assertPositiveNumber(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
}

function assertNonNegativeNumber(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be zero or a positive number`);
  }
}
