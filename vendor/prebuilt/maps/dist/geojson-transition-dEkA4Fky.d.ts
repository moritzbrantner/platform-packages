import { O as TemporalGeoJsonGeometryFeatureCollection, Y as TemporalGeoJsonSupportedGeometry, v as GeoJsonPosition, N as TemporalGeoJsonGeometryFeature, l as GeoJsonMapSource, j as GeoJsonLayerStyle, s as GeoJsonPartMatchingStrategy } from './geojson-layer-09FHd5Kp.js';
import { P as PolygonLikeGeometry } from './geojson-topology-CmiY9wG1.js';

type GeoJsonPolygonConstraint = PolygonLikeGeometry | readonly PolygonLikeGeometry[] | null | undefined;
type GeoJsonGeometryTransformOptions = {
    polygonConstraint?: GeoJsonPolygonConstraint;
};
declare function applyGeoJsonEditOperation<TProperties extends Record<string, unknown> = Record<string, unknown>>(collection: TemporalGeoJsonGeometryFeatureCollection<TProperties>, operation: GeoJsonEditOperation<TProperties>): TemporalGeoJsonGeometryFeatureCollection<TProperties>;
declare function createGeoJsonEditFeature<TProperties extends Record<string, unknown>>(geometryType: "Point", coordinates: GeoJsonPosition, properties: TProperties): TemporalGeoJsonGeometryFeature<TProperties>;
declare function createGeoJsonEditFeature<TProperties extends Record<string, unknown>>(geometryType: "LineString", coordinates: readonly GeoJsonPosition[], properties: TProperties): TemporalGeoJsonGeometryFeature<TProperties>;
declare function createGeoJsonEditFeature<TProperties extends Record<string, unknown>>(geometryType: "Polygon", coordinates: readonly (readonly GeoJsonPosition[])[], properties: TProperties): TemporalGeoJsonGeometryFeature<TProperties>;
declare function validateGeoJsonEditableGeometry(geometry: TemporalGeoJsonGeometryFeature["geometry"]): GeoJsonEditValidationResult;
declare function moveGeoJsonGeometry(geometry: TemporalGeoJsonSupportedGeometry, deltaLongitude: number, deltaLatitude: number): TemporalGeoJsonSupportedGeometry;
declare function moveGeoJsonGeometry(geometry: TemporalGeoJsonSupportedGeometry, deltaLongitude: number, deltaLatitude: number, options: GeoJsonGeometryTransformOptions): TemporalGeoJsonSupportedGeometry | null;
declare function constrainGeoJsonGeometryToPolygon(geometry: TemporalGeoJsonSupportedGeometry, constraint: GeoJsonPolygonConstraint): TemporalGeoJsonSupportedGeometry | null;
declare function setGeoJsonVertex(geometry: TemporalGeoJsonSupportedGeometry, handle: GeoJsonVertexHandle, coordinates: GeoJsonPosition): TemporalGeoJsonSupportedGeometry | null;
declare function insertGeoJsonVertex(geometry: TemporalGeoJsonSupportedGeometry, handle: GeoJsonVertexHandle, coordinates: GeoJsonPosition): TemporalGeoJsonSupportedGeometry | null;
declare function removeGeoJsonVertex(geometry: TemporalGeoJsonSupportedGeometry, handle: GeoJsonVertexHandle): TemporalGeoJsonSupportedGeometry | null;

type GeoJsonEditorSnapMode = "vertex" | "midpoint" | "segment" | "grid";
type GeoJsonSnapTarget = {
    coordinates: GeoJsonPosition;
    distancePixels: number;
    featureId?: string;
    mode: GeoJsonEditorSnapMode;
};
type GeoJsonEditorSnapOptions = {
    enabled?: boolean;
    gridSizeDegrees?: number;
    includeDraft?: boolean;
    includeSelectedFeature?: boolean;
    modes?: readonly GeoJsonEditorSnapMode[];
    pixelTolerance?: number;
};

type GeoJsonEditMode = "none" | "select" | "draw-point" | "draw-line" | "draw-polygon" | "move" | "reshape" | "delete" | "boolean-union" | "boolean-intersection" | "boolean-difference";
type GeoJsonEditReason = "move-feature" | "move-vertex" | "insert-vertex" | "remove-vertex" | "group-feature" | "ungroup-feature" | "draw-complete" | "boolean-union" | "boolean-intersection" | "boolean-difference";
type GeoJsonBatchEditReason = "delete-selection" | "duplicate-selection" | "group-selection" | "ungroup-selection" | "move-selection" | "boolean-union" | "boolean-intersection" | "boolean-difference";
type GeoJsonEditValidationResult = {
    reason?: string;
    valid: boolean;
};
type GeoJsonVertexHandle = {
    coordinates: GeoJsonPosition;
    featureId: string;
    geometryIndex?: number;
    kind: "vertex" | "midpoint";
    nextVertexIndex?: number;
    ringIndex?: number;
    vertexIndex: number;
};

