import { i as GeoJsonEditorLayerProps, b as GeoJsonEditMode } from './geojson-transition-dEkA4Fky.js';
export { G as GeoJsonBatchEditReason, c as GeoJsonEditOperation, d as GeoJsonEditReason, e as GeoJsonEditValidationResult, f as GeoJsonEditorCommand, g as GeoJsonEditorGroupOptions, h as GeoJsonEditorLayer, j as GeoJsonEditorSelection, k as GeoJsonEditorSnapMode, l as GeoJsonEditorSnapOptions, m as GeoJsonGeometryTransformOptions, n as GeoJsonPolygonConstraint, o as GeoJsonSnapTarget, v as GeoJsonVertexHandle, w as applyGeoJsonEditOperation, x as constrainGeoJsonGeometryToPolygon, y as createGeoJsonEditFeature, A as insertGeoJsonVertex, C as moveGeoJsonGeometry, D as removeGeoJsonVertex, E as setGeoJsonVertex, F as validateGeoJsonEditableGeometry } from './geojson-transition-dEkA4Fky.js';
import * as react_jsx_runtime from 'react/jsx-runtime';
import { Map } from 'maplibre-gl';
import { TimelineEditorSelection, TimelineEditorSnapOptions, TimelineEditorViewport } from '@moritzbrantner/timeline-editor';
import { j as GeoJsonLayerStyle, l as GeoJsonMapSource, M as MapContextMenuContext } from './geojson-layer-09FHd5Kp.js';
import { GeoJsonTimelineDocument } from './timeline.js';
import { j as MapViewportProps, g as MapViewState, c as MapDisplayMode, R as RasterMapStyle, f as MapSurfaceController } from './map-display-ChLAprbZ.js';
import { f as MapMeasurementProps } from './measurement-UgWxBeK2.js';
export { G as GeoJsonEditHistoryEntry, a as GeoJsonEditHistoryState, c as createGeoJsonEditHistoryState, i as invertGeoJsonEditOperation, p as pushGeoJsonEditHistory, r as redoGeoJsonEditHistory, u as undoGeoJsonEditHistory } from './geojson-editor-history-COAjvX6J.js';
import './geojson-topology-CmiY9wG1.js';
import 'react';

type EditableGeoJsonMapProps<TProperties extends Record<string, unknown> = Record<string, unknown>> = Omit<GeoJsonEditorLayerProps<TProperties>, "featureCollection" | "mode" | "style"> & MapMeasurementProps & MapViewportProps & {
    children?: React.ReactNode;
    className?: string;
    editMode: GeoJsonEditMode;
    editorStyle?: GeoJsonLayerStyle;
    fitBoundsPadding?: number;
    fitToData?: boolean;
    geoJson: GeoJsonMapSource<TProperties>;
    /**
     * @deprecated Use `defaultViewState` for an uncontrolled initial viewport.
     */
    initialViewState?: MapViewState;
    mapDisplay?: MapDisplayMode;
    mapLabel?: string;
    mapStyle?: string | RasterMapStyle;
    onMapControllerReady?: (controller: MapSurfaceController) => void;
    onMapContextMenu?: (context: MapContextMenuContext) => void;
    onMapReady?: (map: Map) => void;
    renderMapContextMenu?: (context: MapContextMenuContext) => React.ReactNode;
    showAttributionControl?: boolean;
    style?: React.CSSProperties;
    showTimelineEditor?: boolean;
    timelineActiveTimeMs?: number;
    timelineClassName?: string;
    timelineDocument?: GeoJsonTimelineDocument<TProperties>;
    timelineDurationMs?: number;
    timelineFrameRate?: number;
    timelineReadOnly?: boolean;
    timelineSelection?: TimelineEditorSelection;
    timelineSnap?: Partial<TimelineEditorSnapOptions>;
    timelineViewport?: TimelineEditorViewport;
    onTimelineActiveTimeChange?: (timeMs: number) => void;
    onTimelineDocumentChange?: (document: GeoJsonTimelineDocument<TProperties>) => void;
    onTimelineSelectionChange?: (selection: TimelineEditorSelection) => void;
    onTimelineViewportChange?: (viewport: TimelineEditorViewport) => void;
};
declare function EditableGeoJsonMap<TProperties extends Record<string, unknown> = Record<string, unknown>>({ className, children, editMode, editorStyle, enableKeyboardShortcuts, fitBoundsPadding, fitToData, geoJson, initialViewState, mapDisplay, mapLabel, mapStyle, maxBounds, maxZoom, measurementDistanceFormat, measurementDraftLineColor, measurementLineColor, measurementMode, measurements, onMapControllerReady, onMapContextMenu, onMapReady, onMeasurementCreate, onMeasurementDraftChange, onMeasurementSelect, onViewStateChange, renderMapContextMenu, showAttributionControl, showTimelineEditor, style, timelineActiveTimeMs, timelineClassName, timelineDocument, timelineDurationMs, timelineFrameRate, timelineReadOnly, timelineSelection, timelineSnap, timelineViewport, onTimelineActiveTimeChange, onTimelineDocumentChange, onTimelineSelectionChange, onTimelineViewportChange, viewState, defaultViewState, ...editorProps }: EditableGeoJsonMapProps<TProperties>): react_jsx_runtime.JSX.Element;

export { EditableGeoJsonMap, type EditableGeoJsonMapProps, GeoJsonEditMode, GeoJsonEditorLayerProps };
