declare module "leaflet" {
  export type Map = {
    remove(): void;
  };

  export type GeoJSON = {
    addTo(map: Map): GeoJSON;
    remove(): void;
  };

  export type GeoJsonFeature = {
    geometry?: {
      type?: string;
    };
  };

  export type GeoJSONOptions = {
    pointToLayer?: (feature: unknown, latLng: unknown) => unknown;
    style?: (feature?: GeoJsonFeature) => Record<string, string | number | undefined> | undefined;
  };

  export function map(
    element: HTMLElement,
    options: {
      attributionControl?: boolean;
      center: [number, number];
      zoom: number;
    },
  ): Map;

  export function tileLayer(
    urlTemplate: string,
    options?: {
      attribution?: string;
    },
  ): {
    addTo(map: Map): void;
  };

  export function circleMarker(latLng: unknown, options?: Record<string, string | number>): unknown;

  export function geoJSON(geojson?: unknown, options?: GeoJSONOptions): GeoJSON;
}
