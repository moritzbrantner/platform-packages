type MapCoordinate = [longitude: number, latitude: number];
type MapMeasurementMode = "none" | "bee-line";
type MapDistanceFormat = "metric" | "imperial" | "meters";
type MapBeeLineMeasurement = {
    id: string;
    from: MapCoordinate;
    to: MapCoordinate;
    label?: string;
};
type MapBeeLineMeasurementDraft = {
    from: MapCoordinate;
    to?: MapCoordinate;
    distanceMeters?: number;
    formattedDistance?: string;
};
type MapBeeLineMeasurementResult = {
    from: MapCoordinate;
    to: MapCoordinate;
    distanceMeters: number;
    formattedDistance: string;
};
type MapMeasurementProps = {
    measurementMode?: MapMeasurementMode;
    measurements?: readonly MapBeeLineMeasurement[];
    measurementDistanceFormat?: MapDistanceFormat;
    measurementLineColor?: string;
    measurementDraftLineColor?: string;
    onMeasurementCreate?: (measurement: MapBeeLineMeasurementResult) => void;
    onMeasurementDraftChange?: (draft: MapBeeLineMeasurementDraft | null) => void;
    onMeasurementSelect?: (measurement: MapBeeLineMeasurement | null) => void;
};
declare function getBeeLineDistanceMeters(fromCoordinate: readonly number[] | null | undefined, toCoordinate: readonly number[] | null | undefined): number | null;
declare function formatMapDistance(distanceMeters: number, measurementDistanceFormat?: MapDistanceFormat): string;
declare function getBeeLineMeasurementLabel(measurement: Pick<MapBeeLineMeasurement, "from" | "label" | "to">, measurementDistanceFormat?: MapDistanceFormat): string | null;

export { type MapBeeLineMeasurement as M, type MapBeeLineMeasurementDraft as a, type MapBeeLineMeasurementResult as b, type MapCoordinate as c, type MapDistanceFormat as d, type MapMeasurementMode as e, type MapMeasurementProps as f, formatMapDistance as g, getBeeLineDistanceMeters as h, getBeeLineMeasurementLabel as i };
