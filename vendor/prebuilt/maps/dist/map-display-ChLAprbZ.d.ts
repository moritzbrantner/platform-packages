import { J as MapPoint, l as GeoJsonMapSource } from './geojson-layer-09FHd5Kp.js';
import { StyleSpecification, Map } from 'maplibre-gl';

type MapLibreMapStyle = string | StyleSpecification;
type FlatPointerEvent = {
    containerPoint?: {
        x: number;
        y: number;
    };
    latlng?: {
        lat: number;
        lng: number;
    };
    lngLat?: {
        lat: number;
        lng: number;
    };
    originalEvent?: {
        defaultPrevented?: boolean;
        preventDefault?: () => void;
        stopPropagation?: () => void;
    };
};
type FlatLayerOptions = {
    bubblingMouseEvents?: boolean;
    className?: string;
    color?: string;
    fillColor?: string;
    fillOpacity?: number;
    interactive?: boolean;
    opacity?: number;
    radius?: number;
    weight?: number;
};
type FlatDivIconOptions = {
    className?: string;
    html?: string;
    iconAnchor?: [number, number];
    iconSize?: [number, number];
};
type FlatMarkerOptions = {
    icon?: FlatDivIconOptions;
    interactive?: boolean;
    keyboard?: boolean;
    opacity?: number;
};
type FlatTooltipOptions = {
    className?: string;
    direction?: string;
    permanent?: boolean;
};
type FlatLayer = {
    addTo: (group: FlatLayerGroup) => FlatLayer;
    bindTooltip: (label: string, options?: FlatTooltipOptions) => FlatLayer;
    bringToFront?: () => FlatLayer;
    off?: (event: string, handler: (event?: FlatPointerEvent) => void) => FlatLayer;
    on: (event: string, handler: (event?: FlatPointerEvent) => void) => FlatLayer;
    openTooltip: (latLng?: [number, number]) => FlatLayer;
    remove?: () => void;
    setBounds?: (bounds: [[number, number], [number, number]]) => FlatLayer;
    setLatLng?: (latLng: [number, number]) => FlatLayer;
    setLatLngs?: (latLngs: unknown) => FlatLayer;
    setOpacity?: (opacity: number) => FlatLayer;
    setStyle?: (options: FlatLayerOptions) => FlatLayer;
    setUrl?: (url: string) => FlatLayer;
};
type FlatLayerGroup = {
    addLayer: (layer: FlatLayer) => FlatLayerGroup;
    addTo: (map: Map) => FlatLayerGroup;
    clearLayers: () => FlatLayerGroup;
    layers: FlatLayer[];
    remove: () => void;
    removeLayer: (layer: FlatLayer) => FlatLayerGroup;
};
type FlatMapAdapter = Map & {
    containerPointToLatLng: (point: [number, number]) => {
        lat: number;
        lng: number;
    };
    dragging: {
        disable: () => void;
        enable: () => void;
    };
    getSize: () => {
        x: number;
        y: number;
    };
    latLngToContainerPoint: (latLng: [number, number] | {
        lat: number;
        lng: number;
    }) => {
        x: number;
        y: number;
    };
    setView: (latLng: [number, number] | {
        lat: number;
        lng: number;
    }, zoom: number) => void;
};
type FlatLayerFactory = {
    circleMarker: (latLng: [number, number], options?: FlatLayerOptions) => FlatLayer;
    divIcon: (options?: FlatDivIconOptions) => FlatDivIconOptions;
    imageOverlay: (url: string, bounds: [[number, number], [number, number]], options?: FlatLayerOptions) => FlatLayer;
    layerGroup: () => FlatLayerGroup;
    marker: (latLng: [number, number], options?: FlatMarkerOptions) => FlatLayer;
    polygon: (latLngs: unknown, options?: FlatLayerOptions) => FlatLayer;
    polyline: (latLngs: unknown, options?: FlatLayerOptions) => FlatLayer;
};

type MapDisplayMode = "flat" | "globe";
type MapViewState = {
    center: [longitude: number, latitude: number];
    zoom: number;
    bearing?: number;
    pitch?: number;
};
type MapBounds = [west: number, south: number, east: number, north: number];
type MapFitBoundsOptions = {
    animate?: boolean;
    durationMs?: number;
    maxZoom?: number;
    padding?: number;
};
type MapFlyToOptions = {
    animate?: boolean;
    durationMs?: number;
};
type MapViewStateChangeReason = "initial" | "fit-to-data" | "fit-bounds" | "fly-to" | "pan" | "zoom" | "rotate" | "cluster-expand" | "prop-change" | "programmatic";
type MapViewStateChangeContext = {
    display: MapDisplayMode;
    reason: MapViewStateChangeReason;
};
/**
 * Shared viewport contract for convenience maps and MapView.
 *
 * Pass `viewState` with `onViewStateChange` for a controlled viewport. Pass
 * `defaultViewState` for an uncontrolled initial viewport; `initialViewState`
 * remains as the legacy alias.
 */
type MapViewportProps = {
    viewState?: MapViewState;
    defaultViewState?: MapViewState;
    /**
     * @deprecated Use `defaultViewState` for an uncontrolled initial viewport.
     */
    initialViewState?: MapViewState;
    maxBounds?: MapBounds;
    maxZoom?: number;
    onViewStateChange?: (viewState: MapViewState, context: MapViewStateChangeContext) => void;
};
type MapSurfaceController = {
    display: MapDisplayMode;
    fitToData: () => void;
    fitBounds: (bounds: MapBounds, options?: MapFitBoundsOptions) => void;
    fitPoints: <TProperties>(points: readonly MapPoint<TProperties>[], options?: MapFitBoundsOptions) => void;
    fitGeoJson: <TProperties extends Record<string, unknown>>(source: GeoJsonMapSource<TProperties>, options?: MapFitBoundsOptions) => void;
    flyTo: (viewState: MapViewState, options?: MapFlyToOptions) => void;
    getViewState: () => MapViewState;
    setViewState: (viewState: MapViewState, reason?: MapViewStateChangeReason) => void;
};

type LegacyRasterMapStyle = {
    attribution?: string;
    maxZoom?: number;
    minZoom?: number;
    tileSize?: number;
    tiles?: string | readonly string[] | false;
} & Record<string, unknown>;
type RasterMapStyle = MapLibreMapStyle | LegacyRasterMapStyle;
declare const defaultRasterMapStyle: RasterMapStyle;
declare function getMapBoundsCenter(bounds: MapBounds): [longitude: number, latitude: number];
declare function padMapBounds(bounds: MapBounds, paddingDegrees: number): MapBounds;
declare function mergeMapBounds(...boundsList: Array<MapBounds | null | undefined>): MapBounds | null;

export { type FlatLayerFactory as F, type MapBounds as M, type RasterMapStyle as R, type FlatLayerGroup as a, type FlatMapAdapter as b, type MapDisplayMode as c, type MapFitBoundsOptions as d, type MapFlyToOptions as e, type MapSurfaceController as f, type MapViewState as g, type MapViewStateChangeContext as h, type MapViewStateChangeReason as i, type MapViewportProps as j, defaultRasterMapStyle as k, getMapBoundsCenter as l, mergeMapBounds as m, padMapBounds as p };
