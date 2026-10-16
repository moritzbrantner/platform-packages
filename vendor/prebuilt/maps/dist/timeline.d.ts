import { n as GeoJsonPolygonConstraint, t as GeoJsonTransitionOptions, m as GeoJsonGeometryTransformOptions } from './geojson-transition-dEkA4Fky.js';
export { a as GeoJsonComplexGeometryBehavior, p as GeoJsonTopologyStrategy, q as GeoJsonTransitionAlgorithm, r as GeoJsonTransitionFallback, s as GeoJsonTransitionFragmentKind, u as GeoJsonTransitionPlan, R as ResolvedGeoJsonTransitionOptions, z as createGeoJsonTransitionPlan, B as interpolateGeoJsonTransitionPlan } from './geojson-transition-dEkA4Fky.js';
import * as react_jsx_runtime from 'react/jsx-runtime';
import { TimelineEditorDocument, TimelineEditorTransformValues, TimelineEditorSelection, TimelineEditorViewport, TimelineEditorSnapOptions, TimelineEditorTransform, TimelineEditorItem } from '@moritzbrantner/timeline-editor';
import { N as TemporalGeoJsonGeometryFeature, Y as TemporalGeoJsonSupportedGeometry, O as TemporalGeoJsonGeometryFeatureCollection } from './geojson-layer-09FHd5Kp.js';
import './geojson-topology-CmiY9wG1.js';
import 'react';

