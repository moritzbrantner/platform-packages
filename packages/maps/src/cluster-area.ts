import { Delaunay } from "d3-delaunay";

type Coordinate = [longitude: number, latitude: number];
type Bounds = [west: number, south: number, east: number, north: number];
type ProjectedPoint = {
  coordinate: Coordinate;
  x: number;
  y: number;
};
type Edge = {
  from: number;
  to: number;
};

const DEFAULT_SEGMENTS = 24;
const ALPHA_MULTIPLIERS = [2.2, 3, 4.2, 6];

export type ClusterVoronoiInput = {
  clusterId: number | string;
  coordinates: Coordinate;
  boundary?: readonly Coordinate[];
};

export type ClusterVoronoiBoundarySegment = {
  clusterIds: [number | string, number | string | null];
  clusterIndexes: [number, number | null];
  coordinates: [Coordinate, Coordinate];
};

export function createClusterAreaRing(
  points: readonly Coordinate[],
  center: Coordinate,
): Coordinate[] | null {
  if (points.length === 0) {
    return null;
  }

  const deduped = dedupeCoordinates(points);

  if (deduped.length === 1) {
    return createEllipseRing(center, 0.08, 0.06);
  }

  if (deduped.length === 2) {
    return createBoundsRing(deduped, center, 0.12);
  }

  const projectedPoints = projectPoints(deduped, center);
  const delaunay = Delaunay.from(
    projectedPoints,
    (point: ProjectedPoint) => point.x,
    (point: ProjectedPoint) => point.y,
  );
  const alphaLoops = buildAlphaLoops(projectedPoints, delaunay);

  if (alphaLoops.length > 0) {
    const selectedLoop =
      selectLoopContainingCenter(alphaLoops, center) ?? selectLargestLoop(alphaLoops);

    if (selectedLoop) {
      return closeRing(selectedLoop);
    }
  }

  return closeRing(buildConvexHull(deduped));
}

export function createClusterVoronoiCells(
  clusters: readonly ClusterVoronoiInput[],
  bounds: Bounds,
) {
  if (clusters.length === 0) {
    return new Map<ClusterVoronoiInput["clusterId"], Coordinate[]>();
  }

  const context = createProjectedClusterContext(clusters, bounds);
  const cells = new Map<ClusterVoronoiInput["clusterId"], Coordinate[]>();

  for (const cell of createProjectedClusterCells(context)) {
    if (!cell) {
      continue;
    }

    cells.set(
      context.projectedClusters[cell.clusterIndex]!.clusterId,
      cell.ring.map((point) => context.projection.unproject(point)),
    );
  }

  return cells;
}

export function createClusterVoronoiBoundarySegments(
  clusters: readonly ClusterVoronoiInput[],
  bounds: Bounds,
  options: {
    includeOuterEdges?: boolean;
  } = {},
) {
  if (clusters.length === 0) {
    return [] as ClusterVoronoiBoundarySegment[];
  }

  const { includeOuterEdges = true } = options;
  const context = createProjectedClusterContext(clusters, bounds);
  const edgeMap = new Map<
    string,
    {
      coordinates: [Coordinate, Coordinate];
      owners: Array<{
        clusterId: ClusterVoronoiInput["clusterId"];
        clusterIndex: number;
      }>;
    }
  >();

  for (const cell of createProjectedClusterCells(context)) {
    if (!cell) {
      continue;
    }

    const ring = removeClosingPoint(cell.ring);

    for (let pointIndex = 0; pointIndex < ring.length; pointIndex += 1) {
      const start = ring[pointIndex]!;
      const end = ring[(pointIndex + 1) % ring.length]!;

      if (samePointWithTolerance(start, end)) {
        continue;
      }

      const normalizedEdge = normalizeEdge(start, end);
      const existingEdge = edgeMap.get(normalizedEdge.key);

      if (existingEdge) {
        if (
          !existingEdge.owners.some((owner) => owner.clusterIndex === cell.clusterIndex)
        ) {
          existingEdge.owners.push({
            clusterId: context.projectedClusters[cell.clusterIndex]!.clusterId,
            clusterIndex: cell.clusterIndex,
          });
        }

        continue;
      }

      edgeMap.set(normalizedEdge.key, {
        coordinates: normalizedEdge.coordinates,
        owners: [
          {
            clusterId: context.projectedClusters[cell.clusterIndex]!.clusterId,
            clusterIndex: cell.clusterIndex,
          },
        ],
      });
    }
  }

  return [...edgeMap.values()]
    .flatMap((edge) => {
      const sortedOwners = [...edge.owners].sort(
        (left, right) => left.clusterIndex - right.clusterIndex,
      );

      if (sortedOwners.length === 1) {
        if (!includeOuterEdges) {
          return [];
        }

        return [
          {
            clusterIds: [sortedOwners[0]!.clusterId, null],
            clusterIndexes: [sortedOwners[0]!.clusterIndex, null],
            coordinates: edge.coordinates.map((coordinate) =>
              context.projection.unproject(coordinate),
            ) as [Coordinate, Coordinate],
          },
        ];
      }

      const distinctClusterIds = new Set(
        sortedOwners.map((owner) => serializeClusterId(owner.clusterId)),
      );

      if (distinctClusterIds.size <= 1) {
        return [];
      }

      return [
        {
          clusterIds: [sortedOwners[0]!.clusterId, sortedOwners[1]!.clusterId],
          clusterIndexes: [sortedOwners[0]!.clusterIndex, sortedOwners[1]!.clusterIndex],
          coordinates: edge.coordinates.map((coordinate) =>
            context.projection.unproject(coordinate),
          ) as [Coordinate, Coordinate],
        },
      ];
    })
    .filter((segment) => segment.coordinates.length === 2);
}

