// MapLibre GL 6 (pulled in by @moritzbrantner/maps) derives its worker URL from its own
// `import.meta.url` at runtime, which a bundler cannot follow, so the built playground has
// no worker file and GeoJSON sources never finish loading. Hand MapLibre a bundled worker
// URL before any map page renders. Import this module first in every map entry.
import { setWorkerUrl } from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

setWorkerUrl(maplibreWorkerUrl);
