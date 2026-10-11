import * as react_jsx_runtime from 'react/jsx-runtime';
import { l as HeatLayerProps } from './heat-layer-types-BH7QSCCa.js';

declare function HeatLayer<TProperties = Record<string, unknown>>({ domainBounds, domainPaddingRatio, fieldCellSizeMeters, fieldContourColor, fieldContourLevels, fieldContourLineWidth, fieldContourOpacity, fieldContourValueFormat, fieldAsyncRender, fieldColorRamp, fieldColumns, fieldOpacity, fieldRenderMode, fieldRows, fieldValueDomain, filterPoint, getValue, getWeight, heatmapAggregationMaxZoom, heatmapAggregationMinZoom, heatmapAggregationRadius, heatmapAsyncRender, heatmapColorRamp, heatmapIntensity, heatmapMaxRasterPixels, heatmapMaxZoom, heatmapMinZoomDeltaForRebuild, heatmapOpacity, heatmapOverscanRatio, heatmapRadius, heatmapRenderStrategy, heatmapSurfaceMode, interpolationEpsilonMeters, interpolationExtrapolate, interpolationK, interpolationMaxDistanceMeters, interpolationPower, layerId, maskGeoJson, maxWeight, points, showDataPoints, dataPointColor, dataPointOpacity, dataPointRadius, dataPointStrokeColor, dataPointStrokeWidth, dataPointValueFormat, valueMetric, weightMetric, }: HeatLayerProps<TProperties>): null;
type HeatFieldLayerProps<TProperties = Record<string, unknown>> = Omit<HeatLayerProps<TProperties>, "heatmapSurfaceMode">;
declare function HeatFieldLayer<TProperties = Record<string, unknown>>(props: HeatFieldLayerProps<TProperties>): react_jsx_runtime.JSX.Element;

export { HeatFieldLayer as H, type HeatFieldLayerProps as a, HeatLayer as b };