export function createClusterBoundaryMidpoints(
  clusters: readonly ClusterVoronoiInput[],
  bounds: Bounds,
) {
  if (clusters.length < 2) {
    return new Map<ClusterVoronoiInput["clusterId"], Coordinate[]>();
  }

  const context = createProjectedClusterContext(clusters, bounds);

  if (!hasProjectedBoundaries(context.projectedClusters)) {
    return new Map<ClusterVoronoiInput["clusterId"], Coordinate[]>();
  }

  const midpoints = new Map<ClusterVoronoiInput["clusterId"], Coordinate[]>();

  for (let clusterIndex = 0; clusterIndex < context.projectedClusters.length; clusterIndex += 1) {
    for (const neighborIndex of getComparableClusterIndexes(
      clusterIndex,
      context.neighborIndexes,
      context.projectedClusters.length,
    )) {
      if (neighborIndex <= clusterIndex) {
        continue;
      }

      const guide = getBoundaryGuide(
        context.projectedClusters[clusterIndex]!,
        context.projectedClusters[neighborIndex]!,
      );

      if (!guide) {
        continue;
      }

      const midpoint = context.projection.unproject(guide.midpoint);
      pushCoordinate(midpoints, context.projectedClusters[clusterIndex]!.clusterId, midpoint);
      pushCoordinate(midpoints, context.projectedClusters[neighborIndex]!.clusterId, midpoint);
    }
  }

  return midpoints;
}

function createProjectedClusterContext(
  clusters: readonly ClusterVoronoiInput[],
  bounds: Bounds,
) {
  const projection = createProjectionFromBounds(bounds);
  const projectedClusters = clusters.map((cluster) => ({
    clusterId: cluster.clusterId,
    center: projection.project(cluster.coordinates),
    boundary:
      cluster.boundary && cluster.boundary.length >= 3
        ? removeClosingPoint(cluster.boundary).map((point) => projection.project(point))
        : null,
  }));
  const projectedBoundsRing: Coordinate[] = [
    projection.project([bounds[0], bounds[1]]),
    projection.project([bounds[2], bounds[1]]),
    projection.project([bounds[2], bounds[3]]),
    projection.project([bounds[0], bounds[3]]),
  ];
  const projectedBounds: [number, number, number, number] = [
    projectedBoundsRing[0]![0],
    projectedBoundsRing[0]![1],
    projectedBoundsRing[2]![0],
    projectedBoundsRing[2]![1],
  ];
  const delaunay = Delaunay.from(
    projectedClusters,
    (cluster) => cluster.center[0],
    (cluster) => cluster.center[1],
  );
  const neighborIndexes = new Map<number, number[]>();

  for (let clusterIndex = 0; clusterIndex < projectedClusters.length; clusterIndex += 1) {
    neighborIndexes.set(clusterIndex, [...delaunay.neighbors(clusterIndex)]);
  }

  return {
    delaunay,
    neighborIndexes,
    projectedBounds,
    projectedBoundsRing,
    projectedClusters,
    projection,
  };
}

function createProjectedClusterCells(
  context: ReturnType<typeof createProjectedClusterContext>,
) {
  return hasProjectedBoundaries(context.projectedClusters)
    ? createBoundaryGuidedProjectedClusterCells(context)
    : createCenterProjectedClusterCells(context);
}

