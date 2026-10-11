import * as react_jsx_runtime from 'react/jsx-runtime';
import { C as MapFeatureInteractionProps, x as IndexedMapPoint, K as MapPointFilter, J as MapPoint } from './geojson-layer-09FHd5Kp.js';

type PointLayerFeature<TProperties = Record<string, unknown>> = {
    coordinates: [longitude: number, latitude: number];
    point: IndexedMapPoint<TProperties>;
};
type PointLayerProps<TProperties = Record<string, unknown>> = MapFeatureInteractionProps<PointLayerFeature<TProperties>> & {
    draggable?: boolean | ((feature: PointLayerFeature<TProperties>) => boolean);
    filterPoint?: MapPointFilter<TProperties>;
    getPointColor?: (feature: PointLayerFeature<TProperties>) => string;
    /** Text drawn centered on a point, like a cluster count; `null` or `""` draws none. */
    getPointLabel?: (feature: PointLayerFeature<TProperties>) => string | null;
    getPointRadius?: (feature: PointLayerFeature<TProperties>) => number;
    layerId?: string;
    onFeatureDrag?: (feature: PointLayerFeature<TProperties>, coordinates: [longitude: number, latitude: number]) => void;
    onFeatureDragEnd?: (feature: PointLayerFeature<TProperties>, coordinates: [longitude: number, latitude: number]) => void;
    onFeatureSelect?: (feature: PointLayerFeature<TProperties> | null) => void;
    points: readonly MapPoint<TProperties>[];
    pointColor?: string;
    pointRadius?: number;
};
type BubbleLayerFeature<TProperties = Record<string, unknown>> = PointLayerFeature<TProperties> & {
    rawValue: number;
    radius: number;
    value: number;
};
type BubbleLayerWeightAccessor<TProperties = Record<string, unknown>> = (point: IndexedMapPoint<TProperties>) => number;
type BubbleLayerProps<TProperties = Record<string, unknown>> = Omit<PointLayerProps<TProperties>, "draggable" | "getPointColor" | "getPointLabel" | "getPointRadius" | "onFeatureDrag" | "onFeatureDragEnd" | "onFeatureSelect" | "pointColor" | "pointRadius"> & MapFeatureInteractionProps<BubbleLayerFeature<TProperties>> & {
    bubbleColor?: string;
    draggable?: boolean | ((feature: BubbleLayerFeature<TProperties>) => boolean);
    getBubbleColor?: (feature: BubbleLayerFeature<TProperties>) => string;
    getWeight?: BubbleLayerWeightAccessor<TProperties>;
    maxRadius?: number;
    maxWeight?: number;
    minRadius?: number;
    onFeatureDrag?: (feature: BubbleLayerFeature<TProperties>, coordinates: [longitude: number, latitude: number]) => void;
    onFeatureDragEnd?: (feature: BubbleLayerFeature<TProperties>, coordinates: [longitude: number, latitude: number]) => void;
    onFeatureSelect?: (feature: BubbleLayerFeature<TProperties> | null) => void;
    weightMetric?: string;
};
declare function PointLayer<TProperties = Record<string, unknown>>({ filterPoint, draggable, getFeatureId, getPointColor, getPointLabel, getPointRadius, hoveredFeatureId, layerId, onHoveredFeatureIdChange, onFeatureContextMenu, onFeatureDrag, onFeatureDragEnd, onFeatureHover, onFeatureSelect, onSelectedFeatureIdChange, points, pointColor, pointRadius, renderFeatureContextMenu, renderFeaturePopup, renderFeatureTooltip, selectedFeatureId, }: PointLayerProps<TProperties>): react_jsx_runtime.JSX.Element;
declare function BubbleLayer<TProperties = Record<string, unknown>>({ bubbleColor, filterPoint, draggable, getBubbleColor, getWeight, layerId, maxRadius, maxWeight, minRadius, onFeatureSelect, onFeatureDrag, onFeatureDragEnd, points, weightMetric, ...interactionProps }: BubbleLayerProps<TProperties>): react_jsx_runtime.JSX.Element;

export { BubbleLayer as B, PointLayer as P, type BubbleLayerFeature as a, type BubbleLayerProps as b, type BubbleLayerWeightAccessor as c, type PointLayerFeature as d, type PointLayerProps as e };