type GeoJsonTimelineTransformValues = TimelineEditorTransformValues & {
    latitudeOffset: number;
    longitudeOffset: number;
    originLatitude: number;
    originLongitude: number;
    rotateDegrees: number;
    scale: number;
    scaleX: number;
    scaleY: number;
};
type GeoJsonTimelineTrackData = {
    featureId?: string;
    kind: "geojson-feature" | "geojson-features";
};
type GeoJsonTimelineItemData<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    featureId: string;
    featureIndex: number;
    kind: "geojson-feature";
    properties?: TProperties | null;
};
type GeoJsonTimelineDocument<TProperties extends Record<string, unknown> = Record<string, unknown>> = TimelineEditorDocument<GeoJsonTimelineTrackData, GeoJsonTimelineItemData<TProperties>, Record<string, unknown>, GeoJsonTimelineTransformValues>;
type GeoJsonTimelineOptions<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    currentTimeMs?: number;
    durationMs?: number;
    getFeatureId?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, index: number) => string;
    getFeatureLabel?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, index: number) => string | undefined;
    getFeatureTransform?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, index: number) => TimelineEditorTransform<GeoJsonTimelineTransformValues> | undefined;
    getTimelineTrackId?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, index: number) => string | undefined;
    getItemDurationMs?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, index: number) => number | undefined;
    getItemStartMs?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, index: number) => number | undefined;
    itemDurationMs?: number;
    trackMode?: "per-feature" | "single";
};
type GeoJsonTimelineApplyOptions<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    getFeatureId?: (feature: TemporalGeoJsonGeometryFeature<TProperties>, index: number) => string;
    outsideItemBehavior?: "none" | "hold";
    polygonConstraint?: GeoJsonPolygonConstraint;
};
type GeoJsonTimelineTransitionSpec = GeoJsonTransitionOptions & {
    durationMs?: number;
};
type GeoJsonTimelineSceneOptions<TProperties extends Record<string, unknown> = Record<string, unknown>> = GeoJsonTimelineApplyOptions<TProperties> & {
    defaultTransition?: GeoJsonTimelineTransitionSpec;
    getSceneTransition?: (previous: Array<TimelineEditorItem<GeoJsonTimelineItemData<TProperties>, GeoJsonTimelineTransformValues>>, next: Array<TimelineEditorItem<GeoJsonTimelineItemData<TProperties>, GeoJsonTimelineTransformValues>>) => GeoJsonTimelineTransitionSpec | undefined;
    getTransition?: (previous: TimelineEditorItem<GeoJsonTimelineItemData<TProperties>, GeoJsonTimelineTransformValues>, next: TimelineEditorItem<GeoJsonTimelineItemData<TProperties>, GeoJsonTimelineTransformValues>) => GeoJsonTimelineTransitionSpec | undefined;
};
type GeoJsonTimelineEditorProps<TProperties extends Record<string, unknown> = Record<string, unknown>> = {
    className?: string;
    document: GeoJsonTimelineDocument<TProperties>;
    frameRate?: number;
    onCurrentTimeChange?: (timeMs: number) => void;
    onDocumentChange?: (document: GeoJsonTimelineDocument<TProperties>) => void;
    onSelectionChange?: (selection: TimelineEditorSelection) => void;
    onViewportChange?: (viewport: TimelineEditorViewport) => void;
    readOnly?: boolean;
    selectedFeatureId?: string | null;
    selection?: TimelineEditorSelection;
    snap?: Partial<TimelineEditorSnapOptions>;
    viewport?: TimelineEditorViewport;
};
declare function GeoJsonTimelineEditor<TProperties extends Record<string, unknown> = Record<string, unknown>>({ className, document, frameRate, onCurrentTimeChange, onDocumentChange, onSelectionChange, onViewportChange, readOnly, selectedFeatureId, selection, snap, viewport, }: GeoJsonTimelineEditorProps<TProperties>): react_jsx_runtime.JSX.Element;
declare function createGeoJsonTimelineDocument<TProperties extends Record<string, unknown> = Record<string, unknown>>(collection: TemporalGeoJsonGeometryFeatureCollection<TProperties>, options?: GeoJsonTimelineOptions<TProperties>): GeoJsonTimelineDocument<TProperties>;
declare function setGeoJsonTimelineFeatureTransform<TProperties extends Record<string, unknown> = Record<string, unknown>>(document: GeoJsonTimelineDocument<TProperties>, featureId: string, transform: TimelineEditorTransform<GeoJsonTimelineTransformValues> | undefined): GeoJsonTimelineDocument<TProperties>;
declare function getGeoJsonTimelineFeatureCollectionAtTime<TProperties extends Record<string, unknown> = Record<string, unknown>>(collection: TemporalGeoJsonGeometryFeatureCollection<TProperties>, document: GeoJsonTimelineDocument<TProperties>, timeMs: number, options?: GeoJsonTimelineApplyOptions<TProperties>): TemporalGeoJsonGeometryFeatureCollection<TProperties>;
declare function getGeoJsonTimelineSceneAtTime<TProperties extends Record<string, unknown> = Record<string, unknown>>(collection: TemporalGeoJsonGeometryFeatureCollection<TProperties>, document: GeoJsonTimelineDocument<TProperties>, timeMs: number, options?: GeoJsonTimelineSceneOptions<TProperties>): TemporalGeoJsonGeometryFeatureCollection<TProperties>;
declare function applyGeoJsonTimelineTransform(geometry: TemporalGeoJsonSupportedGeometry, values: Partial<GeoJsonTimelineTransformValues>): TemporalGeoJsonSupportedGeometry;
declare function applyGeoJsonTimelineTransform(geometry: TemporalGeoJsonSupportedGeometry, values: Partial<GeoJsonTimelineTransformValues>, options: GeoJsonGeometryTransformOptions): TemporalGeoJsonSupportedGeometry | null;
declare function getGeoJsonTimelineItemId(featureId: string): string;
declare function getGeoJsonTimelineTrackId(featureId: string): string;

export { GeoJsonGeometryTransformOptions, GeoJsonPolygonConstraint, type GeoJsonTimelineApplyOptions, type GeoJsonTimelineDocument, GeoJsonTimelineEditor, type GeoJsonTimelineEditorProps, type GeoJsonTimelineItemData, type GeoJsonTimelineOptions, type GeoJsonTimelineSceneOptions, type GeoJsonTimelineTrackData, type GeoJsonTimelineTransformValues, type GeoJsonTimelineTransitionSpec, GeoJsonTransitionOptions, applyGeoJsonTimelineTransform, createGeoJsonTimelineDocument, getGeoJsonTimelineFeatureCollectionAtTime, getGeoJsonTimelineItemId, getGeoJsonTimelineSceneAtTime, getGeoJsonTimelineTrackId, setGeoJsonTimelineFeatureTransform };