function createCenterProjectedClusterCells(
  context: ReturnType<typeof createProjectedClusterContext>,
) {
  const voronoi = context.delaunay.voronoi(context.projectedBounds);
  const cells: Array<
    | {
        clusterIndex: number;
        ring: Coordinate[];
      }
    | null
  > = [];

  for (let clusterIndex = 0; clusterIndex < context.projectedClusters.length; clusterIndex += 1) {
    const polygon = voronoi.cellPolygon(clusterIndex);

    if (!polygon || polygon.length < 3) {
      cells.push(null);
      continue;
    }

    const ring = closeRing(polygon.slice(0, -1).map(([x, y]) => [x, y] as Coordinate));

    if (ring.length >= 4) {
      cells.push({ clusterIndex, ring });
      continue;
    }

    cells.push(null);
  }

  return cells;
}

function createBoundaryGuidedProjectedClusterCells(
  context: ReturnType<typeof createProjectedClusterContext>,
) {
  const cells: Array<
    | {
        clusterIndex: number;
        ring: Coordinate[];
      }
    | null
  > = [];

  for (let clusterIndex = 0; clusterIndex < context.projectedClusters.length; clusterIndex += 1) {
    const projectedCluster = context.projectedClusters[clusterIndex]!;
    let cell = closeRing(context.projectedBoundsRing);

    for (const neighborIndex of getComparableClusterIndexes(
      clusterIndex,
      context.neighborIndexes,
      context.projectedClusters.length,
    )) {
      const guide = getBoundaryGuide(
        projectedCluster,
        context.projectedClusters[neighborIndex]!,
      );

      if (!guide) {
        continue;
      }

      const clippedCell = clipRingToHalfPlane(
        cell,
        guide.currentPoint,
        guide.otherPoint,
      );

      if (!clippedCell) {
        cell = [];
        break;
      }

      cell = clippedCell;
    }

    cells.push(cell.length >= 4 ? { clusterIndex, ring: cell } : null);
  }

  return cells;
}

function hasProjectedBoundaries(
  clusters: ReadonlyArray<{ boundary: readonly Coordinate[] | null }>,
) {
  return clusters.every((cluster) => (cluster.boundary?.length ?? 0) >= 3);
}

function getComparableClusterIndexes(
  clusterIndex: number,
  neighborIndexes: ReadonlyMap<number, readonly number[]>,
  clusterCount: number,
) {
  const neighbors = neighborIndexes.get(clusterIndex) ?? [];

  if (neighbors.length > 0) {
    return neighbors;
  }

  const allOthers: number[] = [];

  for (let index = 0; index < clusterCount; index += 1) {
    if (index !== clusterIndex) {
      allOthers.push(index);
    }
  }

  return allOthers;
}

function getBoundaryGuide(
  current: {
    center: Coordinate;
    boundary: readonly Coordinate[] | null;
  },
  other: {
    center: Coordinate;
    boundary: readonly Coordinate[] | null;
  },
) {
  const boundaryPair =
    current.boundary && other.boundary
      ? findClosestBoundaryPair(current.boundary, other.boundary)
      : null;

  if (
    boundaryPair &&
    getCoordinateDistanceSquared(boundaryPair.currentPoint, boundaryPair.otherPoint) > 1e-12
  ) {
    return {
      ...boundaryPair,
      midpoint: getMidpoint(boundaryPair.currentPoint, boundaryPair.otherPoint),
    };
  }

  if (getCoordinateDistanceSquared(current.center, other.center) <= 1e-12) {
    return null;
  }

  return {
    currentPoint: current.center,
    otherPoint: other.center,
    midpoint: getMidpoint(current.center, other.center),
  };
}

function findClosestBoundaryPair(
  currentBoundary: readonly Coordinate[],
  otherBoundary: readonly Coordinate[],
) {
  let bestPair:
    | {
        currentPoint: Coordinate;
        otherPoint: Coordinate;
      }
    | null = null;
  let minimumDistance = Number.POSITIVE_INFINITY;

  for (const currentPoint of currentBoundary) {
    for (let index = 0; index < otherBoundary.length; index += 1) {
      const segmentStart = otherBoundary[index]!;
      const segmentEnd = otherBoundary[(index + 1) % otherBoundary.length]!;
      const otherPoint = getClosestPointOnSegment(currentPoint, segmentStart, segmentEnd);
      const distance = getCoordinateDistanceSquared(currentPoint, otherPoint);

      if (distance < minimumDistance) {
        minimumDistance = distance;
        bestPair = { currentPoint, otherPoint };
      }
    }
  }

  for (const otherPoint of otherBoundary) {
    for (let index = 0; index < currentBoundary.length; index += 1) {
      const segmentStart = currentBoundary[index]!;
      const segmentEnd = currentBoundary[(index + 1) % currentBoundary.length]!;
      const currentPoint = getClosestPointOnSegment(otherPoint, segmentStart, segmentEnd);
      const distance = getCoordinateDistanceSquared(currentPoint, otherPoint);

      if (distance < minimumDistance) {
        minimumDistance = distance;
        bestPair = { currentPoint, otherPoint };
      }
    }
  }

  return bestPair;
}

