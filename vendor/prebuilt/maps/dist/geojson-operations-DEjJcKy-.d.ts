import { Y as TemporalGeoJsonSupportedGeometry, v as GeoJsonPosition, N as TemporalGeoJsonGeometryFeature, O as TemporalGeoJsonGeometryFeatureCollection, l as GeoJsonMapSource } from './geojson-layer-09FHd5Kp.js';
import { P as PolygonLikeGeometry } from './geojson-topology-CmiY9wG1.js';

type GeoJsonValidationSeverity = "error" | "warning";
type GeoJsonValidationIssue = {
    code: "invalid-collection" | "invalid-feature" | "invalid-geometry" | "invalid-coordinate" | "missing-feature-id" | "nonnumeric-metric";
    featureIndex?: number;
    geometryPath?: string;
    message: string;
    metricKey?: string;
    severity: GeoJsonValidationSeverity;
};
type GeoJsonValidationResult = {
    errorCount: number;
    issues: GeoJsonValidationIssue[];
    valid: boolean;
    warningCount: number;
};
type GeoJsonValidationOptions = {
    maxIssues?: number;
    metricKeys?: readonly string[];
    requireFeatureIds?: boolean;
    supportedGeometryTypes?: readonly TemporalGeoJsonSupportedGeometry["type"][];
};
declare function validateGeoJsonMapSource(source: unknown, options?: GeoJsonValidationOptions): GeoJsonValidationResult;