type GeoJsonEditorSelection = {
    featureIds: string[];
    primaryFeatureId: string | null;
    vertexHandle?: GeoJsonVertexHandle | null;
};
type GeoJsonEditorGroupOptions<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    groupId?: string;
    getGroupId?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, index: number) => string | null | undefined;
    setGroupId?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, groupId: string | null) => TemporalGeoJsonGeometryFeature<TProperties>;
};
type GeoJsonEditorCommand = "select-all" | "clear-selection" | "delete-selection" | "duplicate-selection" | "group-selection" | "ungroup-selection" | "start-select" | "start-draw-point" | "start-draw-line" | "start-draw-polygon" | "start-move" | "start-reshape" | "finish-draft" | "cancel-draft" | "remove-selected-vertex";
type GeoJsonEditOperation<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    feature: TemporalGeoJsonGeometryFeature<TProperties>;
    featureId: string;
    type: "create";
} | {
    feature: TemporalGeoJsonGeometryFeature<TProperties>;
    featureId: string;
    previousFeature: TemporalGeoJsonGeometryFeature<TProperties>;
    reason: GeoJsonEditReason;
    type: "update";
} | {
    featureId: string;
    previousFeature: TemporalGeoJsonGeometryFeature<TProperties>;
    type: "delete";
} | {
    operations: GeoJsonEditOperation<TProperties>[];
    reason: GeoJsonBatchEditReason;
    type: "batch";
};
/**
 * Controlled GeoJSON editor layer contract.
 *
 * The layer emits the next feature collection plus an operation descriptor;
 * consumers own persistence, undo/redo, save/cancel flows, and any surrounding
 * toolbar UI.
 */
type GeoJsonEditorLayerProps<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    booleanPreview?: boolean;
    canEditFeature?: (feature: TemporalGeoJsonGeometryFeature<TProperties>) => boolean;
    createFeatureProperties?: (geometryType: "Point" | "LineString" | "Polygon") => TProperties;
    enableKeyboardShortcuts?: boolean;
    featureCollection: TemporalGeoJsonGeometryFeatureCollection<TProperties>;
    getFeatureId?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, index: number) => string;
    groupOptions?: GeoJsonEditorGroupOptions<TProperties>;
    handleColor?: string;
    keyboardShortcutScope?: HTMLElement | Document | null;
    layerId?: string;
    midpointHandleColor?: string;
    mode: GeoJsonEditMode;
    onCommand?: (command: GeoJsonEditorCommand, context: {
        mode: GeoJsonEditMode;
        selection: GeoJsonEditorSelection;
    }) => boolean | void;
    onEditModeChange?: (mode: GeoJsonEditMode) => void;
    onEditorSelectionChange?: (selection: GeoJsonEditorSelection) => void;
    onFeatureCollectionChange?: (next: TemporalGeoJsonGeometryFeatureCollection<TProperties>, operation: GeoJsonEditOperation<TProperties>) => void;
    onBooleanOperationPreviewChange?: (preview: GeoJsonMapSource | null) => void;
    onSelectionChange?: (featureId: string | null) => void;
    polygonConstraint?: GeoJsonPolygonConstraint;
    selectedFeatureIds?: readonly string[];
    selectedFeatureId?: string | null;
    selection?: GeoJsonEditorSelection;
    selectedStyle?: GeoJsonLayerStyle;
    snapIndicatorColor?: string;
    snapOptions?: GeoJsonEditorSnapOptions;
    style?: GeoJsonLayerStyle;
    onSnapTargetChange?: (target: GeoJsonSnapTarget | null) => void;
    validateEdit?: (nextFeature: TemporalGeoJsonGeometryFeature<TProperties>, operation: GeoJsonEditOperation<TProperties>) => GeoJsonEditValidationResult;
};
declare function GeoJsonEditorLayer<TProperties extends Record<string, unknown> = Record<string, unknown>>({ booleanPreview, canEditFeature, createFeatureProperties, enableKeyboardShortcuts, featureCollection, getFeatureId, groupOptions, handleColor, keyboardShortcutScope, layerId, midpointHandleColor, mode, onCommand, onBooleanOperationPreviewChange, onEditModeChange, onEditorSelectionChange, onFeatureCollectionChange, onSelectionChange, polygonConstraint, selectedFeatureIds, selectedFeatureId, selection, selectedStyle, snapIndicatorColor, snapOptions, style, onSnapTargetChange, validateEdit, }: GeoJsonEditorLayerProps<TProperties>): null;