function getClosestPointOnSegment(
  point: Coordinate,
  segmentStart: Coordinate,
  segmentEnd: Coordinate,
): Coordinate {
  const segment: Coordinate = [
    segmentEnd[0] - segmentStart[0],
    segmentEnd[1] - segmentStart[1],
  ];
  const segmentLengthSquared = getCoordinateDistanceSquared(segmentStart, segmentEnd);

  if (segmentLengthSquared <= 1e-12) {
    return [...segmentStart] as Coordinate;
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point[0] - segmentStart[0]) * segment[0] +
        (point[1] - segmentStart[1]) * segment[1]) /
        segmentLengthSquared,
    ),
  );

  return [segmentStart[0] + segment[0] * t, segmentStart[1] + segment[1] * t];
}

function clipRingToHalfPlane(
  subjectRing: readonly Coordinate[],
  currentPoint: Coordinate,
  otherPoint: Coordinate,
) {
  const subject = removeClosingPoint(subjectRing);

  if (subject.length < 3) {
    return null;
  }

  const midpoint = getMidpoint(currentPoint, otherPoint);
  const normal: Coordinate = [
    otherPoint[0] - currentPoint[0],
    otherPoint[1] - currentPoint[1],
  ];

  if (getCoordinateDistanceSquared(currentPoint, otherPoint) <= 1e-12) {
    return closeRing(subject);
  }

  const output: Coordinate[] = [];
  let previousPoint = subject.at(-1)!;
  let previousInside = isInsideHalfPlane(previousPoint, midpoint, normal);

  for (const current of subject) {
    const currentInside = isInsideHalfPlane(current, midpoint, normal);

    if (currentInside !== previousInside) {
      const intersection = getHalfPlaneIntersection(
        previousPoint,
        current,
        midpoint,
        normal,
      );

      if (intersection) {
        output.push(intersection);
      }
    }

    if (currentInside) {
      output.push(current);
    }

    previousPoint = current;
    previousInside = currentInside;
  }

  const compacted = compactRing(output);

  if (compacted.length < 3) {
    return null;
  }

  return closeRing(compacted);
}

function isInsideHalfPlane(
  point: Coordinate,
  midpoint: Coordinate,
  normal: Coordinate,
) {
  return (
    (point[0] - midpoint[0]) * normal[0] + (point[1] - midpoint[1]) * normal[1] <= 1e-9
  );
}

function getHalfPlaneIntersection(
  segmentStart: Coordinate,
  segmentEnd: Coordinate,
  midpoint: Coordinate,
  normal: Coordinate,
): Coordinate | null {
  const direction: Coordinate = [
    segmentEnd[0] - segmentStart[0],
    segmentEnd[1] - segmentStart[1],
  ];
  const denominator = direction[0] * normal[0] + direction[1] * normal[1];

  if (Math.abs(denominator) <= 1e-12) {
    return null;
  }

  const t =
    ((midpoint[0] - segmentStart[0]) * normal[0] +
      (midpoint[1] - segmentStart[1]) * normal[1]) /
    denominator;

  return [segmentStart[0] + direction[0] * t, segmentStart[1] + direction[1] * t];
}

function compactRing(points: readonly Coordinate[]) {
  const compacted: Coordinate[] = [];

  for (const point of points) {
    if (!samePointWithTolerance(point, compacted.at(-1))) {
      compacted.push(point);
    }
  }

  if (samePointWithTolerance(compacted[0], compacted.at(-1))) {
    compacted.pop();
  }

  return compacted;
}

function samePointWithTolerance(left: Coordinate | undefined, right: Coordinate | undefined) {
  if (!left || !right) {
    return false;
  }

  return Math.abs(left[0] - right[0]) <= 1e-9 && Math.abs(left[1] - right[1]) <= 1e-9;
}

function getCoordinateDistanceSquared(first: Coordinate, second: Coordinate) {
  const deltaX = first[0] - second[0];
  const deltaY = first[1] - second[1];

  return deltaX * deltaX + deltaY * deltaY;
}

function getMidpoint(first: Coordinate, second: Coordinate): Coordinate {
  return [(first[0] + second[0]) / 2, (first[1] + second[1]) / 2];
}