type GeoJsonBooleanOperation = "intersection" | "union" | "difference" | "clip";
type GeoJsonOperationIssueCode = "invalid-geometry" | "operation-failed" | "skipped-non-polygon";
type GeoJsonOperationIssue = {
    code: GeoJsonOperationIssueCode;
    featureId?: string;
    featureIndex?: number;
    message: string;
    partIndex?: number;
};
type GeoJsonOperationFeatureProperties = {
    area: number;
    operation: GeoJsonBooleanOperation;
    ratioOfSource?: number;
    ratioOfTarget?: number;
    sourceIds: string[];
    sourceIndexes: number[];
    targetIds: string[];
    targetIndexes: number[];
};
type GeoJsonOperationPropertiesContext<TInputProperties extends Record<string, unknown>> = {
    defaultProperties: GeoJsonOperationFeatureProperties;
    geometry: PolygonLikeGeometry;
    operation: GeoJsonBooleanOperation;
    sourceFeatures: Array<TemporalGeoJsonGeometryFeature<TInputProperties>>;
    targetFeatures: Array<TemporalGeoJsonGeometryFeature<TInputProperties>>;
};
type GeoJsonOperationOptions<TInputProperties extends Record<string, unknown> = Record<string, unknown>, TOutputProperties extends Record<string, unknown> = GeoJsonOperationFeatureProperties> = {
    areaEpsilon?: number;
    getFeatureId?: (feature: TemporalGeoJsonGeometryFeature<TInputProperties>, index: number, partIndex?: number) => string | number | undefined;
    getProperties?: (context: GeoJsonOperationPropertiesContext<TInputProperties>) => TOutputProperties;
    includeEmptyResults?: boolean;
};
type GeoJsonOperationResult<TProperties extends Record<string, unknown>> = {
    collection: TemporalGeoJsonGeometryFeatureCollection<TProperties>;
    issues: GeoJsonOperationIssue[];
};
type GeoJsonIntersectionRecord = {
    area: number;
    geometry: PolygonLikeGeometry;
    leftId: string;
    leftIndex: number;
    leftPartIndex?: number;
    ratioOfLeft: number;
    ratioOfRight: number;
    rightId: string;
    rightIndex: number;
    rightPartIndex?: number;
};
type GeoJsonContainmentRecord = {
    point: GeoJsonPosition;
    pointFeatureId: string;
    pointFeatureIndex: number;
    pointIndex?: number;
    polygonFeatureId: string;
    polygonFeatureIndex: number;
    polygonPartIndex?: number;
};
type GeoJsonOverlapRecord = {
    area: number;
    geometry: PolygonLikeGeometry;
    leftId: string;
    leftIndex: number;
    leftPartIndex?: number;
    ratioOfLeft: number;
    ratioOfRight: number;
    rightId: string;
    rightIndex: number;
    rightPartIndex?: number;
};
type GeoJsonRelationshipOptions<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    areaEpsilon?: number;
    getFeatureId?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, index: number, partIndex?: number) => string | number | undefined;
    includeBoundary?: boolean;
};
type GeoJsonPolygonMeasurementOptions<TProperties extends Record<string, unknown> = Record<string, unknown>> = GeoJsonRelationshipOptions<TProperties> & {
    earthRadiusMeters?: number;
};
type GeoJsonPolygonMeasurementRecord = {
    areaSquareMeters: number;
    featureId: string;
    featureIndex: number;
    partIndex?: number;
    perimeterMeters: number;
    planarArea: number;
};
type GeoJsonPolygonOutlineRingRole = "shell" | "hole";
type GeoJsonPolygonOutlineProperties = {
    featureId: string;
    featureIndex: number;
    lengthMeters: number;
    partIndex?: number;
    planarLength: number;
    polygonIndex: number;
    ringIndex: number;
    role: GeoJsonPolygonOutlineRingRole;
};
type GeoJsonPolygonOverlapResolutionStrategy = "later-wins" | "earlier-wins";
type GeoJsonPolygonOverlapResolutionOptions<TProperties extends Record<string, unknown> = Record<string, unknown>> = GeoJsonRelationshipOptions<TProperties> & {
    strategy?: GeoJsonPolygonOverlapResolutionStrategy;
};
type GeoJsonPolygonOverlapResolutionResult<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    collection: TemporalGeoJsonGeometryFeatureCollection<TProperties>;
    issues: GeoJsonOperationIssue[];
    overlaps: GeoJsonOverlapRecord[];
};
type GeoJsonPolygonSimplifyOptions<TProperties extends Record<string, unknown> = Record<string, unknown>> = GeoJsonRelationshipOptions<TProperties> & {
    tolerance: number;
};
type GeoJsonFeatureInput<TProperties extends Record<string, unknown>> = GeoJsonMapSource<TProperties> | TemporalGeoJsonGeometryFeature<TProperties> | readonly TemporalGeoJsonGeometryFeature<TProperties>[];
declare function intersectGeoJsonFeatures<TInputProperties extends Record<string, unknown> = Record<string, unknown>, TOutputProperties extends Record<string, unknown> = GeoJsonOperationFeatureProperties>(left: GeoJsonMapSource<TInputProperties> | TemporalGeoJsonGeometryFeature<TInputProperties>, right: GeoJsonMapSource<TInputProperties> | TemporalGeoJsonGeometryFeature<TInputProperties>, options?: GeoJsonOperationOptions<TInputProperties, TOutputProperties>): GeoJsonOperationResult<TOutputProperties>;
declare function unionGeoJsonFeatures<TInputProperties extends Record<string, unknown> = Record<string, unknown>, TOutputProperties extends Record<string, unknown> = GeoJsonOperationFeatureProperties>(featuresInput: GeoJsonMapSource<TInputProperties> | readonly TemporalGeoJsonGeometryFeature<TInputProperties>[], options?: GeoJsonOperationOptions<TInputProperties, TOutputProperties>): GeoJsonOperationResult<TOutputProperties>;
declare function differenceGeoJsonFeatures<TInputProperties extends Record<string, unknown> = Record<string, unknown>, TOutputProperties extends Record<string, unknown> = GeoJsonOperationFeatureProperties>(subject: GeoJsonFeatureInput<TInputProperties>, masks: GeoJsonFeatureInput<TInputProperties>, options?: GeoJsonOperationOptions<TInputProperties, TOutputProperties>): GeoJsonOperationResult<TOutputProperties>;
declare function clipGeoJsonToPolygon<TInputProperties extends Record<string, unknown> = Record<string, unknown>, TOutputProperties extends Record<string, unknown> = GeoJsonOperationFeatureProperties>(source: GeoJsonFeatureInput<TInputProperties>, mask: GeoJsonFeatureInput<TInputProperties>, options?: GeoJsonOperationOptions<TInputProperties, TOutputProperties>): GeoJsonOperationResult<TOutputProperties>;
declare function getGeoJsonIntersections<TProperties extends Record<string, unknown> = Record<string, unknown>>(leftCollection: GeoJsonMapSource<TProperties>, rightCollection: GeoJsonMapSource<TProperties>, options?: GeoJsonRelationshipOptions<TProperties>): GeoJsonIntersectionRecord[];
declare function getGeoJsonPolygonMeasurements<TProperties extends Record<string, unknown> = Record<string, unknown>>(source: GeoJsonMapSource<TProperties>, options?: GeoJsonPolygonMeasurementOptions<TProperties>): GeoJsonPolygonMeasurementRecord[];
declare function createGeoJsonPolygonOutlines<TProperties extends Record<string, unknown> = Record<string, unknown>>(source: GeoJsonMapSource<TProperties>, options?: GeoJsonPolygonMeasurementOptions<TProperties>): GeoJsonOperationResult<GeoJsonPolygonOutlineProperties>;
declare function findContainingGeoJsonFeatures<TProperties extends Record<string, unknown> = Record<string, unknown>>(points: GeoJsonMapSource<TProperties>, polygons: GeoJsonMapSource<TProperties>, options?: GeoJsonRelationshipOptions<TProperties>): GeoJsonContainmentRecord[];
declare function findOverlappingGeoJsonFeatures<TProperties extends Record<string, unknown> = Record<string, unknown>>(collection: GeoJsonMapSource<TProperties>, options?: GeoJsonRelationshipOptions<TProperties>): GeoJsonOverlapRecord[];
declare function resolveGeoJsonPolygonOverlaps<TProperties extends Record<string, unknown> = Record<string, unknown>>(source: GeoJsonMapSource<TProperties>, options?: GeoJsonPolygonOverlapResolutionOptions<TProperties>): GeoJsonPolygonOverlapResolutionResult<TProperties>;
declare function simplifyGeoJsonPolygons<TProperties extends Record<string, unknown> = Record<string, unknown>>(source: GeoJsonMapSource<TProperties>, options: GeoJsonPolygonSimplifyOptions<TProperties>): GeoJsonOperationResult<TProperties>;