type GeoJsonTransitionAlgorithm = "hold" | "compatible" | "resample" | "vertex-union" | "centroid-radial" | "topology-plan";
type GeoJsonTransitionFallback = "hold" | "hide";
type GeoJsonTopologyStrategy = "bounds" | "area-overlap" | "voronoi-partition";
type GeoJsonComplexGeometryBehavior = "preserve" | "flatten" | "decompose";
type GeoJsonTransitionOptions = {
    algorithm?: GeoJsonTransitionAlgorithm;
    complexGeometryBehavior?: GeoJsonComplexGeometryBehavior;
    coordinateSpace?: "lonlat" | "web-mercator" | "identity";
    fallback?: GeoJsonTransitionFallback;
    getPartId?: (feature: TemporalGeoJsonGeometryFeature, featureIndex: number, partPath: string) => string | number | undefined;
    maxCoordinatesPerLine?: number;
    maxCoordinatesPerRing?: number;
    minCoordinatesPerLine?: number;
    minCoordinatesPerRing?: number;
    partMatchingStrategy?: GeoJsonPartMatchingStrategy;
    topologyMinOverlapRatio?: number;
    topologyStrategy?: GeoJsonTopologyStrategy;
};
type GeoJsonTransitionFragmentKind = "preserve" | "split" | "merge" | "appear" | "disappear" | "morph";
type GeoJsonTransitionPlan<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    readonly algorithm: GeoJsonTransitionAlgorithm;
    readonly fallback: GeoJsonTransitionFallback;
    readonly fragments: readonly GeoJsonTransitionPlanFragment<TProperties>[];
    readonly options: ResolvedGeoJsonTransitionOptions;
    readonly type: "GeoJsonTransitionPlan";
};
type ResolvedGeoJsonTransitionOptions = Omit<Required<GeoJsonTransitionOptions>, "getPartId"> & {
    getPartId?: GeoJsonTransitionOptions["getPartId"];
};
type GeoJsonTransitionPlanFragment<TProperties extends Record<string, unknown>> = {
    fromFeature?: TemporalGeoJsonGeometryFeature<TProperties>;
    fromGeometry?: TemporalGeoJsonSupportedGeometry;
    id: string;
    kind: GeoJsonTransitionFragmentKind;
    overlapArea?: number;
    overlapRatio?: number;
    partMatchStrategy?: GeoJsonPartMatchingStrategy;
    sourceIds: Array<string | number>;
    sourcePartPath?: string;
    targetIds: Array<string | number>;
    targetPartPath?: string;
    toFeature?: TemporalGeoJsonGeometryFeature<TProperties>;
    toGeometry?: TemporalGeoJsonSupportedGeometry;
};
declare function createGeoJsonTransitionPlan<TProperties extends Record<string, unknown> = Record<string, unknown>>(from: TemporalGeoJsonGeometryFeatureCollection<TProperties>, to: TemporalGeoJsonGeometryFeatureCollection<TProperties>, options?: GeoJsonTransitionOptions): GeoJsonTransitionPlan<TProperties>;
declare function interpolateGeoJsonTransitionPlan<TProperties extends Record<string, unknown> = Record<string, unknown>>(plan: GeoJsonTransitionPlan<TProperties>, progress: number): TemporalGeoJsonGeometryFeatureCollection<TProperties>;

export { insertGeoJsonVertex as A, interpolateGeoJsonTransitionPlan as B, moveGeoJsonGeometry as C, removeGeoJsonVertex as D, setGeoJsonVertex as E, validateGeoJsonEditableGeometry as F, type GeoJsonBatchEditReason as G, type ResolvedGeoJsonTransitionOptions as R, type GeoJsonComplexGeometryBehavior as a, type GeoJsonEditMode as b, type GeoJsonEditOperation as c, type GeoJsonEditReason as d, type GeoJsonEditValidationResult as e, type GeoJsonEditorCommand as f, type GeoJsonEditorGroupOptions as g, GeoJsonEditorLayer as h, type GeoJsonEditorLayerProps as i, type GeoJsonEditorSelection as j, type GeoJsonEditorSnapMode as k, type GeoJsonEditorSnapOptions as l, type GeoJsonGeometryTransformOptions as m, type GeoJsonPolygonConstraint as n, type GeoJsonSnapTarget as o, type GeoJsonTopologyStrategy as p, type GeoJsonTransitionAlgorithm as q, type GeoJsonTransitionFallback as r, type GeoJsonTransitionFragmentKind as s, type GeoJsonTransitionOptions as t, type GeoJsonTransitionPlan as u, type GeoJsonVertexHandle as v, applyGeoJsonEditOperation as w, constrainGeoJsonGeometryToPolygon as x, createGeoJsonEditFeature as y, createGeoJsonTransitionPlan as z };