function pushCoordinate(
  coordinateMap: Map<ClusterVoronoiInput["clusterId"], Coordinate[]>,
  clusterId: ClusterVoronoiInput["clusterId"],
  coordinate: Coordinate,
) {
  const coordinates = coordinateMap.get(clusterId);

  if (coordinates) {
    coordinates.push(coordinate);
    return;
  }

  coordinateMap.set(clusterId, [coordinate]);
}

function normalizeEdge(start: Coordinate, end: Coordinate) {
  const coordinates =
    compareCoordinates(start, end) <= 0
      ? ([start, end] as [Coordinate, Coordinate])
      : ([end, start] as [Coordinate, Coordinate]);

  return {
    coordinates,
    key: `${formatCoordinateKey(coordinates[0])}:${formatCoordinateKey(coordinates[1])}`,
  };
}

function compareCoordinates(left: Coordinate, right: Coordinate) {
  if (left[0] === right[0]) {
    return left[1] - right[1];
  }

  return left[0] - right[0];
}

function formatCoordinateKey(point: Coordinate) {
  return `${point[0].toFixed(9)}:${point[1].toFixed(9)}`;
}

function serializeClusterId(clusterId: ClusterVoronoiInput["clusterId"]) {
  return `${typeof clusterId}:${String(clusterId)}`;
}

export function clipRingToPolygon(
  subjectRing: readonly Coordinate[],
  clipRing: readonly Coordinate[],
) {
  const subject = removeClosingPoint(subjectRing);
  const clip = removeClosingPoint(clipRing);

  if (subject.length < 3 || clip.length < 3) {
    return null;
  }

  let output = [...subject];
  const clipOrientation = Math.sign(getSignedArea(clip)) || 1;

  for (let index = 0; index < clip.length; index += 1) {
    const clipStart = clip[index]!;
    const clipEnd = clip[(index + 1) % clip.length]!;
    const input = output;

    output = [];

    if (input.length === 0) {
      break;
    }

    let previousPoint = input.at(-1)!;

    for (const currentPoint of input) {
      const currentInside = isInsideClipEdge(
        currentPoint,
        clipStart,
        clipEnd,
        clipOrientation,
      );
      const previousInside = isInsideClipEdge(
        previousPoint,
        clipStart,
        clipEnd,
        clipOrientation,
      );

      if (currentInside) {
        if (!previousInside) {
          const intersection = getIntersection(previousPoint, currentPoint, clipStart, clipEnd);

          if (intersection) {
            output.push(intersection);
          }
        }

        output.push(currentPoint);
      } else if (previousInside) {
        const intersection = getIntersection(previousPoint, currentPoint, clipStart, clipEnd);

        if (intersection) {
          output.push(intersection);
        }
      }

      previousPoint = currentPoint;
    }
  }

  if (output.length < 3) {
    return null;
  }

  return closeRing(output);
}

