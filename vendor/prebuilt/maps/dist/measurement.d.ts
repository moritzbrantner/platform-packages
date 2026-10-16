import { f as MapMeasurementProps } from './measurement-UgWxBeK2.js';
export { M as MapBeeLineMeasurement, a as MapBeeLineMeasurementDraft, b as MapBeeLineMeasurementResult, c as MapCoordinate, d as MapDistanceFormat, e as MapMeasurementMode, g as formatMapDistance, h as getBeeLineDistanceMeters, i as getBeeLineMeasurementLabel } from './measurement-UgWxBeK2.js';

type BeeLineMeasurementLayerProps = MapMeasurementProps & {
    layerId?: string;
};
declare function BeeLineMeasurementLayer({ measurementDistanceFormat, measurementDraftLineColor, measurementLineColor, measurementMode, measurements, layerId, onMeasurementCreate, onMeasurementDraftChange, onMeasurementSelect, }: BeeLineMeasurementLayerProps): null;

export { BeeLineMeasurementLayer, type BeeLineMeasurementLayerProps, MapMeasurementProps };