export { getGeoJsonIntersections as A, getGeoJsonPolygonMeasurements as B, intersectGeoJsonFeatures as C, resolveGeoJsonPolygonOverlaps as D, simplifyGeoJsonPolygons as E, unionGeoJsonFeatures as F, type GeoJsonBooleanOperation as G, validateGeoJsonMapSource as H, type GeoJsonContainmentRecord as a, type GeoJsonIntersectionRecord as b, type GeoJsonOperationFeatureProperties as c, type GeoJsonOperationIssue as d, type GeoJsonOperationIssueCode as e, type GeoJsonOperationOptions as f, type GeoJsonOperationResult as g, type GeoJsonOverlapRecord as h, type GeoJsonPolygonMeasurementOptions as i, type GeoJsonPolygonMeasurementRecord as j, type GeoJsonPolygonOutlineProperties as k, type GeoJsonPolygonOutlineRingRole as l, type GeoJsonPolygonOverlapResolutionOptions as m, type GeoJsonPolygonOverlapResolutionResult as n, type GeoJsonPolygonOverlapResolutionStrategy as o, type GeoJsonPolygonSimplifyOptions as p, type GeoJsonRelationshipOptions as q, type GeoJsonValidationIssue as r, type GeoJsonValidationOptions as s, type GeoJsonValidationResult as t, type GeoJsonValidationSeverity as u, clipGeoJsonToPolygon as v, createGeoJsonPolygonOutlines as w, differenceGeoJsonFeatures as x, findContainingGeoJsonFeatures as y, findOverlappingGeoJsonFeatures as z };