function dedupeCoordinates(points: readonly Coordinate[]) {
  const seen = new Set<string>();
  const result: Coordinate[] = [];

  for (const point of points) {
    const key = `${point[0].toFixed(6)}:${point[1].toFixed(6)}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(point);
  }

  return result;
}

function createProjectionFromBounds(bounds: Bounds) {
  const centerLongitude = (bounds[0] + bounds[2]) / 2;
  const centerLatitude = (bounds[1] + bounds[3]) / 2;
  const scale = Math.cos((centerLatitude * Math.PI) / 180);

  return {
    project(coordinate: Coordinate): Coordinate {
      return [
        (coordinate[0] - centerLongitude) * scale,
        coordinate[1] - centerLatitude,
      ];
    },
    unproject(coordinate: Coordinate): Coordinate {
      return [
        coordinate[0] / (scale || Number.EPSILON) + centerLongitude,
        coordinate[1] + centerLatitude,
      ];
    },
  };
}

function projectPoints(points: readonly Coordinate[], center: Coordinate) {
  const scale = Math.cos((center[1] * Math.PI) / 180);

  return points.map((coordinate) => ({
    coordinate,
    x: (coordinate[0] - center[0]) * scale,
    y: coordinate[1] - center[1],
  }));
}

function buildAlphaLoops(
  points: readonly ProjectedPoint[],
  delaunay: Delaunay<ProjectedPoint>,
) {
  const nearestNeighborDistance = getNearestNeighborDistance(points, delaunay);

  for (const multiplier of ALPHA_MULTIPLIERS) {
    const loops = extractAlphaLoops(points, delaunay, nearestNeighborDistance * multiplier);

    if (loops.length > 0) {
      return loops;
    }
  }

  return [];
}

function getNearestNeighborDistance(
  points: readonly ProjectedPoint[],
  delaunay: Delaunay<ProjectedPoint>,
) {
  const distances: number[] = [];

  for (let pointIndex = 0; pointIndex < points.length; pointIndex += 1) {
    let minimumDistance = Number.POSITIVE_INFINITY;

    for (const neighborIndex of delaunay.neighbors(pointIndex)) {
      minimumDistance = Math.min(
        minimumDistance,
        distance(points[pointIndex]!, points[neighborIndex]!),
      );
    }

    if (Number.isFinite(minimumDistance)) {
      distances.push(minimumDistance);
    }
  }

  distances.sort((left, right) => left - right);

  return distances[Math.floor(distances.length / 2)] ?? 0.05;
}

function extractAlphaLoops(
  points: readonly ProjectedPoint[],
  delaunay: Delaunay<ProjectedPoint>,
  alphaRadius: number,
) {
  const boundaryEdges = new Map<string, Edge>();
  const triangles = delaunay.triangles;

  for (let triangleIndex = 0; triangleIndex < triangles.length; triangleIndex += 3) {
    const a = triangles[triangleIndex]!;
    const b = triangles[triangleIndex + 1]!;
    const c = triangles[triangleIndex + 2]!;

    if (getCircumradius(points[a]!, points[b]!, points[c]!) > alphaRadius) {
      continue;
    }

    toggleBoundaryEdge(boundaryEdges, a, b);
    toggleBoundaryEdge(boundaryEdges, b, c);
    toggleBoundaryEdge(boundaryEdges, c, a);
  }

  if (boundaryEdges.size === 0) {
    return [];
  }

  return buildLoopsFromEdges(boundaryEdges, points);
}

function getCircumradius(
  first: ProjectedPoint,
  second: ProjectedPoint,
  third: ProjectedPoint,
) {
  const sideA = distance(second, third);
  const sideB = distance(first, third);
  const sideC = distance(first, second);
  const area = Math.abs(cross(first, second, third)) / 2;

  if (area <= Number.EPSILON) {
    return Number.POSITIVE_INFINITY;
  }

  return (sideA * sideB * sideC) / (4 * area);
}

function toggleBoundaryEdge(
  boundaryEdges: Map<string, Edge>,
  startIndex: number,
  endIndex: number,
) {
  const normalizedKey =
    startIndex < endIndex
      ? `${startIndex}:${endIndex}`
      : `${endIndex}:${startIndex}`;

  if (boundaryEdges.has(normalizedKey)) {
    boundaryEdges.delete(normalizedKey);
    return;
  }

  boundaryEdges.set(normalizedKey, { from: startIndex, to: endIndex });
}

function buildLoopsFromEdges(
  boundaryEdges: Map<string, Edge>,
  points: readonly ProjectedPoint[],
) {
  const outgoingEdges = new Map<number, Edge[]>();

  for (const edge of boundaryEdges.values()) {
    pushEdge(outgoingEdges, edge.from, edge);
    pushEdge(outgoingEdges, edge.to, {
      from: edge.to,
      to: edge.from,
    });
  }

  const visitedEdges = new Set<string>();
  const loops: Coordinate[][] = [];

  for (const edge of boundaryEdges.values()) {
    const edgeKey = `${edge.from}:${edge.to}`;

    if (visitedEdges.has(edgeKey)) {
      continue;
    }

    const loop = traceLoop(edge, outgoingEdges, visitedEdges, points);

    if (loop.length >= 3) {
      loops.push(ensureCounterClockwise(loop));
    }
  }

  return loops;
}

function pushEdge(edgeMap: Map<number, Edge[]>, pointIndex: number, edge: Edge) {
  const edges = edgeMap.get(pointIndex);

  if (edges) {
    edges.push(edge);
    return;
  }

  edgeMap.set(pointIndex, [edge]);
}

function traceLoop(
  startEdge: Edge,
  outgoingEdges: Map<number, Edge[]>,
  visitedEdges: Set<string>,
  points: readonly ProjectedPoint[],
) {
  const loop: Coordinate[] = [];
  let previousIndex = startEdge.from;
  let currentIndex = startEdge.to;

  loop.push(points[startEdge.from]!.coordinate);
  visitedEdges.add(`${startEdge.from}:${startEdge.to}`);

  while (true) {
    loop.push(points[currentIndex]!.coordinate);

    const nextEdge = chooseNextEdge(
      previousIndex,
      currentIndex,
      outgoingEdges.get(currentIndex) ?? [],
      points,
      visitedEdges,
      startEdge.from,
    );

    if (!nextEdge) {
      return [];
    }

    const nextEdgeKey = `${nextEdge.from}:${nextEdge.to}`;

    if (visitedEdges.has(nextEdgeKey)) {
      return [];
    }

    visitedEdges.add(nextEdgeKey);
    previousIndex = currentIndex;
    currentIndex = nextEdge.to;

    if (currentIndex === startEdge.from) {
      return loop;
    }
  }
}

function chooseNextEdge(
  previousIndex: number,
  currentIndex: number,
  candidateEdges: readonly Edge[],
  points: readonly ProjectedPoint[],
  visitedEdges: Set<string>,
  startIndex: number,
) {
  const currentPoint = points[currentIndex]!;
  const previousPoint = points[previousIndex]!;
  const incomingAngle = Math.atan2(
    currentPoint.y - previousPoint.y,
    currentPoint.x - previousPoint.x,
  );
  let bestEdge: Edge | null = null;
  let bestTurn = Number.POSITIVE_INFINITY;

  for (const edge of candidateEdges) {
    const edgeKey = `${edge.from}:${edge.to}`;

    if (visitedEdges.has(edgeKey)) {
      continue;
    }

    if (edge.to === previousIndex) {
      continue;
    }

    if (edge.to === startIndex && candidateEdges.length > 1) {
      const remainingUnvisited = candidateEdges.some((candidate) => {
        if (candidate.to === previousIndex || candidate.to === startIndex) {
          return false;
        }

        return !visitedEdges.has(`${candidate.from}:${candidate.to}`);
      });

      if (remainingUnvisited) {
        continue;
      }
    }

    const nextPoint = points[edge.to]!;
    const outgoingAngle = Math.atan2(
      nextPoint.y - currentPoint.y,
      nextPoint.x - currentPoint.x,
    );
    const rightTurn = normalizeAngle(incomingAngle - outgoingAngle);

    if (rightTurn < bestTurn) {
      bestTurn = rightTurn;
      bestEdge = edge;
    }
  }

  return bestEdge;
}

function selectLoopContainingCenter(loops: readonly Coordinate[][], center: Coordinate) {
  const containingLoops = loops.filter((loop) => pointInPolygon(center, loop));

  if (containingLoops.length === 0) {
    return null;
  }

  return selectLargestLoop(containingLoops);
}

function selectLargestLoop(loops: readonly Coordinate[][]) {
  let largestLoop: Coordinate[] | null = null;
  let largestArea = Number.NEGATIVE_INFINITY;

  for (const loop of loops) {
    const area = Math.abs(getSignedArea(loop));

    if (area > largestArea) {
      largestArea = area;
      largestLoop = loop;
    }
  }

  return largestLoop;
}

function pointInPolygon(point: Coordinate, polygon: readonly Coordinate[]) {
  let isInside = false;

  for (
    let currentIndex = 0, previousIndex = polygon.length - 1;
    currentIndex < polygon.length;
    previousIndex = currentIndex, currentIndex += 1
  ) {
    const current = polygon[currentIndex]!;
    const previous = polygon[previousIndex]!;
    const intersects =
      current[1] > point[1] !== previous[1] > point[1] &&
      point[0] <
        ((previous[0] - current[0]) * (point[1] - current[1])) /
          (previous[1] - current[1] || Number.EPSILON) +
          current[0];

    if (intersects) {
      isInside = !isInside;
    }
  }

  return isInside;
}

function ensureCounterClockwise(loop: readonly Coordinate[]) {
  return getSignedArea(loop) >= 0 ? [...loop] : [...loop].reverse();
}

function getSignedArea(loop: readonly Coordinate[]) {
  let area = 0;

  for (let index = 0; index < loop.length; index += 1) {
    const current = loop[index]!;
    const next = loop[(index + 1) % loop.length]!;
    area += current[0] * next[1] - next[0] * current[1];
  }

  return area / 2;
}

function removeClosingPoint(points: readonly Coordinate[]) {
  if (points.length >= 2 && samePoint(points[0]!, points.at(-1)!)) {
    return points.slice(0, -1);
  }

  return [...points];
}

function samePoint(left: Coordinate, right: Coordinate) {
  return left[0] === right[0] && left[1] === right[1];
}

function isInsideClipEdge(
  point: Coordinate,
  clipStart: Coordinate,
  clipEnd: Coordinate,
  clipOrientation: number,
) {
  const side = crossCoordinates(clipStart, clipEnd, point);

  return clipOrientation >= 0 ? side >= -1e-9 : side <= 1e-9;
}

function getIntersection(
  segmentStart: Coordinate,
  segmentEnd: Coordinate,
  clipStart: Coordinate,
  clipEnd: Coordinate,
): Coordinate | null {
  const segmentDirection: Coordinate = [
    segmentEnd[0] - segmentStart[0],
    segmentEnd[1] - segmentStart[1],
  ];
  const clipDirection: Coordinate = [
    clipEnd[0] - clipStart[0],
    clipEnd[1] - clipStart[1],
  ];
  const denominator =
    segmentDirection[0] * clipDirection[1] - segmentDirection[1] * clipDirection[0];

  if (Math.abs(denominator) <= 1e-12) {
    return null;
  }

  const difference: Coordinate = [
    clipStart[0] - segmentStart[0],
    clipStart[1] - segmentStart[1],
  ];
  const t =
    (difference[0] * clipDirection[1] - difference[1] * clipDirection[0]) / denominator;

  return [
    segmentStart[0] + segmentDirection[0] * t,
    segmentStart[1] + segmentDirection[1] * t,
  ];
}

function buildConvexHull(points: readonly Coordinate[]) {
  const sorted = [...points].sort((left, right) =>
    left[0] === right[0] ? left[1] - right[1] : left[0] - right[0],
  );
  const lower: Coordinate[] = [];

  for (const point of sorted) {
    while (lower.length >= 2 && crossCoordinates(lower.at(-2)!, lower.at(-1)!, point) <= 0) {
      lower.pop();
    }

    lower.push(point);
  }

  const upper: Coordinate[] = [];

  for (const point of [...sorted].reverse()) {
    while (upper.length >= 2 && crossCoordinates(upper.at(-2)!, upper.at(-1)!, point) <= 0) {
      upper.pop();
    }

    upper.push(point);
  }

  lower.pop();
  upper.pop();

  return [...lower, ...upper];
}

function createBoundsRing(
  points: readonly Coordinate[],
  center: Coordinate,
  minimumPadding: number,
) {
  let west = Number.POSITIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;

  for (const [longitude, latitude] of points) {
    west = Math.min(west, longitude);
    south = Math.min(south, latitude);
    east = Math.max(east, longitude);
    north = Math.max(north, latitude);
  }

  const padding = Math.max(getPaddingDegrees(points), minimumPadding);

  return closeRing([
    [Math.min(west, center[0]) - padding, Math.min(south, center[1]) - padding],
    [Math.max(east, center[0]) + padding, Math.min(south, center[1]) - padding],
    [Math.max(east, center[0]) + padding, Math.max(north, center[1]) + padding],
    [Math.min(west, center[0]) - padding, Math.max(north, center[1]) + padding],
  ]);
}

function getPaddingDegrees(points: readonly Coordinate[]) {
  let west = Number.POSITIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;

  for (const [longitude, latitude] of points) {
    west = Math.min(west, longitude);
    south = Math.min(south, latitude);
    east = Math.max(east, longitude);
    north = Math.max(north, latitude);
  }

  const longitudeSpan = Math.max(east - west, 0.01);
  const latitudeSpan = Math.max(north - south, 0.01);

  return Math.max(longitudeSpan, latitudeSpan) * 0.14;
}

function createEllipseRing(
  center: Coordinate,
  radiusLongitude: number,
  radiusLatitude: number,
) {
  const ring: Coordinate[] = [];

  for (let index = 0; index < DEFAULT_SEGMENTS; index += 1) {
    const angle = (index / DEFAULT_SEGMENTS) * Math.PI * 2;
    ring.push([
      center[0] + Math.cos(angle) * radiusLongitude,
      center[1] + Math.sin(angle) * radiusLatitude,
    ]);
  }

  return closeRing(ring);
}

function closeRing(points: readonly Coordinate[]) {
  if (points.length === 0) {
    return [];
  }

  return [...points, points[0]!];
}

function distance(first: ProjectedPoint, second: ProjectedPoint) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function cross(first: ProjectedPoint, second: ProjectedPoint, third: ProjectedPoint) {
  return (
    (second.x - first.x) * (third.y - first.y) -
    (second.y - first.y) * (third.x - first.x)
  );
}

function crossCoordinates(first: Coordinate, second: Coordinate, third: Coordinate) {
  return (
    (second[0] - first[0]) * (third[1] - first[1]) -
    (second[1] - first[1]) * (third[0] - first[0])
  );
}

function normalizeAngle(angle: number) {
  const fullTurn = Math.PI * 2;
  let normalized = angle % fullTurn;

  if (normalized < 0) {
    normalized += fullTurn;
  }

  return normalized;
}
